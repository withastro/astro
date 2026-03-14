import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { attachContentServerListeners } from '../../../dist/content/index.js';
import { createFixture, runInContainer } from '../test-utils.js';

describe('frontmatter', () => {
	async function createContentFixture() {
		return await createFixture({
			'/src/content/posts/blog.md': `\
					---
					title: One
					---
				`,
			'/src/content.config.ts': `\
					import { defineCollection } from 'astro:content';
					import { z } from 'astro/zod';
					import { glob } from 'astro/loaders';

					const posts = defineCollection({
						loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
						schema: z.string()
					});

					export const collections = {
						posts
					};
				`,
			'/src/pages/index.astro': `\
					---
					---
					<html>
						<head><title>Test</title></head>
						<body class="one">
							<h1>Test</h1>
						</body>
					</html>
				`,
		});
	}

	it('errors in content/ does not crash server', async () => {
		const fixture = await createContentFixture();

		await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
			await attachContentServerListeners(container);

			await fixture.writeFile(
				'/src/content/posts/blog.md',
				`
				---
				title: One
				title: two
				---
				`,
			);
			await new Promise((resolve) => setTimeout(resolve, 100));
			// Note, if we got here, it didn't crash
		});
	});

	it('increases watcher max listeners to avoid startup warnings', async () => {
		const fixture = await createContentFixture();

		await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
			const watcher = container.viteServer.watcher;
			watcher.setMaxListeners(10);

			await attachContentServerListeners(container);

			assert.equal(watcher.getMaxListeners(), 50);
		});
	});
});
