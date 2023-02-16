// Normal Imports
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

interface Options {
	port?: number;
	hostname?: string;
	start?: boolean;
}

// @ts-ignore
let _server: Server | undefined = undefined;
let _startPromise: Promise<void> | undefined = undefined;

export function start(manifest: SSRManifest, options: Options) {
	if (options.start === false) {
		return;
	}

	const clientRoot = new URL('../client/', import.meta.url);
	const app = new App(manifest);
	const handler = async (request: Request, connInfo: any) => {
		if (app.match(request)) {
			let ip = connInfo?.remoteAddr?.hostname;
			Reflect.set(request, Symbol.for('astro.clientAddress'), ip);
			const response = await app.render(request);
			if (app.setCookieHeaders) {
				for (const setCookieHeader of app.setCookieHeaders(response)) {
					response.headers.append('Set-Cookie', setCookieHeader);
				}
			}
			return response;
		}

		// If the request path wasn't found in astro,
		// try to fetch a static file instead
		const url = new URL(request.url);
		const localPath = new URL('./' + app.removeBase(url.pathname), clientRoot);
		const stringLocalPath = localPath.toString();
		// @ts-ignore
		const extendName = fileExtension(stringLocalPath);
		const fileResp = await fetch(
			!extendName
				? `${
						stringLocalPath.endsWith('/')
							? `${stringLocalPath}index.html`
							: `${stringLocalPath}/index.html`
				  }`
				: stringLocalPath
		);

		// If the static file can't be found
		if (fileResp.status == 404) {
			// Render the astro custom 404 page
			const response = await app.render(request);

			if (app.setCookieHeaders) {
				for (const setCookieHeader of app.setCookieHeaders(response)) {
					response.headers.append('Set-Cookie', setCookieHeader);
				}
			}
			return response;

			// If the static file is found
		} else {
			return fileResp;
		}
	};

	const port = options.port ?? 8085;
	// @ts-ignore
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
