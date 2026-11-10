import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createBuilder, createServer, type ViteDevServer } from 'vite';

const root = fileURLToPath(new URL('./fixtures/frameworks/', import.meta.url));
const frameworks = ['react', 'preact', 'solid', 'svelte', 'vue'];

type RenderModule = { render(props: Record<string, any>): Promise<string> };

/** The `renderer-url` of the island whose button has the id `framework`. */
function getRendererUrl(html: string, framework: string): string {
	const island = new RegExp(
		`<astro-island[^>]*renderer-url="([^"]+)"[^>]*>(?:<!--[^>]*-->)*<button[^>]*id="${framework}"[^>]*>${framework} `,
	).exec(html);
	assert.ok(island, `Expected a server-rendered ${framework} island`);
	return island[1];
}

describe('renderers of every framework in dev', () => {
	let server: ViteDevServer;
	let html: string;

	before(async () => {
		server = await createServer({ root, logLevel: 'silent', server: { port: 0 } });
		await server.listen();
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		html = await mod.render({});
	});

	after(async () => {
		await server.close();
	});

	it('server-renders one island per framework, with its client entrypoint', async () => {
		for (const framework of frameworks) {
			const url = getRendererUrl(html, framework);
			const response = await fetch(new URL(url, server.resolvedUrls!.local[0]));
			assert.equal(response.status, 200, url);
			assert.match(response.headers.get('content-type') ?? '', /javascript/, url);
		}
	});

	it('compiles the TypeScript scripts of .astro files next to the JSX plugins', async () => {
		const result = await server.environments.client.transformRequest(
			'/src/components/Page.astro?astro&type=script&index=0&lang.ts',
		);
		assert.match(result?.code ?? '', /frameworks script/);
	});
});

describe('renderers of every framework in a build', () => {
	let html: string;
	const clientDir = new URL('./fixtures/frameworks/dist/client/', import.meta.url);

	before(async () => {
		await fs.rm(new URL('./fixtures/frameworks/dist/', import.meta.url), {
			recursive: true,
			force: true,
		});
		const builder = await createBuilder({ root, logLevel: 'silent' });
		await builder.buildApp();
		const mod: RenderModule = await import(
			new URL('./fixtures/frameworks/dist/server/render.js', import.meta.url).href
		);
		html = await mod.render({});
	});

	it('points the island of each framework at a client build chunk', async () => {
		for (const framework of frameworks) {
			const url = getRendererUrl(html, framework);
			assert.match(url, /^\/assets\/.+\.js$/);
			await fs.access(new URL(`.${url}`, clientDir));
		}
	});
});
