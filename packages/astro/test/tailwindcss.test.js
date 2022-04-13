import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

describe('Tailwind', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/tailwindcss/',
		});
	});

	// test HTML and CSS contents for accuracy
	describe('build', () => {
		let $;
		let bundledCSS;

		before(async () => {
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/assets/]').attr('href');
			bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
		});

		it('resolves CSS in src/styles', async () => {
			expect(bundledCSS, 'includes used component classes').to.match(/\.bg-purple-600{/);

			// tests a random tailwind class that isn't used on the page
			expect(bundledCSS, 'purges unused classes').not.to.match(/\.bg-blue-600{/);

			// tailwind escapes colons, `lg:py-3` compiles to `lg\:py-3`
			expect(bundledCSS, 'includes responsive classes').to.match(/\.lg\\:py-3{/);

			// tailwind escapes brackets, `font-[900]` compiles to `font-\[900\]`
			expect(bundledCSS, 'supports arbitrary value classes').to.match(
				/\.font-\\\[900\\\]{font-weight:900}/
			);

			// custom theme colors were included
			expect(bundledCSS, 'includes custom theme colors').to.match(
				/\.text-midnight{/
			);
			expect(bundledCSS, 'includes custom theme colors').to.match(
				/\.bg-dawn{/
			);
		});

		it('maintains classes in HTML', async () => {
			const button = $('button');

			expect(button.hasClass('text-white'), 'basic class').to.be.true;
			expect(button.hasClass('lg:py-3'), 'responsive class').to.be.true;
			expect(button.hasClass('font-[900]', 'arbitrary value')).to.be.true;
		});

		it('handles complex classes in HTML', async () => {
			const button = $('#complex');

			expect(button.hasClass('w-10/12'), 'solidus').to.be.true;
			expect(button.hasClass('2xl:w-[80%]'), 'complex class').to.be.true;
		});

		it('handles Markdown pages', async () => {
			const html = await fixture.readFile('/markdown-page/index.html');
			const $ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/assets/]').attr('href');
			const bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
			expect(bundledCSS, 'includes used component classes').to.match(/\.bg-purple-600{/);
		});
	});

	// with "build" handling CSS checking, the dev tests are mostly testing the paths resolve in dev
	describe('dev', () => {
		let devServer;
		let $;

		before(async () => {
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);
		});

		after(async () => {
			devServer && (await devServer.stop());
		});

		it('resolves CSS in src/styles', async () => {
			const bundledCSSHREF = $('link[rel=stylesheet]').attr('href');
			const res = await fixture.fetch(bundledCSSHREF);
			expect(res.status).to.equal(200);

			const text = await res.text();
			expect(text, 'includes used component classes').to.match(/\.bg-purple-600/);

			// tests a random tailwind class that isn't used on the page
			expect(text, 'purges unused classes').not.to.match(/\.bg-blue-600/);

			// tailwind escapes colons, `lg:py-3` compiles to `lg\:py-3`
			expect(text, 'includes responsive classes').to.match(/\.lg\\\\:py-3/);

			// tailwind escapes brackets, `font-[900]` compiles to `font-\[900\]`
			expect(text, 'supports arbitrary value classes').to.match(/.font-\\[900\\]/);

			// custom theme colors were included
			expect(text, 'includes custom theme colors').to.match(
				/\.text-midnight/
			);
			expect(text, 'includes custom theme colors').to.match(
				/\.bg-dawn/
			);
		});

		it('maintains classes in HTML', async () => {
			const button = $('button');

			expect(button.hasClass('text-white'), 'basic class').to.be.true;
			expect(button.hasClass('lg:py-3'), 'responsive class').to.be.true;
			expect(button.hasClass('font-[900]', 'arbitrary value')).to.be.true;
		});
	});
});
