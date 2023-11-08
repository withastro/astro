import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { parseHTML } from 'linkedom';

describe('App Entrypoint', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/app-entrypoint/',
		});
		await fixture.build();
	});

	it('loads during SSR', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: basic component renders
		expect($('#foo > #bar').text()).to.eq('works');

		// test 2: component with multiple script blocks renders and exports
		// values from non setup block correctly
		expect($('#multiple-script-blocks').text()).to.equal('2 4');

		// test 3: component using generics renders
		expect($('#generics').text()).to.equal('generic');

		// test 4: component using generics and multiple script blocks renders
		expect($('#generics-and-blocks').text()).to.equal('1 3!!!');
	});

	it('setup included in renderer bundle', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const island = document.querySelector('astro-island');
		const client = island.getAttribute('renderer-url');
		expect(client).not.to.be.undefined;

		const js = await fixture.readFile(client);
		expect(js).to.match(/\w+\.component\(\"Bar\"/gm);
	});

	it('loads svg components without transforming them to assets', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const client = document.querySelector('astro-island svg');

		expect(client).not.to.be.undefined;
	});
});
