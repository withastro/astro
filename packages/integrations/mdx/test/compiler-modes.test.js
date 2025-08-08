import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMdxProcessor } from '../dist/plugins.js';

describe('MDX Compiler Modes', () => {
	const mockLogger = {
		info: () => {},
		warn: () => {},
		error: () => {},
	};

	it('should support rs mode (Rust compiler) in configuration', async () => {
		// RS mode uses Rust compiler (falls back to JS if not available)
		const processor = await createMdxProcessor(
			{
				remarkPlugins: [],
				rehypePlugins: [],
				recmaPlugins: [],
				gfm: true,
				smartypants: true,
			},
			{
				sourcemap: false,
				experimentalHeadingIdCompat: false,
				config: {
					experimental: {
						mdxCompiler: 'rs',
					},
				},
				logger: mockLogger,
			},
		);

		assert.ok(processor);
		assert.ok(processor.process);
	});

	it('should handle plugins in rs mode', async () => {
		// With plugins, rs mode uses AST bridge for performance
		const processor = await createMdxProcessor(
			{
				remarkPlugins: [() => (tree) => tree],
				rehypePlugins: [],
				recmaPlugins: [],
				gfm: true,
				smartypants: true,
			},
			{
				sourcemap: false,
				experimentalHeadingIdCompat: false,
				config: {
					experimental: {
						mdxCompiler: 'rs',
					},
				},
				logger: mockLogger,
			},
		);

		assert.ok(processor);
		assert.ok(processor.process);
	});

	it('should process MDX content successfully', async () => {
		const processor = await createMdxProcessor(
			{
				remarkPlugins: [],
				rehypePlugins: [],
				recmaPlugins: [],
				gfm: true,
				smartypants: true,
			},
			{
				sourcemap: false,
				experimentalHeadingIdCompat: false,
				config: {
					experimental: {
						mdxCompiler: 'js', // Use JS as baseline
					},
				},
				logger: mockLogger,
			},
		);

		const result = await processor.process({
			value: '# Hello\n\nThis is **MDX**',
			path: 'test.mdx',
			data: { astro: { frontmatter: {} } },
		});

		assert.ok(result);
		assert.ok(result.value);
		assert.ok(result.value.includes('Hello'));
	});
});
