import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Using TypeScript in hoisted scripts', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/ts-in-hoisted-script/' });
		await fixture.build();
	});

	it('works', async () => {
		const html = await fixture.readFile('/index.html');
		console.log(html);
	});
});
