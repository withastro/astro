import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

/** @type {import('./test-utils.js').Fixture} */
describe('Cloudflare SSR functionPerRoute', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/function-per-route/',
		});
		await fixture.build();
	});

	after(() => {
		fixture.clean();
	});

	it('generates functions folders inside the project root, and checks that each page is emitted by astro', async () => {
		expect(await fixture.pathExists('../functions')).to.be.true;
		expect(await fixture.pathExists('../functions/index.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/cool.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/[post].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[person]/[car].js')).to.be.true;
		expect(await fixture.pathExists('../functions/files/[[path]].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[language]/files/[[path]].js')).to.be.true;
		expect(await fixture.pathExists('../functions/trpc/[trpc].js')).to.be.true;
		expect(await fixture.pathExists('../functions/javascript.js')).to.be.true;
		expect(await fixture.pathExists('../functions/test.json.js')).to.be.true;
	});

	it('generates pre-rendered files', async () => {
		expect(await fixture.pathExists('./prerender/index.html')).to.be.true;
	});
});
