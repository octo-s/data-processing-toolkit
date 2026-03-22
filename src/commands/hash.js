import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

async function hash(args, currentDir) {
    const inputPath = resolvePath(args.input, currentDir);
    const algorithm = args.algorithm || 'sha256';
    const shouldSave = args.save === true;

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
        throw new Error(`Unsupported algorithm: ${algorithm}. Supported: ${SUPPORTED_ALGORITHMS.join(', ')}`);
    }

    const hashSum = createHash(algorithm);
    const readStream = createReadStream(inputPath);

    await pipeline(readStream, hashSum);

    const hashValue = hashSum.digest('hex');

    console.log(`${algorithm}: ${hashValue}`);

    if (shouldSave) {
        const hashFilePath = `${inputPath}.${algorithm}`;
        await writeFile(hashFilePath, hashValue);
    }

    return hashValue;
}

export { hash };