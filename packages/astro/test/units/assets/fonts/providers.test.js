// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { resolveLocalFont } from '../../../../dist/assets/fonts/providers/local.js';
import * as adobeEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/adobe.js';
import * as bunnyEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/bunny.js';
import * as fontshareEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontshare.js';
import * as fontsourceEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontsource.js';
import * as googleEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/google.js';
import { validateMod, resolveProvider } from '../../../../dist/assets/fonts/providers/utils.js';
import { proxyURL } from '../../../../dist/assets/fonts/utils.js';
import { basename, extname } from 'node:path';

/**
 * @param {Parameters<resolveLocalFont>[0]['family']} family
 */
function resolveLocalFontSpy(family) {
	/** @type {Array<string>} */
	const values = [];

	const { fonts } = resolveLocalFont({
		family,
		proxyURL: (v) =>
			proxyURL({
				value: v,
				hashString: (value) => basename(value, extname(value)),
				collect: ({ hash, value }) => {
					values.push(value);
					return `/_astro/fonts/${hash}`;
				},
			}),
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
			assert.equal(fontProviders.google().entrypoint, 'astro/assets/fonts/providers/google');
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
		assert.equal(
			'provider' in googleEntrypoint && typeof googleEntrypoint.provider === 'function',
			true,
		);
	});

	it('resolveLocalFont()', () => {
		let { fonts, values } = resolveLocalFontSpy({
			name: 'Custom',
			nameWithHash: 'Custom-xxx',
			cssVariable: '--custom',
			provider: 'local',
			variants: [
				{
					src: [{ url: '/src/fonts/foo.woff2' }, { url: '/src/fonts/foo.ttf' }],
					weight: '400',
					style: 'normal',
					display: 'block',
				},
			],
		});

		assert.deepStrictEqual(fonts, [
			{
				weight: '400',
				style: 'normal',
				display: 'block',
				src: [
					{
						originalURL: '/src/fonts/foo.woff2',
						url: '/_astro/fonts/foo.woff2',
						format: 'woff2',
						tech: undefined,
					},
					{
						originalURL: '/src/fonts/foo.ttf',
						url: '/_astro/fonts/foo.ttf',
						format: 'ttf',
						tech: undefined,
					},
				],
			},
		]);
		assert.deepStrictEqual(values, ['/src/fonts/foo.woff2', '/src/fonts/foo.ttf']);

		({ fonts, values } = resolveLocalFontSpy({
			name: 'Custom',
			nameWithHash: 'Custom-xxx',
			cssVariable: '--custom',
			provider: 'local',
			variants: [
				{
					src: [{ url: '/src/fonts/bar.eot', tech: 'color-SVG' }],
					weight: '600',
					style: 'oblique',
					stretch: 'condensed',
				},
				{
					src: [{ url: '/src/fonts/bar.eot' }],
					weight: '700',
					style: 'oblique',
					stretch: 'condensed',
				},
			],
		}));

		assert.deepStrictEqual(fonts, [
			{
				weight: '600',
				style: 'oblique',
				stretch: 'condensed',
				src: [
					{
						originalURL: '/src/fonts/bar.eot',
						url: '/_astro/fonts/bar.eot',
						format: 'eot',
						tech: 'color-SVG',
					},
				],
			},
			{
				weight: '700',
				style: 'oblique',
				stretch: 'condensed',
				src: [
					{
						originalURL: '/src/fonts/bar.eot',
						url: '/_astro/fonts/bar.eot',
						format: 'eot',
						tech: undefined,
					},
				],
			},
		]);
		assert.deepStrictEqual(values, ['/src/fonts/bar.eot']);
	});

	describe('utils', () => {
		it('validateMod()', () => {
			const provider = () => {};

			assert.deepStrictEqual(validateMod({ provider }, 'custom'), { provider });

			const invalidMods = [{}, null, () => {}, { provider: {} }, { provider: null }];

			for (const invalidMod of invalidMods) {
				try {
					validateMod(invalidMod, 'custom');
					assert.fail('This mod should not pass');
				} catch (err) {
					assert.equal(err instanceof Error, true);
				}
			}
		});

		it('resolveProvider()', async () => {
			const root = new URL(import.meta.url);
			const provider = () => {};

			assert.deepStrictEqual(
				await resolveProvider({
					provider: {
						entrypoint: 'bar',
						config: { abc: 404 },
					},

					resolveMod: async () => ({ provider }),
					root,
				}),
				{
					config: { abc: 404 },
					provider,
				},
			);
		});
	});
});
