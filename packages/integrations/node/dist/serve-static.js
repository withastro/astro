import fs from 'node:fs';
import path from 'node:path';
import { hasFileExtension, isInternalPath } from '@astrojs/internal-helpers/path';
import send from 'send';
import { resolveClientDir } from './shared.js';
import { createRequest } from 'astro/app/node';
function resolveStaticPath(client, urlPath) {
	const filePath = path.join(client, urlPath);
	const resolved = path.resolve(filePath);
	const resolvedClient = path.resolve(client);
	if (resolved !== resolvedClient && !resolved.startsWith(resolvedClient + path.sep)) {
		return { filePath: resolved, isDirectory: false };
	}
	let isDirectory = false;
	try {
		isDirectory = fs.lstatSync(filePath).isDirectory();
	} catch {}
	return { filePath: resolved, isDirectory };
}
function createStaticHandler(app, options, headersMap) {
	const client = resolveClientDir(options);
	return (req, res, ssr) => {
		if (req.url) {
			let fullUrl = req.url;
			if (req.url.includes('#')) {
				fullUrl = fullUrl.slice(0, req.url.indexOf('#'));
			}
			const [urlPath, urlQuery] = fullUrl.split('?');
			const { isDirectory } = resolveStaticPath(client, app.removeBase(urlPath));
			const hasSlash = urlPath.endsWith('/');
			let pathname = urlPath;
			if (headersMap && headersMap.length > 0) {
				const request = createRequest(req, {
					allowedDomains: app.getAllowedDomains?.() ?? [],
					port: options.port,
				});
				const routeData = app.match(request, true);
				if (routeData && routeData.prerender) {
					const baselessPathname = prependForwardSlash(app.removeBase(urlPath));
					const matchedRoute = headersMap.find((header) =>
						header.pathname.includes(baselessPathname),
					);
					if (matchedRoute) {
						for (const header of matchedRoute.headers) {
							res.setHeader(header.key, header.value);
						}
					}
				}
			}
			switch (app.manifest.trailingSlash) {
				case 'never': {
					if (isDirectory && urlPath !== '/' && hasSlash) {
						pathname = urlPath.slice(0, -1) + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					}
					if (isDirectory && !hasSlash) {
						pathname = `${urlPath}/index.html`;
					}
					break;
				}
				case 'ignore': {
					if (isDirectory && !hasSlash) {
						pathname = `${urlPath}/index.html`;
					}
					break;
				}
				case 'always': {
					if (!hasSlash && !hasFileExtension(urlPath) && !isInternalPath(urlPath)) {
						pathname = urlPath + '/' + (urlQuery ? '?' + urlQuery : '');
						res.statusCode = 301;
						res.setHeader('Location', pathname);
						return res.end();
					}
					break;
				}
			}
			pathname = prependForwardSlash(app.removeBase(pathname));
			const normalizedPathname = path.posix.normalize(pathname);
			const stream = send(req, normalizedPathname, {
				root: client,
				dotfiles: normalizedPathname.startsWith('/.well-known/') ? 'allow' : 'deny',
			});
			let forwardError = false;
			stream.on('error', (err) => {
				if (forwardError) {
					const status = 'statusCode' in err ? err.statusCode : 500;
					if (status >= 500) {
						console.error(err.toString());
					}
					res.writeHead(status);
					res.end(status >= 500 ? 'Internal server error' : '');
					return;
				}
				ssr();
			});
			stream.on('file', () => {
				forwardError = true;
			});
			stream.on('stream', () => {
				if (normalizedPathname.startsWith(`/${app.manifest.assetsDir}/`)) {
					res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				}
			});
			stream.pipe(res);
		} else {
			ssr();
		}
	};
}
function prependForwardSlash(pth) {
	return pth.startsWith('/') ? pth : '/' + pth;
}
export { createStaticHandler, resolveStaticPath };
