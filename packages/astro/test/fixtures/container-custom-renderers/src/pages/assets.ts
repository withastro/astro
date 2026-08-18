import type { APIRoute } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import Component from '../components/Assets.astro';

export const GET: APIRoute = async () => {
	const container = await experimental_AstroContainer.create();
	return new Response(
		await container.renderComponent(Component, {
			props: { message: 'Hello ' },
			slots: { default: 'World' },
		}),
	);
};
