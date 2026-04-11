import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from '../../test-utils.js';

type Fixture = Awaited<ReturnType<typeof loadFixture>>;
type DevServer = NonNullable<Awaited<ReturnType<Fixture['startDevServer']>>>;

describe('core/render chunk', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-render/',
			logLevel: 'silent',
		});
		const startedDevServer = await fixture.startDevServer();
		assert.ok(startedDevServer);
		devServer = startedDevServer;
	});

	after(async () => {
		await devServer.stop();
	});

	it('does not throw on user object with type', async () => {
		const res = await fixture.fetch('/chunk');
		const html = await res.text();
		const $ = cheerio.load(html);
		const target = $('#chunk');

		assert.ok(target);
		assert.equal(target.text(), '[object Object]');
	});
});
