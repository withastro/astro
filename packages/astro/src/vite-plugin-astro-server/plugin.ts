
import type * as vite from 'vite';
import type { AstroSettings, ManifestData } from '../@types/astro';

import { LogOptions } from '../core/logger/core.js';
import { createDevelopmentEnvironment } from '../core/render/dev/index.js';
import { createRouteManifest } from '../core/routing/index.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { baseMiddleware } from './base.js';
import { handleRequest } from './request.js';
import { createController } from './controller.js';
import type fs from 'fs';

export interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
	fs: typeof fs;
}

export default function createVitePluginAstroServer({ settings, logging, fs: fsMod }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			const loader = createViteLoader(viteServer);
			let env = createDevelopmentEnvironment(settings, logging, loader);
			let manifest: ManifestData = createRouteManifest({ settings, fsMod }, logging);
			const serverController = createController({ loader });

			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean, _file: string) {
				env.routeCache.clearAll();
				if (needsManifestRebuild) {
					manifest = createRouteManifest({ settings }, logging);
				}
			}
			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));

			return () => {
				// Push this middleware to the front of the stack so that it can intercept responses.
				if (settings.config.base !== '/') {
					viteServer.middlewares.stack.unshift({
						route: '',
						handle: baseMiddleware(settings, logging),
					});
				}
				viteServer.middlewares.use(async (req, res) => {
					if (!req.url || !req.method) {
						throw new Error('Incomplete request');
					}
					handleRequest(env, manifest, serverController, req, res);
				});
			};
		},
		// HACK: hide `.tip` in Vite's ErrorOverlay and replace [vite] messages with [astro]
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;
			return code
				.replace(/\.tip \{[^}]*\}/gm, '.tip {\n  display: none;\n}')
				.replace(/\[vite\]/g, '[astro]');
		},
	};
}
