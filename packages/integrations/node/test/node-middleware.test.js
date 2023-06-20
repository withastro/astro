import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('test 404 cant load', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});
	describe('test 404', async () => {
		let devPreview;

		before(async () => {
			devPreview = await fixture.preview();
		});
		after(async () => {
			await devPreview.stop();
		});
		it('when mode is standalone', async () => {
			const res = await fixture.fetch('/error-page');

			expect(res.status).to.equal(404);

			const html = await res.text();
			const $ = cheerio.load(html);

			const h1 = $('h1');
			expect(h1.text()).to.equal('404!!!!!!!!!!');
		});
	});
});
