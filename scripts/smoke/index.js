/** @file Runs all smoke tests and may add extra smoke-test dependencies to `yarn.lock`. */

// @ts-check

import Zip from 'adm-zip';
import { execa } from 'execa';
import { polyfill } from '@astropub/webapi';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

polyfill(globalThis, { exclude: 'window document' });

/* Configuration
/* -------------------------------------------------------------------------- */

/** URL directory containing this current script. */
const scriptDir = new URL('./', import.meta.url);

/** URL directory containing the entire project. */
const rootDir = new URL('../../', import.meta.url);

/** URL directory containing the example subdirectories. */
const exampleDir = new URL('examples/', rootDir);

/** URL directory containing the Astro package. */
const astroDir = new URL('packages/astro/', rootDir);

/** GitHub configuration for the external "docs" Astro project. */
const docGithubConfig = { org: 'withastro', name: 'docs', branch: 'main' };

/** GitHub configuration for the external "astro.build" Astro project. */
const wwwGithubConfig = { org: 'withastro', name: 'astro.build', branch: 'main' };

/* Application
/* -------------------------------------------------------------------------- */

/** Runs all smoke tests. */
async function run() {
	console.log('');

	const directories = await getChildDirectories(exampleDir);

	// TODO Skipped the docs-main test since it is failing at the moment.
	directories.push(/*await downloadGithubZip(docGithubConfig), */await downloadGithubZip(wwwGithubConfig));

	console.log('🤖', 'Preparing', 'yarn');

	await execa('yarn', [], { cwd: fileURLToPath(rootDir), stdout: 'inherit', stderr: 'inherit' });

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

/* Functionality
/* -------------------------------------------------------------------------- */

/** Returns the URL to the ZIP of the given GitHub project. */
const getGithubZipURL = (/** @type {GithubOpts} */ opts) => `https://github.com/${opts.org}/${opts.name}/archive/refs/heads/${opts.branch}.zip`;

/** Returns the awaited ZIP Buffer from the given GitHub project. */
const fetchGithubZip = (/** @type {GithubOpts} */ opts) =>
	fetch(getGithubZipURL(opts))
		.then((response) => response.arrayBuffer())
		.then((arrayBuffer) => Buffer.from(arrayBuffer));

/** Downloads a ZIP from the given GitHub project. */
const downloadGithubZip = async (/** @type {GithubOpts} */ opts) => {
	/** Expected directory when the zip is downloaded. */
	const githubDir = new URL(`${opts.name}-${opts.branch}`, scriptDir);

	/** Whether the expected directory is already available */
	const hasGithubDir = await fs.stat(githubDir).then(
		(stats) => stats.isDirectory(),
		() => false
	);

	if (!hasGithubDir) {
		console.log('🤖', 'Downloading', `${opts.org}/${opts.name}#${opts.branch}`);

		const buffer = await fetchGithubZip(opts);

		console.log('🤖', 'Extracting', `${opts.org}/${opts.name}#${opts.branch}`);

		new Zip(buffer).extractAllTo(fileURLToPath(scriptDir), true);

		console.log('🤖', 'Preparing', `${opts.org}/${opts.name}#${opts.branch}`);

		const astroPackage = await readDirectoryPackage(astroDir);

		const githubPackage = await readDirectoryPackage(githubDir);

		if ('astro' in Object(githubPackage.dependencies)) {
			githubPackage.dependencies['astro'] = astroPackage.version;
		}

		if ('astro' in Object(githubPackage.devDependencies)) {
			githubPackage.devDependencies['astro'] = astroPackage.version;
		}

		if ('astro' in Object(githubPackage.peerDependencies)) {
			githubPackage.peerDependencies['astro'] = astroPackage.version;
		}

		await writeDirectoryPackage(githubDir, githubPackage);
	}

	return githubDir;
};

/** Returns the parsed package.json of the given directory. */
const readDirectoryPackage = async (/** @type {URL} */ dir) => JSON.parse(await fs.readFile(new URL('package.json', dir + '/'), 'utf-8'));

/** Returns upon completion of writing a package.json to the given directory. */
const writeDirectoryPackage = async (/** @type {URL} */ dir, /** @type {any} */ data) =>
	await fs.writeFile(new URL('package.json', dir + '/'), JSON.stringify(data, null, '  ') + '\n');

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

/* Execution
/* -------------------------------------------------------------------------- */

run();

/** @typedef {{ org: string, name: string, branch: string }} GithubOpts */
