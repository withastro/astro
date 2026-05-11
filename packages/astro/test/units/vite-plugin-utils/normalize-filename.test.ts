import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { normalizeFilename } from '../../../dist/vite-plugin-utils/index.js';

describe('normalizeFilename', () => {
	it('strips the /@fs prefix from filesystem paths', () => {
		const root = pathToFileURL('/Users/me/project/');
		const result = normalizeFilename('/@fs/Users/me/project/src/pages/index.astro', root);
		assert.equal(result, '/Users/me/project/src/pages/index.astro');
	});

	it('resolves relative paths against root', () => {
		const root = pathToFileURL('/Users/me/project/');
		const result = normalizeFilename('./src/components/Foo.astro', root);
		assert.equal(result, '/Users/me/project/src/components/Foo.astro');
	});

	it('resolves server-relative ids against root', () => {
		const root = pathToFileURL('/Users/me/project/');
		const result = normalizeFilename('/src/pages/index.astro', root);
		assert.equal(result, '/Users/me/project/src/pages/index.astro');
	});

	it('preserves absolute paths that live inside root', () => {
		const root = pathToFileURL('/Users/me/project/');
		const result = normalizeFilename('/Users/me/project/src/pages/index.astro', root);
		assert.equal(result, '/Users/me/project/src/pages/index.astro');
	});

	it('preserves absolute paths when their case differs from root (issue #14013)', () => {
		// Reproduces the case-insensitive filesystem scenario (Windows or macOS) where
		// the user starts the dev server from a path whose case differs from disk.
		// `root` comes from process.cwd() with one case, but Vite resolves modules with
		// the canonical filesystem case. The two must still be treated as the same path.
		const root = pathToFileURL('/users/me/project/');
		const result = normalizeFilename('/Users/me/project/src/pages/index.astro', root);
		assert.equal(result, '/Users/me/project/src/pages/index.astro');
	});
});
