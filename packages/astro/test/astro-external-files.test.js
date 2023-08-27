import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('External file references', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-external-files/' });
		await fixture.build();
	});

	it('Build with externeal reference', async () => {
		const html = await fixture.readFile('/index.html');
		expect(html).to.include('<script src="/external-file.js"');
	});
});

it.skip('is skipped', () => {});
