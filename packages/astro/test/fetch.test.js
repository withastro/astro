import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Global Fetch', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/fetch/' });
		await fixture.build();
	});

	it('Is available in Astro pages', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#astro-page').text()).to.equal('function', 'Fetch supported in .astro page');
	});
	it('Is available in Astro components', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#astro-component').text()).to.equal('function', 'Fetch supported in .astro components');
	});
	it('Is available in non-Astro components', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#jsx').text()).to.equal('function', 'Fetch supported in .jsx');
		expect($('#svelte').text()).to.equal('function', 'Fetch supported in .svelte');
		expect($('#vue').text()).to.equal('function', 'Fetch supported in .vue');
	});
	it('Respects existing code', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#already-imported').text()).to.equal('function', 'Existing fetch imports respected');
		expect($('#custom-declaration').text()).to.equal('number', 'Custom fetch declarations respected');
	});
});
