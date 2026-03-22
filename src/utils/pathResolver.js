import { isAbsolute, resolve } from 'path';

export function resolvePath(inputPath, currentDir) {
    if (isAbsolute(inputPath)) {
        return inputPath;
    }

    return resolve(currentDir, inputPath);
}

