import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('adapter-backed content collection sources', () => {
	let fixture: Fixture;
	let app: App;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collection-source/' });
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('uses regular content APIs for adapter and loader collections', async () => {
		const result = JSON.parse(await fixture.readFile('/client/index.json'));

		assert.deepEqual(result.databasePosts, [
			{
				id: 'alpha',
				collection: 'databasePosts',
				data: { title: 'From the database', order: 1, source: 'database' },
			},
			{
				id: 'beta',
				collection: 'databasePosts',
				data: { title: 'Also from the database', order: 2, source: 'database' },
			},
		]);
		assert.equal(result.databasePost.id, 'beta');
		assert.equal(result.localPosts[0].id, 'local');
		assert.equal(result.localPost.data.title, 'From a loader');
	});

	it('queries the adapter source in production SSR', async () => {
		const response = await app.render(new Request('http://example.test/runtime.json'));
		const result = await response.json();

		assert.equal(result.databasePosts[0].data.source, 'database');
		assert.equal(result.localPost.id, 'local');
	});

	it('queries the adapter source in development', async () => {
		devServer = await fixture.startDevServer();
		const response = await fixture.fetch('/runtime.json');
		const result = await response.json();

		assert.equal(result.databasePosts[1].id, 'beta');
		assert.equal(result.localPost.data.title, 'From a loader');
	});
});
