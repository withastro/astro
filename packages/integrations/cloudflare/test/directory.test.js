import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

describe('mode: "directory"', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
			output: 'server',
			adapter: cloudflare({ mode: 'directory' }),
		});
		await fixture.build();
	});

	it('generates the functions folder on under the config root', async () => {
		// const functions = await fixture.readFile('/_routes.json')
		// expect(routes.exclude).to.include('/one/');
		console.log(await fixture.readdir('../../basics'));
		expect(await fixture.pathExists('../functions')).to.be.true;
	});
});
