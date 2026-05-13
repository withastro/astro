import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { Agent } from 'undici';
import { CILogger } from '../../../scripts/testing/github-utils.js';
import { check } from '../dist/cli/check/index.js';
import { globalContentLayer } from '../dist/content/instance.js';
import { globalContentConfigObserver } from '../dist/content/utils.js';
import build from '../dist/core/build/index.js';
import { mergeConfig, resolveConfig } from '../dist/core/config/index.js';
import { dev, preview } from '../dist/core/index.js';
import sync from '../dist/core/sync/index.js';
import type { App } from '../dist/core/app/app.js';
import type { DevServer } from '../dist/core/dev/dev.js';
import type {
	AstroConfig,
	AstroInlineConfig as BaseAstroInlineConfig,
} from '../dist/types/public/config.js';
import type { PreviewServer } from '../dist/types/public/preview.js';

export type { App, AstroConfig, DevServer, PreviewServer };

// Disable telemetry when running tests
process.env.ASTRO_TELEMETRY_DISABLED = 'true';

export type AstroInlineConfig = Omit<BaseAstroInlineConfig, 'root'> & {
	root?: string | URL;
};

// `RequestHandler` is defined in `@astrojs/node` so we cannot import it directly.
// See https://github.com/withastro/astro/blob/astro@6.0.0/packages/integrations/node/src/types.ts#L44-L50
export type RequestHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	next?: (err?: unknown) => void,
	locals?: object,
	// We use `PromiseLike` instead of `Promise` as the return type to bypass the `no-floating-promises` eslint rule.
	// See https://typescript-eslint.io/rules/no-floating-promises/
) => void | PromiseLike<void>;

// `startServer` is defined in `@astrojs/node` so we cannot import it directly.
// See https://github.com/withastro/astro/blob/astro@6.0.0/packages/integrations/node/src/server.ts#L21
export type AdapterServer = PreviewServer & { server: Server };
export type AdapterStartServer = () => { server: AdapterServer; stop: Promise<void> };

export interface Fixture {
	build: (
		extraInlineConfig?: Parameters<typeof build>[0],
		options?: Parameters<typeof build>[1],
	) => Promise<void>;
	resolveUrl: (url: string) => string;
	pathExists: (p: string) => boolean;
	fetch: (url: string, opts?: Parameters<typeof fetch>[1]) => Promise<Response>;
	readFile: {
		(filePath: string): Promise<string>;
		(filePath: string, encoding: BufferEncoding): Promise<string>;
		(filePath: string, encoding: null): Promise<Buffer>;
	};
	readBuffer: (filePath: string) => Promise<Buffer>;
	editFile: (
		filePath: string,
		newContentsOrCallback: string | ((content: string) => string),
		waitForNextWrite?: boolean,
	) => Promise<() => void>;
	readdir: (fp: string) => Promise<string[]>;
	glob: (pattern: string) => Promise<string[]>;
	startDevServer: (extraInlineConfig?: Parameters<typeof dev>[0]) => Promise<DevServer>;
	preview: (extraInlineConfig?: Parameters<typeof preview>[0]) => Promise<PreviewServer>;
	clean: () => Promise<void>;
	loadTestAdapterApp: (streaming?: boolean) => Promise<App>;
	loadSelfAdapterApp: (streaming?: boolean) => Promise<App>;
	loadAdapterEntryModule: () => Promise<{
		handler: RequestHandler;
		startServer: AdapterStartServer;
	}>;
	loadNodeAdapterHandler: () => Promise<RequestHandler>;
	onNextDataStoreChange: (timeout?: number) => Promise<void>;
	check: typeof check;
	sync: typeof sync;
	config: AstroConfig;
	resetAllFiles: () => void;
}

/**
 * Load Astro fixture
 *
 *   Build
 *   .build()          - Async. Builds into current folder (will erase previous build)
 *   .readFile(path)   - Async. Read a file from the build.
 *
 *   Dev
 *   .startDevServer() - Async. Starts a dev server at an available port. Be sure to call devServer.stop() before test exit.
 *   .fetch(url)       - Async. Returns a URL from the preview server (must have called .preview() before)
 *
 *   Preview
 *   .preview()        - Async. Starts a preview server. Note this can’t be running in same fixture as .dev() as they share ports. Also, you must call `server.close()` before test exit
 *
 *   Clean-up
 *   .clean()          - Async. Removes the project’s dist folder.
 */
