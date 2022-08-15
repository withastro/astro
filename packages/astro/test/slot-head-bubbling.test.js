import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots head bubbling', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/slot-head-bubbling/' });
		await fixture.build();
	});

	it('Renders hydration CSS in the head', async () => {
		const html = await fixture.readFile('/index.html');
		console.log(html);
		//const $ = cheerio.load(html);
	});
});
