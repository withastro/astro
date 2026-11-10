import { createApp } from 'virtual:astro:app';

const app = createApp();

/**
 * Renders `request` with the routes of the project: pages, endpoints and redirects, through
 * middleware and the fetch handlers. A request no route matches gets an empty `404` response.
 * Cookies set with `Astro.cookies` become `Set-Cookie` headers.
 */
export async function fetch(request: Request): Promise<Response> {
	// `render()` matches on-demand routes only; the dev app finds prerendered routes too.
	const routeData = app.isDev()
		? (await app.devMatch(app.getPathnameFromRequest(request)))?.routeData
		: undefined;
	return app.render(request, { addCookieHeader: true, routeData });
}

/**
 * Whether `request` matches a route, using the route table, `base` and the routing extensions.
 * Nothing is rendered. In a build, only on-demand routes (pages, endpoints and redirects that
 * render at request time) match: prerendered routes are files in the client output directory,
 * which the host serves before calling the server. When Vite serves, prerendered routes match
 * too, and the route table follows the files added to and removed from the project.
 */
export function match(request: Request): boolean {
	return app.match(request) !== undefined;
}

/**
 * The server app of `router()`, `{ fetch, match }`. Import it from a custom
 * `serverOutput.entrypoint` to put the Astro routes behind another server.
 */
export default { fetch, match };
