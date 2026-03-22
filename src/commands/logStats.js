import { Worker } from 'worker_threads';
import { stat, open, writeFile } from 'fs/promises';
import { cpus } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolvePath } from '../utils/pathResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function calculateChunkBoundaries(filePath, fileSize, numChunks) {
    const boundaries = [];
    const approximateChunkSize = Math.ceil(fileSize / numChunks);

    const fileHandle = await open(filePath, 'r');
    const buffer = Buffer.alloc(1024);

    let currentStart = 0;

    for (let i = 0; i < numChunks; i++) {
        let endPosition = Math.min(currentStart + approximateChunkSize, fileSize);

        if (i < numChunks - 1 && endPosition < fileSize) {
            const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, endPosition);

            if (bytesRead > 0) {
                const newlineIndex = buffer.indexOf(10);
                if (newlineIndex !== -1) {
                    endPosition += newlineIndex;
                }
            }
        } else {
            endPosition = fileSize - 1;
        }

        if (currentStart < fileSize) {
            boundaries.push({ start: currentStart, end: endPosition });
        }

        currentStart = endPosition + 1;
    }

    await fileHandle.close();
    return boundaries;
}

function runWorker(filePath, start, end) {
    return new Promise((resolve, reject) => {
        const workerPath = join(__dirname, '../workers/logWorker.js');

        const worker = new Worker(workerPath, {
            workerData: { filePath, start, end }
        });

        worker.on('message', (result) => {
            if (result.error) {
                reject(new Error(result.error));
            } else {
                resolve(result);
            }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker exited with code ${code}`));
            }
        });
    });
}

function mergeStats(results) {
    const merged = {
        total: 0,
        levels: {},
        status: {},
        paths: {},
        responseTimeSum: 0
    };

    for (const result of results) {
        merged.total += result.total;
        merged.responseTimeSum += result.responseTimeSum;

        for (const [level, count] of Object.entries(result.levels)) {
            merged.levels[level] = (merged.levels[level] || 0) + count;
        }

        for (const [status, count] of Object.entries(result.status)) {
            merged.status[status] = (merged.status[status] || 0) + count;
        }

        for (const [path, count] of Object.entries(result.paths)) {
            merged.paths[path] = (merged.paths[path] || 0) + count;
        }
    }

    return merged;
}

function formatOutput(stats) {
    const topPaths = Object.entries(stats.paths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

    const avgResponseTimeMs = stats.total > 0
        ? Math.round((stats.responseTimeSum / stats.total) * 100) / 100
        : 0;

    return {
        total: stats.total,
        levels: stats.levels,
        status: stats.status,
        topPaths,
        avgResponseTimeMs
    };
}

export async function logStats(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const outputPath = resolvePath(args.output, currentDir);

    try {
        const fileStats = await stat(inputPath);
        const fileSize = fileStats.size;
        const numCores = cpus().length;

        const chunkBoundaries = await calculateChunkBoundaries(inputPath, fileSize, numCores);

        const workerPromises = chunkBoundaries.map((boundary) => {
            return runWorker(inputPath, boundary.start, boundary.end);
        });

        const results = await Promise.all(workerPromises);
        const mergedStats = mergeStats(results);
        const output = formatOutput(mergedStats);

        await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');

    } catch (error) {
        console.log('Operation failed');
    }
}
