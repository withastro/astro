import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

process.on('exit', () => {
	console.log('process [exit]');
});

process.on('uncaughtException', err => {
	console.log('uncaughtException');
});

process.on('unhandledRejection', rej => {
	console.log('unhandledRejection');
});

describe('Prerendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender/',
		});
		try {
			console.log("BEFORE");
			await fixture.build();
			console.log('done');
		} catch(err) {
			console.log('after build', err);
		}
	});

	it('works', async () => {
		console.log('works');
	});
});
