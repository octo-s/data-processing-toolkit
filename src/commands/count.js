import { createReadStream } from 'node:fs';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function count(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);

    let lines = 0;
    let words = 0;
    let characters = 0;

    const countTransform = new Transform({
        transform(chunk, encoding, callback) {
            const text = chunk.toString();

            characters += text.length;

            const lineBreaks = text.match(/\n/g);
            if (lineBreaks) {
                lines += lineBreaks.length;
            }

            const wordMatches = text.match(/\S+/g);
            if (wordMatches) {
                words += wordMatches.length;
            }

            callback();
        }
    });

    const nullStream = new Writable({
        write(chunk, encoding, callback) {
            callback();
        }
    });

    const readStream = createReadStream(inputPath);

    await pipeline(readStream, countTransform, nullStream);

    console.log(`Lines: ${lines}`);
    console.log(`Words: ${words}`);
    console.log(`Characters: ${characters}`);
}