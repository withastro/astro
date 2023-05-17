import { expect } from 'chai';
import { createFsWithFallback } from '../test-utils.js';
import { defaultLogging } from '../../test-utils.js';
import { validateConfig } from '../../../dist/core/config/config.js';
import { createSettings } from '../../../dist/core/config/index.js';
import { fileURLToPath } from 'url';
import { sync as _sync } from '../../../dist/core/sync/index.js';

const root = new URL('../../fixtures/content-mixed-errors/', import.meta.url);
const logging = defaultLogging;

async function sync({ fs, config = {} }) {
	const astroConfig = await validateConfig(config, fileURLToPath(root), 'prod');
	const settings = createSettings(astroConfig, fileURLToPath(root));

	return _sync(settings, { logging, fs });
}

describe('Content Collections - mixed content errors', () => {
	it('raises "mixed content" error when content in data collection', async () => {
		const fs = createFsWithFallback(
			{
				'/src/content/authors/ben.md': `---
name: Ben
---

# Ben`,
				'/src/content/authors/tony.json': `{ "name": "Tony" }`,
				'/src/content/config.ts': `
				
					import { z, defineCollection } from 'astro:content';
					
					const authors = defineCollection({
						type: 'data',
						schema: z.object({
							name: z.string(),
						}),
					});
							
					export const collections = { authors };`,
			},
			root
		);

		try {
			await sync({ fs });
			expect.fail(0, 1, 'Expected sync to throw');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.type).to.equal('AstroError');
			expect(e.errorCode).to.equal(9005);
			expect(e.message).to.include('authors');
		}
	});

	it('raises "mixed content" error when data in content collection', async () => {
		const fs = createFsWithFallback(
			{
				'/src/content/blog/post.md': `---
title: Post
---

# Post`,
				'/src/content/blog/post.yaml': `title: YAML Post`,
				'/src/content/config.ts': `
				
					import { z, defineCollection } from 'astro:content';
					
					const blog = defineCollection({
						type: 'content',
						schema: z.object({
							title: z.string(),
						}),
					});
							
					export const collections = { blog };`,
			},
			root
		);

		try {
			await sync({ fs });
			expect.fail(0, 1, 'Expected sync to throw');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.type).to.equal('AstroError');
			expect(e.errorCode).to.equal(9005);
			expect(e.message).to.include('blog');
		}
	});

	it('raises error when data collection configured as content collection', async () => {
		const fs = createFsWithFallback(
			{
				'/src/content/banners/welcome.json': `{ "src": "/example", "alt": "Welcome" }`,
				'/src/content/config.ts': `
				
					import { z, defineCollection } from 'astro:content';
					
					const banners = defineCollection({
						schema: z.object({
							src: z.string(),
							alt: z.string(),
						}),
					});
							
					export const collections = { banners };`,
			},
			root
		);

		try {
			await sync({ fs });
			expect.fail(0, 1, 'Expected sync to throw');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.type).to.equal('AstroError');
			expect(e.errorCode).to.equal(9006);
			expect(e.hint).to.include("Try adding `type: 'data'`");
		}
	});
});
