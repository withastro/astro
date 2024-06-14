import type { ManifestData, RouteData } from '#astro/@types/astro';
import type { APIRoute } from '../../@types/astro.js';
import type { ModuleLoader } from '../module-loader/loader.js';

export function createEndpoint(loader: ModuleLoader) {
	const POST: APIRoute = async ({ request, params }) => {
		let raw = await request.text();
		let data = JSON.parse(raw);
	
		console.log("D", data);
	
		return new Response(`<div>Testing1</div>`, {
			status: 200,
			headers: {
				'Content-Type': 'text/html'
			}
		});
	}

	return {
		POST
	};
}

export function ensureServerIslandRoute(manifest: ManifestData, loader: ModuleLoader) {
	const endpoint = createEndpoint(loader);

	const route: RouteData = {
		type: 'endpoint',
		component: '_server-islands.ts',
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
		route: '/_server-islands/[name]',


		/*
		"type": "endpoint",
		"isIndex": false,
		"route": "/_server-islands/[name]",
		"pattern": {},
		"segments": [
		 [
			{
			 "content": "_server-islands",
			 "dynamic": false,
			 "spread": false
			}
		 ],
		 [
			{
			 "content": "name",
			 "dynamic": true,
			 "spread": false
			}
		 ]
		],
		"params": [
		 "name"
		],
		"component": "../../packages/astro/dist/core/server-islands/endpoint.js",
		"prerender": false,
		"fallbackRoutes": []
		*/
 
	}
	
	//manifest.routes.push();
}
