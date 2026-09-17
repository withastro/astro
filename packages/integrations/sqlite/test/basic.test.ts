import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import testAdapter from 'astro/_internal/test/test-adapter';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

const root = new URL('./fixtures/basic/', import.meta.url);

function checkApi(data: any) {
	assert.equal(data.all.error, undefined);
	assert.deepEqual(
		data.all.entries.map((entry: any) => entry.id),
		['draft-post', 'hello-world', 'second-post', 'sqlite-tips'],
	);
	assert.equal(data.pubDateIsDate, true);
	assert.ok(data.all.cacheHint.tags.includes('posts'));
	assert.equal(typeof data.all.cacheHint.lastModified, 'string');

	assert.deepEqual(
		data.published.entries.map((entry: any) => entry.id),
		['sqlite-tips', 'second-post', 'hello-world'],
	);
	assert.deepEqual(
		data.tagged.entries.map((entry: any) => entry.id),
		['second-post', 'sqlite-tips'],
	);
	assert.deepEqual(data.selected.entries, [
		{
			id: 'sqlite-tips',
			data: { title: 'SQLite Tips', pubDate: '2024-04-20T00:00:00.000Z' },
			cacheHint: { tags: ['posts:sqlite-tips'], lastModified: data.all.cacheHint.lastModified },
		},
		{
			id: 'hello-world',
			data: { title: 'Hello World', pubDate: '2024-01-10T00:00:00.000Z' },
			cacheHint: { tags: ['posts:hello-world'], lastModified: data.all.cacheHint.lastModified },
		},
	]);
	assert.deepEqual(
		data.ordered.entries.map((entry: any) => entry.id),
		['hello-world', 'sqlite-tips'],
	);
	assert.deepEqual(
		data.paged.entries.map((entry: any) => entry.id),
		['second-post', 'draft-post'],
	);
	assert.deepEqual(
		data.nested.entries.map((entry: any) => entry.id),
		['hello-world'],
	);
	assert.equal(data.byId.entry.id, 'hello-world');
	assert.equal(data.byId.entry.data.title, 'Hello World');
	assert.deepEqual(data.byId.entry.data.author, { id: 'ada', collection: 'authors' });
	assert.match(data.byId.entry.rendered.html, /<strong>first<\/strong>/);
	assert.equal(data.byWhere.entry.id, 'sqlite-tips');
	assert.equal(data.missing.entry, undefined);
	assert.equal(data.missing.error.name, 'LiveEntryNotFoundError');
	assert.deepEqual(
		data.authors.entries.map((entry: any) => entry.id),
		['grace'],
	);
	// LIKE is case-insensitive for ASCII in SQLite, so "Draft Post" matches too.
	assert.deepEqual(
		data.search.entries.map((entry: any) => entry.id),
		['draft-post', 'second-post'],
	);
}

function checkIndex(html: string) {
	assert.match(html, /<li data-id="hello-world">Hello World \(2024\)<\/li>/);
	assert.match(html, /<li data-id="sqlite-tips">SQLite Tips \(2024\)<\/li>/);
	assert.doesNotMatch(html, /draft-post/);
	assert.match(html, /<article id="hello"><h1 id="hello">Hello<\/h1>/);
}

describe('@astrojs/sqlite', () => {
	describe('dev', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({ root, outDir: './dist/dev/' });
			devServer = await fixture.startDevServer({});
		});

		after(async () => {
			await devServer?.stop();
			fixture.resetAllFiles();
		});

		it('queries mirrored collections', async () => {
			const res = await fixture.fetch('/api.json');
			assert.equal(res.status, 200);
			checkApi(await res.json());
		});

		it('renders pages', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
			checkIndex(await res.text());
		});

		it('refreshes when content changes', async () => {
			await fixture.editFile('/src/data/posts/second-post.md', (content) =>
				content.replace('title: Second Post', 'title: Second Post (edited)'),
			);
			const deadline = Date.now() + 10_000;
			let title: string | undefined;
			while (Date.now() < deadline) {
				const res = await fixture.fetch('/api.json');
				const data = await res.json();
				title = data.byWhere.error
					? undefined
					: data.all.entries.find((e: any) => e.id === 'second-post')?.data.title;
				if (title === 'Second Post (edited)') break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			assert.equal(title, 'Second Post (edited)');
		});
	});

	describe('static build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({ root, outDir: './dist/static/' });
			await fixture.build({});
		});

		it('queries mirrored collections while prerendering', async () => {
			checkApi(JSON.parse(await fixture.readFile('/api.json')));
		});

		it('renders pages', async () => {
			checkIndex(await fixture.readFile('/index.html'));
		});
	});

	describe('server build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root,
				outDir: './dist/server/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build({});
		});

		it('ships the database next to the server bundle', () => {
			assert.ok(fixture.pathExists('/server/astro-sqlite.db'));
		});

		it('queries the shipped database at runtime', async () => {
			const app = await fixture.loadTestAdapterApp();
			const res = await app.render(new Request('http://example.com/api.json'));
			assert.equal(res.status, 200);
			checkApi(await res.json());
			const page = await app.render(new Request('http://example.com/'));
			assert.equal(page.status, 200);
			checkIndex(await page.text());
		});
	});
});
