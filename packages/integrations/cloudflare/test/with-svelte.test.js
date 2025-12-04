import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('Svelte', 	
	() => {
		let fixture;
		let previewServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-svelte/',
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			await previewServer.stop();
			await fixture.clean();
		});

		it('renders the svelte component', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('.svelte').text(), 'Svelte Content');
		});
	},
);
