import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type ResolvedConfig, resolveConfig } from 'vite';
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
