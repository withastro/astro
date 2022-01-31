import { execa } from 'execa';
import { polyfill } from '@astropub/webapi';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadConfig } from '../dist/core/config.js';
import dev from '../dist/core/dev/index.js';
import build from '../dist/core/build/index.js';
import preview from '../dist/core/preview/index.js';
import os from 'os';

// polyfill WebAPIs to globalThis for Node v12, Node v14, and Node v16
polyfill(globalThis, {
	exclude: 'window document',
});

/**
 * @typedef {import('node-fetch').Response} Response
 * @typedef {import('../src/core/dev/index').DevServer} DevServer
 * @typedef {import('../src/@types/astro').AstroConfig} AstroConfig
 * @typedef {import('../src/core/preview/index').PreviewServer} PreviewServer
 *
 *
 * @typedef {Object} Fixture
 * @property {typeof build} build
 * @property {(url: string, opts: any) => Promise<Response>} fetch
 * @property {(path: string) => Promise<string>} readFile
 * @property {(path: string) => Promise<string[]>} readdir
 * @property {() => Promise<DevServer>} startDevServer
 * @property {() => Promise<PreviewServer>} preview
 * @property {() => Promise<void>} clean
 */

/**
 * Load Astro fixture
 * @param {AstroConfig} inlineConfig Astro config partial (note: must specify projectRoot)
 * @returns {Promise<Fixture>} The fixture. Has the following properties:
 *   .config     - Returns the final config. Will be automatically passed to the methods below:
 *
 *   Build
 *   .build()          - Async. Builds into current folder (will erase previous build)
 *   .readFile(path)   - Async. Read a file from the build.
 *
 *   Dev
 *   .startDevServer() - Async. Starts a dev server at an available port. Be sure to call devServer.stop() before test exit.
 *   .fetch(url)       - Async. Returns a URL from the prevew server (must have called .preview() before)
 *
 *   Preview
 *   .preview()        - Async. Starts a preview server. Note this can’t be running in same fixture as .dev() as they share ports. Also, you must call `server.close()` before test exit
 *
 *   Clean-up
 *   .clean()          - Async. Removes the project’s dist folder.
 */
export async function loadFixture(inlineConfig) {
	if (!inlineConfig || !inlineConfig.projectRoot) throw new Error("Must provide { projectRoot: './fixtures/...' }");

	// load config
	let cwd = inlineConfig.projectRoot;
	if (typeof cwd === 'string') {
		try {
			cwd = new URL(cwd.replace(/\/?$/, '/'));
		} catch (err1) {
			cwd = new URL(cwd.replace(/\/?$/, '/'), import.meta.url);
		}
	}

	// merge configs
	if (!inlineConfig.buildOptions) inlineConfig.buildOptions = {};
	if (inlineConfig.buildOptions.sitemap === undefined) inlineConfig.buildOptions.sitemap = false;
	if (!inlineConfig.devOptions) inlineConfig.devOptions = {};
	let config = await loadConfig({ cwd: fileURLToPath(cwd) });
	config = merge(config, { ...inlineConfig, projectRoot: cwd });

	return {
		build: (opts = {}) => build(config, { mode: 'development', logging: 'error', ...opts }),
		startDevServer: async (opts = {}) => {
			const devResult = await dev(config, { logging: 'error', ...opts });
			config.devOptions.port = devResult.address.port; // update port
			inlineConfig.devOptions.port = devResult.address.port;
			return devResult;
		},
		config,
		fetch: (url, init) => fetch(`http://${config.devOptions.hostname}:${config.devOptions.port}${url.replace(/^\/?/, '/')}`, init),
		preview: async (opts = {}) => {
			const previewServer = await preview(config, { logging: 'error', ...opts });
			inlineConfig.devOptions.port = previewServer.port; // update port for fetch
			return previewServer;
		},
		readFile: (filePath) => fs.promises.readFile(new URL(filePath.replace(/^\//, ''), config.dist), 'utf8'),
		readdir: (fp) => fs.promises.readdir(new URL(fp.replace(/^\//, ''), config.dist)),
		clean: () => fs.promises.rm(config.dist, { maxRetries: 10, recursive: true, force: true }),
	};
}

/**
 * Basic object merge utility. Returns new copy of merged Object.
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
function merge(a, b) {
	const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
	const c = {};
	for (const k of allKeys) {
		const needsObjectMerge =
			typeof a[k] === 'object' && typeof b[k] === 'object' && (Object.keys(a[k]).length || Object.keys(b[k]).length) && !Array.isArray(a[k]) && !Array.isArray(b[k]);
		if (needsObjectMerge) {
			c[k] = merge(a[k] || {}, b[k] || {});
			continue;
		}
		c[k] = a[k];
		if (b[k] !== undefined) c[k] = b[k];
	}
	return c;
}

const cliPath = fileURLToPath(new URL('../astro.js', import.meta.url));

/** Returns a process running the Astro CLI. */
export function cli(/** @type {string[]} */ ...args) {
	const spawned = execa('node', [cliPath, ...args]);

	spawned.stdout.setEncoding('utf8');

	return spawned;
}

export const isWindows = os.platform() === 'win32';
