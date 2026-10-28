import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import { svelte as viteSvelte } from '@sveltejs/vite-plugin-svelte';
import { createBuilder, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import svelte from '../dist/renderer.js';

const root = new URL('./fixtures/renderer/', import.meta.url);

type RenderModule = { render(): Promise<string> };

const config: InlineConfig = {
	root: fileURLToPath(root),
	configFile: false,
	logLevel: 'silent',
	// The framework plugin first: `astro()` applies the renderer's `optimizeDeps.exclude` before the
	// hooks of vite-plugin-svelte whichever comes first.
	plugins: [viteSvelte(), astro({ renderers: [svelte()] })],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
};

describe('@astrojs/svelte/renderer: dev', () => {
	let server: ViteDevServer;

	before(async () => {
		server = await createServer({ ...config, server: { port: 0 } });
	});

	after(async () => {
		await server.close();
	});

	async function render() {
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		return mod.render();
	}

	it('server-renders islands that hydrate with the Svelte client entrypoint', async () => {
		const html = await render();
		assert.match(html, /<astro-island[^>]*><!--\[--><button>count: 3<\/button>/);
		assert.match(html, /<astro-island[^>]*renderer-url="[^"]*svelte\/dist\/client\.svelte\.js"/);
	});

	it('bundles the Svelte libraries among the dependencies of the project', async () => {
		const noExternal = server.environments.ssr.config.resolve.noExternal;
		assert.ok(Array.isArray(noExternal) && noExternal.includes('@test/svelte-renderer-lib'));
		assert.match(await render(), /<p>hello lib<\/p>/);
	});

	it('keeps vite-plugin-svelte from pre-bundling the Svelte server runtime', () => {
		const { include = [], exclude = [] } = server.environments.ssr.config.optimizeDeps;
		assert.ok(exclude.includes('svelte'));
		assert.equal(
			include.some((id) => id.startsWith('svelte/')),
			false,
		);
	});
});

describe('@astrojs/svelte/renderer: build', () => {
	let html: string;

	before(async () => {
		await fs.rm(new URL('./dist/', root), { recursive: true, force: true });
		const builder = await createBuilder(config);
		await builder.buildApp();
		const mod: RenderModule = await import(new URL('./dist/server/render.js', root).href);
		html = await mod.render();
	});

	it('points islands at client build chunks', async () => {
		assert.match(html, /<p>hello lib<\/p>/);
		const rendererUrl = /renderer-url="([^"]+)"/.exec(html)?.[1];
		assert.match(rendererUrl ?? '', /^\/assets\/.+\.js$/);
		await fs.access(new URL(`./dist/client${rendererUrl}`, root));
	});
});
