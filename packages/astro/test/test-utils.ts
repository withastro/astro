import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { Agent } from 'undici';
import { check } from '../dist/cli/check/index.js';
import { globalContentLayer } from '../dist/content/instance.js';
import { globalContentConfigObserver } from '../dist/content/utils.js';
import build from '../dist/core/build/index.js';
import { mergeConfig, resolveConfig } from '../dist/core/config/index.js';
import { dev, preview } from '../dist/core/index.js';
import sync from '../dist/core/sync/index.js';
import type { DevServer } from '../dist/core/dev/dev.js';
import type { AstroInlineConfig, AstroConfig } from '../dist/types/public/config.js';
import type { App } from '../dist/core/app/app.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Disable telemetry when running tests
process.env.ASTRO_TELEMETRY_DISABLED = 'true';

export interface Fixture {
	build: typeof build;
	resolveUrl: (url: string) => string;
	pathExists: (path: string) => boolean;
	fetch: (url: string, opts?: Parameters<typeof fetch>[1]) => Promise<Response>;
	readFile: (path: string, encoding?: BufferEncoding) => Promise<string>;
	editFile: (
		path: string,
		updater: (content: string) => string,
		waitForNextWrite?: boolean,
	) => Promise<() => void>;
	readdir: (path: string) => Promise<string[]>;
	glob: (pattern: string) => Promise<string[]>;
	startDevServer: (inlineConfig?: Parameters<typeof dev>[0]) => ReturnType<typeof dev>;
	preview: typeof preview;
	clean: () => Promise<void>;
	loadTestAdapterApp: (streaming?: boolean) => Promise<App>;
	loadSelfAdapterApp: (streaming?: boolean) => Promise<App>;
	loadNodeAdapterHandler: () => Promise<(req: IncomingMessage, res: ServerResponse) => void>;
	loadAdapterEntryModule: () => Promise<Record<string, any>>;
	onNextDataStoreChange: (timeout?: number) => Promise<void>;
	check: typeof check;
	sync: typeof sync;
	config: AstroConfig;
	resetAllFiles: () => void;
}

export async function loadFixture(
	inlineConfig: AstroInlineConfig & { root?: string | URL },
): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// Silent by default during tests to not pollute the console output
	inlineConfig.logLevel ??= 'silent';
	inlineConfig.vite ??= {};
	inlineConfig.vite.logLevel = 'silent';

	let root = inlineConfig.root;
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
	inlineConfig = { ...inlineConfig, root };
	// Load the config.
	const { astroConfig: config } = await resolveConfig(inlineConfig, 'dev');

	const protocol = config.vite?.server?.https ? 'https' : 'http';

	const resolveUrl = (url: string) =>
		`${protocol}://${config.server.host || 'localhost'}:${config.server.port}${url.replace(
			/^\/?/,
			'/',
		)}`;

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
			? new Promise((resolve) => devServer.watcher.once('change', resolve))
			: Promise.reject(new Error('No dev server running'));

	process.on('exit', resetAllFiles);

	let fixtureId = new Date().valueOf();
	let devServer: DevServer;

	return {
		build: async (extraInlineConfig = {}, options = {}) => {
			globalContentLayer.dispose();
			globalContentConfigObserver.set({ status: 'init' });
			// Reset NODE_ENV so it can be re-set by `build()`
			delete process.env.NODE_ENV;
			return build(mergeConfig(inlineConfig, extraInlineConfig), {
				teardownCompiler: false,
				...options,
			});
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
				devServer = await dev(mergeConfig(inlineConfig, extraInlineConfig));
			} catch (cause) {
				throw new Error('Dev server could not start', { cause });
			}
			config.server.host = parseAddressToHost(devServer.address.address); // update host
			config.server.port = devServer.address.port; // update port
			await new Promise((resolve) => setTimeout(resolve, 100));
			return devServer;
		},
		onNextDataStoreChange: (timeout = 5000) => {
			if (!devServer) {
				return Promise.reject(new Error('No dev server running'));
			}

			const dataStoreFile = path.join(root, '.astro', 'data-store.json');

			return new Promise((resolve, reject) => {
				const changeHandler = (fileName: string) => {
					if (fileName === dataStoreFile) {
						devServer.watcher.removeListener('change', changeHandler);
						resolve();
					}
				};
				devServer.watcher.on('change', changeHandler);
				setTimeout(() => {
					devServer.watcher.removeListener('change', changeHandler);
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
					// @ts-expect-error dispatcher is not exposed on types
					dispatcher: new Agent({
						connect: {
							// We disable cert validation because we're using self-signed certs
							rejectUnauthorized: false,
						},
						// Enable HTTP/2 support
						allowH2: true,
					}),
					...init,
				};
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
			const previewServer = await preview(mergeConfig(inlineConfig, extraInlineConfig));
			config.server.host = parseAddressToHost(previewServer.host ?? ''); // update host
			config.server.port = previewServer.port; // update port
			return previewServer;
		},
		pathExists: (p) => fs.existsSync(new URL(p.replace(/^\//, ''), config.outDir)),
		readFile: (filePath, encoding = 'utf-8') =>
			fs.promises.readFile(new URL(filePath.replace(/^\//, ''), config.outDir), encoding),
		readdir: (fp) => fs.promises.readdir(new URL(fp.replace(/^\//, ''), config.outDir)),
		glob: (p) =>
			glob(p, {
				cwd: fileURLToPath(config.outDir),
				expandDirectories: false,
			}),
		clean: async () => {
			await fs.promises.rm(config.outDir, {
				maxRetries: 10,
				recursive: true,
				force: true,
			});
			const astroCache = new URL('./node_modules/.astro', config.root);
			if (fs.existsSync(astroCache)) {
				await fs.promises.rm(astroCache, {
					maxRetries: 10,
					recursive: true,
					force: true,
				});
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
			const app = createApp(streaming);
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

/**
 * @param {string} [address]
 */
function parseAddressToHost(address: string) {
	if (address?.startsWith('::')) {
		return `[${address}]`;
	}
	return address;
}

const cliPath = fileURLToPath(new URL('../bin/astro.mjs', import.meta.url));

/** Returns a process running the Astro CLI. */
export function cli(/** @type {string[]} */ ...args: string[]) {
	const proc = spawn('node', [cliPath, ...args], {
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: 'true' },
	});
	proc.stdout.setEncoding('utf-8');

	return {
		proc,
		getResult: () =>
			new Promise((resolve) => {
				let stdout = '';
				let stderr = '';
				proc.stdout.on('data', (chunk) => {
					stdout += chunk;
				});
				proc.stderr.on('data', (chunk) => {
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
