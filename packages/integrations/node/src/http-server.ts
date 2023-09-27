import type { AstroUserConfig } from 'astro/config';
import https from 'https';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import send from 'send';
import enableDestroy from 'server-destroy';

interface CreateServerOptions {
	client: URL;
	port: number;
	host: string | undefined;
	removeBase: (pathname: string) => string;
}

function parsePathname(pathname: string, host: string | undefined, port: number) {
	try {
		const urlPathname = new URL(pathname, `http://${host}:${port}`).pathname;
		return decodeURI(encodeURI(urlPathname));
	} catch (err) {
		return undefined;
	}
}

export function createServer(
	{ client, port, host, removeBase }: CreateServerOptions,
	handler: http.RequestListener,
	trailingSlash: AstroUserConfig['trailingSlash']
) {
	const listener: http.RequestListener = (req, res) => {
		if (req.url) {
			let pathname: string = removeBase(req.url);
			pathname = pathname[0] === '/' ? pathname : '/' + pathname;
			const pathnameWithSlash = pathname.endsWith('/') ? pathname : pathname + '/';
			const pathnameWithoutSlash = pathname.endsWith('/')
				? pathname.substring(0, pathname.length - 1)
				: pathname;
			// Ensure that the url always has the directory path
			let pathToSend = parsePathname(pathnameWithSlash, host, port);

			if (!pathToSend) {
				res.writeHead(400);
				res.end('Bad request.');
				return res;
			}

			const stream = send(req, pathToSend, {
				root: fileURLToPath(client),
				dotfiles: pathname.startsWith('/.well-known/') ? 'allow' : 'deny',
			});

			let forwardError = false;

			stream.on('error', (err) => {
				if (forwardError) {
					console.error(err.toString());
					res.writeHead(500);
					res.end('Internal server error');
					return;
				}
				// File not found, forward to the SSR handler
				handler(req, res);
			});
			stream.on('directory', () => {
				let location: URL;
				if (req.url!.includes('?')) {
					const [url = '', search] = req.url!.split('?');
					location = new URL(`${url}/?${search}`);
				} else {
					location = new URL(req.url + '/');
				}
				switch (trailingSlash) {
					case 'never': {
						// Redirect to a url with no trailingSlash if the incoming url had a trailingSlash
						if (pathname.endsWith('/')) {
							res.statusCode = 301;
							location.pathname = pathnameWithoutSlash;
							res.setHeader('Location', location.toString());
							res.end(location);
						}
						break;
					}
					case 'always': {
						// Redirect to a url with trailingSlash if the incoming url did not have a trailingSlash
						if (!pathname.endsWith('/')) {
							res.statusCode = 301;
							location.pathname = pathnameWithSlash;
							res.setHeader('Location', location.toString());
							res.end(location);
						}
						break;
					}
				}
			});
			stream.on('file', () => {
				forwardError = true;
			});
			stream.pipe(res);
		} else {
			handler(req, res);
		}
	};

	let httpServer:
		| http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
		| https.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

	if (process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH) {
		httpServer = https.createServer(
			{
				key: fs.readFileSync(process.env.SERVER_KEY_PATH),
				cert: fs.readFileSync(process.env.SERVER_CERT_PATH),
			},
			listener
		);
	} else {
		httpServer = http.createServer(listener);
	}
	httpServer.listen(port, host);
	enableDestroy(httpServer);

	// Resolves once the server is closed
	const closed = new Promise<void>((resolve, reject) => {
		httpServer.addListener('close', resolve);
		httpServer.addListener('error', reject);
	});

	return {
		host,
		port,
		closed() {
			return closed;
		},
		server: httpServer,
		stop: async () => {
			await new Promise((resolve, reject) => {
				httpServer.destroy((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
