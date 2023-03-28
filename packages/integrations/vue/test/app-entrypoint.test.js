import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
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
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo > #bar');
		expect(bar).not.to.be.undefined;
		expect(bar.textContent).to.eq('works');
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
});
