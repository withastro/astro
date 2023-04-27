import { polyfill } from '@astrojs/webapi';
import { type ExecaChildProcess } from 'execa';
import fastGlob from 'fast-glob';
import fs from 'fs';
import os from 'os';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'url';
import { type SyncOptions, type ProcessExit, sync } from '../core/sync/index.js';
import build, { type BuildOptions } from '../core/build/index.js';
import { openConfig, createSettings, validateConfig, mergeConfig } from '../core/config/index.js';
import dev from '../core/dev/index.js';
import { nodeLogDestination } from '../core/logger/node.js';
import preview from '../core/preview/index.js';
import { AstroChecker, check, type CheckPayload } from '../cli/check/index.js';
import type { AstroConfig, PreviewServer, SSRManifest } from "../@types/astro";
import { appendForwardSlash } from '../core/path.js';
import { type LogOptions, debug } from '../core/logger/core.js';
import type { DevOptions, DevServer } from '../core/dev/dev.js';
import { AstroTelemetry } from '@astrojs/telemetry';
import { ASTRO_VERSION } from '../core/constants.js';
import type { PreviewOptions } from 'vite';
import type { Stream } from 'stream';
import type { App } from '../core/app/index.js';
import { undefined } from "zod";

// polyfill WebAPIs to globalThis for Node v16
polyfill(globalThis, {
	exclude: 'window document',
});

export const defaultLogging: LogOptions = {
	dest: nodeLogDestination,
	level: 'info',
};

export const silentLogging = {
	dest: nodeLogDestination,
	level: 'silent',
};

type writeFileContentsType =
	string
	| Stream
	| NodeJS.ArrayBufferView
	| Iterable<string | NodeJS.ArrayBufferView>
	| AsyncIterable<string | NodeJS.ArrayBufferView>;
type writeFileContentsCallback = (contents: writeFileContentsType) => writeFileContentsType;
type writeFileContentsTypeOrCallback = writeFileContentsType | writeFileContentsCallback;

export interface Fixture {
	/**
	 * Builds into current folder (will erase previous build).
	 * @param {BuildOptions} opts
	 * @return {Promise<void>}
	 */
	build: (opts?: Partial<BuildOptions>) => Promise<void>;

	/**
	 * Starts a temporary ViteDevServer and generates content collection types.
	 * @param {SyncOptions} opts
	 * @return Promise<ProcessExit> - A non-zero process signal is emitted in case there's an error.
	 */
	sync: (opts: Omit<SyncOptions, "logging" | "fs">) => Promise<ProcessExit>;

	/**
	 * This function returns an instance of the AstroChecker, responsible to check files - classic or watch mode - and
	 * report diagnostics.
	 *
	 * When used in a test suite:
	 * ```js
	 * let fixture = await loadFixture({
	 *   root: new URL('./fixtures/astro-check-watch/', import.meta.url),
	 * });
	 * ```
	 * `opts` will override the options passed to the `AstroChecker`, expecting `opts.logging`.
	 *
	 * ```js
	 * let { check, stop, watch } = fixture.check({
	 *   flags: { watch: true },
	 * });
	 * ```
	 *
	 * @param {CheckPayload} opts
	 * @return {Promise<AstroChecker | undefined>}
	 */
	check: (opts: Omit<CheckPayload, "logging">) => Promise<AstroChecker | undefined>;

	/**
	 * Starts a dev server at an available port. Be sure to call devServer.stop() before test exit.
	 * @param {Partial<DevOptions>} opts
	 * @return {Promise<DevServer | undefined>}
	 */
	startDevServer: (opts?: Partial<DevOptions>) => Promise<DevServer | undefined>;

	/**
	 * Stops the current development server. `config.server.host` and `config.server.post` are undefined corresponding.
	 * @param {boolean?} reset_all_files - Resets to original all modified/created files, if `true`.
	 * @return Promise<void>
	 */
	stopDevServer: (reset_all_files?: boolean) => Promise<void>;

	/**
	 * @type AstroConfig
	 */
	config: AstroConfig;

	/**
	 * Build a URI from the current `config.server.host` and `config.server.port` and the `url` parameter. A trailing
	 * slash '/' is applied and any further trailing slashes removed.
	 * @param {string} url
	 * @return {string} - New URI.
	 */
	resolveUrl: (url: string) => string;

