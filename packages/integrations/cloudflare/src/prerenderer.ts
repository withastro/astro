import type {
	AstroConfig,
	AstroIntegrationLogger,
	AstroPrerenderer,
	ImageService,
	LocalImageService,
	PathWithRoute,
	PrerenderUnattributedMetadata,
} from 'astro';
import { preview, createLogger, type PreviewServer as VitePreviewServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import type { StaticPathsResponse, PrerenderRequest } from './prerender-types.js';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
	IMAGE_TRANSFORM_ENDPOINT,
} from './utils/prerender-constants.js';
import { readFramedPrerenderResponse } from './utils/prerender-response.js';
import { buildServerUrl } from './utils/server-url.js';

/** Maps Astro's transform options onto the query parameters `/_image` expects. */
const IMAGE_TRANSFORM_PARAMS: Record<string, string> = {
	w: 'width',
	h: 'height',
	q: 'quality',
	f: 'format',
	fit: 'fit',
	position: 'position',
	background: 'background',
};

interface CloudflarePrerendererOptions {
	root: AstroConfig['root'];
	serverDir: AstroConfig['build']['server'];
	clientDir: AstroConfig['build']['client'];
	base: AstroConfig['base'];
	trailingSlash: AstroConfig['trailingSlash'];
	cfPluginConfig: PluginConfig;
	hasBuildImageService: boolean;
	/** When true, images are optimized by the IMAGES binding in workerd during the build. */
	hasBindingImageService: boolean;
	userImageServiceEntrypoint?: string;
	logger: AstroIntegrationLogger;
}

function createImageTransformUrl(
	serverUrl: string,
	originalPath: string,
	transform: Record<string, any>,
): string {
	const url = new URL(IMAGE_TRANSFORM_ENDPOINT, serverUrl);
	url.searchParams.set('href', originalPath);

	for (const [param, key] of Object.entries(IMAGE_TRANSFORM_PARAMS)) {
		const value = transform[key];
		if (value) {
			url.searchParams.set(param, value.toString());
		}
	}

	return url.toString();
}

function createBindingImageService(
	getServerUrl: () => string,
	localService: LocalImageService,
	logger: AstroIntegrationLogger,
): LocalImageService {
	return {
		...localService,
		async transform(inputBuffer, transform, imageConfig, runtimeLogger) {
			try {
				const response = await fetch(
					createImageTransformUrl(getServerUrl(), transform.src, transform),
					{ method: 'POST', body: inputBuffer as Uint8Array<ArrayBuffer> },
				);
				if (!response.ok) {
					// The body can be a full error page, so keep only enough of it to be useful.
					const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
					const details = body ? `: ${body.slice(0, 200)}` : '';
					throw new Error(
						`the prerender server responded ${response.status} ${response.statusText}${details}`,
					);
				}
				return { data: new Uint8Array(await response.arrayBuffer()), format: transform.format };
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				logger.warn(
					`Could not optimize "${transform.src}" with the Cloudflare IMAGES binding (${message}). Falling back to the local image service.`,
				);
				return localService.transform(inputBuffer, transform, imageConfig, runtimeLogger);
			}
		},
	};
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
	hasBuildImageService,
	hasBindingImageService,
	userImageServiceEntrypoint,
	logger,
}: CloudflarePrerendererOptions): AstroPrerenderer {
	let previewServer: VitePreviewServer | undefined;
	let serverUrl: string;

	return {
		name: '@astrojs/cloudflare:prerenderer',

		async setup() {
			// Ensure client dir exists (CF plugin expects it for assets)
			await mkdir(clientDir, { recursive: true });

			// Create a custom logger that filters out internal HTTP request logs (e.g. "POST /__astro_prerender 200 OK")
			// from the Cloudflare vite plugin while still allowing user console.log output to pass through.
			// We strip ANSI codes before testing because the Cloudflare vite plugin wraps messages in color codes.
			const defaultLogger = createLogger('info');
			// eslint-disable-next-line no-control-regex
			const ansiRe = /\x1b\[[0-9;]*m/g;
			const astroRequestLogRe = /^(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\/__astro_/;
			const customLogger: ReturnType<typeof createLogger> = {
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
					port: 0, // Let the OS pick a free port
					open: false,
				},
				plugins: [cfVitePlugin({ ...cfPluginConfig, viteEnvironment: { name: 'prerender' } })],
			});

			const address = previewServer.httpServer.address();
			if (address && typeof address === 'object') {
				// Derive the URL from the address we ACTUALLY bound — never by re-stating
				// "localhost". That hostname would be resolved a second time, independently
				// of the resolution `listen()` just used, and nothing makes the two agree:
				// on some Linux hosts `listen()` binds ::1 while `fetch()` dials 127.0.0.1,
				// and every prerender request fails with ECONNREFUSED on a random port.
				serverUrl = buildServerUrl(address);
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
			return data.paths.map(({ pathname, route, cacheKey }) => ({
				pathname,
				route: deserializeRouteData(route),
				cacheKey,
			}));
		},

		async render(request, { routeData }) {
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

			// Check for prerender errors surfaced by the workerd handler via header
			// (the response body may be stripped by the Vite preview server).
			// Only the header marks a failure: pages may intentionally return
			// non-2xx responses while prerendering (e.g. a custom 404 page).
			const prerenderError = response.headers.get('x-astro-prerender-error');
			if (prerenderError) {
				throw new Error(`Failed to prerender ${request.url}: ${prerenderError}`);
			}

			return readFramedPrerenderResponse(response);
		},

		collectUnattributedMetadata:
			hasBuildImageService || hasBindingImageService
				? async (): Promise<PrerenderUnattributedMetadata> => {
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

						return response.json();
					}
				: undefined,

		getImageService:
			hasBuildImageService || hasBindingImageService
				? async (): Promise<ImageService> => {
						let localService: LocalImageService;
						if (userImageServiceEntrypoint) {
							const mod = await import(userImageServiceEntrypoint);
							localService = mod.default ?? mod;
						} else {
							const { default: sharpService } = await import('astro/assets/services/sharp');
							localService = sharpService;
						}
						return hasBindingImageService
							? createBindingImageService(() => serverUrl, localService, logger)
							: localService;
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
