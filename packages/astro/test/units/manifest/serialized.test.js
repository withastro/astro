import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	serializedManifestPlugin,
	SERIALIZED_MANIFEST_RESOLVED_ID,
} from '../../../dist/manifest/serialized.js';
import { createBasicSettings } from '../test-utils.js';

/**
 * Invoke the plugin's load handler (as it runs in dev mode) and return the
 * parsed SerializedSSRManifest that is embedded in the generated module code.
 */
async function getManifest(settings) {
	const plugin = serializedManifestPlugin({ settings, command: 'dev', sync: false });
	const load = plugin.load;
	const result = await load.handler.call({}, SERIALIZED_MANIFEST_RESOLVED_ID);
	// The generated code contains: _deserializeManifest((<json>))
	const match = /_deserializeManifest\(\((.+)\)\)/s.exec(result.code);
	assert.ok(match, 'Could not find manifest JSON in plugin output');
	return JSON.parse(match[1]);
}

describe('serializedManifestPlugin - dev mode', () => {
	describe('allowedDomains', () => {
		it('defaults to an empty array when not configured', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.deepEqual(manifest.allowedDomains, []);
		});

		it('is an empty array when configured as []', async () => {
			const settings = await createBasicSettings({
				security: { allowedDomains: [] },
			});
			const manifest = await getManifest(settings);
			assert.deepEqual(manifest.allowedDomains, []);
		});

		it('preserves a single hostname pattern', async () => {
			const pattern = [{ hostname: 'example.com' }];
			const settings = await createBasicSettings({
				security: { allowedDomains: pattern },
			});
			const manifest = await getManifest(settings);
			assert.deepEqual(manifest.allowedDomains, pattern);
		});

		it('preserves multiple patterns with protocol and port', async () => {
			const patterns = [
				{ hostname: '*.example.com', protocol: 'https' },
				{ hostname: 'cdn.example.com', port: '443' },
			];
			const settings = await createBasicSettings({
				security: { allowedDomains: patterns },
			});
			const manifest = await getManifest(settings);
			assert.deepEqual(manifest.allowedDomains, patterns);
		});
	});

	describe('checkOrigin', () => {
		it('is false by default', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(manifest.checkOrigin, false);
		});

		it('is false when checkOrigin=true but buildOutput is not server', async () => {
			const settings = await createBasicSettings({
				security: { checkOrigin: true },
			});
			settings.buildOutput = 'static';
			const manifest = await getManifest(settings);
			assert.equal(manifest.checkOrigin, false);
		});

		it('is true when checkOrigin=true and buildOutput is server', async () => {
			const settings = await createBasicSettings({
				security: { checkOrigin: true },
			});
			settings.buildOutput = 'server';
			const manifest = await getManifest(settings);
			assert.equal(manifest.checkOrigin, true);
		});
	});

	describe('actionBodySizeLimit', () => {
		it('defaults to 1 MB when not configured', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(manifest.actionBodySizeLimit, 1024 * 1024);
		});

		it('uses the configured value', async () => {
			const settings = await createBasicSettings({
				security: { actionBodySizeLimit: 2097152 },
			});
			const manifest = await getManifest(settings);
			assert.equal(manifest.actionBodySizeLimit, 2097152);
		});
	});

	describe('serverIslandBodySizeLimit', () => {
		it('defaults to 1 MB when not configured', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(manifest.serverIslandBodySizeLimit, 1024 * 1024);
		});

		it('uses the configured value', async () => {
			const settings = await createBasicSettings({
				security: { serverIslandBodySizeLimit: 512 },
			});
			const manifest = await getManifest(settings);
			assert.equal(manifest.serverIslandBodySizeLimit, 512);
		});
	});

	describe('serverLike', () => {
		it('is true when buildOutput is server', async () => {
			const settings = await createBasicSettings({});
			settings.buildOutput = 'server';
			const manifest = await getManifest(settings);
			assert.equal(manifest.serverLike, true);
		});

		it('is false when buildOutput is static', async () => {
			const settings = await createBasicSettings({});
			settings.buildOutput = 'static';
			const manifest = await getManifest(settings);
			assert.equal(manifest.serverLike, false);
		});

		it('is false when buildOutput is undefined', async () => {
			const settings = await createBasicSettings({});
			settings.buildOutput = undefined;
			const manifest = await getManifest(settings);
			assert.equal(manifest.serverLike, false);
		});
	});

	describe('trailingSlash', () => {
		for (const value of ['always', 'never', 'ignore']) {
			it(`preserves trailingSlash="${value}"`, async () => {
				const settings = await createBasicSettings({ trailingSlash: value });
				const manifest = await getManifest(settings);
				assert.equal(manifest.trailingSlash, value);
			});
		}
	});

	describe('base', () => {
		it('preserves base="/"', async () => {
			const settings = await createBasicSettings({ base: '/' });
			const manifest = await getManifest(settings);
			assert.equal(manifest.base, '/');
		});

		it('preserves base="/subpath/"', async () => {
			const settings = await createBasicSettings({ base: '/subpath/' });
			const manifest = await getManifest(settings);
			assert.equal(manifest.base, '/subpath/');
		});
	});

	describe('compressHTML', () => {
		it('is true by default', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(manifest.compressHTML, true);
		});

		it('is false when explicitly disabled', async () => {
			const settings = await createBasicSettings({ compressHTML: false });
			const manifest = await getManifest(settings);
			assert.equal(manifest.compressHTML, false);
		});
	});

	describe('i18n', () => {
		it('is undefined when not configured', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(manifest.i18n, undefined);
		});

		it('includes expected fields when configured', async () => {
			const settings = await createBasicSettings({
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'fr'],
					fallback: { fr: 'en' },
				},
			});
			const manifest = await getManifest(settings);
			assert.ok(manifest.i18n, 'i18n should be defined');
			assert.equal(manifest.i18n.defaultLocale, 'en');
			assert.deepEqual(manifest.i18n.locales, ['en', 'fr']);
			assert.deepEqual(manifest.i18n.fallback, { fr: 'en' });
			assert.ok('strategy' in manifest.i18n, 'strategy should be present');
			assert.ok('fallbackType' in manifest.i18n, 'fallbackType should be present');
			assert.ok('domainLookupTable' in manifest.i18n, 'domainLookupTable should be present');
		});
	});

	describe('key', () => {
		it('embeds a non-empty encoded key string', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.ok(typeof manifest.key === 'string' && manifest.key.length > 0);
		});
	});

	describe('directory paths', () => {
		it('serializes directory URLs to strings', async () => {
			const settings = await createBasicSettings({});
			const manifest = await getManifest(settings);
			assert.equal(typeof manifest.rootDir, 'string');
			assert.equal(typeof manifest.srcDir, 'string');
			assert.equal(typeof manifest.outDir, 'string');
			assert.equal(typeof manifest.cacheDir, 'string');
			assert.equal(typeof manifest.publicDir, 'string');
			assert.equal(typeof manifest.buildClientDir, 'string');
			assert.equal(typeof manifest.buildServerDir, 'string');
		});
	});
});