	/**
	 * Returns a site from the preview server (must have called `startPreviewServer()` before).
	 * @param {string} url
	 * @param {RequestInit} init
	 * @return {Promise<Response>}
	 */
	fetch: (url: string, init?: RequestInit) => Promise<Response>;

	/**
	 * Wrapper for `startPreviewServer()` method.
	 * @deprecated Please use `startPreviewServer()` instead.
	 * @param {PreviewOptions} opts
	 * @return {Promise<PreviewServer | undefined>}
	 */
	preview: (opts?: Omit<PreviewOptions, "logging" | "telemetry">) => Promise<PreviewServer | undefined>;

	/**
	 * Starts a preview server and updates the `config.server.host` and `config.server.port` configuration corresponding.
	 * @param {PreviewOptions} opts
	 * @return {Promise<PreviewServer | undefined>}
	 */
	startPreviewServer: (opts?: Omit<PreviewOptions, "logging" | "telemetry">) => Promise<PreviewServer | undefined>;

	/**
	 * Stops current preview server.
	 * @return {Promise<void>}
	 */
	stopPreviewServer: () => Promise<void>;

	/**
	 * Check if the `p` exists relative to `config.outDir`.
	 * @param {string} p -
	 * @return {boolean}
	 */
	pathExists: (p: string) => boolean;

	/**
	 * Read the `filePath` from the directory relative to `config.outDir`.
	 * @param {string} filePath
	 * @param {BufferEncoding} encoding
	 * @return {Promise<string | Buffer>}
	 */
	readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string | Buffer>;

	/**
	 * Reads the contents of the `fp` directory relative to `config.outDir`.
	 * @param {string} fp
	 * @return {Promise<string[]>}
	 */
	readdir: (fp: string) => Promise<string[]>;

	/**
	 * Traversing the file system and returning pathnames that matched a defined set of a specified
	 * pattern according to the rules used by the Unix Bash shell with some simplifications, meanwhile
	 * results are returned in arbitrary order.
	 * @param {string|string[]} pattern
	 * @return {Promise<string[]>}
	 */
	glob: (pattern: string | string[]) => Promise<string[]>;

	/**
	 * Delete the `config.outDir` directory.
	 */
	clean: () => void;

	/**
	 * SSR (Server-side Rendering)
	 * @param {boolean} streaming - Default: `true`
	 * @return {Promise<TestAdapterApp>}
	 */
	loadTestAdapterApp: ({streaming}?: { streaming: boolean }) => Promise<TestAdapterApp>;

	/**
	 * Modify the file `filePath` within `config.outDir`.
	 * Restore the content of all files with `resetAllFiles()`.
	 * @param {string} filePath
	 * @param {writeFileContentsTypeOrCallback} newContentsOrCallback
	 */
	editFile: (filePath: string, newContentsOrCallback: writeFileContentsTypeOrCallback) => void;

	/**
	 * Restore the previous content of all files, which where modified with `editFile`.
	 */
	resetAllFiles: () => void;
}

export type FixtureConfig = {
	startDevServer?: boolean;
}

export type TestFactoryConfig = {
	testFactory?: FixtureConfig;
}

export interface TestAdapterApp {
	manifest: SSRManifest,
	app: App,
}

/**
 * @param {string} [address]
 */
function parseAddressToHost(address: string): string {
	if (address?.startsWith('::')) {
		return `[${address}]`;
	}
	return address;
}

/**
 * Load Astro test fixture
 * @param {AstroConfig} inlineConfig - Astro configuration (note: must specify `root` as URL)
 * @return {Promise<Fixture>} The fixture. Has the following properties:
 */
