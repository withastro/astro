// NOTE(fks): Side-effect -- shim.js must run first. This isn't guaranteed by
// the language, but it is a Node.js behavior that we rely on here. Keep this
// separate from the other imports so that it doesn't get organized & reordered.
import './shim.js';

// Normal Imports
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
// @ts-ignore
import { Server } from 'https://deno.land/std@0.132.0/http/server.ts';
// @ts-ignore
import { fetch } from 'https://deno.land/x/file_fetch/mod.ts';

interface Options {
	port?: number;
	hostname?: string;
	start?: boolean;
}

let _server: Server | undefined = undefined;
let _startPromise: Promise<void> | undefined = undefined;

export function start(manifest: SSRManifest, options: Options) {
	if (options.start === false) {
		return;
	}

	const clientRoot = new URL('../client/', import.meta.url);
	const app = new App(manifest);
	const handler = async (request: Request) => {
		if (app.match(request)) {
			return await app.render(request);
		}

		const url = new URL(request.url);
		const localPath = new URL('.' + url.pathname, clientRoot);
		return fetch(localPath.toString());
	};

	const port = options.port ?? 8085;
	_server = new Server({
		port,
		hostname: options.hostname ?? '0.0.0.0',
		handler,
	});

	_startPromise = Promise.resolve(_server.listenAndServe());
	// eslint-disable-next-line no-console
	console.error(`Server running on port ${port}`);
}

export function createExports(manifest: SSRManifest, options: Options) {
	const app = new App(manifest);
	return {
		async stop() {
			if (_server) {
				_server.close();
				_server = undefined;
			}
			await Promise.resolve(_startPromise);
		},
		running() {
			return _server !== undefined;
		},
		async start() {
			return start(manifest, options);
		},
		async handle(request: Request) {
			return app.render(request);
		},
	};
}
