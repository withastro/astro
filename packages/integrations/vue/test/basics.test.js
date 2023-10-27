import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import { parseHTML } from 'linkedom';
describe('Basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();
	});

	it('Slots are added without the slot attribute', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo');

		expect(bar).not.to.be.undefined;
		expect(bar.getAttribute('slot')).to.be.null;
	});

});
