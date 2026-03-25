import { EventEmitter } from 'node:events';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as vite from 'vite';
import type { RunnableDevEnvironment } from 'vite';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { getViteErrorPayload } from '../errors/dev/vite.js';
import type { ModuleLoader, ModuleLoaderEventEmitter } from './runner.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';

export function createViteLoader(
	viteServer: vite.ViteDevServer,
	ssrEnvironment: RunnableDevEnvironment,
): ModuleLoader {
	const events = new EventEmitter() as ModuleLoaderEventEmitter;

	let isTsconfigUpdated = false;
	function isTsconfigUpdate(filePath: string) {
		const result = path.basename(filePath) === 'tsconfig.json';
		if (result) isTsconfigUpdated = true;
		return result;
	}

	// Use prependListener to ensure the isTsconfigUpdated flag is set BEFORE Vite's
	// internal watcher handlers run. Vite's handlers (registered during createServer)
	// call reloadOnTsconfigChange which sends full-reload to all environments. By
	// prepending our handler, the flag is set before those hot.send calls happen,
	// allowing our hot.send intercepts below to block them.
	const watcher = viteServer.watcher as EventEmitter;
	watcher.prependListener('add', (filePath: string) => {
		if (!isTsconfigUpdate(filePath)) {
			events.emit('file-add', [filePath]);
		}
	});
	watcher.prependListener('unlink', (filePath: string) => {
		if (!isTsconfigUpdate(filePath)) {
			events.emit('file-unlink', [filePath]);
		}
	});
	watcher.prependListener('change', (filePath: string) => {
		if (!isTsconfigUpdate(filePath)) {
			events.emit('file-change', [filePath]);
		}
	});

	// When tsconfig.json changes, Vite triggers a full-reload on all environments.
	// However, Astro restarts the entire server when tsconfig changes. If Vite's
	// full-reload reaches the SSR module runners, they try to re-import modules
	// through a transport that gets disconnected during restart, causing
	// "transport was disconnected, cannot call fetchModule" errors.
	// Block full-reload messages on all non-client environments when a tsconfig
	// change is detected.
	for (const [name, env] of Object.entries(viteServer.environments)) {
		if (name === 'client') continue; // client is handled separately below with error enhancement
		const _origSend = env.hot.send;
		env.hot.send = function (...args: any) {
			if (isTsconfigUpdated) {
				const msg = args[0] as vite.HotPayload;
				if (msg?.type === 'full-reload') return;
			}
			_origSend.apply(this, args);
		};
	}

	const _wsSend = viteServer.environments.client.hot.send;
	viteServer.environments.client.hot.send = function (...args: any) {
		// If the tsconfig changed, Vite will trigger a reload as it invalidates the module.
		// However in Astro, the whole server is restarted when the tsconfig changes. If we
		// do a restart and reload at the same time, the browser will refetch and the server
		// is not ready yet, causing a blank page. Here we block that reload from happening.
		if (isTsconfigUpdated) {
			const msg = args[0] as vite.HotPayload;
			if (msg?.type === 'full-reload') {
				// Reset the flag asynchronously so it persists for all synchronous hot.send
				// calls in Vite's environment iteration loop, then gets cleared afterward.
				queueMicrotask(() => {
					isTsconfigUpdated = false;
				});
				return;
			}
		}
		const msg = args[0] as vite.HotPayload;
		if (msg?.type === 'error') {
			// If we have an error, but it didn't go through our error enhancement program, it means that it's a HMR error from
			// vite itself, which goes through a different path. We need to enhance it here.
			if (!(msg as any)['__isEnhancedAstroErrorPayload']) {
				const err = collectErrorMetadata(msg.err, pathToFileURL(viteServer.config.root));
				getViteErrorPayload(err).then((payload) => {
					events.emit('hmr-error', {
						type: 'error',
						err: {
							message: payload.err.message,
							stack: payload.err.stack,
						},
					});

					args[0] = payload;
					_wsSend.apply(this, args);
				});
				return;
			}
			events.emit('hmr-error', msg);
		}
		_wsSend.apply(this, args);
	};

	return {
		import(src) {
			return ssrEnvironment.runner.import(src);
		},
		async resolveId(spec, parent) {
			const ret = await ssrEnvironment.pluginContainer.resolveId(spec, parent);
			return ret?.id;
		},
		getModuleById(id) {
			return ssrEnvironment.moduleGraph.getModuleById(id);
		},
		getModulesByFile(file) {
			return ssrEnvironment.moduleGraph.getModulesByFile(file);
		},
		getModuleInfo(id) {
			return ssrEnvironment.pluginContainer.getModuleInfo(id);
		},
		eachModule(cb) {
			return ssrEnvironment.moduleGraph.idToModuleMap.forEach(cb);
		},
		invalidateModule(mod) {
			ssrEnvironment.moduleGraph.invalidateModule(mod as unknown as vite.EnvironmentModuleNode);
		},
		fixStacktrace(err) {
			return viteServer.ssrFixStacktrace(err);
		},
		clientReload() {
			viteServer.environments.client.hot.send({
				type: 'full-reload',
				path: '*',
			});
		},
		webSocketSend(msg) {
			return viteServer.environments.client.hot.send(msg);
		},
		getSSREnvironment() {
			return viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr] as RunnableDevEnvironment;
		},
		isHttps() {
			return !!ssrEnvironment.config.server.https;
		},
		events,
	};
}
