import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
	fixture = await loadFixture({ projectRoot: './fixtures/builtins/' });
	await fixture.build();
});

describe('Node builtins', () => {
	it('Can be used with the node: prefix', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#version').text()).to.equal('1.2.0');
		expect($('#dep-version').text()).to.equal('0.0.1');
	});

	it('Can also be used with the non-prefixed version', async () => {
		const html = await fixture.readFile('/bare/index.html');
		const $ = cheerio.load(html);

		expect($('h1').text()).to.equal('true');
	});
});
