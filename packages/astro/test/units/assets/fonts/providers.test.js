// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { google } from '../../../../dist/assets/fonts/providers/google.js';
import {
	LocalFontsWatcher,
	resolveLocalFont,
} from '../../../../dist/assets/fonts/providers/local.js';
import * as adobeEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/adobe.js';
import * as bunnyEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/bunny.js';
import * as fontshareEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontshare.js';
import * as fontsourceEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontsource.js';
import { validateMod, resolveProviders } from '../../../../dist/assets/fonts/providers/utils.js';
import { proxyURL } from '../../../../dist/assets/fonts/utils.js';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {Parameters<typeof resolveLocalFont>[0]} family
 * @param {URL} root
 */
function resolveLocalFontSpy(family, root) {
	/** @type {Array<string>} */
	const values = [];

	const { fonts } = resolveLocalFont(family, {
		proxyURL: (v) =>
			proxyURL({
				value: v,
				hashString: (value) => basename(value, extname(value)),
				collect: ({ hash, value }) => {
					values.push(value);
					return `/_astro/fonts/${hash}`;
				},
			}),
		root,
	});

	return {
		fonts,
		values: [...new Set(values)],
	};
}

describe('fonts providers', () => {
	describe('config objects', () => {
		it('references the right entrypoints', () => {
			assert.equal(
				fontProviders.adobe({ id: '' }).entrypoint,
				'astro/assets/fonts/providers/adobe',
			);
			assert.equal(fontProviders.bunny().entrypoint, 'astro/assets/fonts/providers/bunny');
			assert.equal(fontProviders.fontshare().entrypoint, 'astro/assets/fonts/providers/fontshare');
			assert.equal(
				fontProviders.fontsource().entrypoint,
				'astro/assets/fonts/providers/fontsource',
			);
			assert.equal(google().entrypoint, 'astro/assets/fonts/providers/google');
		});

		it('forwards the config', () => {
			assert.deepStrictEqual(fontProviders.adobe({ id: 'foo' }).config, {
				id: 'foo',
			});
		});
	});

	it('providers are correctly exported', () => {
		assert.equal(
			'provider' in adobeEntrypoint && typeof adobeEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in bunnyEntrypoint && typeof bunnyEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in fontshareEntrypoint && typeof fontshareEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in fontsourceEntrypoint && typeof fontsourceEntrypoint.provider === 'function',
			true,
		);
	});

	it('resolveLocalFont()', () => {
		const root = new URL(import.meta.url);

		let { fonts, values } = resolveLocalFontSpy(
			{
				name: 'Custom',
				provider: 'local',
				src: [
					{
						paths: ['./src/fonts/foo.woff2', './src/fonts/foo.ttf'],
						display: 'block',
					},
				],
			},
			root,
		);

		assert.deepStrictEqual(fonts, [
			{
				weight: '400',
				style: 'normal',
				display: 'block',
				src: [
					{
						originalURL: fileURLToPath(new URL('./src/fonts/foo.woff2', import.meta.url)),
						url: '/_astro/fonts/foo.woff2',
						format: 'woff2',
					},
					{
						originalURL: fileURLToPath(new URL('./src/fonts/foo.ttf', import.meta.url)),
						url: '/_astro/fonts/foo.ttf',
						format: 'ttf',
					},
				],
			},
			{
				weight: '400',
				style: 'italic',
				display: 'block',
				src: [
					{
						originalURL: fileURLToPath(new URL('./src/fonts/foo.woff2', import.meta.url)),
						url: '/_astro/fonts/foo.woff2',
						format: 'woff2',
					},
					{
						originalURL: fileURLToPath(new URL('./src/fonts/foo.ttf', import.meta.url)),
						url: '/_astro/fonts/foo.ttf',
						format: 'ttf',
					},
				],
			},
		]);
		assert.deepStrictEqual(values, [
			fileURLToPath(new URL('./src/fonts/foo.woff2', root)),
			fileURLToPath(new URL('./src/fonts/foo.ttf', root)),
		]);

		({ fonts, values } = resolveLocalFontSpy(
			{
				name: 'Custom',
				provider: 'local',
				src: [
					{
						weights: ['600', '700'],
						styles: ['oblique'],
						paths: ['./src/fonts/bar.eot'],
						stretch: 'condensed',
					},
				],
			},
			root,
		));

		assert.deepStrictEqual(fonts, [
			{
				weight: '600',
				style: 'oblique',
				stretch: 'condensed',
				src: [
					{
						originalURL: fileURLToPath(new URL('./src/fonts/bar.eot', import.meta.url)),
						url: '/_astro/fonts/bar.eot',
						format: 'eot',
					},
				],
			},
			{
				weight: '700',
				style: 'oblique',
				stretch: 'condensed',
				src: [
					{
						originalURL: fileURLToPath(new URL('./src/fonts/bar.eot', import.meta.url)),
						url: '/_astro/fonts/bar.eot',
						format: 'eot',
					},
				],
			},
		]);
		assert.deepStrictEqual(values, [fileURLToPath(new URL('./src/fonts/bar.eot', root))]);
	});

	it('LocalFontsWatcher', () => {
		let updated = 0;
		const watcher = new LocalFontsWatcher({
			paths: ['foo', 'bar'],
			update: () => {
				updated++;
			},
		});

		watcher.onUpdate('baz');
		assert.equal(updated, 0);

		watcher.onUpdate('foo');
		watcher.onUpdate('bar');
		assert.equal(updated, 2);

		assert.doesNotThrow(() => watcher.onUnlink('baz'));
		try {
			watcher.onUnlink('foo');
			assert.fail();
		} catch (err) {
			assert.equal(err instanceof Error, true);
			assert.equal(err.message, 'File used for font deleted. Restore it or update your config');
		}
	});

	describe('utils', () => {
		it('validateMod()', () => {
			const provider = () => {};

			assert.deepStrictEqual(validateMod({ provider }), { provider });

			const invalidMods = [{}, null, () => {}, { provider: {} }, { provider: null }];

			for (const invalidMod of invalidMods) {
				try {
					validateMod(invalidMod);
					assert.fail('This mod should not pass');
				} catch (err) {
					assert.equal(err instanceof Error, true);
				}
			}
		});

		it('resolveProviders()', async () => {
			const root = new URL(import.meta.url);
			const provider = () => {};

			assert.deepStrictEqual(
				await resolveProviders({
					providers: [],
					resolveMod: async () => ({ provider }),
					root,
				}),
				[
					{
						name: 'google',
						config: undefined,
						provider,
					},
				],
			);

			assert.deepStrictEqual(
				await resolveProviders({
					providers: [
						{
							name: 'foo',
							entrypoint: 'bar',
							config: { abc: 404 },
						},
					],
					resolveMod: async () => ({ provider }),
					root,
				}),
				[
					{
						name: 'google',
						config: undefined,
						provider,
					},
					{
						name: 'foo',
						config: { abc: 404 },
						provider,
					},
				],
			);
		});
	});
});
