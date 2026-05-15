import type { PackageInfo } from './importPackage.js';
export declare function getLanguageServerTypesDir(ts: typeof import('typescript')): string;
export declare function getAstroInstall(
	basePaths: string[],
	checkForAstro?: {
		nearestPackageJson: string | undefined;
		readDirectory: typeof import('typescript').sys.readDirectory;
	},
): PackageInfo | 'not-an-astro-project' | 'not-found';
