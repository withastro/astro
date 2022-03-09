import type { AstroConfig } from '../../@types/astro';

import fs from 'fs';
import npath from 'path';
import { fileURLToPath } from 'url';

const isWindows = process.platform === 'win32';

export function emptyDir(dir: string, skip?: Set<string>): void {
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}
		const abs = npath.resolve(dir, file);
		// baseline is Node 12 so can't use rmSync :(
		let isDir = false;
		try {
			isDir = fs.lstatSync(abs).isDirectory();
		} catch (err: any) {
			// Taken from:
			// https://github.com/isaacs/rimraf/blob/9219c937be159edbdf1efa961f2904e863c3ce2d/rimraf.js#L293-L296
			if (err.code === 'EPERM' && isWindows) {
				fixWinEPERMSync(abs, err);
			} else {
				throw err;
			}
		}

		if (isDir) {
			emptyDir(abs);
			fs.rmdirSync(abs);
		} else {
			fs.unlinkSync(abs);
		}
	}
}

export function prepareOutDir(astroConfig: AstroConfig) {
	const outDir = fileURLToPath(astroConfig.dist);
	if (fs.existsSync(outDir)) {
		return emptyDir(outDir, new Set(['.git']));
	}
}

function fixWinEPERMSync(path: string, error: Error) {
	try {
		fs.chmodSync(path, 0o666);
	} catch (er2: any) {
		if (er2.code === 'ENOENT') {
			return;
		} else {
			throw error;
		}
	}

	let stats;
	try {
		stats = fs.statSync(path);
	} catch (er3: any) {
		if (er3.code === 'ENOENT') {
			return;
		} else {
			throw error;
		}
	}

	if (stats.isDirectory()) {
		emptyDir(path);
	} else {
		fs.unlinkSync(path);
	}
}
