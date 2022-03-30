import './shim.js';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
// @ts-ignore
import { Server } from 'https://deno.land/std@0.132.0/http/server.ts';

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

	const app = new App(manifest);

	const handler = async (request: Request) => {
		const response = await app.render(request);
		return response;
	};

	_server = new Server({
		port: options.port ?? 8085,
		hostname: options.hostname ?? '0.0.0.0',
		handler,
		//onError: options.onError,
	});

	_startPromise = _server.listenAndServe();
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	return {
		async stop() {
			if (_server) {
				_server.close();
			}
			await Promise.resolve(_startPromise);
		},
		async handle(request: Request) {
			return app.render(request);
		},
	};
}
