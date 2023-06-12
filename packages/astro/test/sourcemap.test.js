import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Sourcemap', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/sourcemap/' });
		await fixture.build();
	});

	it('Builds sourcemap', async () => {
		const dir = await fixture.readdir('./_astro');
		const counterMap = dir.find((file) => file.match(/^Counter\.\w+\.js\.map$/));
		expect(counterMap).to.be.ok;
	});

	it('Builds non-empty sourcemap', async () => {
		const map = await fixture.readFile('renderers.mjs.map');
		expect(map).to.not.include('"sources":[]');
	});
});
