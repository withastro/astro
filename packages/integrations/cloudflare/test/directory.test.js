import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils').Fixture} */
describe('mode: "directory"', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
			output: 'server',
			adapter: cloudflare({ mode: 'directory' }),
			redirects: {
				'/old': '/',
			},
		});
		await fixture.build();
	});

	it('generates functions folder inside the project root', async () => {
		expect(await fixture.pathExists('../functions')).to.be.true;
		expect(await fixture.pathExists('../functions/[[path]].js')).to.be.true;
	});

	it('generates a redirects file', async () => {
		try {
			let _redirects = await fixture.readFile('/_redirects');
			let parts = _redirects.split(/\s+/);
			expect(parts).to.deep.equal(['/old', '/', '301']);
		} catch {
			expect(false).to.equal(true);
		}
	});
});
