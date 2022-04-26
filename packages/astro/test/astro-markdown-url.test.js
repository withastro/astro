import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown URL', () => {
	describe('With subpath', () => {
		const baseUrl = `/my-cool-base/docs/pages/how-to-make-a-page`;

		it('trailingSlash: always', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/with-subpath-always/', import.meta.url),
				base: '/my-cool-base',
				trailingSlash: 'always',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl + '/');
		});

		it('trailingSlash: never', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/with-subpath-never/', import.meta.url),
				base: '/my-cool-base',
				trailingSlash: 'never',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl);
		});

		it('trailingSlash: ignore', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/with-subpath-ignore/', import.meta.url),
				base: '/my-cool-base',
				trailingSlash: 'ignore',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl);
		});
	});

	describe('Without subpath', () => {
		const baseUrl = `/docs/pages/how-to-make-a-page`;

		it('trailingSlash: always', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/without-subpath-always/', import.meta.url),
				trailingSlash: 'always',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl + '/');
		});

		it('trailingSlash: never', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/without-subpath-never/', import.meta.url),
				trailingSlash: 'never',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl);
		});

		it('trailingSlash: ignore', async () => {
			let fixture = await loadFixture({
				root: './fixtures/astro-markdown-url/',
				outDir: new URL('./fixtures/astro-markdown-url/without-subpath-ignore/', import.meta.url),
				trailingSlash: 'ignore',
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('#url').attr('href')).to.equal(baseUrl);
		});
	});
});
