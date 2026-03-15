import { parentPort, workerData } from 'worker_threads';
import { createReadStream } from 'fs';

async function processChunk() {
    const { filePath, start, end } = workerData;

    const stats = {
        total: 0,
        levels: {},
        status: {},
        paths: {},
        responseTimeSum: 0
    };

    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath, {
            start,
            end,
            encoding: 'utf8'
        });

        let buffer = '';
        let isFirstChunk = start > 0;

        stream.on('data', (chunk) => {
            buffer += chunk;
        });

        stream.on('end', () => {
            const lines = buffer.split('\n');
            const startIndex = isFirstChunk ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parsed = parseLogLine(line);
                if (parsed) {
                    stats.total++;

                    stats.levels[parsed.level] = (stats.levels[parsed.level] || 0) + 1;

                    const statusClass = Math.floor(parsed.statusCode / 100) + 'xx';
                    stats.status[statusClass] = (stats.status[statusClass] || 0) + 1;

                    stats.paths[parsed.path] = (stats.paths[parsed.path] || 0) + 1;

                    stats.responseTimeSum += parsed.responseTimeMs;
                }
            }

            parentPort.postMessage(stats);
            resolve();
        });

        stream.on('error', reject);
    });
}

function parseLogLine(line) {
    // Format: <isoTimestamp> <level> <service> <statusCode> <responseTimeMs> <method> <path>
    const parts = line.split(' ');

    if (parts.length < 7) return null;

    const statusCode = parseInt(parts[3], 10);
    const responseTimeMs = parseFloat(parts[4]);

    if (isNaN(statusCode) || isNaN(responseTimeMs)) return null;

    return {
        level: parts[1],
        statusCode,
        responseTimeMs,
        path: parts[6]
    };
}

processChunk().catch((err) => {
    parentPort.postMessage({ error: err.message });
});