import type { APIRoute, SSRLoadedRenderer } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer as r } from '@astrojs/react';
import { getContainerRenderer as v } from '@astrojs/vue';
import Component from '../components/buttonDirective.astro';

export const GET: APIRoute = async (ctx) => {
	try {
		const renderers = await loadRenderers([v(), r()]);
	} catch (e) {
		console.log(e);
	}
	return new Response(null, {
		status: 200,
	});
	// const container = await experimental_AstroContainer.create({
	// 	renderers,
	// });
	// container.addServerRenderer({ renderer });
	// return await container.renderToResponse(Component);
};
