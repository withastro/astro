import type {
	AstroConfig,
	AstroPrerenderer,
	AssetsGlobalStaticImagesList,
	PathWithRoute,
} from 'astro';
import { preview, type PreviewServer as VitePreviewServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import type {
	StaticPathsResponse,
	PrerenderRequest,
	StaticImagesResponse,
} from './prerender-types.js';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
} from './utils/prerender-constants.js';

interface CloudflarePrerendererOptions {
	root: AstroConfig['root'];
	serverDir: AstroConfig['build']['server'];
	clientDir: AstroConfig['build']['client'];
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	cfPluginConfig: PluginConfig;
	hasCompileImageService: boolean;
}

/**
 * Creates a prerenderer that uses Cloudflare's workerd runtime via a preview server.
 * This allows prerendering to happen in the same runtime that will serve the pages.
 */
export function createCloudflarePrerenderer({
	root,
	serverDir,
	clientDir,
	base,
	trailingSlash,
	cfPluginConfig,
	hasCompileImageService,
}: CloudflarePrerendererOptions): AstroPrerenderer {
	let previewServer: VitePreviewServer | undefined;
	let serverUrl: string;

	return {
		name: '@astrojs/cloudflare:prerenderer',

		async setup() {
			// Ensure client dir exists (CF plugin expects it for assets)
			await mkdir(clientDir, { recursive: true });

			previewServer = await preview({
				configFile: false,
				base,
				appType: 'mpa',
				build: {
					outDir: fileURLToPath(serverDir),
				},
				root: fileURLToPath(root),
				preview: {
					host: 'localhost',
					port: 0, // Let the OS pick a free port
					open: false,
				},
				plugins: [cfVitePlugin({ ...cfPluginConfig, viteEnvironment: { name: 'prerender' } })],
			});

			const address = previewServer.httpServer.address();
			if (address && typeof address === 'object') {
				serverUrl = `http://localhost:${address.port}`;
			} else {
				throw new Error(
					'Failed to start the Cloudflare prerender server. The preview server did not return a valid address. ' +
						'This is likely a bug in @astrojs/cloudflare. Please file an issue at https://github.com/withastro/astro/issues',
				);
			}
		},

		async getStaticPaths(): Promise<PathWithRoute[]> {
			// Call the workerd endpoint to get static paths
			const response = await fetch(`${serverUrl}${STATIC_PATHS_ENDPOINT}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.ok) {
				throw new Error(
					`Failed to get static paths from the Cloudflare prerender server (${response.status}: ${response.statusText}). ` +
						'This is likely a bug in @astrojs/cloudflare. Please file an issue at https://github.com/withastro/astro/issues',
				);
			}

			const data: StaticPathsResponse = await response.json();

			// Deserialize the routes
			return data.paths.map(({ pathname, route }) => ({
				pathname,
				route: deserializeRouteData(route),
			}));
		},

		async render(request, { routeData }) {
			// Serialize routeData and send to workerd
			const body: PrerenderRequest = {
				url: request.url,
				routeData: serializeRouteData(routeData, trailingSlash),
			};

			const response = await fetch(`${serverUrl}${PRERENDER_ENDPOINT}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			return response;
		},

		collectStaticImages: hasCompileImageService
			? async (): Promise<AssetsGlobalStaticImagesList> => {
					const response = await fetch(`${serverUrl}${STATIC_IMAGES_ENDPOINT}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
					});

					if (!response.ok) {
						throw new Error(
							`Failed to get static images from the Cloudflare prerender server (${response.status}: ${response.statusText}).`,
						);
					}

					const entries: StaticImagesResponse = await response.json();

					// Switch from the workerd stub to Sharp for the Node-side generation pipeline
					const { default: sharpService } = await import('astro/assets/services/sharp');
					globalThis.astroAsset ??= {};
					globalThis.astroAsset.imageService = sharpService;

					const staticImages: AssetsGlobalStaticImagesList = new Map();
					for (const entry of entries) {
						const transforms = new Map();
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
			: undefined,

		async teardown() {
			if (previewServer) {
				await previewServer.close();
				// Release reference to allow garbage collection
				previewServer = undefined;
			}
		},
	};
}
