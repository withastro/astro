import { createLoader, RateLimitCache } from '../dist/index.js';
import { expect } from 'chai';

describe('RateLimitCache', () => {
	it('does not call load function when exceeding the limit', async () => {
		const cache = new RateLimitCache({
			allowed: 1,
			period: 'second'
		});
		let loadCount = 0;
		const getItem = createLoader({
			key: id => id,
			load(id) {
				loadCount++;
				return Promise.resolve(22);
			},
			layers: [cache]
		});

		await getItem();
		expect(loadCount).to.equal(1);

		// Do it immediately again, we should exceed the limit
		await getItem();
		expect(loadCount).to.equal(1, 'load() should not be called because caught by cache');

		// Wait a second so the cache resets.
		await new Promise(resolve => setTimeout(resolve, 1100));
		await getItem();
		expect(loadCount).to.equal(2);
	});
})
