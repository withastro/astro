import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import { createBuilder, type Plugin, type PluginOption, type Rolldown } from 'vite';
import router, { type RouterPluginOptions } from '../dist/index.js';

// Plugin order must not matter: `astro()` has a `buildApp` hook of its own.
const orders: Record<string, (options?: RouterPluginOptions) => PluginOption[]> = {
	'router() first': (options) => [router(options), astro()],
	'astro() first': (options) => [astro(), router(options)],
};

interface BuildOptions {
	plugins?: Plugin[];
	routerOptions?: RouterPluginOptions;
	/** Prefix of the output directory, for builds of the same fixture with other options. */
	outDirPrefix?: string;
}

async function build(
	fixture: string,
	order: string,
	{ plugins = [], routerOptions, outDirPrefix = '' }: BuildOptions = {},
): Promise<URL> {
	const root = new URL(`./fixtures/${fixture}/`, import.meta.url);
	const outDir = `dist/${outDirPrefix}${order.split('(')[0]}-first/`;
	const builder = await createBuilder({
		root: fileURLToPath(root),
		configFile: false,
		logLevel: 'silent',
		plugins: [...orders[order](routerOptions), ...plugins],
		build: { outDir },
	});
	await builder.buildApp();
	return new URL(outDir, root);
}

function read(dir: URL, path: string): string {
	return fs.readFileSync(new URL(path, dir), 'utf-8');
}

for (const order of Object.keys(orders)) {
	describe(`router() in plain Vite: static build, ${order}`, () => {
		let dist: URL;

		before(async () => {
			dist = await build('basic', order);
		});

		it('writes the pages and the paths of getStaticPaths()', () => {
			assert.match(read(dist, 'index.html'), /<h1>Home<\/h1>/);
			assert.match(read(dist, 'blog/first/index.html'), /<h1>Post first<\/h1>/);
			assert.match(read(dist, 'blog/second/index.html'), /<h1>Post second<\/h1>/);
			assert.match(read(dist, '404.html'), /<h1>Not found<\/h1>/);
		});

		it('writes endpoints', () => {
			assert.deepEqual(JSON.parse(read(dist, 'data.json')), { ok: true });
		});

		it('leaves no server output behind', () => {
			assert.equal(fs.existsSync(new URL('.prerender/', dist)), false);
			assert.equal(fs.existsSync(new URL('server/', dist)), false);
		});
	});

	describe(`router() in plain Vite: server build, ${order}`, () => {
		let dist: URL;
		let handler: {
			fetch(request: Request): Promise<Response>;
			match(request: Request): boolean;
		};
		let serverOutputOptions: Rolldown.OutputOptions | undefined;
		const serverChunks: Rolldown.OutputChunk[] = [];

		before(async () => {
			const collectServerChunks: Plugin = {
				name: 'collect-server-chunks',
				applyToEnvironment: (environment) => environment.name === 'ssr',
				outputOptions(options) {
					serverOutputOptions = options;
				},
				generateBundle(_options, bundle) {
					for (const output of Object.values(bundle)) {
						if (output.type === 'chunk') serverChunks.push(output);
					}
				},
			};
			dist = await build('server-output', order, { plugins: [collectServerChunks] });
			handler = (await import(new URL('server/entry.mjs', dist).href)).default;
		});

		it('prerenders the static pages into the client directory', () => {
			assert.match(read(dist, 'client/index.html'), /<h1>Static<\/h1>/);
			assert.match(read(dist, 'client/404.html'), /<h1>Not found<\/h1>/);
		});

		it('renders on-demand pages through middleware from the server entry', async () => {
			const response = await handler.fetch(new Request('http://localhost/greet?name=Vite'));
			assert.equal(response.status, 200);
			assert.equal(response.headers.get('x-middleware'), 'yes');
			assert.match(await response.text(), /<h1>Hello Vite<\/h1>/);
		});

		it('serves on-demand endpoints from the server entry', async () => {
			const response = await handler.fetch(
				new Request('http://localhost/api/echo', { method: 'POST', body: 'hi' }),
			);
			assert.equal(response.status, 200);
			assert.deepEqual(await response.json(), { echo: 'hi' });
		});

		it('keeps pages lazy: the server entry does not import page chunks statically', () => {
			const entry = serverChunks.find((chunk) => chunk.fileName === 'entry.mjs');
			assert.ok(entry);
			const pageChunks = serverChunks.filter((chunk) =>
				chunk.facadeModuleId?.startsWith('\0virtual:astro:page:'),
			);
			assert.ok(pageChunks.length > 0);
			for (const page of pageChunks) {
				assert.equal(entry.imports.includes(page.fileName), false, page.fileName);
			}
			// Rolldown can merge its runtime helpers into a page chunk, which the entry then imports
			// statically; wrapping modules keeps them evaluating in source order.
			assert.equal(serverOutputOptions?.strictExecutionOrder, true);
		});

		it('does not render prerendered pages on demand', async () => {
			const response = await handler.fetch(new Request('http://localhost/'));
			assert.equal(response.status, 404);
		});

		it('matches only on-demand routes', () => {
			assert.equal(handler.match(new Request('http://localhost/greet')), true);
			assert.equal(handler.match(new Request('http://localhost/api/echo')), true);
			assert.equal(handler.match(new Request('http://localhost/')), false);
			assert.equal(handler.match(new Request('http://localhost/missing')), false);
		});
	});

	describe(`router() in plain Vite: custom server entry, ${order}`, () => {
		let handler: { fetch(request: Request): Promise<Response> };

		before(async () => {
			const dist = await build('server-output', order, {
				outDirPrefix: 'custom-entry-',
				routerOptions: {
					redirects: { '/old': '/greet' },
					serverOutput: {
						entrypoint: new URL('./fixtures/server-output/src/server.ts', import.meta.url),
					},
				},
			});
			handler = (await import(new URL('server/entry.mjs', dist).href)).default;
		});

		it('hands matched requests to the Astro app', async () => {
			const response = await handler.fetch(new Request('http://localhost/greet?name=Vite'));
			assert.equal(response.status, 200);
			assert.match(await response.text(), /<h1>Hello Vite<\/h1>/);
		});

		it('matches redirects', async () => {
			const response = await handler.fetch(new Request('http://localhost/old'));
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('location'), '/greet');
		});

		it('leaves unknown and prerendered paths to the other server', async () => {
			for (const path of ['/missing', '/']) {
				const response = await handler.fetch(new Request(`http://localhost${path}`));
				assert.equal(response.status, 418, path);
			}
		});
	});
}
