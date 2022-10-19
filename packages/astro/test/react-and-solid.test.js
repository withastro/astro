import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Solid app with some React components', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/react-and-solid/' });
		await fixture.build();
	});

	it('Reads jsxImportSource from tsconfig', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		expect($('#example-solid').text()).to.equal('example solidjs component');
		expect($('#example-react').text()).to.equal('example react component');
	});
});
