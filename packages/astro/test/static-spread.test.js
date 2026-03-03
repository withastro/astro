import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { getSharedFixture, getSharedPreviewServer, stopAllServers } from './shared-fixture.js';

describe('Static - Spread Attributes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await getSharedFixture({
			name: 'static',
			root: './fixtures/static/',
		});
		await fixture.build();
		previewServer = await getSharedPreviewServer(fixture);
	});

	after(async () => {
		await stopAllServers();
	});

	it('Allows spread attributes', async () => {
		const html = await fixture.readFile('/spread/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#spread-leading').length, 1);
		assert.equal($('#spread-leading').attr('a'), '0');
		assert.equal($('#spread-leading').attr('b'), '1');
		assert.equal($('#spread-leading').attr('c'), '2');

		assert.equal($('#spread-trailing').length, 1);
		assert.equal($('#spread-trailing').attr('a'), '0');
		assert.equal($('#spread-trailing').attr('b'), '1');
		assert.equal($('#spread-trailing').attr('c'), '2');
	});

	it('Allows spread attributes with TypeScript', async () => {
		const html = await fixture.readFile('/spread/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#spread-ts').length, 1);
		assert.equal($('#spread-ts').attr('a'), '0');
		assert.equal($('#spread-ts').attr('b'), '1');
		assert.equal($('#spread-ts').attr('c'), '2');
	});

	it('Allows scoped classes with spread', async () => {
		const html = await fixture.readFile('/spread-scope/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#spread-plain').length, 1);
		assert.match($('#spread-plain').attr('class'), /astro-.*/);

		assert.equal($('#spread-class').length, 1);
		assert.match($('#spread-class').attr('class'), /astro-.*/);

		assert.equal($('#spread-class-list').length, 1);
		assert.match($('#spread-class-list').attr('class'), /astro-.*/);
	});
});
