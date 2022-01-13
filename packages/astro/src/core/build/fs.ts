import type { AstroConfig } from '../../@types/astro';

import fs from 'fs';
import npath from 'path';
import { fileURLToPath } from 'url';

export function emptyDir(dir: string, skip?: Set<string>): void {
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}
		const abs = npath.resolve(dir, file);
		// baseline is Node 12 so can't use rmSync :(
		if (fs.lstatSync(abs).isDirectory()) {
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
