import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMdxProcessor } from '../dist/plugins.js';

describe('MDX Compiler Selection', () => {
	it('should default to JS compiler when no experimental flag is set', async () => {
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
			},
		);

		assert.ok(processor);
		assert.ok(processor.process);
	});

	it('should select rs compiler when mdxCompiler is set to rs', async () => {
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
				logger: {
					info: () => {},
					warn: () => {},
					error: () => {},
				},
			},
		);

		assert.ok(processor);
		assert.ok(processor.process);
	});
});
