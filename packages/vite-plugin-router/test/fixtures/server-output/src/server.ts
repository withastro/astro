import astro from '@astrojs/vite-plugin-router/app';

// A custom server entry that puts the Astro routes in front of another server.
export default {
	fetch(request: Request): Promise<Response> | Response {
		if (astro.match(request)) return astro.fetch(request);
		return new Response('not Astro', { status: 418 });
	},
};
