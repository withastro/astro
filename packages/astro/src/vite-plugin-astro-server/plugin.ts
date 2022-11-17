import type * as vite from 'vite';
import type { AstroSettings, ManifestData } from '../@types/astro';

import type fs from 'fs';
import { LogOptions } from '../core/logger/core.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { createDevelopmentEnvironment } from '../core/render/dev/index.js';
import { createRouteManifest } from '../core/routing/index.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { handleRequest } from './request.js';

export interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
	fs: typeof fs;
}

export default function createVitePluginAstroServer({
	settings,
	logging,
	fs: fsMod,
}: AstroPluginOptions): vite.Plugin {
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
					if (req.url === undefined || !req.method) {
						res.writeHead(500, 'Incomplete request');
						res.end();
						return;
					}
					handleRequest(env, manifest, serverController, req, res);
				});
			};
		},
		// HACK: Manually replace code in Vite's overlay to fit it to our needs
		// In the future, we'll instead take over the overlay entirely, which should be safer and cleaner
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;
			return (
				code
					// Transform links in the message to clickable links
					.replace(
						"this.text('.message-body', message.trim());",
						`const urlPattern = /(\\b(https?|ftp):\\/\\/[-A-Z0-9+&@#\\/%?=~_|!:,.;]*[-A-Z0-9+&@#\\/%=~_|])/gim;
						function escapeHtml(unsafe){return unsafe.replace(/</g, "&lt;").replace(/>/g, "&gt;");}
 					const escapedMessage = escapeHtml(message);
					this.root.querySelector(".message-body").innerHTML = escapedMessage.trim().replace(urlPattern, '<a href="$1" target="_blank">$1</a>');`
					)
					.replace('</style>', '.message-body a {\n  color: #ededed;\n}\n</style>')
					// Hide `.tip` in Vite's ErrorOverlay
					.replace(/\.tip \{[^}]*\}/gm, '.tip {\n  display: none;\n}')
					// Replace [vite] messages with [astro]
					.replace(/\[vite\]/g, '[astro]')
			);
		},
	};
}
