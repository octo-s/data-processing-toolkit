import { createReadStream, createWriteStream } from 'node:fs';
import { stat, open } from 'node:fs/promises';
import { pbkdf2Sync, createDecipheriv } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

async function decrypt(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const outputPath = resolvePath(args.output, currentDir);
    const password = args.password;

    const stats = await stat(inputPath);
    const fileSize = stats.size;

    const headerBuffer = Buffer.alloc(28);
    const fd = await open(inputPath, 'r');
    await fd.read(headerBuffer, 0, 28, 0);

    const salt = headerBuffer.subarray(0, 16);
    const iv = headerBuffer.subarray(16, 28);

    const authTagBuffer = Buffer.alloc(16);
    await fd.read(authTagBuffer, 0, 16, fileSize - 16);
    await fd.close();

    const key = pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTagBuffer);

    const readStream = createReadStream(inputPath, {
        start: 28,
        end: fileSize - 17
    });
    const writeStream = createWriteStream(outputPath);

    await pipeline(readStream, decipher, writeStream);
}

export { decrypt };