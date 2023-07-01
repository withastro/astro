import type { PathLike } from 'node:fs';
import * as fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

export async function writeJson<T>(path: PathLike, data: T) {
	await fs.writeFile(path, JSON.stringify(data, null, '\t'), { encoding: 'utf-8' });
}

export async function removeDir(dir: PathLike) {
	await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
}

export async function emptyDir(dir: PathLike): Promise<void> {
	await removeDir(dir);
	await fs.mkdir(dir, { recursive: true });
}

export async function getFilesFromFolder(dir: URL) {
	const data = await fs.readdir(dir, { withFileTypes: true });
	let files: URL[] = [];
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

export const getVercelOutput = (root: URL) => new URL('./.vercel/output/', root);

/**
 * Copies files into a folder keeping the folder structure intact.
 * The resulting file tree will start at the common ancestor.
 *
 * @param {URL[]} files A list of files to copy (absolute path).
 * @param {URL} outDir Destination folder where to copy the files to (absolute path).
 * @param {URL[]} [exclude] A list of files to exclude (absolute path).
 * @returns {Promise<string>} The common ancestor of the copied files.
 */
export async function copyFilesToFunction(
	files: URL[],
	outDir: URL,
	exclude: URL[] = []
): Promise<string> {
	const excludeList = exclude.map(fileURLToPath);
	const fileList = files.map(fileURLToPath).filter((f) => !excludeList.includes(f));

	if (files.length === 0) throw new Error('[@astrojs/vercel] No files found to copy');

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

		// Create directories recursively
		if (isDir && !isSymlink) {
			await fs.mkdir(new URL('..', dest), { recursive: true });
		} else {
			await fs.mkdir(new URL('.', dest), { recursive: true });
		}

		if (isSymlink) {
			const realdest = fileURLToPath(new URL(nodePath.relative(commonAncestor, realpath), outDir));
			await fs.symlink(
				nodePath.relative(fileURLToPath(new URL('.', dest)), realdest),
				dest,
				isDir ? 'dir' : 'file'
			);
		} else if (!isDir) {
			await fs.copyFile(origin, dest);
		}
	}

	return commonAncestor;
}
