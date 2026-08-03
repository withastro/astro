import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fontProviders } from '../../../../dist/config/entrypoint.js';

describe('googleicons glyphs workaround (unifont#336)', () => {
	// The googleicons provider wraps unifont and pre-joins multiple glyphs
	// into a single comma-separated string before passing to unifont. This
	// works around unifont's .join("") bug which concatenates icon names
	// without a separator.
	//
	// We can't fully test the transformation without hitting the network
	// (init() fetches Google's metadata), so we verify that resolveFont
	// handles all option shapes without errors when the provider is
	// uninitialized (returns undefined).

	it('handles multiple glyphs without error', async () => {
		const provider = fontProviders.googleicons();
		const result = await provider.resolveFont({
			familyName: 'Material Symbols Outlined',
			weights: ['400'],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			options: {
				experimental: {
					glyphs: ['add_shopping_cart', 'remove_shopping_cart', 'home'],
				},
			},
		});
		// Without init(), returns undefined — no crash means the patching logic is safe
		assert.equal(result, undefined);
	});

	it('handles single glyph without error', async () => {
		const provider = fontProviders.googleicons();
		const result = await provider.resolveFont({
			familyName: 'Material Symbols Outlined',
			weights: ['400'],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			options: {
				experimental: {
					glyphs: ['add_shopping_cart'],
				},
			},
		});
		assert.equal(result, undefined);
	});

	it('handles undefined options without error', async () => {
		const provider = fontProviders.googleicons();
		const result = await provider.resolveFont({
			familyName: 'Material Symbols Outlined',
			weights: ['400'],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			options: undefined,
		});
		assert.equal(result, undefined);
	});

	it('handles empty glyphs array without error', async () => {
		const provider = fontProviders.googleicons();
		const result = await provider.resolveFont({
			familyName: 'Material Symbols Outlined',
			weights: ['400'],
			styles: ['normal'],
			subsets: ['latin'],
			formats: ['woff2'],
			options: {
				experimental: {
					glyphs: [],
				},
			},
		});
		assert.equal(result, undefined);
	});
});
