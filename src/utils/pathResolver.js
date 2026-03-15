import { isAbsolute, resolve } from 'path';

function resolvePath(inputPath, currentDir) {
    if (isAbsolute(inputPath)) {
        return inputPath;
    }

    return resolve(currentDir, inputPath);
}

module.exports = { resolvePath };

