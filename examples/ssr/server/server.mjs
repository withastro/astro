import { createServer } from 'http';
import { deserializeManifestData, matchRoute } from 'astro/routing';
import { createResult } from 'astro/ssr/result.js';
import { renderPage } from 'astro/server/index.js';
import reactRenderer from '@astrojs/renderer-react';
import reactServerRenderer from '@astrojs/renderer-react/server.js';
import fs from 'fs';

const renderers = [
	Object.create(reactRenderer, {
		ssr: {
			value: reactServerRenderer
		}
	})
];

const serverRoot = new URL('../dist/server/', import.meta.url);
const manifestData = JSON.parse(await fs.promises.readFile(new URL('./manifest.json', serverRoot)));
const manifest = deserializeManifestData(manifestData);

async function handle(req, res) {
	const route = matchRoute(req.url, manifest);
	if(route) {
		const modFile = new URL('./' + route.distEntry, serverRoot);
		const mod = await import(modFile);
		const { default: Component } = mod;
		// TODO get params

		const result = createResult({
			astroConfig: {
				buildOptions: {}
			},
			logging: {},
			origin: 'http://example.com',
			params: {},
			pathname: req.url,
			renderers,
			links: undefined, // TODO
			scripts: undefined // TODO
		});

		const pageProps = {};

		let html = await renderPage(result, Component, pageProps, null);


		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.end(html)
	} else {
		res.writeHead(404);
		res.end();
	}
}

const server = createServer((req, res) => {
	handle(req, res).catch(err => {
		console.error(err);
		res.writeHead(500, {
			'Content-Type': 'text/plain'
		});
		res.end(err.toString());
	})
});

server.listen(8080);
console.log('Serving at http://localhost:8080');

// Silence weird <time> warning
console.error = () => {};