export async function loadFixture(inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// Silent by default during tests to not pollute the console output
	inlineConfig.logLevel ??= 'silent';
	inlineConfig.vite ??= {};
	inlineConfig.vite.logLevel = 'silent';

	let root: string | URL = inlineConfig.root;
	// Handle URL, should already be absolute so just convert to path
	if (typeof root !== 'string') {
		root = fileURLToPath(root);
	}
	// Handle "file:///C:/Users/fred", convert to "C:/Users/fred"
	else if (root.startsWith('file://')) {
		root = fileURLToPath(new URL(root));
	}
	// Handle "./fixtures/...", convert to absolute path
	else if (!path.isAbsolute(root)) {
		root = fileURLToPath(new URL(root, import.meta.url));
	}
	const resolvedInlineConfig: BaseAstroInlineConfig = { ...inlineConfig, root };
	// Load the config.
	const { astroConfig: config } = await resolveConfig(resolvedInlineConfig, 'dev');

	const protocol = config.vite?.server?.https ? 'https' : 'http';

	const resolveUrl = (url: string) =>
		`${protocol}://${config.server.host || 'localhost'}:${config.server.port}${url.replace(
			/^\/?/,
			'/',
		)}`;

	// A map of files that have been edited.
	const fileEdits = new Map<string, () => void>();

	const resetAllFiles = () => {
		for (const [, reset] of fileEdits) {
			reset();
		}
		fileEdits.clear();
	};

	const onNextChange = () =>
		devServer
			? new Promise<void>((resolve) => devServer!.watcher.once('change', () => resolve()))
			: Promise.reject(new Error('No dev server running'));

	// After each test, reset each of the edits to their original contents.
	// `afterEach` is not a `node:test` global, but older test runners expose it — guard defensively.
	const maybeAfterEach = (globalThis as { afterEach?: (fn: () => void) => void }).afterEach;
	if (typeof maybeAfterEach === 'function') {
		maybeAfterEach(resetAllFiles);
	}
	// Also do it on process exit, just in case.
	process.on('exit', resetAllFiles);

	const fixtureId = new Date().valueOf();
	let devServer: DevServer | undefined;

	return {
		build: async (extraInlineConfig = {}, options = {}) => {
			globalContentLayer.dispose();
			globalContentConfigObserver.set({ status: 'init' });
			// Reset NODE_ENV so it can be re-set by `build()`
			delete process.env.NODE_ENV;
			const t0 = performance.now();
			await build(mergeConfig(resolvedInlineConfig, extraInlineConfig), {
				teardownCompiler: false,
				...options,
			});
			CILogger.logBuild({ fixture: root as string, duration: performance.now() - t0 });
		},
		sync,
		check: async (opts) => {
			return await check(opts);
		},
		startDevServer: async (extraInlineConfig = {}) => {
			globalContentLayer.dispose();
			globalContentConfigObserver.set({ status: 'init' });
			// Reset NODE_ENV so it can be re-set by `dev()`
			delete process.env.NODE_ENV;
			try {
				devServer = await dev(mergeConfig(resolvedInlineConfig, extraInlineConfig));
			} catch (e) {
				console.error(e);
				return undefined as unknown as DevServer;
			}
			config.server.host = parseAddressToHost(devServer.address.address)!; // update host
			config.server.port = devServer.address.port; // update port
			await new Promise((resolve) => setTimeout(resolve, 100));
			return devServer;
		},
		onNextDataStoreChange: (timeout = 5000) => {
			if (!devServer) {
				return Promise.reject(new Error('No dev server running'));
			}

			const dataStoreFile = path.join(root as string, '.astro', 'data-store.json');

			return new Promise<void>((resolve, reject) => {
				const changeHandler = (fileName: string) => {
					if (fileName === dataStoreFile) {
						devServer!.watcher.removeListener('change', changeHandler);
						resolve();
					}
				};
				devServer!.watcher.on('change', changeHandler);
				setTimeout(() => {
					devServer!.watcher.removeListener('change', changeHandler);
					reject(new Error('Data store did not update within timeout'));
				}, timeout);
			});
		},
		config,
		resolveUrl,
		fetch: async (url, init) => {
			if (config.vite?.server?.https) {
				init = {
					// Use a custom fetch dispatcher. This is an undici option that allows
					// us to customize the fetch behavior. We use it here to allow h2.
					dispatcher: new Agent({
						connect: {
							// We disable cert validation because we're using self-signed certs
							rejectUnauthorized: false,
						},
						// Enable HTTP/2 support
						allowH2: true,
					}),
					...init,
				} as RequestInit;
			}
			const resolvedUrl = resolveUrl(url);
			try {
				return await fetch(resolvedUrl, init);
			} catch (err) {
				// node fetch throws a vague error when it fails, so we log the url here to easily debug it
				if (err instanceof Error && err.message?.includes('fetch failed')) {
					console.error(`[astro test] failed to fetch ${resolvedUrl}`);
					console.error(err);
				}
				throw err;
			}
		},
		preview: async (extraInlineConfig = {}) => {
			// Reset NODE_ENV so it can be re-set by `preview()`
			delete process.env.NODE_ENV;
			const previewServer = await preview(mergeConfig(resolvedInlineConfig, extraInlineConfig));
			config.server.host = parseAddressToHost(previewServer.host)!; // update host
			config.server.port = previewServer.port; // update port
			return previewServer;
		},
		pathExists: (p) => fs.existsSync(new URL(p.replace(/^\//, ''), config.outDir)),
		readFile: ((filePath: string, encoding?: BufferEncoding | null) =>
			fs.promises.readFile(
				new URL(filePath.replace(/^\//, ''), config.outDir),
				encoding === undefined ? 'utf8' : encoding,
			)) as Fixture['readFile'],
		readBuffer: (filePath) => {
			return fs.promises.readFile(new URL(filePath.replace(/^\//, ''), config.outDir));
		},
		readdir: (fp) => fs.promises.readdir(new URL(fp.replace(/^\//, ''), config.outDir)),
		glob: (p) =>
			glob(p, {
				cwd: fileURLToPath(config.outDir),
				expandDirectories: false,
			}),
		clean: async () => {
			for (const dir of [config.outDir, config.cacheDir]) {
				if (fs.existsSync(dir)) {
					await fs.promises.rm(dir, {
						maxRetries: 10,
						recursive: true,
						force: true,
					});
				}
			}
		},
		loadAdapterEntryModule: async () => {
			const url = new URL(`./server/entry.mjs?id=${fixtureId}`, config.outDir);
			return await import(url.toString());
		},
		loadNodeAdapterHandler: async () => {
			const url = new URL(`./server/entry.mjs?id=${fixtureId}`, config.outDir);
			const { handler } = await import(url.toString());
			return handler;
		},
		loadTestAdapterApp: async (streaming) => {
			const url = new URL(`./server/${config.build.serverEntry}?id=${fixtureId}`, config.outDir);
			const { createApp, manifest } = await import(url.toString());
			const app: App = createApp(streaming);
			app.manifest = manifest;
			return app;
		},
		loadSelfAdapterApp: async (streaming) => {
			const url = new URL(`./server/${config.build.serverEntry}?id=${fixtureId}`, config.outDir);
			const { createApp } = await import(url.toString());
			return createApp(streaming);
		},
		editFile: async (filePath, newContentsOrCallback, waitForNextWrite = true) => {
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
			const nextChange = devServer && waitForNextWrite ? onNextChange() : Promise.resolve();
			await fs.promises.writeFile(fileUrl, newContents);
			await nextChange;
			return reset;
		},
		resetAllFiles,
	};
}

function parseAddressToHost(address?: string) {
	if (address?.startsWith('::')) {
		return `[${address}]`;
	}
	return address;
}

const cliPath = fileURLToPath(new URL('../bin/astro.mjs', import.meta.url));

interface CliResult {
	exitCode: number | null;
	stdout: string;
	stderr: string;
}

interface CliProcess {
	proc: ChildProcess;
	getResult: () => Promise<CliResult>;
}

/** Returns a process running the Astro CLI. */
export function cli(...args: string[]): CliProcess {
	const proc = spawn('node', [cliPath, ...args], {
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: 'true' },
	});
	proc.stdout?.setEncoding('utf-8');

	return {
		proc,
		getResult: () =>
			new Promise((resolve) => {
				let stdout = '';
				let stderr = '';
				proc.stdout?.on('data', (chunk) => {
					stdout += chunk;
				});
				proc.stderr?.on('data', (chunk) => {
					stderr += chunk;
				});
				proc.on('close', (exitCode) => {
					resolve({
						exitCode,
						stdout,
						stderr,
					});
				});
			}),
	};
}

export const isMacOS = os.platform() === 'darwin';
export const isWindows = os.platform() === 'win32';

export function fixLineEndings(str: string) {
	return str.replace(/\r\n/g, '\n');
}

export async function* streamAsyncIterator<T>(stream: ReadableStream<T> | null) {
	if (!stream) throw new Error('streamAsyncIterator called with null stream');
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}
