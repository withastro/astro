import { serializeRouteData, deserializeRouteData } from 'astro/app/manifest';
import { StaticPaths } from 'astro:static-paths';
import {
	STATIC_PATHS_ENDPOINT,
	PRERENDER_ENDPOINT,
	STATIC_IMAGES_ENDPOINT,
} from './prerender-constants.js';
function isStaticPathsRequest(request) {
	const { pathname } = new URL(request.url);
	return pathname === STATIC_PATHS_ENDPOINT && request.method === 'POST';
}
function isPrerenderRequest(request) {
	const { pathname } = new URL(request.url);
	return pathname === PRERENDER_ENDPOINT && request.method === 'POST';
}
async function handleStaticPathsRequest(app) {
	const staticPaths = new StaticPaths(app);
	const paths = await staticPaths.getAll();
	const response = {
		paths: paths.map(({ pathname, route }) => ({
			pathname,
			route: serializeRouteData(route, app.manifest.trailingSlash),
		})),
	};
	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
async function handlePrerenderRequest(app, request) {
	const headers = new Headers();
	for (const [key, value] of request.headers.entries()) {
		headers.append(key, value);
	}
	const body = await request.json();
	const routeData = deserializeRouteData(body.routeData);
	const prerenderRequest = new Request(body.url, {
		method: 'GET',
		headers,
	});
	return app.render(prerenderRequest, { routeData });
}
function isStaticImagesRequest(request) {
	const { pathname } = new URL(request.url);
	return pathname === STATIC_IMAGES_ENDPOINT && request.method === 'POST';
}
function handleStaticImagesRequest() {
	const staticImages = globalThis.astroAsset?.staticImages;
	if (!staticImages || staticImages.size === 0) {
		return new Response('[]', {
			headers: { 'Content-Type': 'application/json' },
		});
	}
	const entries = [];
	for (const [originalPath, { originalSrcPath, transforms }] of staticImages) {
		const serializedTransforms = [];
		for (const [hash, { finalPath, transform }] of transforms) {
			serializedTransforms.push({
				hash,
				finalPath,
				transform,
			});
		}
		entries.push({ originalPath, originalSrcPath, transforms: serializedTransforms });
	}
	return new Response(JSON.stringify(entries), {
		headers: { 'Content-Type': 'application/json' },
	});
}
export {
	handlePrerenderRequest,
	handleStaticImagesRequest,
	handleStaticPathsRequest,
	isPrerenderRequest,
	isStaticImagesRequest,
	isStaticPathsRequest,
};
