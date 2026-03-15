import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

async function hashCompare(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const hashFilePath = resolvePath(args.hash, currentDir);
    const algorithm = args.algorithm || 'sha256';

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
        throw new Error('Unsupported algorithm');
    }

    const expectedHash = (await readFile(hashFilePath, 'utf8'))
        .trim()
        .toLowerCase();

    const hashSum = createHash(algorithm);
    const readStream = createReadStream(inputPath);

    await pipeline(readStream, hashSum);

    const actualHash = hashSum.digest('hex').toLowerCase();

    if (actualHash === expectedHash) {
        console.log('OK');
    } else {
        console.log('MISMATCH');
    }
}

export { hashCompare };