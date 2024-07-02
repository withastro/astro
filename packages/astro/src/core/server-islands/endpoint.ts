import { renderComponent, renderTemplate, type AstroComponentFactory } from '../../runtime/server/index.js';
import type { APIRoute, ComponentInstance, ManifestData, RouteData, SSRManifest } from '../../@types/astro.js';
import type { ModuleLoader } from '../module-loader/loader.js';

export const SERVER_ISLAND_ROUTE = '/_server-islands/[name]';
export const SERVER_ISLAND_COMPONENT = '_server-islands.astro';

export function ensureServerIslandRoute(manifest: ManifestData) {
	if (manifest.routes.some((route) => route.route === '/_server-islands/[name]')) {
		return;
	}

	const route: RouteData = {
		type: 'page',
		component: SERVER_ISLAND_COMPONENT,
		generate: () => '',
		params: ['name'],
		segments: [
			[{ content: '_server-islands', dynamic: false, spread: false }],
			[{ content: 'name', dynamic: true, spread: false }]
		],
		pattern: /^\/_server-islands\/([^/]+?)$/,
		prerender: false,
		isIndex: false,
		fallbackRoutes: [],
		route: SERVER_ISLAND_ROUTE,
	}

	manifest.routes.push(route);
}

type RenderOptions = {
	componentExport: string;
	props: Record<string, any>;
	slots: Record<string, any>;
}

export function createEndpoint(manifest: SSRManifest) {
	const page: AstroComponentFactory = async (result) => {
		const params = result.params;
		const request = result.request;
		const raw = await request.text();
		const data = JSON.parse(raw) as RenderOptions;
		if(!params.name) {
			return new Response(null, {
				status: 400,
				statusText: 'Bad request'
			});
		}
		const componentId = params.name;

		const imp = manifest.serverIslandMap?.get(componentId);
		if(!imp) {
			return new Response(null, {
				status: 404,
				statusText: 'Not found'
			});
		}

		const props = data.props;
		const slots = data.slots;
		const componentModule = await imp();
		const Component = (componentModule as any)[data.componentExport];

		return renderTemplate`${renderComponent(result, 'Component', Component, props, slots)}`;
	}

	page.isAstroComponentFactory = true;
	
	const instance: ComponentInstance = {
		default: page,
	};

	return instance;
}

