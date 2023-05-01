import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Errors', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/errors/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});
	describe('Within the stream', async () => {
		let devPreview;

		before(async () => {
			devPreview = await fixture.preview();
		});
		after(async () => {
			await devPreview.stop();
		});
		it('when mode is standalone', async () => {
			const res = await fixture.fetch('/in-stream');
			const html = await res.text();
			const $ = cheerio.load(html);

			expect($('p').text().trim()).to.equal('Internal server error');
		});
	});
});
