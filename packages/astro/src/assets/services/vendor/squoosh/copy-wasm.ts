import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function copyWasmFiles(dir: URL) {
	const src = new URL('./', import.meta.url);
	const fileList = await listFiles(fileURLToPath(src), fileURLToPath(dir));

	for (let file of fileList) {
		await fs.mkdir(path.dirname(file.dest), { recursive: true });
		await fs.copyFile(file.src, file.dest);
	}
}

export async function deleteWasmFiles(dir: URL) {
	const src = new URL('./', import.meta.url);
	const fileList = await listFiles(fileURLToPath(src), fileURLToPath(dir));

	for (let file of fileList) {
		await fs.rm(file.dest);
	}
}

async function listFiles(src: string, dest: string) {
	const itemNames = await fs.readdir(src);
	const copiedFiles: {src: string, dest: string}[] = []
	await Promise.all(itemNames.map(async (srcName) => {
		const srcPath = path.join(src, srcName);
		const destPath = path.join(dest, srcName);
		const s = await fs.stat(srcPath);
		if (s.isFile() && /.wasm$/.test(srcPath)) {
			copiedFiles.push({src: srcPath, dest: destPath});
		}
		else if (s.isDirectory()) {
			copiedFiles.push(...await listFiles(srcPath, destPath));
		}
	}));

	return copiedFiles;
}
