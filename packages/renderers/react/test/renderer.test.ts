import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import viteReact from '@vitejs/plugin-react';
import { createBuilder, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import react, { type ReactRendererOptions } from '../dist/renderer.js';

const root = new URL('./fixtures/renderer/', import.meta.url);

type RenderModule = { render(): Promise<string> };

function config(options?: ReactRendererOptions): InlineConfig {
	return {
		root: fileURLToPath(root),
		configFile: false,
		logLevel: 'silent',
		plugins: [astro({ renderers: [react(options)] }), viteReact()],
		environments: {
			ssr: {
				build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
			},
			client: { build: { outDir: 'dist/client' } },
		},
	};
}

describe('@astrojs/react/renderer: dev', () => {
	let server: ViteDevServer;

	before(async () => {
		server = await createServer({ ...config(), server: { port: 0 } });
	});

	after(async () => {
		await server.close();
	});

	async function render() {
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		return mod.render();
	}

	it('server-renders islands that hydrate with the React client entrypoint', async () => {
		const html = await render();
		assert.match(html, /<astro-island[^>]*><button>count: <!-- -->3<\/button>/);
		assert.match(html, /<astro-island[^>]*renderer-url="[^"]*react\/dist\/client\.js"/);
	});

	it('renders children as static HTML by default', async () => {
		const html = await render();
		assert.match(html, /<div id="wrapper"><astro-slot><p>child<\/p><\/astro-slot><\/div>/);
		assert.equal(html.includes('data-react-children'), false);
	});

	it('adds the Fast Refresh preamble to the head', async () => {
		assert.match(
			await render(),
			/<script type="module">[^<]*@react-refresh[^<]*<\/script>[\s\S]*<\/head>/,
		);
	});
});

describe('@astrojs/react/renderer: options', () => {
	let server: ViteDevServer;

	before(async () => {
		server = await createServer({
			...config({ experimentalReactChildren: true }),
			server: { port: 0 },
		});
	});

	after(async () => {
		await server.close();
	});

	it('passes its options to the server renderer', async () => {
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		const html = await mod.render();
		// The children reach the component as React elements, not as static HTML.
		assert.match(html, /<astro-island[^>]*data-react-children/);
		assert.equal(html.includes('<astro-slot>'), false);
	});
});

describe('@astrojs/react/renderer: build', () => {
	let html: string;

	before(async () => {
		await fs.rm(new URL('./dist/', root), { recursive: true, force: true });
		const builder = await createBuilder(config());
		await builder.buildApp();
		const mod: RenderModule = await import(new URL('./dist/server/render.js', root).href);
		html = await mod.render();
	});

	it('points islands at client build chunks', async () => {
		const rendererUrl = /renderer-url="([^"]+)"/.exec(html)?.[1];
		assert.match(rendererUrl ?? '', /^\/assets\/.+\.js$/);
		await fs.access(new URL(`./dist/client${rendererUrl}`, root));
	});

	it('leaves the Fast Refresh preamble out', () => {
		assert.equal(html.includes('@react-refresh'), false);
	});
});
