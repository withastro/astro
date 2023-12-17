import { expect } from 'chai';
import { loadFixture } from "@astrojs/test-utils"

describe('SSR - Redirects', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		let redirects = await fixture.readFile('./_redirects');
		let parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal([
			'',
			'/other',
			'/',
			'301',
			'',
		]);
		expect(redirects).to.matchSnapshot();
	});

	it('Does not create .html files', async () => {
		let hasErrored = false;
		try {
			await fixture.readFile('/other/index.html');
		} catch {
			hasErrored = true;
		}
		expect(hasErrored).to.equal(true, 'this file should not exist');
	});
});
