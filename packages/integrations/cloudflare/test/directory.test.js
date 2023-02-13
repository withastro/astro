import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils').Fixture} */
describe('mode: "directory"', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
			output: 'server',
			adapter: cloudflare({ mode: 'directory' }),
		});
		await fixture.build();
	});

	it('generates functions folder inside the project root', async () => {
		expect(await fixture.pathExists('../functions')).to.be.true;
		expect(await fixture.pathExists('../functions/[[path]].js')).to.be.true;
	});
});
