import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.js';

describe('HTML Slots', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-slots/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders slot content from parent components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Test that slot content is properly passed and rendered
			const slotDefault = $('#default');
			assert.equal(slotDefault.text(), 'Default');

			const a = $('#a');
			assert.equal(a.text().trim(), 'A');

			const b = $('#b');
			assert.equal(b.text().trim(), 'B');

			const c = $('#c');
			assert.equal(c.text().trim(), 'C');
		});

		it('preserves inline slots', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const inline = $('#inline');
			assert.equal(inline.html(), '<slot is:inline=""></slot>');
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders slot content from parent components', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			// Test that slot content is properly passed and rendered
			const slotDefault = $('#default');
			assert.equal(slotDefault.text(), 'Default');

			const a = $('#a');
			assert.equal(a.text().trim(), 'A');

			const b = $('#b');
			assert.equal(b.text().trim(), 'B');

			const c = $('#c');
			assert.equal(c.text().trim(), 'C');
		});

		it('preserves inline slots', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);

			const inline = $('#inline');
			assert.equal(inline.html(), '<slot is:inline=""></slot>');
		});
	});
});
