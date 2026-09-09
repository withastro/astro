import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isEndpoint, isPage } from '../../../dist/core/util.js';
import type { AstroSettings } from '../../../dist/types/astro.js';

const root = new URL('file:///project/');
const settings = {
	config: {
		root,
		srcDir: new URL('./src/', root),
	},
	pageExtensions: ['.astro'],
	resolvedInjectedRoutes: [],
} as unknown as AstroSettings;

describe('page directory detection', () => {
	it('detects pages and endpoints inside the pages directory', () => {
		assert.equal(isPage(new URL('pages/index.astro', settings.config.srcDir), settings), true);
		assert.equal(isPage(new URL('pages/blog/post.astro', settings.config.srcDir), settings), true);
		assert.equal(isEndpoint(new URL('pages/api.ts', settings.config.srcDir), settings), true);
		assert.equal(isEndpoint(new URL('pages/index.astro', settings.config.srcDir), settings), false);
	});

	it('rejects files in sibling directories with the same prefix', () => {
		assert.equal(isPage(new URL('pages-old/card.astro', settings.config.srcDir), settings), false);
		assert.equal(isPage(new URL('pages2/card.astro', settings.config.srcDir), settings), false);
		assert.equal(isEndpoint(new URL('pages-old/api.ts', settings.config.srcDir), settings), false);
		assert.equal(isEndpoint(new URL('pages2/api.ts', settings.config.srcDir), settings), false);
	});
});
