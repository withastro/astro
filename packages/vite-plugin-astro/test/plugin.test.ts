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
