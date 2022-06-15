import * as terser from 'terser';
import esbuild from 'esbuild';
import glob from 'tiny-glob';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

export default async function prebuild(...args) {
	let buildToString = args.indexOf('--to-string');
	if (buildToString !== -1) {
		args.splice(buildToString, 1);
		buildToString = true;
	}

	let patterns = args;
	let entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true }))
		))
	);

	function getPrebuildURL(entryfilepath) {
		const entryURL = pathToFileURL(entryfilepath);
		const basename = path.basename(entryfilepath);
		const ext = path.extname(entryfilepath);
		const name = basename.slice(0, basename.indexOf(ext));
		const outname = `${name}.prebuilt${ext}`;
		const outURL = new URL('./' + outname, entryURL);
		return outURL;
	}

	async function prebuildFile(filepath) {
		const tscode = await fs.promises.readFile(filepath, 'utf-8');
		const esbuildresult = await esbuild.transform(tscode, {
			loader: 'ts',
			minify: true,
		});
		const rootURL = new URL('../../', import.meta.url);
		const rel = path.relative(fileURLToPath(rootURL), filepath);
		const mod = `/**
 * This file is prebuilt from ${rel}
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default \`${esbuildresult.code.trim()}\`;`;
		const url = getPrebuildURL(filepath);
		await fs.promises.writeFile(url, mod, 'utf-8');
	}

	await Promise.all(entryPoints.map(prebuildFile));
}
