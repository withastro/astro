import fs from 'fs';
import http from 'http';
import https from 'https';
import send from 'send';
import enableDestroy from 'server-destroy';
import { fileURLToPath } from 'url';

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
	handler: http.RequestListener
) {
	const listener: http.RequestListener = (req, res) => {
		if (req.url) {
			let pathname: string | undefined = removeBase(req.url);
			pathname = pathname[0] === '/' ? pathname : '/' + pathname;
			const encodedURI = parsePathname(pathname, host, port);

			if (!encodedURI) {
				res.writeHead(400);
				res.end('Bad request.');
				return res;
			}

			const stream = send(req, encodedURI, {
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
				// On directory find, redirect to the trailing slash
				let location: string;
				if (req.url!.includes('?')) {
					const [url = '', search] = req.url!.split('?');
					location = `${url}/?${search}`;
				} else {
					location = req.url + '/';
				}

				res.statusCode = 301;
				res.setHeader('Location', location);
				res.end(location);
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
