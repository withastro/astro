import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('adapter-backed content collection storage', () => {
	let fixture: Fixture;
	let app: App;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collection-storage/' });
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	after(async () => {
		fixture.resetAllFiles();
		await devServer?.stop();
	});

	it('uses regular content APIs with SQLite storage', async () => {
		const result = JSON.parse(await fixture.readFile('/client/index.json'));

		assert.deepEqual(result.databasePosts, [
			{
				id: 'alpha',
				collection: 'databasePosts',
				data: { title: 'From the database', order: 1, source: 'database' },
				filePath: 'src/database-posts.json',
			},
			{
				id: 'beta',
				collection: 'databasePosts',
				data: { title: 'Also from the database', order: 2, source: 'database' },
				filePath: 'src/database-posts.json',
			},
		]);
		assert.equal(result.databasePost.id, 'beta');
		assert.equal(result.localPosts[0].id, 'local');
		assert.equal(result.localPost.data.title, 'From a loader');
	});

	it('queries SQLite storage in production SSR', async () => {
		const response = await app.render(new Request('http://example.test/runtime.json'));
		const result = await response.json();

		assert.equal(result.databasePosts[0].data.source, 'database');
		assert.equal(result.localPost.id, 'local');
	});

	it('queries SQLite storage in development', async () => {
		devServer ??= await fixture.startDevServer();
		const response = await fixture.fetch('/runtime.json');
		const result = await response.json();

		assert.equal(result.databasePosts[1].id, 'beta');
		assert.equal(result.localPost.data.title, 'From a loader');
	});

	it('updates SQLite storage before invalidating development content', async () => {
		devServer ??= await fixture.startDevServer();
		const changed = fixture.onNextDataStoreChange();
		await fixture.editFile('/src/database-posts.json', (contents) =>
			contents.replace('Also from the database', 'Updated in SQLite'),
		);
		await changed;

		const timeout = Date.now() + 5_000;
		let title: string | undefined;
		do {
			const response = await fixture.fetch('/runtime.json');
			const result = await response.json();
			title = result.databasePosts[1]?.data.title;
			if (title !== 'Updated in SQLite') {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		} while (title !== 'Updated in SQLite' && Date.now() < timeout);

		assert.equal(title, 'Updated in SQLite');
	});
});
