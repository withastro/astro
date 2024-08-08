import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parse as parseDevalue } from 'devalue';
import { fixLineEndings, loadFixture } from '../../../astro/test/test-utils.js';
import markdoc from '../dist/index.js';

function formatPost(post) {
	return {
		...post,
		body: fixLineEndings(post.body),
	};
}

const root = new URL('./fixtures/content-collections/', import.meta.url);

describe('Markdoc - Content Collections', () => {
	let baseFixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await baseFixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('loads entry', async () => {
			const res = await baseFixture.fetch('/entry.json');
			const post = parseDevalue(await res.text());
			assert.deepEqual(formatPost(post), post1Entry);
		});

		it('loads collection', async () => {
			const res = await baseFixture.fetch('/collection.json');
			const posts = parseDevalue(await res.text());
			assert.notEqual(posts, null);

			assert.deepEqual(
				posts.sort().map((post) => formatPost(post)),
				[post1Entry, post2Entry, post3Entry],
			);
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
				posts.sort().map((post) => formatPost(post)),
				[post1Entry, post2Entry, post3Entry],
			);
		});
	});
});

const post1Entry = {
	id: 'post-1.mdoc',
	slug: 'post-1',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 1',
	},
	body: '\n## Post 1\n\nThis is the contents of post 1.\n',
};

const post2Entry = {
	id: 'post-2.mdoc',
	slug: 'post-2',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 2',
	},
	body: '\n## Post 2\n\nThis is the contents of post 2.\n',
};

const post3Entry = {
	id: 'post-3.mdoc',
	slug: 'post-3',
	collection: 'blog',
	data: {
		schemaWorks: true,
		title: 'Post 3',
	},
	body: '\n## Post 3\n\nThis is the contents of post 3.\n',
};
