import path from "node:path";
import url from "node:url";
import send from "send";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Options } from "./types.js";
import type { NodeApp } from "astro/app/node";

/**
 * Intended to be used only in the standalone mode.
 * This is queried first, and if a static file is not found, it relegates to the SSR handler.
 */
export default function createListener(app: NodeApp, options: Options) {
	const client = resolveClientDir(options);
    return (req: IncomingMessage, res: ServerResponse, ssr: () => unknown) => {
		if (req.url) {
			let pathname = app.removeBase(req.url);
			pathname = decodeURI(new URL(pathname, 'http://host').pathname);

			const stream = send(req, pathname, {
				root: client,
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
				ssr();
			});
			stream.on('headers', (_res: ServerResponse) => {
                // assets in dist/_astro are hashed and should get the immutable header
				if (pathname.startsWith(`/${options.assets}/`)) {
					// Taken from https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable
					_res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				}
			});
			stream.on('directory', () => {
				// On directory find, redirect to the trailing slash
				let location: string;
				if (req.url!.includes('?')) {
					const [url1 = '', search] = req.url!.split('?');
					location = `${url1}/?${search}`;
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
			ssr();
		}
	};
}

function resolveClientDir(options: Options) {
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);
	const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));
	const serverEntryURL = new URL(import.meta.url);
	const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);
	const client = url.fileURLToPath(clientURL);
	return client;
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}
