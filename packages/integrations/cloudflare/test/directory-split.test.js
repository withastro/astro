import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils').Fixture} */
describe('ssr split', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/split/',
			adapter: cloudflare({ mode: 'directory' }),
			build: {
				split: true,
				excludeMiddleware: true
			},
			vite: {
				build: {
					minify: false,
				},
			},
		});
		await fixture.build();
	});

	after(() => {
		fixture.clean();
	});

	it('generates functions folder inside the project root', async () => {
		expect(await fixture.pathExists('../functions')).to.be.true;
		expect(await fixture.pathExists('../functions/index.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/cool.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/[post].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[person]/[car].js')).to.be.true;
		expect(await fixture.pathExists('../functions/files/[[path]].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[language]/files/[[path]].js')).to.be.true;
	});
});
