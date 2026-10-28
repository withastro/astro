import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import { createBuilder, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import viteSolid from 'vite-plugin-solid';
import solid from '../dist/renderer.js';

const root = new URL('./fixtures/renderer/', import.meta.url);

type RenderModule = { render(): Promise<string> };

const config: InlineConfig = {
	root: fileURLToPath(root),
	configFile: false,
	logLevel: 'silent',
	plugins: [astro({ renderers: [solid()] }), viteSolid({ ssr: true })],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
};

describe('@astrojs/solid-js/renderer: dev', () => {
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

	it('server-renders islands that hydrate with the Solid client entrypoint', async () => {
		const html = await render();
		assert.match(html, /<astro-island[^>]*><button[^>]*>count: <!--\$-->3<!--\/-->/);
		assert.match(html, /<astro-island[^>]*renderer-url="[^"]*solid\/dist\/client\.js"/);
	});

	it('bundles the Solid libraries among the dependencies of the project', async () => {
		const noExternal = server.environments.ssr.config.resolve.noExternal;
		assert.ok(Array.isArray(noExternal) && noExternal.includes('@test/solid-renderer-lib'));
		assert.match(await render(), /<p[^>]*>hello <!--\$-->lib<!--\/--><\/p>/);
	});
});

describe('@astrojs/solid-js/renderer: build', () => {
	let html: string;

	before(async () => {
		await fs.rm(new URL('./dist/', root), { recursive: true, force: true });
		const builder = await createBuilder(config);
		await builder.buildApp();
		const mod: RenderModule = await import(new URL('./dist/server/render.js', root).href);
		html = await mod.render();
	});

	it('points islands at client build chunks', async () => {
		assert.match(html, /<p[^>]*>hello <!--\$-->lib<!--\/--><\/p>/);
		const rendererUrl = /renderer-url="([^"]+)"/.exec(html)?.[1];
		assert.match(rendererUrl ?? '', /^\/assets\/.+\.js$/);
		await fs.access(new URL(`./dist/client${rendererUrl}`, root));
	});
});
