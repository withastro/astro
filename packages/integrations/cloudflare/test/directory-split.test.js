import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils').Fixture} */
describe('Cloudflare SSR split', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/split/',
			adapter: cloudflare({ mode: 'directory' }),
			output: 'server',
			build: {
				split: true,
				excludeMiddleware: false,
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

	it('generates functions folders inside the project root, and checks that each page is emitted by astro', async () => {
		expect(await fixture.pathExists('../functions')).to.be.true;
		expect(await fixture.pathExists('../functions/index.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/cool.js')).to.be.true;
		expect(await fixture.pathExists('../functions/blog/[post].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[person]/[car].js')).to.be.true;
		expect(await fixture.pathExists('../functions/files/[[path]].js')).to.be.true;
		expect(await fixture.pathExists('../functions/[language]/files/[[path]].js')).to.be.true;
	});

	it('generates pre-rendered files', async () => {
		expect(await fixture.pathExists('./prerender/index.html')).to.be.true;
	});
});
