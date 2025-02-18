// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { google } from '../../../../dist/assets/fonts/providers/google.js';
import * as adobeEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/adobe.js';
import * as bunnyEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/bunny.js';
import * as fontshareEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontshare.js';
import * as fontsourceEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontsource.js';

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
});
