import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			devOptions: {
				port: 3005,
			},
			projectRoot: './fixtures/vue-component/',
			renderers: ['@astrojs/renderer-vue'],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load Vue', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const allPreValues = $('pre')
				.toArray()
				.map((el) => $(el).text());

			// test 1: renders all components correctly
			expect(allPreValues).to.deep.equal(['0', '1', '10', '100', '1000']);

			// test 2: renders 3 <astro-root>s
			expect($('astro-root')).to.have.lengthOf(4);

			// test 3: all <astro-root>s have uid attributes
			expect($('astro-root[uid]')).to.have.lengthOf(4);

			// test 5: all <astro-root>s have unique uid attributes
			const uniqueRootUIDs = $('astro-root').map((i, el) => $(el).attr('uid'));
			expect(new Set(uniqueRootUIDs).size).to.equal(4);
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			devServer && (await devServer.stop());
		});

		it('scripts proxy correctly', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			for (const script of $('script').toArray()) {
				const { src } = script.attribs;
				if (!src) continue;
				expect((await fixture.fetch(src)).status, `404: ${src}`).to.equal(200);
			}
		});
	});
});
