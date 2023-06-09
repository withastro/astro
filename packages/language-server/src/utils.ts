import * as path from 'node:path';
import { getPackagePath } from './importPackage.js';

export interface AstroInstall {
	path: string;
	version: {
		full: string;
		major: number;
		minor: number;
		patch: number;
	};
}

export function getAstroInstall(basePaths: string[]): AstroInstall | undefined {
	let astroPath;
	let version;

	try {
		astroPath = getPackagePath('astro', basePaths);

		if (!astroPath) {
			throw Error;
		}

		version = require(path.resolve(astroPath, 'package.json')).version;
	} catch {
		// If we couldn't find it inside the workspace's node_modules, it might means we're in the monorepo
		try {
			astroPath = getPackagePath('./packages/astro', basePaths);

			if (!astroPath) {
				throw Error;
			}

			version = require(path.resolve(astroPath, 'package.json')).version;
		} catch (e) {
			// If we still couldn't find it, it probably just doesn't exist
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`
			);

			return undefined;
		}
	}

	let [major, minor, patch] = version.split('.');

	if (patch.includes('-')) {
		const patchParts = patch.split('-');
		patch = patchParts[0];
	}

	return {
		path: astroPath,
		version: {
			full: version,
			major: Number(major),
			minor: Number(minor),
			patch: Number(patch),
		},
	};
}
