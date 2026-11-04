import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import { preact as vitePreact } from '@preact/preset-vite';
import { createBuilder, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import preact, { type PreactRendererOptions } from '../dist/renderer.js';

const root = new URL('./fixtures/renderer/', import.meta.url);

type RenderModule = { render(): Promise<string> };

const fallback = {
	name: 'fallback',
	serverEntrypoint: new URL('./src/fallback-server.js', root),
	clientEntrypoint: new URL('./src/fallback-client.js', root),
};

function config(options?: PreactRendererOptions): InlineConfig {
	return {
		root: fileURLToPath(root),
		configFile: false,
		logLevel: 'silent',
		plugins: [astro({ renderers: [preact(options), fallback] }), vitePreact()],
		environments: {
			ssr: {
				build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
			},
			client: { build: { outDir: 'dist/client' } },
		},
	};
}

async function startServer(options?: PreactRendererOptions) {
	const server = await createServer({ ...config(options), server: { port: 0 } });
	await server.listen();
	const render = async () => {
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		return mod.render();
	};
	return { server, render };
}

describe('@astrojs/preact/renderer: dev', () => {
	let server: ViteDevServer;
	let render: () => Promise<string>;

	before(async () => {
		({ server, render } = await startServer());
	});

	after(async () => {
		await server.close();
	});

	it('server-renders islands that hydrate with the Preact client entrypoint', async () => {
		const html = await render();
		assert.match(html, /<astro-island[^>]*><button>count: 3<\/button>/);
		assert.match(html, /<astro-island[^>]*renderer-url="[^"]*preact\/dist\/client\.js"/);
	});

	it('adds no head script without devtools', async () => {
		assert.equal((await render()).includes('preact/debug'), false);
	});
});

describe('@astrojs/preact/renderer: options', () => {
	it('passes include and exclude to the server renderer', async () => {
		const { server, render } = await startServer({ exclude: ['**/Counter.jsx'] });
		try {
			// The fallback renderer, tried after Preact, renders the excluded component.
			assert.match(await render(), /<astro-island[^>]*><p>fallback<\/p>/);
		} finally {
			await server.close();
		}
	});

	it('loads preact/debug on every page with devtools', async () => {
		const { server, render } = await startServer({ devtools: true });
		try {
			const html = await render();
			const src = /<script type="module">import "([^"]+)";<\/script>[\s\S]*<\/head>/.exec(
				html,
			)?.[1];
			assert.equal(src, '/@id/preact/debug');
			const response = await fetch(new URL(src!, server.resolvedUrls!.local[0]));
			assert.equal(response.status, 200);
			assert.match(response.headers.get('content-type') ?? '', /javascript/);
		} finally {
			await server.close();
		}
	});
});

describe('@astrojs/preact/renderer: build', () => {
	let html: string;

	before(async () => {
		await fs.rm(new URL('./dist/', root), { recursive: true, force: true });
		const builder = await createBuilder(config({ devtools: true }));
		await builder.buildApp();
		const mod: RenderModule = await import(new URL('./dist/server/render.js', root).href);
		html = await mod.render();
	});

	it('points islands at client build chunks', async () => {
		assert.match(html, /<astro-island[^>]*><button>count: 3<\/button>/);
		const rendererUrl = /renderer-url="([^"]+)"/.exec(html)?.[1];
		assert.match(rendererUrl ?? '', /^\/assets\/.+\.js$/);
		await fs.access(new URL(`./dist/client${rendererUrl}`, root));
	});

	it('leaves the devtools script out', () => {
		assert.equal(html.includes('preact/debug'), false);
	});
});
