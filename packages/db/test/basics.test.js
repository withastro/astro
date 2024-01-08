import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { isWindows, loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basics/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Prints the list of authors', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			const ul = $('ul');
			expect(ul).to.have.a.lengthOf(5);
			expect($('li').text()).to.equal('Ben');
		});
	});
});
