import { expect } from 'chai';
import cheerio from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

describe('Svelte component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/svelte-component/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Works with TypeScript', async () => {
			const html = await fixture.readFile('/typescript/index.html');
			const $ = cheerio.load(html);

			expect($('#svelte-ts').text()).to.equal('Hello, TypeScript');
		});

		it('Works with custom Svelte config', async () => {
			const html = await fixture.readFile('/typescript/index.html');
			const $ = cheerio.load(html);

			expect($('#svelte-custom-ext').text()).to.equal('Hello, Custom Extensions');
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
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
