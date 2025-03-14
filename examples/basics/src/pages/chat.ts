import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Counter from '../components/counter.astro';
import Layout from '../layouts/Layout.astro';

let counter = 0;
export const prerender = false;
const container = await AstroContainer.create();

export const GET: APIRoute = async ({ request }) => {
	const counterComp = await container.renderToString(Counter, {
		props: { count: counter },
	});
	const page = await container.renderToString(Layout, {
		slots: {
			default: counterComp,
		},
	});

	console.log(counterComp);

	return new Response(page, {
		headers: {
			'Content-Type': 'text/html',
		},
	});
};
