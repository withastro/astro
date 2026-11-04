import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import viteVue from '@vitejs/plugin-vue';
import { createBuilder, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import vue from '../dist/renderer.js';

const root = new URL('./fixtures/renderer/', import.meta.url);

type RenderModule = { render(): Promise<string>; renderPlain(): Promise<string> };

const config: InlineConfig = {
	root: fileURLToPath(root),
	configFile: false,
	logLevel: 'silent',
	plugins: [astro({ renderers: [vue({ appEntrypoint: './src/app.js' })] }), viteVue()],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
};

describe('@astrojs/vue/renderer: dev', () => {
	let server: ViteDevServer;
	let mod: RenderModule;

	before(async () => {
		server = await createServer({ ...config, server: { port: 0 } });
		await server.listen();
		mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
	});

	after(async () => {
		await server.close();
	});

	it('server-renders islands that hydrate with the Vue client entrypoint', async () => {
		const html = await mod.render();
		assert.match(html, /<astro-island[^>]*><!--\[--><button>count: 3<\/button>/);
		assert.match(html, /<astro-island[^>]*renderer-url="[^"]*vue\/dist\/client\.js"/);
	});

	it('sets up the app with the appEntrypoint', async () => {
		assert.match(await mod.render(), /<p>hello from the app entrypoint<\/p>/);
	});

	it('collects the styles of the appEntrypoint with the Vue components', async () => {
		assert.match(await mod.render(), /<style[^>]*>:root \{ background-color: red; \}/);
		assert.equal((await mod.renderPlain()).includes('background-color'), false);
	});

	it('serves the appEntrypoint to the client entrypoint', async () => {
		const response = await fetch(
			new URL(
				'/@id/__x00__virtual:astro:app-entrypoint/@astrojs/vue',
				server.resolvedUrls!.local[0],
			),
		);
		assert.match(await response.text(), /import\("[^"]*\/src\/app\.js"\)/);
	});
});

describe('@astrojs/vue/renderer: build', () => {
	let html: string;
	let plain: string;

	before(async () => {
		await fs.rm(new URL('./dist/', root), { recursive: true, force: true });
		const builder = await createBuilder(config);
		await builder.buildApp();
		const mod: RenderModule = await import(new URL('./dist/server/render.js', root).href);
		html = await mod.render();
		plain = await mod.renderPlain();
	});

	it('sets up the app and links the styles of the appEntrypoint', async () => {
		assert.match(html, /<p>hello from the app entrypoint<\/p>/);
		const hrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
		const css = await Promise.all(
			hrefs.map((href) => fs.readFile(new URL(`./dist/client${href}`, root), 'utf-8')),
		);
		assert.match(css.join('\n'), /:root\{background-color:red\}/);
		assert.equal(plain.includes('stylesheet'), false);
	});

	it('points islands at client build chunks', async () => {
		const rendererUrl = /renderer-url="([^"]+)"/.exec(html)?.[1];
		assert.match(rendererUrl ?? '', /^\/assets\/.+\.js$/);
		await fs.access(new URL(`./dist/client${rendererUrl}`, root));
	});
});
