import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { normalizeFilename } from '../../../dist/vite-plugin-utils/index.js';

// Build a fixture path that is absolute on both POSIX and Windows. On POSIX,
// `path.resolve('/Users/me/project')` is `/Users/me/project`; on Windows it
// becomes something like `D:\\Users\\me\\project` (the CWD drive gets
// prepended). Using this lets tests that pass the resolved path to Node's URL
// machinery behave identically on both platforms.
const projectRoot = path.resolve('/Users/me/project');
const projectRootUrl = pathToFileURL(projectRoot + path.sep);
// `normalizeFilename` returns paths with forward slashes (it runs the result
// through `viteID`/`slash`), so build expectations the same way.
const projectRootSlash = projectRoot.replaceAll(path.sep, '/');

describe('normalizeFilename', () => {
	it('strips the /@fs prefix from filesystem paths', () => {
		const root = pathToFileURL('/Users/me/project/');
		const result = normalizeFilename('/@fs/Users/me/project/src/pages/index.astro', root);
		assert.equal(result, '/Users/me/project/src/pages/index.astro');
	});

	it('resolves relative paths against root', () => {
		const result = normalizeFilename('./src/components/Foo.astro', projectRootUrl);
		assert.equal(result, `${projectRootSlash}/src/components/Foo.astro`);
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
