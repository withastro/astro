import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'tiny-glob';
import { ensureDir } from '../utils/paths.js';

async function globImages(dir: URL) {
	const srcPath = fileURLToPath(dir);
	return await glob('./**/*.{heic,heif,avif,jpeg,jpg,png,tiff,webp,gif}', {
		cwd: fileURLToPath(dir),
	});
}

export interface SSRBuildParams {
	srcDir: URL;
	outDir: URL;
}

export async function ssrBuild({ srcDir, outDir }: SSRBuildParams) {
	const images = await globImages(srcDir);

	for (const image of images) {
		const from = path.join(fileURLToPath(srcDir), image);
		const to = path.join(fileURLToPath(outDir), image);

		await ensureDir(path.dirname(to));
		await fs.copyFile(from, to);
	}
}
