// NOTE(fks): Side-effect -- shim.js must run first. This isn't guaranteed by
// the language, but it is a Node.js behavior that we rely on here. Keep this
// separate from the other imports so that it doesn't get organized & reordered.
import './shim.js';

// Normal Imports
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const handler = async (request: Request): Promise<Response> => {
		if (app.match(request)) {
			return await app.render(request);
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		});
	};

	return { default: handler };
}
