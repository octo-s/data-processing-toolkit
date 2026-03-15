const path = require('path');
const fs = require('fs/promises');

function goUp(currentDir) {
    return path.dirname(currentDir);
}

async function changeDirectory(targetPath, currentDir) {
    const absolutePath = path.isAbsolute(targetPath)
        ? targetPath
        : path.resolve(currentDir, targetPath);

    try {
        const stats = await fs.stat(absolutePath);
        const newDir = stats.isDirectory() ? absolutePath : currentDir;

        return { success: true, newDir };

    } catch (error) {
        return { success: false, newDir: currentDir };
    }
}

async function listDirectory(currentDir) {
    try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        const folders = [];
        const files = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                folders.push({ name: entry.name, type: 'folder' });

            } else if (entry.isFile()) {
                files.push({ name: entry.name, type: 'file' });
            }
        }

        folders.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, items: [...folders, ...files] };
    } catch (error) {
        return { success: false, items: [] };
    }
}

module.exports = { goUp, changeDirectory, listDirectory };