export async function loadFixture(inlineConfig: Partial<AstroConfig>): Promise<Fixture> {
	if (!inlineConfig?.root)
		throw new Error("Must provide { root: new URL('./fixtures/...', import.meta.url) }");

	// Load the config.
	const cmd = 'dev';
	let {astroConfig: config} = await openConfig({
		cwd: fileURLToPath(inlineConfig?.root),
		logging: defaultLogging,
		cmd,
	});
	config = mergeConfig(config, {
		vite: {
			server: {
				fs: {
					// Allow serving files outside of fixture root directory.
					// This is mandatory because typically a testsuite is a subdirectory of your
					// project, and the project files need to be included within the test which
					// in upper directories. So we need the ability to resolve them in the URL route.
					// See: https://vitejs.dev/config/server-options.html#server-fs-strict
					strict: false
				}
			}
		},
		...inlineConfig
	}) as AstroConfig;

	// HACK: the inline config doesn't run through config validation where these normalizations usually occur
	if (inlineConfig?.base) {
		config.base = appendForwardSlash(inlineConfig.base);
	}
	/* We can not use validateConfig() from ../core/config because the Zod type checking expecting
	* strings instead of the real objects. More details about the defaults and the Zod type checking
	* can be found in ../core/config/schema.ts. */
	//config = await validateConfig(config, fileURLToPath(inlineConfig?.root), cmd);

	let settings = createSettings(config, fileURLToPath(inlineConfig?.root));
	if (config.integrations.find((integration) => integration.name === '@astrojs/mdx')) {
		// Enable default JSX integration. It needs to come first, so unshift rather than push!
		// @ts-ignore
		const {default: jsxRenderer} = await import('astro/jsx/renderer.js');
		settings.renderers.unshift(jsxRenderer);
	}

	const telemetry = new AstroTelemetry({
		astroVersion: ASTRO_VERSION,
		viteVersion: "0"
	});
	telemetry.record = () => {
		return Promise.resolve();
	};

	const resolveUrl = (url: string) =>
		`http://${config.server.host}:${config.server.port}${url.replace(/^\/?/, '/')}`;

	// A map of files that have been edited.
	let fileEdits = new Map();

	const resetAllFiles = () => {
		for (const [, reset] of fileEdits) {
			reset();
		}
		fileEdits.clear();
	};

	const onNextChange = () =>
		devServer
			? new Promise((resolve) => devServer?.watcher.once('change', resolve))
			: Promise.reject(new Error('No dev server running'));

	const startPreviewServer = async (opts?: Omit<PreviewOptions, "logging" | "telemetry">): Promise<PreviewServer | undefined> => {
		if (previewServer)
			throw new Error(`Stop previewServer before continue. Another previewServer is already running: ${resolveUrl('')}`);
		if (devServer)
			throw new Error(`Stop devServer (${resolveUrl('')}) before continue with previewServer.`);
		process.env.NODE_ENV = 'production';
		previewServer = await preview(settings, {
			logging: defaultLogging,
			telemetry,
			...opts,
		});
		if (previewServer) {
			if (previewServer.host) {
				config.server.host = parseAddressToHost(previewServer.host); // update host
			}
			config.server.port = previewServer.port; // update port
			debug(defaultLogging, 'astro', `Preview server started at ${config.server.host}:${config.server.port}`);
		}
		return previewServer;
	};

	// After each test, reset each of the edits to their original contents.
	if (typeof afterEach === 'function') {
		afterEach(resetAllFiles);
	}
	// Also do it on process exit, just in case.
	process.on('exit', resetAllFiles);

	let fixtureId = new Date().valueOf();
	let devServer: DevServer | undefined;
	let previewServer: PreviewServer | undefined;

	return {
		build: async (opts?: Partial<BuildOptions>) => {
			process.env.NODE_ENV = 'production';
			return await build(settings, {logging: defaultLogging, telemetry, ...opts});
		},
		sync: (opts: Omit<SyncOptions, "logging" | "fs">) => sync(settings, {logging: defaultLogging, fs, ...opts}),
		check: async (opts: Omit<CheckPayload, "logging">) => {
			return await check(settings, {logging: defaultLogging, ...opts});
		},
		startDevServer: async (opts?: Partial<DevOptions>) => {
			if (devServer)
				throw new Error(`Stop devServer before continue. Another devServer is already running: ${resolveUrl('')}`);
			if (previewServer)
				throw new Error(`Stop previewServer (${resolveUrl('')}) before continue with a new devServer.`);
			debug(defaultLogging, 'astro', 'Starting development server with following settings' + JSON.stringify(settings, null, 2));
			process.env.NODE_ENV = 'development';
			devServer = await dev(settings, {
				configFlag: "", configFlagPath: "", handleConfigError: (error: Error) => {
					throw new Error(`Configuration error for startDevServer(): ${error.message}`);
				}, logging: defaultLogging, telemetry, ...opts
			});
			if (devServer) {
				config.server.host = parseAddressToHost(devServer.address.address); // update host
				config.server.port = devServer.address.port; // update port
				debug(defaultLogging, 'astro', `Development server started at ${config.server.host}:${config.server.port}`);
			}
			return devServer;
		},
		stopDevServer: async (reset_all_files = true) => {
			if (devServer) {
				debug(defaultLogging, 'astro', `Stopping development server at ${config.server.host}:${config.server.port}`);
				await devServer.stop();
				devServer = void 0;
				config.server.host = false;
				config.server.port = 0;
				reset_all_files && resetAllFiles();
			}
		},
		config,
		resolveUrl,
		fetch: async (url: string, init?: RequestInit): Promise<Response> => fetch(resolveUrl(url), init),
		preview: async (opts?: Omit<PreviewOptions, "logging" | "telemetry">) => {
			return startPreviewServer(opts);
		},
		startPreviewServer,
		stopPreviewServer: async () => {
			if (previewServer) {
				debug(defaultLogging, 'astro', `Stopping preview server at ${config.server.host}:${config.server.port}`);
				await previewServer.stop();
				previewServer = void 0;
				config.server.host = false;
				config.server.port = 0;
			}
		},
		pathExists: (p: string) => fs.existsSync(new URL(p.replace(/^\//, ''), config.outDir)),
		readFile: async (filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string | Buffer> => fs.promises.readFile(
			new URL(filePath.replace(/^\//, ''), config.outDir), encoding),
		readdir: async (fp: string): Promise<string[]> => fs.promises.readdir(new URL(fp.replace(/^\//, ''), config.outDir)),
		glob: async (pattern: string | string[]): Promise<string[]> =>
			fastGlob(pattern, {
				cwd: fileURLToPath(config.outDir),
			}),
		clean: async () => {
			await fs.promises.rm(config.outDir, {
				maxRetries: 10,
				recursive: true,
				force: true,
			});
		},
		loadTestAdapterApp: async ({streaming}: { streaming: boolean } = {streaming: true}): Promise<TestAdapterApp> => {
			const url = new URL(`./server/entry.mjs?id=${fixtureId}`, config.outDir);
			// Implementation depends on @astrojs/vite-plugin-astro-ssr in Astro core plugins
			const {createApp, manifest}: {
				createApp: (streaming: boolean) => App,
				manifest: SSRManifest
			} = await import(url.toString());
			return {
				manifest,
				app: createApp(streaming)
			};
		},
		editFile: async (filePath: string, newContentsOrCallback: writeFileContentsTypeOrCallback) => {
			const fileUrl = new URL(filePath.replace(/^\//, ''), config.root);
			const contents = await fs.promises.readFile(fileUrl, 'utf-8');
			const reset = () => {
				fs.writeFileSync(fileUrl, contents);
			};
			// Only save this reset if not already in the map, in case multiple edits happen
			// to the same file.
			if (!fileEdits.has(fileUrl.toString())) {
				fileEdits.set(fileUrl.toString(), reset);
			}
			const newContents =
				typeof newContentsOrCallback === 'function'
					? newContentsOrCallback(contents)
					: newContentsOrCallback;
			const nextChange = onNextChange();
			await fs.promises.writeFile(fileUrl, newContents);
			await nextChange;
			return reset;
		},
		resetAllFiles,
	};
}

export async function parseCliDevStart(proc: ExecaChildProcess): Promise<{ messages: string[] }> {
	let stdout = '';
	let stderr = '';

	if (proc.stdout) {
		for await (const chunk of proc.stdout) {
			stdout += chunk;
			if (chunk.includes('Local')) break;
		}
	}
	if (!stdout && proc.stderr) {
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

	return {messages};
}

export const isLinux = os.platform() === 'linux';
export const isMacOS = os.platform() === 'darwin';
export const isWindows = os.platform() === 'win32';

export function fixLineEndings(str: string): string {
	return str.replace(/\r\n/g, '\n');
}

export async function* streamAsyncIterator<R>(stream: ReadableStream<R>) {
	const reader = stream.getReader();

	try {
		while (true) {
			const {done, value} = await reader.read();
			if (done) return;
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

// TODO: /** @type {import('astro/src/testing/index').Fixture} */
