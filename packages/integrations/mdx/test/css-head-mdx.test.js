import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import * as cheerio from 'cheerio';

describe('Head injection w/ MDX', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/css-head-mdx/', import.meta.url),
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('only injects contents into head', async () => {
			const html = await fixture.readFile('/indexThree/index.html');
			const { document } = parseHTML(html);

			const links = document.querySelectorAll('head link[rel=stylesheet]');
			expect(links).to.have.a.lengthOf(1);

			const scripts = document.querySelectorAll('head script[type=module]');
			expect(scripts).to.have.a.lengthOf(1);
		});

		it('injects into the head for content collections', async () => {
			const html = await fixture.readFile('/posts/test/index.html');
			const { document } = parseHTML(html);

			const links = document.querySelectorAll('head link[rel=stylesheet]');
			expect(links).to.have.a.lengthOf(1);
		});

		it('injects content from a component using Content#render()', async () => {
			const html = await fixture.readFile('/DirectContentUsage/index.html');
			const { document } = parseHTML(html);

			const links = document.querySelectorAll('head link[rel=stylesheet]');
			expect(links).to.have.a.lengthOf(1);

			const scripts = document.querySelectorAll('head script[type=module]');
			expect(scripts).to.have.a.lengthOf(2);
		});

		it('Using component using slots.render() API', async () => {
			const html = await fixture.readFile('/remote/index.html');
			const { document } = parseHTML(html);

			const links = document.querySelectorAll('head link[rel=stylesheet]');
			expect(links).to.have.a.lengthOf(1);
		});

		it('Using component but no layout', async () => {
			const html = await fixture.readFile('/noLayoutWithComponent/index.html');
			// Using cheerio here because linkedom doesn't support head tag injection
			const $ = cheerio.load(html);

			const headLinks = $('head link[rel=stylesheet]');
			expect(headLinks).to.have.a.lengthOf(1);

			const bodyLinks = $('body link[rel=stylesheet]');
			expect(bodyLinks).to.have.a.lengthOf(0);
		});

		it('JSX component rendering Astro children within head buffering phase', async () => {
			const html = await fixture.readFile('/posts/using-component/index.html');
			// Using cheerio here because linkedom doesn't support head tag injection
			const $ = cheerio.load(html);

			const headLinks = $('head link[rel=stylesheet]');
			expect(headLinks).to.have.a.lengthOf(1);

			const bodyLinks = $('body link[rel=stylesheet]');
			expect(bodyLinks).to.have.a.lengthOf(0);
		});

		it('Injection caused by delayed slots', async () => {
			const html = await fixture.readFile('/componentwithtext/index.html');

			// Using cheerio here because linkedom doesn't support head tag injection
			const $ = cheerio.load(html);

			const headLinks = $('head link[rel=stylesheet]');
			expect(headLinks).to.have.a.lengthOf(1);

			const bodyLinks = $('body link[rel=stylesheet]');
			expect(bodyLinks).to.have.a.lengthOf(0);
		});
	});
});
