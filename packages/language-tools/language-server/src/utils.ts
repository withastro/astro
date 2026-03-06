import * as path from 'node:path';
import type { PackageInfo } from './importPackage.js';
import { getPackageInfo } from './importPackage.js';

export function getLanguageServerTypesDir(ts: typeof import('typescript')) {
	return ts.sys.resolvePath(path.resolve(__dirname, '../types'));
}

export function getAstroInstall(
	basePaths: string[],
	checkForAstro?: {
		nearestPackageJson: string | undefined;
		readDirectory: typeof import('typescript').sys.readDirectory;
	},
): PackageInfo | 'not-an-astro-project' | 'not-found' {
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

	let astroPackage = getPackageInfo('astro', basePaths);

	if (!astroPackage) {
		// If we couldn't find it inside the workspace's node_modules, it might means we're in the Astro development monorepo
		astroPackage = getPackageInfo('./packages/astro', basePaths);

		if (!astroPackage) {
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`,
			);

			// If we still couldn't find it, it probably just doesn't exist
			return 'not-found';
		}
	}

	return astroPackage;
}
