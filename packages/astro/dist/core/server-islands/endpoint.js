import { renderComponent, renderTemplate } from '../../runtime/server/index.js';
import { isAstroComponentFactory } from '../../runtime/server/render/astro/factory.js';
import { createSlotValueFromString } from '../../runtime/server/render/slot.js';
import { decryptString } from '../encryption.js';
import { BodySizeLimitError, readBodyWithLimit } from '../request-body.js';
import { getPattern } from '../routing/pattern.js';
const SERVER_ISLAND_ROUTE = '/_server-islands/[name]';
const SERVER_ISLAND_COMPONENT = '_server-islands.astro';
function getServerIslandRouteData(config) {
	const segments = [
		[{ content: '_server-islands', dynamic: false, spread: false }],
		[{ content: 'name', dynamic: true, spread: false }],
	];
	const route = {
		type: 'page',
		component: SERVER_ISLAND_COMPONENT,
		params: ['name'],
		segments,
		pattern: getPattern(segments, config.base, config.trailingSlash),
		prerender: false,
		isIndex: false,
		fallbackRoutes: [],
		route: SERVER_ISLAND_ROUTE,
		origin: 'internal',
		distURL: [],
	};
	return route;
}
function injectServerIslandRoute(config, routeManifest) {
	routeManifest.routes.unshift(getServerIslandRouteData(config));
}
function badRequest(reason) {
	return new Response(null, {
		status: 400,
		statusText: 'Bad request: ' + reason,
	});
}
const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024;
async function getRequestData(request, bodySizeLimit = DEFAULT_BODY_SIZE_LIMIT) {
	switch (request.method) {
		case 'GET': {
			const url = new URL(request.url);
			const params = url.searchParams;
			if (!params.has('s') || !params.has('e') || !params.has('p')) {
				return badRequest('Missing required query parameters.');
			}
			const encryptedSlots = params.get('s');
			return {
				encryptedComponentExport: params.get('e'),
				encryptedProps: params.get('p'),
				encryptedSlots,
			};
		}
		case 'POST': {
			try {
				const body = await readBodyWithLimit(request, bodySizeLimit);
				const raw = new TextDecoder().decode(body);
				const data = JSON.parse(raw);
				if (Object.hasOwn(data, 'slots') && typeof data.slots === 'object') {
					return badRequest('Plaintext slots are not allowed. Slots must be encrypted.');
				}
				if (Object.hasOwn(data, 'componentExport') && typeof data.componentExport === 'string') {
					return badRequest(
						'Plaintext componentExport is not allowed. componentExport must be encrypted.',
					);
				}
				return data;
			} catch (e) {
				if (e instanceof BodySizeLimitError) {
					return new Response(null, {
						status: 413,
						statusText: e.message,
					});
				}
				if (e instanceof SyntaxError) {
					return badRequest('Request format is invalid.');
				}
				throw e;
			}
		}
		default: {
			return new Response(null, { status: 405 });
		}
	}
}
function createEndpoint(manifest) {
	const page = async (result) => {
		const params = result.params;
		if (!params.name) {
			return new Response(null, {
				status: 400,
				statusText: 'Bad request',
			});
		}
		const componentId = params.name;
		const data = await getRequestData(result.request, manifest.serverIslandBodySizeLimit);
		if (data instanceof Response) {
			return data;
		}
		const serverIslandMappings = await manifest.serverIslandMappings?.();
		const serverIslandMap = await serverIslandMappings?.serverIslandMap;
		let imp = serverIslandMap?.get(componentId);
		if (!imp) {
			return new Response(null, {
				status: 404,
				statusText: 'Not found',
			});
		}
		const key = await manifest.key;
		let componentExport;
		try {
			componentExport = await decryptString(
				key,
				data.encryptedComponentExport,
				`export:${componentId}`,
			);
		} catch (_e) {
			return badRequest('Encrypted componentExport value is invalid.');
		}
		const encryptedProps = data.encryptedProps;
		let props = {};
		if (encryptedProps !== '') {
			try {
				const propString = await decryptString(key, encryptedProps, `props:${componentId}`);
				props = JSON.parse(propString);
			} catch (_e) {
				return badRequest('Encrypted props value is invalid.');
			}
		}
		let decryptedSlots = {};
		const encryptedSlots = data.encryptedSlots;
		if (encryptedSlots !== '') {
			try {
				const slotsString = await decryptString(key, encryptedSlots, `slots:${componentId}`);
				decryptedSlots = JSON.parse(slotsString);
			} catch (_e) {
				return badRequest('Encrypted slots value is invalid.');
			}
		}
		const componentModule = await imp();
		let Component = componentModule[componentExport];
		const slots = {};
		for (const prop in decryptedSlots) {
			slots[prop] = createSlotValueFromString(decryptedSlots[prop]);
		}
		result.response.headers.set('X-Robots-Tag', 'noindex');
		if (isAstroComponentFactory(Component)) {
			const ServerIsland = Component;
			Component = function (...args) {
				return ServerIsland.apply(this, args);
			};
			Object.assign(Component, ServerIsland);
			Component.propagation = 'self';
		}
		return renderTemplate`${renderComponent(result, 'Component', Component, props, slots)}`;
	};
	page.isAstroComponentFactory = true;
	const instance = {
		default: page,
		partial: true,
	};
	return instance;
}
export {
	SERVER_ISLAND_COMPONENT,
	SERVER_ISLAND_ROUTE,
	createEndpoint,
	getRequestData,
	injectServerIslandRoute,
};
