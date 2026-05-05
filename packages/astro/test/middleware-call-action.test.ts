import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Middleware callAction', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-call-action/',
			adapter: testAdapter(),
		});
	});

	describe('build', () => {
		let app: App;

		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('can call an action from a context created via createContext', async () => {
			const request = new Request('http://example.com/');
			const res = await app.render(request);

			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal($('#result').text(), 'Hello Astro');
		});
	});
});
