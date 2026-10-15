import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { satteri } from '../dist/index.js';

const SHARED = { syntaxHighlight: false, shikiConfig: {} } as const;

// A hardcoded `file:///project/src/` has no drive letter, which Windows rejects.
const SRC_DIR_PATH = path.resolve('project', 'src');
const SRC_DIR = pathToFileURL(SRC_DIR_PATH + path.sep);
const PAGE_PATH = path.join(SRC_DIR_PATH, 'pages', 'index.mdx');

describe('satteri createMdxRenderer', () => {
	// Upgrading astro alone reaches this: `@astrojs/mdx` 7.0.x calls it without `srcDir`.
	it('renders when the caller omits `srcDir`', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, { optimize: false } as any);
		const { code } = await renderer.process('# Hello\n\nSome text.\n', PAGE_PATH, {});

		assert.match(code, /MDXContent/);
		assert.doesNotMatch(code, /charset/);
	});

	it('injects the charset for a layout-less page when `srcDir` is passed', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, {
			optimize: false,
			srcDir: SRC_DIR,
		});
		const { code } = await renderer.process('# Hello\n\nSome text.\n', PAGE_PATH, {});

		assert.match(code, /charset/);
	});
});
