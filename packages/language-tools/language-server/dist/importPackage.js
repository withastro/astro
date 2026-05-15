'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.setIsTrusted = setIsTrusted;
exports.getPackageInfo = getPackageInfo;
exports.importSvelteIntegration = importSvelteIntegration;
exports.importVueIntegration = importVueIntegration;
exports.importPrettier = importPrettier;
exports.getPrettierPluginPath = getPrettierPluginPath;
exports.getWorkspacePnpPath = getWorkspacePnpPath;
exports.parsePackageVersion = parsePackageVersion;
const node_path_1 = require('node:path');
let isTrusted = true;
function setIsTrusted(_isTrusted) {
	isTrusted = _isTrusted;
}
/**
 * Get the path of a package's directory from the paths in `fromPath`, if `root` is set to false, it will return the path of the package's entry point
 */
function getPackageInfo(packageName, fromPath) {
	const paths = [];
	if (isTrusted) {
		paths.unshift(...fromPath);
	}
	try {
		const packageJSON = require.resolve(packageName + '/package.json', { paths });
		return {
			directory: (0, node_path_1.dirname)(packageJSON),
			entrypoint: require.resolve(packageName, { paths }),
			version: parsePackageVersion(require(packageJSON).version),
		};
	} catch {
		return undefined;
	}
}
function importEditorIntegration(packageName, fromPath) {
	const pkgPath = getPackageInfo(packageName, [fromPath])?.directory;
	if (pkgPath) {
		try {
			const main = (0, node_path_1.resolve)(pkgPath, 'dist', 'editor.cjs');
			return require(main);
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
function importSvelteIntegration(fromPath) {
	return importEditorIntegration('@astrojs/svelte', fromPath);
}
function importVueIntegration(fromPath) {
	return importEditorIntegration('@astrojs/vue', fromPath);
}
function importPrettier(fromPath) {
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
function getPrettierPluginPath(fromPath) {
	const prettierPluginPath = getPackageInfo('prettier-plugin-astro', [
		fromPath,
		__dirname,
	])?.entrypoint;
	if (!prettierPluginPath) {
		return undefined;
	}
	return prettierPluginPath;
}
function getWorkspacePnpPath(workspacePath) {
	try {
		const possiblePath = (0, node_path_1.resolve)(workspacePath, '.pnp.cjs');
		require.resolve(possiblePath);
		return possiblePath;
	} catch {
		return null;
	}
}
function parsePackageVersion(version) {
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
//# sourceMappingURL=importPackage.js.map
