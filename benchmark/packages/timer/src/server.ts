import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from 'astro/app/entrypoint';
import { createRequest } from 'astro/app/node';

const app = createApp();

export async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const start = performance.now();
	await app.render(
		createRequest(req, {
			allowedDomains: app.manifest.allowedDomains,
		}),
	);
	const end = performance.now();
	res.write(end - start + '');
	res.end();
}
