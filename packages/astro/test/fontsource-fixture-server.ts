import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';

// The Fontsource provider fetches font metadata and font files from
// `api.fontsource.org` and `cdn.jsdelivr.net` at resolution time. Those
// endpoints are not reliably reachable from CI, so the tests serve fixture
// responses from a local server and redirect Fontsource requests to it.
const fontsourceFixtures: Record<string, string> = {
	'/v1/fonts': 'roboto-meta.json',
	'/v1/fonts/roboto': 'roboto-details.json',
	'/fontsource/fonts/roboto@latest/latin-500-normal.woff2': 'latin-500-normal.woff2',
	'/fontsource/fonts/roboto@latest/latin-700-italic.woff2': 'latin-700-italic.woff2',
	'/fontsource/fonts/roboto@latest/latin-700-normal.woff2': 'latin-700-normal.woff2',
};

let fontsourceServer: Server | undefined;
let fontsourceServerUrl: URL | undefined;
let originalFetch: typeof fetch | undefined;

export async function setupFontsourceFixtureServer(): Promise<void> {
	originalFetch = globalThis.fetch;
	fontsourceServer = createServer((request, response) => {
		const fixture = fontsourceFixtures[request.url ?? ''];
		let body: ReturnType<typeof readFileSync> | undefined;
		if (fixture) {
			try {
				body = readFileSync(new URL('./units/assets/fonts/data/fonts/' + fixture, import.meta.url));
			} catch {
				// A missing fixture would otherwise leave the request hanging.
			}
		}
		if (!body) {
			response.writeHead(404);
			response.end();
			return;
		}
		response.writeHead(200, {
			'content-type': fixture!.endsWith('.json') ? 'application/json' : 'font/woff2',
		});
		response.end(body);
	});
	await new Promise<void>((resolve) => {
		fontsourceServer!.listen(0, '127.0.0.1', () => {
			const address = fontsourceServer!.address();
			if (address && typeof address === 'object') {
				fontsourceServerUrl = new URL(`http://127.0.0.1:${address.port}`);
			}
			resolve();
		});
	});
	// Redirect Fontsource requests to the local server. Other requests keep
	// using the original fetch, so unrelated tests in the same process are
	// unaffected.
	globalThis.fetch = async (input, init) => {
		const url =
			typeof input === 'string'
				? new URL(input)
				: input instanceof URL
					? input
					: new URL(input.url);
		if (
			fontsourceServerUrl &&
			(url.hostname === 'api.fontsource.org' || url.hostname === 'cdn.jsdelivr.net')
		) {
			return originalFetch!(new URL(url.pathname + url.search, fontsourceServerUrl), init);
		}
		return originalFetch!(input, init);
	};
}

export async function teardownFontsourceFixtureServer(): Promise<void> {
	globalThis.fetch = originalFetch ?? globalThis.fetch;
	if (fontsourceServer) {
		fontsourceServer.closeAllConnections();
		await new Promise<void>((resolve) => fontsourceServer!.close(() => resolve()));
	}
}
