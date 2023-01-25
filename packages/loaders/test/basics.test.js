import { createLoader } from '../dist/index.js';
import { expect } from 'chai';

describe('loaders', () => {
	it('works', async () => {
		const getItem = createLoader({
			key: id => id,
			load(id) { return Promise.resolve(22); }
		});
		const value = await getItem('key');
		expect(value).to.equal(22);
	});
})
