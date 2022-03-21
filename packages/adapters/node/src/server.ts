import type { IncomingMessage, ServerResponse } from 'http';
import { App } from 'astro/app';

export function createRequestHandler({
	manifest: any,
	rootFolder: URL
}): any {
	let app = new App(manifest, rootFolder);

	return function(req: IncomingMessage, res: ServerResponse) {
		const route = app.match(request);

		if(route) {

		}
	}
}
