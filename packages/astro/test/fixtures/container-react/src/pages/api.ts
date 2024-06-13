import type {APIRoute, SSRLoadedRenderer} from "astro";
import { experimental_AstroContainer } from "astro/container";
import server from '@astrojs/react/server.js';
import Component from "../components/button.jsx"

export const GET: APIRoute = async (ctx) => {
		const container = await experimental_AstroContainer.create();
		container.addServerRenderer("@astrojs/react", server);
		return await container.renderToResponse(Component);
}
