import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('API routes', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/api-routes/' });
		await fixture.build();
	});

	describe('Deprecated API', () => {
		it('two argument supported', async () => {
			const one = JSON.parse(await fixture.readFile('/old-api/twoarg/one.json'));
			expect(one).to.deep.equal({
				param: 'one',
				pathname: '/old-api/twoarg/one.json'
			});
			const two = JSON.parse(await fixture.readFile('/old-api/twoarg/two.json'));
			expect(two).to.deep.equal({
				param: 'two',
				pathname: '/old-api/twoarg/two.json'
			});
		});

		it('param first argument is supported', async () => {
			const one = JSON.parse(await fixture.readFile('/old-api/onearg/one.json'));
			expect(one).to.deep.equal({
				param: 'one'
			});
		});
	});

	describe('1.0 API', () => {
		it('Receives a context argument', async () => {
			const one = JSON.parse(await fixture.readFile('/context/data/one.json'));
			expect(one).to.deep.equal({
				param: 'one',
				pathname: '/context/data/one.json'
			});
		});
	});
});
