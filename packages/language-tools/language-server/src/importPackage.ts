import { dirname, resolve } from 'node:path';

// Those three imports needs to always be `type` imports, as we always want to import them dynamically

// TODO: Consider maybe somehow moving those integrations to a separate package to avoid circular dependencies?
// @ts-ignore - Due to a circular dependency, we can't have those as dependencies
import type * as svelte from '@astrojs/svelte/dist/editor.cjs';
// @ts-ignore - Due to a circular dependency, we can't have those as dependencies
import type * as vue from '@astrojs/vue/dist/editor.cjs';

import type * as prettier from 'prettier';

type PackageVersion = {
	full: string;
	major: number;
	minor: number;
	patch: number;
};

let isTrusted = true;

export function setIsTrusted(_isTrusted: boolean) {
	isTrusted = _isTrusted;
}

export type PackageInfo = {
	entrypoint: string;
	directory: string;
	version: PackageVersion;
};

/**
 * Get the path of a package's directory from the paths in `fromPath`, if `root` is set to false, it will return the path of the package's entry point
 */
export function getPackageInfo(packageName: string, fromPath: string[]): PackageInfo | undefined {
	const paths = [];
	if (isTrusted) {
		paths.unshift(...fromPath);
	}

	try {
		const packageJSON = require.resolve(packageName + '/package.json', { paths });
		return {
			directory: dirname(packageJSON),
			entrypoint: require.resolve(packageName, { paths }),
			version: parsePackageVersion(require(packageJSON).version),
		};
	} catch {
		return undefined;
	}
}

function importEditorIntegration<T>(packageName: string, fromPath: string): T | undefined {
	const pkgPath = getPackageInfo(packageName, [fromPath])?.directory;

	if (pkgPath) {
		try {
			const main = resolve(pkgPath, 'dist', 'editor.cjs');

			return require(main) as T;
		} catch (e) {
			console.error(
				`Couldn't load editor module from ${pkgPath}. Make sure you're using at least version v0.2.1 of the corresponding integration. Reason: ${e}`,
			);

			return undefined;
		}
	} else {
		console.info(
			`Couldn't find package ${packageName} (searching from ${fromPath}). Make sure it's installed. If you believe this to be an error, please open an issue.`,
		);
	}

	return undefined;
}

export function importSvelteIntegration(fromPath: string): typeof svelte | undefined {
	return importEditorIntegration('@astrojs/svelte', fromPath);
}

export function importVueIntegration(fromPath: string): typeof vue | undefined {
	return importEditorIntegration('@astrojs/vue', fromPath);
}

export function importPrettier(fromPath: string): typeof prettier | undefined {
	let prettierPkg = getPackageInfo('prettier', [fromPath, __dirname]);

	if (!prettierPkg) {
		return undefined;
	}

	if (prettierPkg.version.major < 3) {
		console.error(
			`Prettier version ${prettierPkg.version.full} from ${prettierPkg.directory} is not supported, please update to at least version 3.0.0. Falling back to bundled version to ensure formatting works correctly.`,
		);

		prettierPkg = getPackageInfo('prettier', [__dirname]);
		if (!prettierPkg) {
			return undefined;
		}
	}

	return require(prettierPkg.entrypoint);
}

export function getPrettierPluginPath(fromPath: string): string | undefined {
	const prettierPluginPath = getPackageInfo('prettier-plugin-astro', [
		fromPath,
		__dirname,
	])?.entrypoint;

	if (!prettierPluginPath) {
		return undefined;
	}

	return prettierPluginPath;
}

export function getWorkspacePnpPath(workspacePath: string): string | null {
	try {
		const possiblePath = resolve(workspacePath, '.pnp.cjs');
		require.resolve(possiblePath);
		return possiblePath;
	} catch {
		return null;
	}
}

export function parsePackageVersion(version: string): PackageVersion {
	let [major, minor, patch] = version.split('.');

	if (patch.includes('-')) {
		const patchParts = patch.split('-');
		patch = patchParts[0];
	}

	return {
		full: version,
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
	};
}
