import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Hydration script ordering', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hydration-race' });
		await fixture.build();
	});

	it('Places the hydration script before the first island', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);

		// First, let's make sure all islands rendered (or test is bad)
		expect($('astro-island')).to.have.a.lengthOf(3);

		// Now let's make sure the hydration script is placed before the first component
		let firstIsland = $($('astro-island').get(0));
		let prevSibling = firstIsland.prev();
		expect(prevSibling.prop('tagName')).to.equal('SCRIPT');

		// Sanity check that we're only rendering them once.
		expect($('style')).to.have.a.lengthOf(1, 'hydration style added once');
		expect($('script')).to.have.a.lengthOf(1, 'only one hydration script needed');
	});

	it('Hydration placed in correct location when there is slots used', async () => {
		let html = await fixture.readFile('/slot/index.html');
		let $ = cheerio.load(html);
		//console.log(html);

		// First, let's make sure all islands rendered (or test is bad)
		expect($('astro-island')).to.have.a.lengthOf(3);

		// Now let's make sure the hydration script is placed before the first component
		let firstIsland = $($('astro-island').get(0));
		let el = firstIsland.prev();
		let foundScript = false;

		// Traverse the DOM going backwards until we find a script, if there is one.
		while(el.length) {
			let last = el;
			while(el.length) {
				if(el.prop('tagName') === 'SCRIPT') {
					foundScript = true;
				}
				last = el;
				el = el.prev();
			}
			el = last.parent();
		}

		expect(foundScript).to.be.true;

		// Sanity check that we're only rendering them once.
		expect($('style')).to.have.a.lengthOf(1, 'hydration style added once');
		expect($('script')).to.have.a.lengthOf(1, 'only one hydration script needed');
	});
});
