// @ts-check
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * Packages one VSIX per VS Code target into `vsix/`, for the release workflow to publish.
 *
 * `prettier-plugin-astro` loads the native `@astrojs/compiler-binding`, whose per-platform
 * packages are optional dependencies that npm only installs for the platform it runs on. Each
 * target therefore gets its own `npm install` with that target's platform flags before it is
 * packaged, and the script fails if the resulting VSIX does not contain exactly that target's
 * binding.
 *
 * Runs with npm outside the pnpm workspace, after the initial `npm install` in
 * `.github/workflows/release.yml`. Leaves `node_modules` installed for the current platform.
 */

/** @type {Record<string, { npmFlags: string[], binding: string }>} */
const targets = {
	'win32-x64': { npmFlags: ['--os=win32', '--cpu=x64'], binding: 'win32-x64-msvc' },
	'win32-arm64': { npmFlags: ['--os=win32', '--cpu=arm64'], binding: 'win32-arm64-msvc' },
	'linux-x64': { npmFlags: ['--os=linux', '--cpu=x64', '--libc=glibc'], binding: 'linux-x64-gnu' },
	'linux-arm64': {
		npmFlags: ['--os=linux', '--cpu=arm64', '--libc=glibc'],
		binding: 'linux-arm64-gnu',
	},
	// No native binding is published for 32-bit ARM, so this target ships the WASI build, which
	// npm only installs for `--cpu=wasm32`.
	'linux-armhf': { npmFlags: ['--os=linux', '--cpu=wasm32'], binding: 'wasm32-wasi' },
	'darwin-x64': { npmFlags: ['--os=darwin', '--cpu=x64'], binding: 'darwin-x64' },
	'darwin-arm64': { npmFlags: ['--os=darwin', '--cpu=arm64'], binding: 'darwin-arm64' },
	'alpine-x64': { npmFlags: ['--os=linux', '--cpu=x64', '--libc=musl'], binding: 'linux-x64-musl' },
	'alpine-arm64': {
		npmFlags: ['--os=linux', '--cpu=arm64', '--libc=musl'],
		binding: 'linux-arm64-musl',
	},
};

const outDir = 'vsix';
const bindingPrefix = 'extension/node_modules/@astrojs/compiler-binding-';

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir);

for (const [target, { npmFlags, binding }] of Object.entries(targets)) {
	run('npm', ['install', '--workspaces=false', ...npmFlags]);
	const vsix = `${outDir}/astro-vscode-${target}.vsix`;
	run('npx', ['vsce', 'package', '--target', target, '--out', vsix]);

	const files = execFileSync('unzip', ['-Z1', vsix], { encoding: 'utf8' }).split('\n');
	const bindings = new Set(
		files
			.filter((file) => file.startsWith(bindingPrefix))
			.map((file) => file.slice(bindingPrefix.length).split('/')[0]),
	);
	const binary = binding === 'wasm32-wasi' ? 'astro.wasm32-wasi.wasm' : `astro.${binding}.node`;
	if (bindings.size !== 1 || !files.includes(`${bindingPrefix}${binding}/${binary}`)) {
		throw new Error(
			`${vsix} must contain only @astrojs/compiler-binding-${binding} with ${binary}, found: ${[...bindings].join(', ') || 'none'}`,
		);
	}
	console.info(`${vsix} contains @astrojs/compiler-binding-${binding}`);
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
