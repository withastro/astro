import { preview, createLogger } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { cloudflare as cfVitePlugin } from '@cloudflare/vite-plugin';
import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
} from './utils/prerender-constants.js';
function createCloudflarePrerenderer({
	cloudflareOptions,
	root,
	serverDir,
	clientDir,
	base,
	trailingSlash,
	cfPluginConfig,
	hasCompileImageService,
}) {
	let previewServer;
	let serverUrl;
	return {
		name: '@astrojs/cloudflare:prerenderer',
		async setup() {
			await mkdir(clientDir, { recursive: true });
			const defaultLogger = createLogger('info');
			const ansiRe = /\x1b\[[0-9;]*m/g;
			const astroRequestLogRe = /^(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\/__astro_/;
			const customLogger = {
				...defaultLogger,
				info(msg, opts) {
					if (astroRequestLogRe.test(msg.replace(ansiRe, ''))) return;
					defaultLogger.info(msg, opts);
				},
			};
			previewServer = await preview({
				configFile: false,
				base,
				appType: 'mpa',
				build: {
					outDir: fileURLToPath(serverDir),
				},
				root: fileURLToPath(root),
				customLogger,
				preview: {
					host: 'localhost',
					port: 0,
					// Let the OS pick a free port
					open: false,
				},
				plugins: [
					cfVitePlugin({
						...cloudflareOptions,
						...cfPluginConfig,
						viteEnvironment: { name: 'prerender' },
					}),
				],
			});
			const address = previewServer.httpServer.address();
			if (address && typeof address === 'object') {
				serverUrl = `http://localhost:${address.port}`;
			} else {
				throw new Error(
					'Failed to start the Cloudflare prerender server. The preview server did not return a valid address. This is likely a bug in @astrojs/cloudflare. Please file an issue at https://github.com/withastro/astro/issues',
				);
			}
		},
		async getStaticPaths() {
			const response = await fetch(`${serverUrl}${STATIC_PATHS_ENDPOINT}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				const body = await response.text();
				const details = body
					? `
${body}`
					: '';
				throw new Error(
					`Failed to get static paths from the Cloudflare prerender server (${response.status}: ${response.statusText}).${details}`,
				);
			}
			const data = await response.json();
			return data.paths.map(({ pathname, route }) => ({
				pathname,
				route: deserializeRouteData(route),
			}));
		},
		async render(request, { routeData }) {
			const body = {
				url: request.url,
				routeData: serializeRouteData(routeData, trailingSlash),
			};
			const response = await fetch(`${serverUrl}${PRERENDER_ENDPOINT}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				redirect: 'manual',
			});
			return response;
		},
		collectStaticImages: hasCompileImageService
			? async () => {
					const response = await fetch(`${serverUrl}${STATIC_IMAGES_ENDPOINT}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
					});
					if (!response.ok) {
						const body = await response.text();
						const details = body
							? `
${body}`
							: '';
						throw new Error(
							`Failed to get static images from the Cloudflare prerender server (${response.status}: ${response.statusText}).${details}`,
						);
					}
					const entries = await response.json();
					const { default: sharpService } = await import('astro/assets/services/sharp');
					globalThis.astroAsset ??= {};
					globalThis.astroAsset.imageService = sharpService;
					const staticImages = /* @__PURE__ */ new Map();
					for (const entry of entries) {
						const transforms = /* @__PURE__ */ new Map();
						for (const t of entry.transforms) {
							transforms.set(t.hash, { finalPath: t.finalPath, transform: t.transform });
						}
						staticImages.set(entry.originalPath, {
							originalSrcPath: entry.originalSrcPath,
							transforms,
						});
					}
					return staticImages;
				}
			: void 0,
		async teardown() {
			if (previewServer) {
				await previewServer.close();
				previewServer = void 0;
			}
		},
	};
}
export { createCloudflarePrerenderer };
