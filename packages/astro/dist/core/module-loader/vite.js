import { EventEmitter } from 'node:events';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { getViteErrorPayload } from '../errors/dev/vite.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
function createViteLoader(viteServer, ssrEnvironment) {
	const events = new EventEmitter();
	let isTsconfigUpdated = false;
	function isTsconfigUpdate(filePath) {
		const result = path.basename(filePath) === 'tsconfig.json';
		if (result) isTsconfigUpdated = true;
		return result;
	}
	viteServer.watcher.on('add', (...args) => {
		if (!isTsconfigUpdate(args[0])) {
			events.emit('file-add', args);
		}
	});
	viteServer.watcher.on('unlink', (...args) => {
		if (!isTsconfigUpdate(args[0])) {
			events.emit('file-unlink', args);
		}
	});
	viteServer.watcher.on('change', (...args) => {
		if (!isTsconfigUpdate(args[0])) {
			events.emit('file-change', args);
		}
	});
	const _wsSend = viteServer.environments.client.hot.send;
	viteServer.environments.client.hot.send = function (...args) {
		if (isTsconfigUpdated) {
			isTsconfigUpdated = false;
			return;
		}
		const msg = args[0];
		if (msg?.type === 'error') {
			if (!msg['__isEnhancedAstroErrorPayload']) {
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
			ssrEnvironment.moduleGraph.invalidateModule(mod);
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
			return viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
		},
		isHttps() {
			return !!ssrEnvironment.config.server.https;
		},
		events,
	};
}
export { createViteLoader };
