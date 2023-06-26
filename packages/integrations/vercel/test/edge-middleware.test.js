import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware/',
		});
	});
});
