import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

const root = './fixtures/content-layer-external-storage/';
// The file where the fixture's content storage driver saves the external collections
const storeFile = new URL(`${root}.astro/external-content.json`, import.meta.url);

interface CollectionsResponse {
	posts: Array<{ id: string; title: string; author: unknown; body: string }>;
	metadata: Array<{ id: string; fields: string[] }>;
	author: unknown;
	notes: Array<{ id: string; title: string }>;
}

function assertCollections(json: CollectionsResponse) {
	assert.deepEqual(
		json.posts.map((post) => post.id),
		['hello', 'world'],
	);
	assert.equal(json.posts[0].title, 'Hello from external storage');
	assert.deepEqual(json.posts[0].author, { collection: 'authors', id: 'ema' });
	assert.match(json.posts[0].body, /This post is saved by the content storage driver/);
	assert.deepEqual(json.author, { name: 'Ema from external storage' });
	assert.deepEqual(json.notes, [{ id: 'first', title: 'Note from the data store' }]);
}

describe('Content layer with external storage', () => {
	describe('Static build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({ root, outDir: './dist/static/' });
			await fixture.build({ force: true });
		});

		it('saves external collections with the driver and other collections in the data store', async () => {
			const store = JSON.parse(await fs.readFile(storeFile, 'utf-8'));
			assert.deepEqual(Object.keys(store.entries).sort(), ['authors', 'posts']);

			const dataStore = await fs.readFile(
				new URL('data-store.json', fixture.config.cacheDir),
				'utf-8',
			);
			assert.ok(dataStore.includes('Note from the data store'));
			assert.ok(!dataStore.includes('from external storage'));
		});

		it('reads external and embedded collections', async () => {
			assertCollections(JSON.parse(await fixture.readFile('/collections.json')));
		});

		it('returns entries without their body and rendered HTML from getCollectionMetadata()', async () => {
			const { metadata }: CollectionsResponse = JSON.parse(
				await fixture.readFile('/collections.json'),
			);
			assert.deepEqual(
				metadata.map((entry) => entry.id),
				['hello', 'world'],
			);
			for (const { fields } of metadata) {
				assert.ok(fields.includes('data'));
				assert.ok(!fields.includes('body'));
				assert.ok(!fields.includes('rendered'));
			}
		});

		it('renders pages generated with getCollectionMetadata()', async () => {
			const $ = cheerio.load(await fixture.readFile('/posts/hello/index.html'));
			assert.equal($('#title').text(), 'Hello from external storage');
			assert.equal($('#author').text(), 'Ema from external storage');
			assert.ok($('p').text().includes('This post is saved by the content storage driver.'));
			assert.ok(await fixture.pathExists('/posts/world/index.html'));
		});

		it('throws when an entry returned by getCollectionMetadata() is rendered', async () => {
			const { error } = JSON.parse(await fixture.readFile('/render-metadata.json'));
			assert.equal(error.name, 'RenderMetadataEntryError');
		});
	});

	describe('Server build', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root,
				outDir: './dist/server/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		async function fetchCollections(): Promise<CollectionsResponse> {
			const response = await app.render(new Request('http://example.com/collections.json'));
			assert.equal(response.status, 200);
			return response.json();
		}

		it('reads external collections with the driver when rendering on demand', async () => {
			assertCollections(await fetchCollections());
		});

		it('reads the changes saved in the driver after the build', async () => {
			const original = await fs.readFile(storeFile, 'utf-8');
			try {
				await fs.writeFile(
					storeFile,
					original.replaceAll('Hello from external storage', 'Hello again from external storage'),
				);
				const { posts } = await fetchCollections();
				assert.equal(posts[0].title, 'Hello again from external storage');
			} finally {
				await fs.writeFile(storeFile, original);
			}
		});

		it('does not bundle external collections in the server build', async () => {
			const files = await fixture.glob('server/**/*.mjs');
			const contents = await Promise.all(files.map((file) => fixture.readFile(`/${file}`)));
			assert.ok(contents.some((content) => content.includes('Note from the data store')));
			assert.ok(!contents.some((content) => content.includes('from external storage')));
		});
	});

	describe('Dev', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({ root });
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer?.stop();
			fixture.resetAllFiles();
		});

		async function fetchCollections(): Promise<CollectionsResponse> {
			const response = await fixture.fetch('/collections.json');
			assert.equal(response.status, 200);
			return response.json();
		}

		it('reads external and embedded collections', async () => {
			assertCollections(await fetchCollections());
		});

		it('updates an external entry when its file changes', async () => {
			await fixture.editFile('/src/data/posts/hello.md', (contents) =>
				contents.replace('Hello from external storage', 'Hello edited in external storage'),
			);

			let title = '';
			for (let i = 0; i < 50 && title !== 'Hello edited in external storage'; i++) {
				await delay(100);
				title = (await fetchCollections()).posts[0].title;
			}
			assert.equal(title, 'Hello edited in external storage');
		});
	});
});
