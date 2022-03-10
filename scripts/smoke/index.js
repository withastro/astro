/** @file Runs all smoke tests and may add extra smoke-test dependencies to `pnpm-lock.yaml`. */

// @ts-check

import { execa } from 'execa';
import { polyfill } from '@astrojs/webapi';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

polyfill(globalThis, { exclude: 'window document' });

/** URL directory containing the entire project. */
const rootDir = new URL('../../', import.meta.url);

/** URL directory containing the example subdirectories. */
const exampleDir = new URL('examples/', rootDir);
const smokeDir = new URL('smoke/', rootDir);

/** Returns all child directories of the given directory. */
const getChildDirectories = async (/** @type {URL} */ dir) => {
	/** @type {URL[]} */
	const dirs = [];

	for await (const dirent of await fs.opendir(dir)) {
		if (dirent.isDirectory()) {
			dirs.push(new URL(dirent.name, dir));
		}
	}

	return dirs;
};

/** Runs all smoke tests. */
async function run() {
	console.log('');

	const directories = [...(await getChildDirectories(smokeDir)), ...(await getChildDirectories(exampleDir))];

	console.log('🤖', 'Preparing', 'pnpm');

	await execa('pnpm', ['install', '--frozen-lockfile=false'], { cwd: fileURLToPath(rootDir), stdio: 'inherit' });

	for (const directory of directories) {
		const name = directory.pathname.split('/').at(-1) ?? "";
		const isExternal = directory.pathname.includes(smokeDir.pathname);
		console.log('🤖', 'Testing', name);

		try {
			await execa('pnpm', ['install', '--ignore-scripts', '--frozen-lockfile=false', isExternal ? '--shamefully-hoist' : ''].filter(x => x), { cwd: fileURLToPath(directory), stdio: 'inherit' });
			await execa('pnpm', ['run', 'build'], { cwd: fileURLToPath(directory), stdio: 'inherit' });
		} catch (err) {
			console.log(err);
			process.exit(1);
		}
	}
}

run();
