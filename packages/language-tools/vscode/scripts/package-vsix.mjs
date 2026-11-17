// @ts-check
import { execFileSync } from 'node:child_process';

/**
 * Packages a universal `astro-vscode.vsix` for the release workflow to publish.
 *
 * `prettier-plugin-astro` loads `@astrojs/compiler-binding`, whose native packages are optional
 * dependencies that npm only installs for the platform it runs on. Installing with `--cpu=wasm32`
 * selects the WASI build instead, which runs on every platform. The script fails if the VSIX
 * contains a native `.node` binary or is missing the WASI binding or the TypeScript plugin.
 *
 * Runs with npm outside the pnpm workspace, after the initial `npm install` in
 * `.github/workflows/release.yml`. Leaves `node_modules` installed for the current platform.
 */

const vsix = 'astro-vscode.vsix';
const requiredFiles = [
	'extension/node_modules/@astrojs/compiler-binding-wasm32-wasi/astro.wasm32-wasi.wasm',
	'extension/node_modules/astro-ts-plugin-bundle/index.js',
];

run('npm', ['install', '--workspaces=false', '--cpu=wasm32']);
run('npx', ['vsce', 'package', '--out', vsix]);

const files = execFileSync('unzip', ['-Z1', vsix], { encoding: 'utf8' }).split('\n');
const nativeFiles = files.filter((file) => file.endsWith('.node'));
const missingFiles = requiredFiles.filter((file) => !files.includes(file));
if (nativeFiles.length > 0 || missingFiles.length > 0) {
	throw new Error(
		`${vsix} must contain no native binaries and all required files. Native: ${nativeFiles.join(', ') || 'none'}. Missing: ${missingFiles.join(', ') || 'none'}.`,
	);
}

// The publish steps run vsce and ovsx, which have native dependencies of their own.
run('npm', ['install', '--workspaces=false']);

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
	execFileSync(command, args, { stdio: 'inherit' });
}
