import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parse as parseDevalue } from 'devalue';
import { fixLineEndings, loadFixture, type Fixture } from './test-utils.ts';
import markdoc from '../dist/index.js';

function formatPost<T extends { body: string }>(post: T): T {
	return {
		...post,
		body: fixLineEndings(post.body),
	};
}

const root = new URL('./fixtures/content-collections/', import.meta.url);

const sortById = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

describe('Markdoc - Content Collections', () => {
	let baseFixture: Fixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('loads entry', async () => {
			const res = await baseFixture.readFile('/entry.json');
			const post = parseDevalue(res);
			assert.deepEqual(formatPost(post), post1Entry);
		});

		it('loads collection', async () => {
			const res = await baseFixture.readFile('/collection.json');
			const posts = parseDevalue(res);
			assert.notEqual(posts, null);
			assert.deepEqual(
				posts.sort(sortById).map((post: { id: string; body: string }) => formatPost(post)),
				[post1Entry, post2Entry, post3Entry],
			);
		});
	});
});

const post1Entry = {
	id: 'post-1',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 1',
	},
	body: '## Post 1\n\nThis is the contents of post 1.',
	deferredRender: true,
	filePath: 'src/content/blog/post-1.mdoc',
	digest: '5d5bd98d949e2b9a',
};

const post2Entry = {
	id: 'post-2',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 2',
	},
	body: '## Post 2\n\nThis is the contents of post 2.',
	deferredRender: true,
	filePath: 'src/content/blog/post-2.mdoc',
	digest: '595af4b93a4af072',
};

const post3Entry = {
	id: 'post-3',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 3',
	},
	body: '## Post 3\n\nThis is the contents of post 3.',
	deferredRender: true,
	filePath: 'src/content/blog/post-3.mdoc',
	digest: 'ef589606e542247e',
};
