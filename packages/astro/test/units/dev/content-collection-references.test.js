import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	createFixture,
	createRequestAndResponse,
	runInContainerWithContent,
} from '../test-utils.js';

describe('Content Collections - references (unit)', () => {
	it('resolves references between collections', async () => {
		const fixture = await createFixture({
			'/src/content.config.ts': `
import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const authors = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/authors' }),
	schema: z.object({
		name: z.string(),
		twitter: z.string().url(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		author: reference('authors'),
		relatedPosts: z.array(reference('blog')).optional(),
	}),
});

export const collections = { blog, authors };
`,
			'/src/content/authors/alice.yml': `name: Alice Smith\ntwitter: https://twitter.com/alice`,
			'/src/content/authors/bob.yml': `name: Bob Jones\ntwitter: https://twitter.com/bob`,
			'/src/content/blog/hello.md': `---\ntitle: Hello World\nauthor: alice\nrelatedPosts:\n  - second-post\n---\n# Hello`,
			'/src/content/blog/second-post.md': `---\ntitle: Second Post\nauthor: bob\n---\n# Second`,
			'/src/pages/hello-data.json.js': `
import { getEntries, getEntry } from 'astro:content';

export async function GET() {
	const post = await getEntry('blog', 'hello');
	if (!post?.data) {
		return Response.json({ error: 'not found' }, { status: 404 });
	}
	const author = await getEntry(post.data.author);
	const relatedPosts = await getEntries(post.data.relatedPosts ?? []);
	return Response.json({ post: post.data, author: author.data, relatedPosts: relatedPosts.map(p => p.data) });
}
`,
			'/src/pages/hello.astro': `
---
import { getEntries, getEntry } from 'astro:content';
const post = await getEntry('blog', 'hello');
const author = await getEntry(post.data.author);
const relatedPosts = await getEntries(post.data.relatedPosts ?? []);
---
<html><head><title>{post.data.title}</title></head>
<body>
	<h1>{post.data.title}</h1>
	<a data-author href={author.data.twitter}>{author.data.name}</a>
	<ul data-related>
		{relatedPosts.map(p => <li>{p.data.title}</li>)}
	</ul>
</body></html>
`,
		});

		await runInContainerWithContent({ inlineConfig: { root: fixture.path } }, async (container) => {
			// Test JSON endpoint
			{
				const { req, res, text } = createRequestAndResponse({
					method: 'GET',
					url: '/hello-data.json',
				});
				container.handle(req, res);
				const raw = await text();
				const json = JSON.parse(raw);

				assert.equal(json.post.title, 'Hello World');
				assert.equal(json.author.name, 'Alice Smith');
				assert.equal(json.author.twitter, 'https://twitter.com/alice');
				assert.equal(json.relatedPosts.length, 1);
				assert.equal(json.relatedPosts[0].title, 'Second Post');
			}

			// Test rendered page
			{
				const { req, res, text } = createRequestAndResponse({ method: 'GET', url: '/hello' });
				container.handle(req, res);
				const html = await text();
				const $ = cheerio.load(html);

				assert.equal($('h1').text(), 'Hello World');
				assert.equal($('a[data-author]').text(), 'Alice Smith');
				assert.equal($('a[data-author]').attr('href'), 'https://twitter.com/alice');
				assert.equal($('ul[data-related] li').length, 1);
				assert.equal($('ul[data-related] li').text(), 'Second Post');
			}
		});
	});
});
