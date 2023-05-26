import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import testAdapter from './test-adapter.js';

describe('SSR serverless support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-serverless/',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('SSR pages require zero config', async () => {});
});
