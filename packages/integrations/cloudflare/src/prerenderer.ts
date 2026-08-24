import type {
	AstroConfig,
	AstroIntegrationLogger,
	AstroPrerenderer,
	AssetsGlobalStaticImagesList,
	ImageTransform,
	PathWithRoute,
} from 'astro';
import { preview, createLogger, type PreviewServer as VitePreviewServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';
import { join, dirname } from 'node:path';
import { isRemotePath } from '@astrojs/internal-helpers/path';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import type {
	StaticPathsResponse,
	PrerenderRequest,
	SerializedStaticImageEntry,
	StaticImagesResponse,
} from './prerender-types.js';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
	IMAGE_TRANSFORM_ENDPOINT,
} from './utils/prerender-constants.js';
import { readFramedPrerenderResponse } from './utils/prerender-response.js';

/**
 * How many images to request from the prerender worker at once. Each response streams
 * straight to disk, so peak memory stays proportional to this many images rather than
 * to the whole image set.
 */
const IMAGE_TRANSFORM_CONCURRENCY = 8;

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

/** Runs `fn` over `items`, keeping at most `limit` calls in flight. */
async function forEachWithConcurrency<T>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<void>,
): Promise<void> {
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			await fn(items[next++]);
		}
	});
	await Promise.all(workers);
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

/**
 * Locates the unoptimized original on disk. Astro emits it into the prerender output
 * (and deletes it once the transforms are generated), so it is not in the client
 * directory the worker's ASSETS binding serves. Falls back to the source file, which
 * Astro records for images imported from `src`.
 */
function findOriginalImage(
	serverDir: URL,
	clientDir: URL,
	originalPath: string,
	originalSrcPath: string | undefined,
): string | undefined {
	const candidates = [
		join(fileURLToPath(new URL('.prerender/', serverDir)), originalPath),
		join(fileURLToPath(clientDir), originalPath),
		...(originalSrcPath ? [originalSrcPath] : []),
	];
	return candidates.find((candidate) => existsSync(candidate));
}

/**
 * Requests one optimized image from the prerender worker and streams the response body
 * directly into the client output directory. The original is streamed up as the request
 * body, so neither side ever holds a whole image in memory.
 */
async function writeTransformedImage(
	serverUrl: string,
	clientDir: URL,
	originalPath: string,
	finalPath: string,
	transform: Record<string, any>,
	sourcePath: string | undefined,
): Promise<void> {
	const response = await fetch(createImageTransformUrl(serverUrl, originalPath, transform), {
		method: 'POST',
		// Remote images have no local original; the worker fetches those itself.
		...(sourcePath
			? {
					body: Readable.toWeb(createReadStream(sourcePath)) as unknown as BodyInit,
					// Required by Node's fetch whenever the body is a stream.
					duplex: 'half',
				}
			: {}),
	} as RequestInit);

	if (!response.ok || !response.body) {
		// The body can be a full error page, so keep only enough of it to be useful.
		const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
		const details = body ? `: ${body.slice(0, 200)}` : '';
		throw new Error(
			`the prerender server responded ${response.status} ${response.statusText}${details}`,
		);
	}

	const outputPath = join(fileURLToPath(clientDir), finalPath);
	await mkdir(dirname(outputPath), { recursive: true });
	// `fetch` types the body as the DOM `ReadableStream`, which is structurally
	// identical to but nominally distinct from the `node:stream/web` one.
	const body = response.body as unknown as NodeReadableStream<Uint8Array>;
	await pipeline(Readable.fromWeb(body), createWriteStream(outputPath));
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
			return data.paths.map(({ pathname, route, cacheKey }) => ({
				pathname,
				route: deserializeRouteData(route),
				cacheKey,
			}));
		},

		async render(request, { routeData, collectMetadata }) {
			const body: PrerenderRequest = {
				url: request.url,
				routeData: serializeRouteData(routeData, trailingSlash),
				collectMetadata,
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

			if (collectMetadata) {
				return readFramedPrerenderResponse(response);
			}

			return response;
		},

		collectStaticImages:
			hasBuildImageService || hasBindingImageService
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

						// Transforms left in this map fall through to the Node-side image
						// service (the user-configured service, or Sharp).
						const staticImages: AssetsGlobalStaticImagesList = new Map();
						const deferToNodeImageService = (
							entry: SerializedStaticImageEntry,
							t: SerializedStaticImageEntry['transforms'][number],
						) => {
							let existing = staticImages.get(entry.originalPath);
							if (!existing) {
								existing = { originalSrcPath: entry.originalSrcPath, transforms: new Map() };
								staticImages.set(entry.originalPath, existing);
							}
							existing.transforms.set(t.hash, {
								finalPath: t.finalPath,
								// Serialized over HTTP, so it arrives as a plain object.
								transform: t.transform as ImageTransform,
							});
						};

						if (hasBindingImageService) {
							// Pull each optimized image out of workerd on its own request so the
							// bytes stream to disk instead of being buffered into one response.
							const jobs = entries.flatMap((entry) => {
								const sourcePath = isRemotePath(entry.originalPath)
									? undefined
									: findOriginalImage(
											serverDir,
											clientDir,
											entry.originalPath,
											entry.originalSrcPath,
										);
								return entry.transforms.map((t) => ({ entry, t, sourcePath }));
							});
							await forEachWithConcurrency(
								jobs,
								IMAGE_TRANSFORM_CONCURRENCY,
								async ({ entry, t, sourcePath }) => {
									try {
										await writeTransformedImage(
											serverUrl,
											clientDir,
											entry.originalPath,
											t.finalPath,
											t.transform,
											sourcePath,
										);
									} catch (err) {
										const message = err instanceof Error ? err.message : String(err);
										logger.warn(
											`Could not optimize "${entry.originalPath}" with the Cloudflare IMAGES binding (${message}). Falling back to the local image service.`,
										);
										deferToNodeImageService(entry, t);
									}
								},
							);
						} else {
							for (const entry of entries) {
								for (const t of entry.transforms) {
									deferToNodeImageService(entry, t);
								}
							}
						}

						// Only load the Node-side image service if some transforms still need it.
						if (staticImages.size > 0) {
							globalThis.astroAsset ??= {};
							if (userImageServiceEntrypoint) {
								const mod = await import(userImageServiceEntrypoint);
								globalThis.astroAsset.imageService = mod.default ?? mod;
							} else {
								const { default: sharpService } = await import('astro/assets/services/sharp');
								globalThis.astroAsset.imageService = sharpService;
							}
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
