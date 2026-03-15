import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function jsonToCsv(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const outputPath = resolvePath(args.output, currentDir);

    let buffer = '';

    const jsonTransform = new Transform({
        transform(chunk, encoding, callback) {
            buffer += chunk.toString();
            callback();
        },

        flush(callback) {
            try {
                const data = JSON.parse(buffer);

                if (!Array.isArray(data) || data.length === 0) {
                    callback(new Error('Invalid JSON format'));
                    return;
                }

                const headers = Object.keys(data[0]);
                this.push(headers.join(',') + '\n');

                for (const obj of data) {
                    const row = headers.map(h => escapeCsvValue(obj[h] ?? ''));
                    this.push(row.join(',') + '\n');
                }

                callback();
            } catch (error) {
                callback(error);
            }
        }
    });

    const readStream = createReadStream(inputPath, { encoding: 'utf8' });
    const writeStream = createWriteStream(outputPath);

    await pipeline(readStream, jsonTransform, writeStream);
}

function escapeCsvValue(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}