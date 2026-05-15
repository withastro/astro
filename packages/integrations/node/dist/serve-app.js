import { AsyncLocalStorage } from 'node:async_hooks';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createRequest, writeResponse, getAbortControllerCleanup } from 'astro/app/node';
import { resolveClientDir } from './shared.js';
async function readErrorPageFromDisk(client, status) {
	const filePaths = [`${status}.html`, `${status}/index.html`];
	for (const filePath of filePaths) {
		const fullPath = path.join(client, filePath);
		let stream;
		try {
			stream = createReadStream(fullPath);
			await new Promise((resolve, reject) => {
				stream.once('open', () => resolve());
				stream.once('error', reject);
			});
			const webStream = Readable.toWeb(stream);
			return new Response(webStream, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		} catch {
			stream?.destroy();
		}
	}
	return void 0;
}
function createAppHandler(app, options) {
	const als = new AsyncLocalStorage();
	const logger = app.adapterLogger;
	process.on('unhandledRejection', (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});
	const client = resolveClientDir(options);
	const prerenderedErrorPageFetch = async (url) => {
		const { pathname } = new URL(url);
		if (pathname.endsWith('/404.html') || pathname.endsWith('/404/index.html')) {
			const response = await readErrorPageFromDisk(client, 404);
			if (response) return response;
		}
		if (pathname.endsWith('/500.html') || pathname.endsWith('/500/index.html')) {
			const response = await readErrorPageFromDisk(client, 500);
			if (response) return response;
		}
		return new Response(null, { status: 404 });
	};
	const effectiveBodySizeLimit =
		options.bodySizeLimit === 0 || options.bodySizeLimit === Number.POSITIVE_INFINITY
			? void 0
			: options.bodySizeLimit;
	return async (req, res, next, locals) => {
		let request;
		try {
			request = createRequest(req, {
				allowedDomains: app.getAllowedDomains?.() ?? [],
				bodySizeLimit: effectiveBodySizeLimit,
				port: options.port,
			});
		} catch (err) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			res.statusCode = 500;
			res.end('Internal Server Error');
			return;
		}
		const routeData = app.match(request, true);
		if (routeData && !(routeData.type === 'page' && routeData.prerender)) {
			const response = await als.run(request.url, () =>
				app.render(request, {
					addCookieHeader: true,
					locals,
					routeData,
					prerenderedErrorPageFetch,
				}),
			);
			await writeResponse(response, res);
		} else if (next) {
			const cleanup = getAbortControllerCleanup(req);
			if (cleanup) cleanup();
			return next();
		} else {
			const response = await app.render(request, {
				addCookieHeader: true,
				prerenderedErrorPageFetch,
			});
			await writeResponse(response, res);
		}
	};
}
export { createAppHandler };
