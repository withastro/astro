// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { google } from '../../../../dist/assets/fonts/providers/google.js';
import * as adobeEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/adobe.js';
import * as bunnyEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/bunny.js';
import * as fontshareEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontshare.js';
import * as fontsourceEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontsource.js';
import { validateMod, resolveProviders } from '../../../../dist/assets/fonts/providers/utils.js';

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

	describe('entrypoints', () => {
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
	});

	// TODO: test local provider
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
			const root = new URL('file:///foo/');
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
