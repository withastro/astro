import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { satteri } from '../dist/index.js';

const SHARED = { syntaxHighlight: false, shikiConfig: {} } as const;

describe('satteri createMdxRenderer', () => {
	// Upgrading astro alone reaches this: `@astrojs/mdx` 7.0.x calls it without `srcDir`.
	it('renders when the caller omits `srcDir`', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, { optimize: false } as any);
		const { code } = await renderer.process(
			'# Hello\n\nSome text.\n',
			'/project/src/pages/index.mdx',
			{},
		);

		assert.match(code, /MDXContent/);
		assert.doesNotMatch(code, /charset/);
	});

	it('injects the charset for a layout-less page when `srcDir` is passed', async () => {
		const renderer = await satteri().createMdxRenderer!(SHARED, {
			optimize: false,
			srcDir: new URL('file:///project/src/'),
		});
		const { code } = await renderer.process(
			'# Hello\n\nSome text.\n',
			'/project/src/pages/index.mdx',
			{},
		);

		assert.match(code, /charset/);
	});
});
