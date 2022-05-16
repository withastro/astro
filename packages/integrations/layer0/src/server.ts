import { createServer, Server } from 'http';
import { App } from 'astro/app';
import type { SSRManifest } from 'astro';

interface Options {
	port?: number;
	start?: boolean;
}

let _server: Server | undefined = undefined;
let _startPromise: Promise<void> | undefined = undefined;

export function start(manifest: SSRManifest, options: Options) {
	if (options.start === false) {
		return;
	}

	const app = new App(manifest);
	const handler = async (request: any) => {
		return await app.render(request);
	};

	_server = createServer(async (req, res) => {
		try {
			await handler(req);
		} catch (e: any) {
			const message = 'An unexpected error occurred while processing the request with Astro';
			console.error(e.stack);
			res.writeHead(500);
			res.end(message);
		}
	});

	_startPromise = new Promise((resolve, reject) => {
		try {
			_server.on('listening', resolve);
			_server.listen(options.port ?? process.env.PORT ?? 3001);
		} catch (e) {
			reject(e);
		}
	});
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
