import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, type ResolvedConfig, resolveConfig } from 'vite';
import astro, { getAstroApi } from '../dist/index.js';

const root = new URL('./fixtures/', import.meta.url);
const rootPath = fileURLToPath(root);

describe('astro()', () => {
	it('resolves the shared config from its options and the Vite config', async () => {
		const config = await resolveConfig(
			{
				configFile: false,
				logLevel: 'silent',
				root: rootPath,
				base: '/docs/',
				plugins: [astro({ srcDir: './source', site: 'https://example.com' })],
			},
			'serve',
		);
		assert.deepEqual(getAstroApi(config).config, {
			root,
			srcDir: new URL('./source/', root),
			publicDir: new URL('./public/', root),
			base: '/docs/',
			site: 'https://example.com',
			compressHTML: 'jsx',
			trailingSlash: 'ignore',
		});
	});

	it('resolves `root` against the Vite root', async () => {
		const config = await resolveConfig(
			{ configFile: false, logLevel: 'silent', root: rootPath, plugins: [astro({ root: 'app' })] },
			'serve',
		);
		assert.equal(getAstroApi(config).config.root.href, pathToFileURL(`${rootPath}app/`).href);
	});

	it('resolves the shared config before configResolved hooks of plugins listed earlier', async () => {
		let srcDir: URL | undefined;
		const feature = {
			name: 'feature',
			configResolved(config: ResolvedConfig) {
				srcDir = getAstroApi(config).config.srcDir;
			},
		};
		await resolveConfig(
			{ configFile: false, logLevel: 'silent', root: rootPath, plugins: [feature, astro()] },
			'serve',
		);
		assert.equal(srcDir?.href, new URL('./src/', root).href);
	});

	it('exposes renderers and client directives', () => {
		const renderer = { name: 'test', serverEntrypoint: 'test/server.js' };
		const directive = { name: 'click', entrypoint: './click.js' };
		const [plugin] = astro({ renderers: [renderer], clientDirectives: [directive] });
		assert.deepEqual(plugin.api.astro.renderers, [renderer]);
		assert.deepEqual(plugin.api.astro.clientDirectives, [directive]);
	});

	it('applies the dependency fields of renderers to each environment', async () => {
		const renderer = {
			name: 'test',
			serverEntrypoint: 'test/server.js',
			optimizeDeps: {
				client: { include: ['test-client'], exclude: ['test/server.js'] },
				server: { include: ['test-server'] },
			},
			dedupe: ['test-dedupe'],
			noExternal: ['test-no-external'],
		};
		const config = await resolveConfig(
			{
				configFile: false,
				logLevel: 'silent',
				root: rootPath,
				plugins: [astro({ renderers: [renderer] })],
				environments: { workerd: { consumer: 'server', optimizeDeps: { noDiscovery: false } } },
			},
			'serve',
		);
		const { client, ssr, workerd } = config.environments;
		assert.ok(client.optimizeDeps.include?.includes('test-client'));
		assert.ok(client.optimizeDeps.exclude?.includes('test/server.js'));
		assert.ok(client.resolve.dedupe.includes('test-dedupe'));
		assert.equal((client.resolve.noExternal as string[]).includes('test-no-external'), false);
		// `ssr` does not run the dependency optimizer by default.
		assert.equal(ssr.optimizeDeps.include?.includes('test-server'), false);
		assert.ok((ssr.resolve.noExternal as string[]).includes('test-no-external'));
		assert.ok(ssr.resolve.dedupe.includes('test-dedupe'));
		assert.ok(workerd.optimizeDeps.include?.includes('test-server'));
		assert.ok((workerd.resolve.noExternal as string[]).includes('test-no-external'));
	});

	it('serves renderers with their options, without the fields astro() applies itself', async () => {
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-astro-'));
		await fs.writeFile(path.join(projectRoot, 'server.js'), 'export default { name: "test" };\n');
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root: projectRoot,
			server: { middlewareMode: true, ws: false },
			plugins: [
				astro({
					renderers: [
						{
							name: 'test',
							serverEntrypoint: path.join(projectRoot, 'server.js'),
							options: { include: [/\.test\.jsx$/], streaming: false },
							dedupe: ['test-dedupe'],
							devHeadScript: 'window.test = true;',
						},
					],
				}),
			],
		});
		try {
			const { renderers } = await server.ssrLoadModule('virtual:astro:renderers');
			assert.equal(renderers.length, 1);
			const [renderer] = renderers;
			assert.equal(renderer.name, 'test');
			assert.deepEqual(renderer.ssr, { name: 'test' });
			assert.ok(renderer.options.include[0] instanceof RegExp);
			assert.equal(renderer.options.include[0].source, '\\.test\\.jsx$');
			assert.equal(renderer.options.streaming, false);
			assert.equal('dedupe' in renderer, false);
			assert.equal('devHeadScript' in renderer, false);
		} finally {
			await server.close();
			await fs.rm(projectRoot, { recursive: true, force: true });
		}
	});

	it('resolves the runtime for components in a project that does not depend on it', async () => {
		// Outside this package, so the project's own module resolution cannot find `@astrojs/runtime`.
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-astro-'));
		await fs.writeFile(path.join(projectRoot, 'Page.astro'), '<h1>Hello</h1>');
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root: projectRoot,
			server: { middlewareMode: true, ws: false },
			plugins: [astro()],
		});
		try {
			const mod = await server.ssrLoadModule('/Page.astro');
			assert.equal(mod.default.isAstroComponentFactory, true);
		} finally {
			await server.close();
			await fs.rm(projectRoot, { recursive: true, force: true });
		}
	});

	it('renders with renderToString() from @astrojs/runtime in a project outside the workspace', async () => {
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-astro-'));
		// The project depends on `@astrojs/runtime`, the package it imports the render API from.
		await fs.mkdir(path.join(projectRoot, 'node_modules/@astrojs'), { recursive: true });
		await fs.symlink(
			fileURLToPath(new URL('../../runtime/', import.meta.url)),
			path.join(projectRoot, 'node_modules/@astrojs/runtime'),
			'dir',
		);
		await fs.writeFile(path.join(projectRoot, 'Page.astro'), '<h1>Hello {Astro.props.name}</h1>');
		await fs.writeFile(
			path.join(projectRoot, 'render.js'),
			"import { renderToString } from '@astrojs/runtime';\nimport Page from './Page.astro';\nexport const render = () => renderToString(Page, { props: { name: 'Vite' }, partial: true });\n",
		);
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root: projectRoot,
			server: { middlewareMode: true, ws: false },
			plugins: [astro()],
		});
		try {
			const mod = await server.ssrLoadModule('/render.js');
			assert.equal(await mod.render(), '<h1>Hello Vite</h1>');
		} finally {
			await server.close();
			await fs.rm(projectRoot, { recursive: true, force: true });
		}
	});

	it('resolves a renderer entrypoint given as a file URL to the module that components import', async () => {
		const projectRoot = await fs.realpath(
			await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-astro-')),
		);
		await fs.mkdir(path.join(projectRoot, 'node_modules/@astrojs'), { recursive: true });
		await fs.symlink(
			fileURLToPath(new URL('../../runtime/', import.meta.url)),
			path.join(projectRoot, 'node_modules/@astrojs/runtime'),
			'dir',
		);
		// The renderer reports whether the page has set its module state, which it sees only when the
		// file URL, which goes through a symlink, resolves to the same module as the page's import.
		await fs.writeFile(
			path.join(projectRoot, 'renderer.js'),
			"export const state = { fromPage: false };\nexport default { name: 'test', check: () => true, renderToStaticMarkup: () => ({ html: `<p>${state.fromPage}</p>` }) };\n",
		);
		await fs.writeFile(
			path.join(projectRoot, 'Widget.js'),
			'export default function Widget() {}\n',
		);
		await fs.writeFile(
			path.join(projectRoot, 'Page.astro'),
			"---\nimport { state } from './renderer.js';\nimport Widget from './Widget.js';\nstate.fromPage = true;\n---\n<Widget />",
		);
		await fs.writeFile(
			path.join(projectRoot, 'render.js'),
			"import { renderToString } from '@astrojs/runtime';\nimport Page from './Page.astro';\nexport const render = () => renderToString(Page, { partial: true });\n",
		);
		const link = `${projectRoot}-link`;
		await fs.symlink(projectRoot, link, 'dir');
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root: projectRoot,
			server: { middlewareMode: true, ws: false },
			plugins: [
				astro({
					renderers: [
						{ name: 'test', serverEntrypoint: pathToFileURL(path.join(link, 'renderer.js')) },
					],
				}),
			],
		});
		try {
			const mod = await server.ssrLoadModule('/render.js');
			assert.equal(await mod.render(), '<p>true</p>');
		} finally {
			await server.close();
			await fs.rm(link);
			await fs.rm(projectRoot, { recursive: true, force: true });
		}
	});

	it('serves the before-hydration scripts of the astro CLI and leaves out the render API modules', async () => {
		const plugins = astro(
			{},
			{
				compileConfig: {} as any,
				logger: { debug() {} },
				toolbarEnabled: () => false,
				scripts: [
					{ stage: 'before-hydration', content: 'globalThis.before = 1;' },
					{ stage: 'page', content: 'globalThis.page = 1;' },
				],
			},
		);
		const names = plugins.map((plugin) => plugin.name);
		for (const name of [
			'astro:render-setup',
			'astro:client-directives',
			'astro:component-assets',
		]) {
			assert.equal(names.includes(name), false, name);
		}
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root: rootPath,
			server: { middlewareMode: true, ws: false },
			plugins,
		});
		try {
			const result = await server.environments.client.transformRequest(
				'astro:scripts/before-hydration.js',
			);
			assert.match(result!.code, /globalThis\.before = 1/);
			assert.doesNotMatch(result!.code, /globalThis\.page/);
		} finally {
			await server.close();
		}
	});

	it('throws when the config is read before Vite resolves it', () => {
		const [plugin] = astro();
		assert.throws(() => plugin.api.astro.config, /configResolved/);
	});
});

describe('getAstroApi()', () => {
	it('throws when astro() is not registered', async () => {
		const config = await resolveConfig({ configFile: false, logLevel: 'silent' }, 'serve');
		assert.throws(
			() => getAstroApi(config),
			/`astro\(\)` from @astrojs\/vite-plugin-astro is missing/,
		);
	});
});
