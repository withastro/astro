import { execa } from 'execa';
import { polyfill } from '@astrojs/webapi';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { resolveConfig, loadConfig } from '../dist/core/config.js';
import dev from '../dist/core/dev/index.js';
import build from '../dist/core/build/index.js';
import preview from '../dist/core/preview/index.js';
import { nodeLogDestination } from '../dist/core/logger/node.js';
import os from 'os';
import stripAnsi from 'strip-ansi';

// polyfill WebAPIs to globalThis for Node v12, Node v14, and Node v16
polyfill(globalThis, {
	exclude: 'window document',
});

/**
 * @typedef {import('node-fetch').Response} Response
 * @typedef {import('../src/core/dev/index').DevServer} DevServer
 * @typedef {import('../src/@types/astro').AstroConfig} AstroConfig
 * @typedef {import('../src/core/preview/index').PreviewServer} PreviewServer
 * @typedef {import('../src/core/app/index').App} App
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
 * @property {() => Promise<App>} loadTestAdapterApp
 */

/**
 * Load Astro fixture
 * @param {AstroConfig} inlineConfig Astro config partial (note: must specify `root`)
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
	if (!inlineConfig || !inlineConfig.root)
		throw new Error("Must provide { root: './fixtures/...' }");

	// load config
	let cwd = inlineConfig.root;
	delete inlineConfig.root;
	if (typeof cwd === 'string') {
		try {
			cwd = new URL(cwd.replace(/\/?$/, '/'));
		} catch (err1) {
			cwd = new URL(cwd.replace(/\/?$/, '/'), import.meta.url);
		}
	}
	// Load the config.
	let config = await loadConfig({ cwd: fileURLToPath(cwd) });
	config = merge(config, { ...inlineConfig, root: cwd });

	// Note: the inline config doesn't run through config validation where these normalizations usually occur
	if (typeof inlineConfig.site === 'string') {
		config.site = new URL(inlineConfig.site);
	}
	if (inlineConfig.base && !inlineConfig.base.endsWith('/')) {
		config.base = inlineConfig.base + '/';
	}

	/** @type {import('../src/core/logger/core').LogOptions} */
	const logging = {
		dest: nodeLogDestination,
		level: 'error',
	};

	return {
		build: (opts = {}) => build(config, { mode: 'development', logging, ...opts }),
		startDevServer: async (opts = {}) => {
			const devResult = await dev(config, { logging, ...opts });
			config.server.port = devResult.address.port; // update port
			return devResult;
		},
		config,
		fetch: (url, init) =>
			fetch(`http://${'127.0.0.1'}:${config.server.port}${url.replace(/^\/?/, '/')}`, init),
		preview: async (opts = {}) => {
			const previewServer = await preview(config, { logging, ...opts });
			return previewServer;
		},
		readFile: (filePath) =>
			fs.promises.readFile(new URL(filePath.replace(/^\//, ''), config.outDir), 'utf8'),
		readdir: (fp) => fs.promises.readdir(new URL(fp.replace(/^\//, ''), config.outDir)),
		clean: () => fs.promises.rm(config.outDir, { maxRetries: 10, recursive: true, force: true }),
		loadTestAdapterApp: async () => {
			const url = new URL('./server/entry.mjs', config.outDir);
			const { createApp } = await import(url);
			return createApp();
		},
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
			typeof a[k] === 'object' &&
			typeof b[k] === 'object' &&
			(Object.keys(a[k]).length || Object.keys(b[k]).length) &&
			!Array.isArray(a[k]) &&
			!Array.isArray(b[k]);
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

export async function parseCliDevStart(proc) {
	let stdout = '';
	let stderr = '';

	for await (const chunk of proc.stdout) {
		stdout += chunk;
		if (chunk.includes('Local')) break;
	}
	if (!stdout) {
		for await (const chunk of proc.stderr) {
			stderr += chunk;
			break;
		}
	}

	proc.kill();
	stdout = stripAnsi(stdout);
	stderr = stripAnsi(stderr);

	if (stderr) {
		throw new Error(stderr);
	}

	const messages = stdout
		.split('\n')
		.filter((ln) => !!ln.trim())
		.map((ln) => ln.replace(/[🚀┃]/g, '').replace(/\s+/g, ' ').trim());

	return { messages };
}

export async function cliServerLogSetup(flags = [], cmd = 'dev') {
	const proc = cli(cmd, ...flags);

	const { messages } = await parseCliDevStart(proc);

	const local = messages.find((msg) => msg.includes('Local'))?.replace(/Local\s*/g, '');
	const network = messages.find((msg) => msg.includes('Network'))?.replace(/Network\s*/g, '');

	return { local, network };
}

export const isWindows = os.platform() === 'win32';
