import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function csvToJson(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const outputPath = resolvePath(args.output, currentDir);

    let headers = null;
    let isFirstLine = true;
    let isFirstObject = true;

    const csvTransform = new Transform({
        transform(chunk, encoding, callback) {
            this.buffer = (this.buffer || '') + chunk.toString();
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                const values = parseCsvLine(trimmed);

                if (isFirstLine) {
                    headers = values;
                    isFirstLine = false;
                    this.push('[');
                } else {
                    const obj = {};
                    for (let i = 0; i < headers.length; i++) {
                        obj[headers[i]] = values[i] || '';
                    }

                    const prefix = isFirstObject ? '\n  ' : ',\n  ';
                    isFirstObject = false;
                    this.push(prefix + JSON.stringify(obj));
                }
            }
            callback();
        },

        flush(callback) {
            if (this.buffer && this.buffer.trim()) {
                const values = parseCsvLine(this.buffer.trim());
                if (headers && values.length > 0) {
                    const obj = {};
                    for (let i = 0; i < headers.length; i++) {
                        obj[headers[i]] = values[i] || '';
                    }
                    const prefix = isFirstObject ? '\n  ' : ',\n  ';
                    this.push(prefix + JSON.stringify(obj));
                }
            }
            this.push('\n]');
            callback();
        }
    });

    const readStream = createReadStream(inputPath, { encoding: 'utf8' });
    const writeStream = createWriteStream(outputPath);

    await pipeline(readStream, csvTransform, writeStream);
}

function parseCsvLine(line) {
    return line.split(',').map(v => v.trim());
}