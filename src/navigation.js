import { readdir, stat } from 'fs/promises';
import { dirname, resolve, isAbsolute} from 'path';

export function goUp(currentDir) {
    return dirname(currentDir);
}

export async function changeDirectory(targetPath, currentDir) {
    const absolutePath = isAbsolute(targetPath)
        ? targetPath
        : resolve(currentDir, targetPath);

    try {
        const stats = await stat(absolutePath);
        const newDir = stats.isDirectory() ? absolutePath : currentDir;

        return { success: true, newDir };

    } catch (error) {
        return { success: false, newDir: currentDir };
    }
}

export async function listDirectory(currentDir) {
    try {
        const entries = await readdir(currentDir, { withFileTypes: true });

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