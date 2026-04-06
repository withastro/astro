import type {
	AstroConfig,
	AstroPrerenderer,
	AssetsGlobalStaticImagesList,
	PathWithRoute,
} from 'astro';
import { preview, type PreviewServer as VitePreviewServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
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
	/** When true, images were pre-optimized by the IMAGES binding in workerd and can be written directly. */
	hasBindingImageService: boolean;
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
	hasBindingImageService,
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
				logLevel: 'error',
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
				const body = await response.text();
				const details = body ? `\n${body}` : '';
				throw new Error(
					`Failed to get static paths from the Cloudflare prerender server (${response.status}: ${response.statusText}).${details}`,
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
				redirect: 'manual',
			});

			return response;
		},

		collectStaticImages: hasCompileImageService || hasBindingImageService
			? async (): Promise<AssetsGlobalStaticImagesList> => {
					const response = await fetch(`${serverUrl}${STATIC_IMAGES_ENDPOINT}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
					});

					if (!response.ok) {
						const body = await response.text();
						const details = body ? `\n${body}` : '';
						throw new Error(
							`Failed to get static images from the Cloudflare prerender server (${response.status}: ${response.statusText}).${details}`,
						);
					}

					const entries: StaticImagesResponse = await response.json();

					// For transforms that already have imageData (optimized by the IMAGES binding
					// in workerd), write the bytes directly to the client output directory.
					// Remaining transforms without imageData fall through to Sharp.
					const staticImages: AssetsGlobalStaticImagesList = new Map();
					let needsSharp = false;

					for (const entry of entries) {
						const transforms = new Map();
						for (const t of entry.transforms) {
							if (t.imageData) {
								// Image was already transformed by the Cloudflare IMAGES binding —
								// write it directly to the output directory.
								const outputPath = join(fileURLToPath(clientDir), t.finalPath);
								await mkdir(dirname(outputPath), { recursive: true });
								await writeFile(outputPath, Buffer.from(t.imageData, 'base64'));
							} else {
								// No pre-transformed data — collect for Sharp processing
								transforms.set(t.hash, { finalPath: t.finalPath, transform: t.transform });
								needsSharp = true;
							}
						}
						if (transforms.size > 0) {
							staticImages.set(entry.originalPath, {
								originalSrcPath: entry.originalSrcPath,
								transforms,
							});
						}
					}

					// Only load Sharp if there are transforms that weren't handled by the binding
					if (needsSharp) {
						const { default: sharpService } = await import('astro/assets/services/sharp');
						globalThis.astroAsset ??= {};
						globalThis.astroAsset.imageService = sharpService;
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
