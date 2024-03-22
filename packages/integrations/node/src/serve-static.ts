import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import url from 'node:url';
import type { NodeApp } from 'astro/app/node';
import send from 'send';
import type { Options } from './types.js';

// check for a dot followed by a extension made up of lowercase characters
const isSubresourceRegex = /.+\.[a-z]+$/i;

/**
 * Creates a Node.js http listener for static files and prerendered pages.
 * In standalone mode, the static handler is queried first for the static files.
 * If one matching the request path is not found, it relegates to the SSR handler.
 * Intended to be used only in the standalone mode.
 */
export function createStaticHandler(app: NodeApp, options: Options) {
	const client = resolveClientDir(options);
	/**
	 * @param ssr The SSR handler to be called if the static handler does not find a matching file.
	 */
	return (req: IncomingMessage, res: ServerResponse, ssr: () => unknown) => {
		if (req.url) {
			const [urlPath, urlQuery] = req.url.split('?');
			const filePath = path.join(client, app.removeBase(urlPath));

			let pathname: string;
			let isDirectory = false;
			try {
				isDirectory = fs.lstatSync(filePath).isDirectory();
			} catch {}

			const { trailingSlash = 'ignore' } = options;

			const hasSlash = urlPath.endsWith('/');
			switch (trailingSlash) {
				case 'never':
					if (isDirectory && urlPath != '/' && hasSlash) {
						pathname = urlPath.slice(0, -1) + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					} else pathname = urlPath;
				// intentionally fall through
				case 'ignore':
					{
						if (isDirectory && !hasSlash) {
							pathname = urlPath + '/index.html';
						} else pathname = urlPath;
					}
					break;
				case 'always':
					// trailing slash is not added to "subresources"
					if (!hasSlash && !urlPath.match(isSubresourceRegex)) {
						pathname = urlPath + '/' + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					} else pathname = urlPath;
					break;
			}
			// app.removeBase sometimes returns a path without a leading slash
			pathname = prependForwardSlash(app.removeBase(pathname));

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
					// This is the "far future" cache header, used for static files whose name includes their digest hash.
					// 1 year (31,536,000 seconds) is convention.
					// Taken from https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable
					_res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				}
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

function prependForwardSlash(pth: string) {
	return pth.startsWith('/') ? pth : '/' + pth;
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}
