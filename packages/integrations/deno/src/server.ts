import './shim.js';
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

	_server = new Server({
		port: options.port ?? 8085,
		hostname: options.hostname ?? '0.0.0.0',
		handler,
	});

	_startPromise = _server.listenAndServe();
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
