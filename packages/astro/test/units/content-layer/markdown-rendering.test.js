import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { defineCollection } from '../../../dist/content/config.js';
import { z } from 'zod';
import {
	createTempDir,
	createTestConfigObserver,
	createMinimalSettings,
	parseSimpleMarkdownFrontmatter,
} from './test-helpers.js';

describe('Content Layer - Markdown Rendering', () => {
	// Create a real temp directory for tests
	const root = createTempDir();

	it('renders markdown content through ContentLayer', async () => {
		const store = new MutableDataStore();

		// Inline loader with markdown content
		const markdownLoader = {
			name: 'test-markdown-loader',
			load: async (context) => {
				const posts = [
					{
						id: 'post-1',
						content: `---
title: Test Post
description: This is a test post
tags: ["astro", "testing"]
publishedDate: 2024-01-15
---

# Hello World

This is the post content with **bold** and *italic* text.`,
					},
					{
						id: 'post-2',
						content: `---
title: Another Post
publishedDate: 2024-01-20
---

## Another Title

Content with [a link](https://astro.build).`,
					},
				];

				for (const post of posts) {
					// Parse the markdown content
					const { data, body } = parseSimpleMarkdownFrontmatter(post.content, post.id);

					// Parse data through the schema
					const parsedData = await context.parseData({
						id: post.id,
						data,
					});

					await context.store.set({
						id: post.id,
						data: parsedData,
						body,
					});
				}
			},
		};

		// Define collections
		const collections = {
			posts: defineCollection({
				loader: markdownLoader,
				schema: z.object({
					title: z.string(),
					description: z.string().optional(),
					tags: z.array(z.string()).optional(),
					publishedDate: z.coerce.date(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Create ContentLayer with test config observer
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		// Verify markdown was processed
		const post1 = store.get('posts', 'post-1');
		assert.ok(post1);
		assert.equal(post1.data.title, 'Test Post');
		assert.equal(post1.data.description, 'This is a test post');
		assert.deepEqual(post1.data.tags, ['astro', 'testing']);
		assert.ok(post1.data.publishedDate instanceof Date);
		assert.ok(post1.body);
		assert.ok(post1.body.includes('# Hello World'));

		const post2 = store.get('posts', 'post-2');
		assert.ok(post2);
		assert.equal(post2.data.title, 'Another Post');
		assert.ok(post2.data.publishedDate instanceof Date);
		assert.ok(post2.body);
		assert.ok(post2.body.includes('## Another Title'));
	});

	it('renders markdown content with loader renderMarkdown', async () => {
		const store = new MutableDataStore();

		// Custom loader that uses renderMarkdown
		const customMarkdownLoader = {
			name: 'custom-markdown-loader',
			load: async (context) => {
				const markdownContent = `---
title: Rendered Post
author: Test Author
---

# Rendered Content

This content is processed by the loader using renderMarkdown.

- List item 1
- List item 2`;

				// Use the renderMarkdown function from context
				const rendered = await context.renderMarkdown(markdownContent, {
					fileURL: new URL('test.md', root),
				});

				await context.store.set({
					id: 'rendered-post',
					data: {
						title: 'Rendered Post',
						author: 'Test Author',
					},
					body: markdownContent,
					rendered: {
						html: rendered.html,
						metadata: rendered.metadata,
					},
				});
			},
		};

		const collections = {
			custom: defineCollection({
				loader: customMarkdownLoader,
				schema: z.object({
					title: z.string(),
					author: z.string(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check that markdown was rendered
		const entry = store.get('custom', 'rendered-post');
		assert.ok(entry);
		assert.ok(entry.rendered);
		assert.ok(entry.rendered.html);
		// Check for heading - might have id attribute
		assert.ok(
			entry.rendered.html.includes('Rendered Content') && entry.rendered.html.includes('h1'),
		);
		// Check for list items
		assert.ok(entry.rendered.html.includes('List item 1'));
		assert.ok(entry.rendered.metadata);
	});

	it('preserves markdown headings metadata', async () => {
		const store = new MutableDataStore();

		const customLoader = {
			name: 'headings-test-loader',
			load: async (context) => {
				const content = `---
title: Headings Test
---

# Main Title

Some intro text.

## Section 1

Section 1 content.

### Subsection 1.1

More details.

## Section 2

Section 2 content.`;

				const rendered = await context.renderMarkdown(content);

				await context.store.set({
					id: 'headings-test',
					data: { title: 'Headings Test' },
					rendered: {
						html: rendered.html,
						metadata: rendered.metadata,
					},
				});
			},
		};

		const collections = {
			headings: defineCollection({
				loader: customLoader,
			}),
		};

		const settings = createMinimalSettings(root);

		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('headings', 'headings-test');
		assert.ok(entry);
		assert.ok(entry.rendered);
		assert.ok(entry.rendered.metadata);
		assert.ok(entry.rendered.metadata.headings);
		assert.ok(Array.isArray(entry.rendered.metadata.headings));

		const headings = entry.rendered.metadata.headings;
		assert.ok(headings.length >= 4);

		// Check heading structure
		const h1 = headings.find((h) => h.depth === 1);
		assert.ok(h1);
		assert.equal(h1.text, 'Main Title');

		const h2s = headings.filter((h) => h.depth === 2);
		assert.ok(h2s.length >= 2);
	});

	it('handles markdown with no frontmatter', async () => {
		const store = new MutableDataStore();

		const noFrontmatterLoader = {
			name: 'no-frontmatter-loader',
			load: async (context) => {
				const content = `# Just Markdown

This file has no frontmatter, just content.`;

				// Parse content - should handle no frontmatter gracefully
				const { data, body } = parseSimpleMarkdownFrontmatter(content, 'plain');

				await context.store.set({
					id: 'plain',
					data,
					body,
				});
			},
		};

		const collections = {
			noFrontmatter: defineCollection({
				loader: noFrontmatterLoader,
			}),
		};

		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('noFrontmatter', 'plain');
		assert.ok(entry);
		assert.ok(entry.body);
		assert.ok(entry.body.includes('# Just Markdown'));
		assert.ok(entry.body.includes('This file has no frontmatter'));
	});

	it('handles complex markdown with code blocks', async () => {
		const store = new MutableDataStore();

		const customLoader = {
			name: 'code-test-loader',
			load: async (context) => {
				const content = `---
title: Code Examples
---

# Code Examples

Here's some JavaScript:

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

And some inline code: \`const x = 42\`.`;

				const rendered = await context.renderMarkdown(content);

				await context.store.set({
					id: 'code-test',
					data: { title: 'Code Examples' },
					rendered: {
						html: rendered.html,
						metadata: rendered.metadata,
					},
				});
			},
		};

		const collections = {
			code: defineCollection({
				loader: customLoader,
			}),
		};

		const settings = createMinimalSettings(root, {
			config: {
				markdown: {
					syntaxHighlight: 'shiki',
					shikiConfig: {
						theme: 'github-dark',
					},
				},
			},
		});

		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('code', 'code-test');
		assert.ok(entry);
		assert.ok(entry.rendered);
		assert.ok(entry.rendered.html);
		// Should have code block elements
		assert.ok(entry.rendered.html.includes('<pre') || entry.rendered.html.includes('<code'));
		// Should have the function content
		assert.ok(entry.rendered.html.includes('hello') || entry.rendered.html.includes('function'));
	});

	it('renderMarkdown parses frontmatter correctly through loader', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const frontmatterTestLoader = {
			name: 'frontmatter-test-loader',
			load: async (context) => {
				const markdownWithFrontmatter = `---
title: Test Post
description: A test post for renderMarkdown
tags:
  - test
  - markdown
---

# Hello World

This is the body content.

## Subheading

More content here.`;

				const result = await context.renderMarkdown(markdownWithFrontmatter, {
					fileURL: new URL('test.md', root),
				});

				// Store the frontmatter data that was parsed
				const parsed = await context.parseData({
					id: 'frontmatter-test',
					data: {
						...result.metadata.frontmatter,
						rendered: true,
					},
				});

				await context.store.set({
					id: 'frontmatter-test',
					data: parsed,
					body: markdownWithFrontmatter,
				});
			},
		};

		const collections = {
			frontmatterTest: defineCollection({
				loader: frontmatterTestLoader,
				schema: z.object({
					title: z.string(),
					description: z.string(),
					tags: z.array(z.string()),
					rendered: z.boolean(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('frontmatterTest', 'frontmatter-test');
		assert.ok(entry);
		assert.equal(entry.data.title, 'Test Post');
		assert.equal(entry.data.description, 'A test post for renderMarkdown');
		assert.deepEqual(entry.data.tags, ['test', 'markdown']);
	});

	it('renderMarkdown excludes frontmatter from HTML output through loader', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const htmlTestLoader = {
			name: 'html-test-loader',
			load: async (context) => {
				const markdownWithFrontmatter = `---
title: Test Post
---

# Hello World`;

				const result = await context.renderMarkdown(markdownWithFrontmatter, {
					fileURL: new URL('test.md', root),
				});

				await context.store.set({
					id: 'html-test',
					data: {
						html: result.html,
						title: result.metadata.frontmatter.title || 'No title',
					},
				});
			},
		};

		const collections = {
			htmlTest: defineCollection({
				loader: htmlTestLoader,
				schema: z.object({
					html: z.string(),
					title: z.string(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('htmlTest', 'html-test');
		assert.ok(entry);
		// HTML should not contain frontmatter
		assert.ok(!entry.data.html.includes('title:'));
		assert.ok(!entry.data.html.includes('Test Post'));
		// But should contain the rendered content
		assert.ok(entry.data.html.includes('Hello World'));
		// And we should have access to the frontmatter data separately
		assert.equal(entry.data.title, 'Test Post');
	});

	it('renderMarkdown extracts headings correctly through loader', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const headingsTestLoader = {
			name: 'headings-test-loader',
			load: async (context) => {
				const markdown = `# Heading 1
Some text

## Heading 2
More text

### Heading 3
Even more text

## Another Heading 2`;

				const result = await context.renderMarkdown(markdown, {
					fileURL: new URL('test.md', root),
				});

				// Extract heading information
				const headings = result.metadata.headings.map((h) => ({
					depth: h.depth,
					text: h.text,
				}));

				await context.store.set({
					id: 'headings-test',
					data: {
						headingCount: result.metadata.headings.length,
						headings: headings,
					},
				});
			},
		};

		const collections = {
			headingsTest: defineCollection({
				loader: headingsTestLoader,
				schema: z.object({
					headingCount: z.number(),
					headings: z.array(
						z.object({
							depth: z.number(),
							text: z.string(),
						}),
					),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('headingsTest', 'headings-test');
		assert.ok(entry);
		assert.equal(entry.data.headingCount, 4);
		assert.deepEqual(entry.data.headings, [
			{ depth: 1, text: 'Heading 1' },
			{ depth: 2, text: 'Heading 2' },
			{ depth: 3, text: 'Heading 3' },
			{ depth: 2, text: 'Another Heading 2' },
		]);
	});

	it('renderMarkdown resolves relative image paths through loader', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const imageTestLoader = {
			name: 'image-test-loader',
			load: async (context) => {
				const markdownWithImage = `# Post with Image

![Local image](./image.png)
![Remote image](https://example.com/image.png)`;

				const fileURL = new URL('./virtual-post.md', root);
				const result = await context.renderMarkdown(markdownWithImage, {
					fileURL,
				});

				await context.store.set({
					id: 'image-test',
					data: {
						localImages: result.metadata.localImagePaths || [],
						remoteImages: result.metadata.remoteImagePaths || [],
						hasImages: true,
					},
				});
			},
		};

		const collections = {
			imageTest: defineCollection({
				loader: imageTestLoader,
				schema: z.object({
					localImages: z.array(z.string()),
					remoteImages: z.array(z.string()),
					hasImages: z.boolean(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entry = store.get('imageTest', 'image-test');
		assert.ok(entry);
		assert.ok(entry.data.hasImages);
		assert.equal(entry.data.localImages.length, 1);
		assert.equal(entry.data.localImages[0], './image.png');
		assert.equal(entry.data.remoteImages.length, 0); // Remote images are not tracked in localImagePaths
	});
});
