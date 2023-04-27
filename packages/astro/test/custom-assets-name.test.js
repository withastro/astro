import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('custom the assets name function', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/custom-assets-name/', import.meta.url),
			output: 'server',
		});
		await fixture.build();
	});

	it('It cant find this file cause the node throws an error if the users custom a path that includes the folder path', async () => {
		const csslength = await fixture.readFile('client/assets/css/a.css');
		/** @type {Set<string>} */
		expect(!!csslength).to.equal(true);
	});
});
