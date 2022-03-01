/** @file Runs all smoke tests and may add extra smoke-test dependencies to `yarn.lock`. */

// @ts-check

import Zip from 'adm-zip';
import rimraf from 'rimraf';
import { execa } from 'execa';
import { polyfill } from '@astropub/webapi';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

polyfill(globalThis, { exclude: 'window document' });

/* Configuration
/* -------------------------------------------------------------------------- */

/** URL directory containing this current script. */
// const scriptDir = new URL('./', import.meta.url);

/** URL directory containing the entire project. */
const rootDir = new URL('../../', import.meta.url);

/** URL directory containing the example subdirectories. */
const exampleDir = new URL('examples/', rootDir);
const smokeDir = new URL('smoke/', rootDir);

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
	await downloadGithubZip(docGithubConfig);
	await downloadGithubZip(wwwGithubConfig);
	await execa('yarn', [], { cwd: fileURLToPath(rootDir), stdout: 'inherit', stderr: 'inherit' });
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
	const githubDir = new URL(`${opts.name}-${opts.branch}`, smokeDir);
	/** Whether the expected directory is already available */
	rimraf.sync(fileURLToPath(githubDir));
	console.log('🤖', 'Downloading', `${opts.org}/${opts.name}#${opts.branch}`);
	const buffer = await fetchGithubZip(opts);
	console.log('🤖', 'Extracting', `${opts.org}/${opts.name}#${opts.branch}`);
	new Zip(buffer).extractAllTo(fileURLToPath(smokeDir), true);
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
	rimraf.sync(fileURLToPath(new URL(`yarn.lock`, githubDir)));
	rimraf.sync(fileURLToPath(new URL(`package-lock.json`, githubDir)));
};

/** Returns the parsed package.json of the given directory. */
const readDirectoryPackage = async (/** @type {URL} */ dir) => JSON.parse(await fs.readFile(new URL('package.json', dir + '/'), 'utf-8'));

/** Returns upon completion of writing a package.json to the given directory. */
const writeDirectoryPackage = async (/** @type {URL} */ dir, /** @type {any} */ data) =>
	await fs.writeFile(new URL('package.json', dir + '/'), JSON.stringify(data, null, '  ') + '\n');

/* Execution
/* -------------------------------------------------------------------------- */

run();

/** @typedef {{ org: string, name: string, branch: string }} GithubOpts */
