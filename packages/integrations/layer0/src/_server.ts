import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { NodeApp } from 'astro/app/node';
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

	const port = options.port ?? process.env.PORT ?? 3001;
	const app = new NodeApp(manifest);

	const handler = async (request: any) => {
		console.log('request from `start`', request);
		request.url = `http://localhost:${port}${request.url}`;
		return await app.render(request);
	};

	_server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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
			_server?.on('listening', resolve);
			_server?.listen(port);
		} catch (e) {
			reject(e);
		}
	});
}

export function createExports(manifest: SSRManifest, options: Options) {
	const app = new NodeApp(manifest);
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
			console.log('request from `createExports`', request);
			return app.render(request);
		},
	};
}
