import { isRemotePath } from '@astrojs/internal-helpers/path';
import type { AstroConfig } from 'astro';
import { createJiti } from 'jiti';
import type { Plugin, ViteDevServer } from 'vite';
import { isRemoteAllowed } from './utils/assets.js';

export interface DevImageMiddlewareOptions {
	/**
	 * Lazy getter for the dev image service entrypoint.
	 * Returns the final entrypoint after all integrations have run (config:done),
	 * so custom services are picked up automatically.
	 */
	getDevServiceEntrypoint: () => string;
	/** Lazy getter — `_config.image` is set in `config:done`, middleware runs later. */
	getImageConfig: () => AstroConfig['image'];
	/** The Astro `base` path (e.g. `/` or `/docs/`). */
	base: string;
}

/**
 * Vite plugin that intercepts `/_image` requests in dev and handles image
 * transforms in Node. This allows custom image services
 * to work in dev even though workerd can't load native bindings.
 *
 * The middleware runs before the workerd handler, so the workerd-based
 * generic endpoint never sees these requests.
 */
export function createDevImageMiddlewarePlugin(options: DevImageMiddlewareOptions): Plugin {
	const route = joinBase(options.base, '/_image');

	return {
		name: '@astrojs/cloudflare:dev-image-middleware',
		configureServer(server) {
			// Lazy init — only needed on first image request.
			let jiti: ReturnType<typeof createJiti> | undefined;
			server.middlewares.use(async (req, res, next) => {
				if (!req.url?.startsWith(route)) return next();

				if (!jiti) jiti = createJiti(import.meta.url);
				try {
					const entrypoint = options.getDevServiceEntrypoint();
					const mod = await jiti.import(entrypoint);
					const service = (mod as any).default ?? mod;
					const imageConfig = options.getImageConfig();

					const url = new URL(req.url, `http://${req.headers.host}`);
					const transform = await service.parseURL(url, imageConfig);

					if (!transform?.src) {
						res.statusCode = 400;
						res.end('Missing or invalid image source');
						return;
					}

					const inputBuffer = await loadSourceImage(transform.src, server, imageConfig);
					if (!inputBuffer) {
						res.statusCode = 404;
						res.end('Source image not found');
						return;
					}

					const { data, format } = await service.transform(
						inputBuffer,
						transform,
						imageConfig,
					);

					res.setHeader('Content-Type', `image/${format}`);
					res.setHeader('Cache-Control', 'public, max-age=31536000');
					res.end(data);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					res.statusCode = 500;
					res.end(`Image transform failed: ${message}`);
				}
			});
		},
	};
}

/** Load the source image — either from the Vite dev server (local) or via fetch (remote). */
async function loadSourceImage(
	src: string,
	server: ViteDevServer,
	imageConfig: AstroConfig['image'],
): Promise<Uint8Array | null> {
	if (isRemotePath(src)) {
		if (!isRemoteAllowed(src, imageConfig)) return null;
		const response = await fetch(src);
		if (!response.ok) return null;
		return new Uint8Array(await response.arrayBuffer());
	}

	const address = server.httpServer?.address();
	if (!address || typeof address === 'string') return null;

	const response = await fetch(new URL(src, `http://localhost:${address.port}`));
	if (!response.ok) return null;
	return new Uint8Array(await response.arrayBuffer());
}

/** Join a base path with a route, avoiding double slashes. */
function joinBase(base: string, route: string): string {
	const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
	return `${normalizedBase}${route}`;
}
