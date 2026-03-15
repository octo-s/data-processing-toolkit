import { createReadStream, createWriteStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

async function encrypt(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const outputPath = resolvePath(args.output, currentDir);
    const password = args.password;

    const salt = randomBytes(16);
    const iv = randomBytes(12);

    const key = pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const readStream = createReadStream(inputPath);
    const writeStream = createWriteStream(outputPath);

    writeStream.write(salt);
    writeStream.write(iv);

    await pipeline(readStream, cipher, writeStream);

    const authTag = cipher.getAuthTag();
    await appendFile(outputPath, authTag);
}

export { encrypt };