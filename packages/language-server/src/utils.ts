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

export function getLanguageServerTypesDir(ts: typeof import('typescript')) {
	return ts.sys.resolvePath(path.resolve(__dirname, '../types'));
}

export function getAstroInstall(
	basePaths: string[],
	checkForAstro?: {
		nearestPackageJson: string | undefined;
		readDirectory: typeof import('typescript').sys.readDirectory;
	},
): AstroInstall | 'not-an-astro-project' | 'not-found' {
	let astroPath;
	let version;

	if (checkForAstro && checkForAstro.nearestPackageJson) {
		basePaths.push(path.dirname(checkForAstro.nearestPackageJson));

		let deps = new Set<string>();
		try {
			const packageJSON = require(checkForAstro.nearestPackageJson);
			[
				...Object.keys(packageJSON.dependencies ?? {}),
				...Object.keys(packageJSON.devDependencies ?? {}),
				...Object.keys(packageJSON.peerDependencies ?? {}),
			].forEach((dep) => deps.add(dep));
		} catch {}

		if (!deps.has('astro')) {
			const directoryContent = checkForAstro.readDirectory(
				path.dirname(checkForAstro.nearestPackageJson),
				['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'],
				undefined,
				undefined,
				1,
			);

			if (!directoryContent.some((file) => path.basename(file).startsWith('astro.config'))) {
				return 'not-an-astro-project';
			}
		}
	}

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
		} catch {
			// If we still couldn't find it, it probably just doesn't exist
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`,
			);

			return 'not-found';
		}
	}

	if (!version) {
		return 'not-found';
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
