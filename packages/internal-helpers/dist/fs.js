import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
async function writeJson(path, data) {
	await fs.writeFile(path, JSON.stringify(data, null, '	'), { encoding: 'utf-8' });
}
async function removeDir(dir) {
	await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
}
async function emptyDir(dir) {
	await removeDir(dir);
	await fs.mkdir(dir, { recursive: true });
}
async function getFilesFromFolder(dir) {
	const data = await fs.readdir(dir, { withFileTypes: true });
	let files = [];
	for (const item of data) {
		if (item.isDirectory()) {
			const moreFiles = await getFilesFromFolder(new URL(`./${item.name}/`, dir));
			files = files.concat(moreFiles);
		} else {
			files.push(new URL(`./${item.name}`, dir));
		}
	}
	return files;
}
async function copyFilesToFolder(files, outDir, exclude = []) {
	const excludeList = exclude.map((url) => fileURLToPath(url));
	const fileList = files.map((url) => fileURLToPath(url)).filter((f) => !excludeList.includes(f));
	if (files.length === 0) throw new Error('No files found to copy');
	let commonAncestor = nodePath.dirname(fileList[0]);
	for (const file of fileList.slice(1)) {
		while (!file.startsWith(commonAncestor)) {
			commonAncestor = nodePath.dirname(commonAncestor);
		}
	}
	for (const origin of fileList) {
		const dest = new URL(nodePath.relative(commonAncestor, origin), outDir);
		const realpath = await fs.realpath(origin);
		const isSymlink = realpath !== origin;
		const isDir = (await fs.stat(origin)).isDirectory();
		if (isDir && !isSymlink) {
			await fs.mkdir(new URL('..', dest), { recursive: true });
		} else {
			await fs.mkdir(new URL('.', dest), { recursive: true });
		}
		if (isSymlink) {
			const realdest = fileURLToPath(new URL(nodePath.relative(commonAncestor, realpath), outDir));
			const target = nodePath.relative(fileURLToPath(new URL('.', dest)), realdest);
			if (!existsSync(dest)) {
				await fs.symlink(target, dest, isDir ? 'dir' : 'file');
			}
		} else if (!isDir) {
			await fs.copyFile(origin, dest);
		}
	}
	return commonAncestor;
}
export { copyFilesToFolder, emptyDir, getFilesFromFolder, removeDir, writeJson };
