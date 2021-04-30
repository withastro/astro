import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import glob from 'tiny-glob';

export default async function copy(pattern, ...args) {
    const files = await glob(pattern, { filesOnly: true });
    await Promise.all(files.map(file => {
        const dest = resolve(file.replace(/^[^/]+/, 'dist'));
        return fs.mkdir(dirname(dest), { recursive: true }).then(() => fs.copyFile(resolve(file), dest))
    }));
}
