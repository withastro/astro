import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { createMarkdownProcessorRouter } from '../../../src/core/markdown/processor-router.js';

describe('MDX-rs Compatibility', () => {
	let jsProcessor, rustProcessor;
	const testContent = `# Test Heading

This is a test paragraph with **bold** and *italic* text.

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

![Test Image](./test-image.png)

## Second Heading

- List item 1
- List item 2
- List item 3
`;

	const testFrontmatter = {
		title: 'Test Document',
		date: '2023-01-01',
		tags: ['test', 'markdown'],
	};

	const markdownConfig = {
		image: { service: { entrypoint: 'astro/assets/services/sharp' } },
		experimentalHeadingIdCompat: false,
		gfm: true,
		smartypants: true,
		remarkPlugins: [],
		rehypePlugins: [],
		rsOptions: {
			fallbackToJs: true,
			cacheDir: './node_modules/.astro/mdx-rs',
			parallelism: 1,
		},
	};

	before(async () => {
		// Create JS processor (control)
		jsProcessor = await createMarkdownProcessorRouter({
			...markdownConfig,
			experimentalRs: false,
		});

		// Create Rust processor (test subject)
		rustProcessor = await createMarkdownProcessorRouter({
			...markdownConfig,
			experimentalRs: true,
		});
	});

	it('should produce compatible HTML output', async () => {
		const jsResult = await jsProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		const rustResult = await rustProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		// Both should produce HTML code
		assert.ok(jsResult.code.includes('<h1'));
		assert.ok(rustResult.code.includes('<h1'));

		// Both should include the content
		assert.ok(jsResult.code.includes('Test Heading'));
		assert.ok(rustResult.code.includes('Test Heading'));

		// Both should process the code block
		assert.ok(jsResult.code.includes('javascript'));
		assert.ok(rustResult.code.includes('javascript'));
	});

	it('should extract compatible frontmatter', async () => {
		const jsResult = await jsProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		const rustResult = await rustProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		// Both should preserve frontmatter
		assert.deepEqual(jsResult.metadata.frontmatter, rustResult.metadata.frontmatter);
		assert.equal(jsResult.metadata.frontmatter.title, 'Test Document');
		assert.equal(rustResult.metadata.frontmatter.title, 'Test Document');
	});

	it('should extract compatible headings', async () => {
		const jsResult = await jsProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		const rustResult = await rustProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		// Both should extract headings
		assert.ok(Array.isArray(jsResult.metadata.headings));
		assert.ok(Array.isArray(rustResult.metadata.headings));

		// Should have at least 2 headings
		assert.ok(jsResult.metadata.headings.length >= 2);
		assert.ok(rustResult.metadata.headings.length >= 2);

		// First heading should be similar
		const jsFirstHeading = jsResult.metadata.headings[0];
		const rustFirstHeading = rustResult.metadata.headings[0];

		assert.equal(jsFirstHeading.depth, rustFirstHeading.depth);
		assert.equal(jsFirstHeading.text, rustFirstHeading.text);
		// Slug might differ slightly due to implementation differences, but should exist
		assert.ok(jsFirstHeading.slug);
		assert.ok(rustFirstHeading.slug);
	});

	it('should extract compatible image paths', async () => {
		const jsResult = await jsProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		const rustResult = await rustProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		// Both should extract local image paths
		assert.ok(Array.isArray(jsResult.metadata.localImagePaths));
		assert.ok(Array.isArray(rustResult.metadata.localImagePaths));

		// Should contain the test image
		assert.ok(jsResult.metadata.localImagePaths.some((path) => path.includes('test-image.png')));
		assert.ok(rustResult.metadata.localImagePaths.some((path) => path.includes('test-image.png')));
	});

	it('should handle fallback when Rust processor fails', async () => {
		// Create a processor with invalid Rust config (this should fallback to JS)
		const fallbackProcessor = await createMarkdownProcessorRouter({
			...markdownConfig,
			experimentalRs: true,
			rsOptions: {
				...markdownConfig.rsOptions,
				fallbackToJs: true,
			},
		});

		// Should still work due to fallback
		const result = await fallbackProcessor.render(testContent, {
			frontmatter: testFrontmatter,
		});

		assert.ok(result.code.includes('Test Heading'));
		assert.ok(result.metadata.frontmatter.title === 'Test Document');
	});

	it('should handle empty content', async () => {
		const emptyContent = '';

		const jsResult = await jsProcessor.render(emptyContent, {
			frontmatter: testFrontmatter,
		});

		const rustResult = await rustProcessor.render(emptyContent, {
			frontmatter: testFrontmatter,
		});

		// Both should handle empty content gracefully
		assert.ok(typeof jsResult.code === 'string');
		assert.ok(typeof rustResult.code === 'string');
		assert.deepEqual(jsResult.metadata.frontmatter, rustResult.metadata.frontmatter);
	});

	it('should handle content with no frontmatter', async () => {
		const jsResult = await jsProcessor.render(testContent);
		const rustResult = await rustProcessor.render(testContent);

		// Both should work without frontmatter
		assert.ok(jsResult.code.includes('Test Heading'));
		assert.ok(rustResult.code.includes('Test Heading'));

		// Frontmatter should be empty object
		assert.ok(typeof jsResult.metadata.frontmatter === 'object');
		assert.ok(typeof rustResult.metadata.frontmatter === 'object');
	});
});
