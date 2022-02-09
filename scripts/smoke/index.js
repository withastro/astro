/** @todo migrate these to use the independent docs repository at https://github.com/withastro/docs */

// NOTE: Only needed for Windows, due to a Turbo bug.
// Once Turbo works on Windows, we can remove this script
// and update our CI to run through Turbo.

// @ts-check

import Zip from 'adm-zip';
import { execa } from 'execa';
import { polyfill } from '@astropub/webapi';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

polyfill(globalThis, { exclude: 'window document' });

const currentDir = new URL('./', import.meta.url);

/** Returns the URL to the ZIP of the given GitHub project. */
const getGitHubZipURL = (/** @type {GitHubZipOpts} */ opts) => `https://github.com/${opts.org}/${opts.name}/archive/refs/heads/${opts.branch}.zip`;

/** Returns the awaited ZIP Buffer from the given GitHub project. */
const fetchGitHubZip = (/** @type {GitHubZipOpts} */ opts) =>
	fetch(getGitHubZipURL(opts))
		.then((response) => response.arrayBuffer())
		.then((arrayBuffer) => Buffer.from(arrayBuffer));

/** Downloads a ZIP from the given GitHub project. */
const downloadGitHubZip = async (/** @type {GitHubZipOpts} */ opts) => {
	/** Expected directory when the zip is downloaded. */
	const expectedDir = new URL(`${opts.name}-${opts.branch}`, currentDir);

	/** Whether the expected directory is already available */
	const hasExpectedDir = await fs.stat(expectedDir).then(
		(stats) => stats.isDirectory(),
		() => false
	);

	if (!hasExpectedDir) {
		console.log('🤖', 'Downloading', `${opts.org}/${opts.name}#${opts.branch}`);

		const buffer = await fetchGitHubZip(opts);

		console.log('🤖', 'Extracting', `${opts.org}/${opts.name}#${opts.branch}`);

		new Zip(buffer).extractAllTo(fileURLToPath(currentDir), true);

		console.log('🤖', 'Preparing', `${opts.org}/${opts.name}#${opts.branch}`);
		await execa('yarn', [], { cwd: fileURLToPath(expectedDir), stdout: 'inherit', stderr: 'inherit' });
	}

	return expectedDir;
};

/** Returns all child directories of the given directory. */
const getDirectories = async (/** @type {URL} */ dir) => {
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
export default async function run() {
	console.log('');

	const directories = await getDirectories(new URL('../../examples/', import.meta.url));

	directories.push(await downloadGitHubZip({ org: 'withastro', name: 'docs', branch: 'main' }), await downloadGitHubZip({ org: 'withastro', name: 'astro.build', branch: 'main' }));

	for (const directory of directories) {
		console.log('🤖', 'Testing', directory.pathname.split('/').at(-1));

		try {
			await execa('yarn', ['build'], { cwd: fileURLToPath(directory), stdout: 'inherit', stderr: 'inherit' });
		} catch (err) {
			console.log(err);
			process.exit(1);
		}

		console.log();
	}
}

run();

/** @typedef {{ org: string, name: string, branch: string }} GitHubZipOpts */
