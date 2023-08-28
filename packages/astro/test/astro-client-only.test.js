import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Client only components', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-client-only/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: <astro-island> is empty
		expect($('astro-island').html()).to.equal('');

		// test 2: svelte renderer is on the page
		expect($('astro-island').attr('renderer-url')).to.be.ok;
	});

	it('Adds the CSS to the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		const stylesheets = await Promise.all(
			$('link[rel=stylesheet]').map((_, el) => {
				return fixture.readFile(el.attribs.href);
			})
		);
		const css = stylesheets.join('');

		expect(css).to.match(/yellowgreen/, 'Svelte styles are added');
		expect(css).to.match(/Courier New/, 'Global styles are added');
	});

	it('Adds the CSS to the page - standalone svelte component', async () => {
		const html = await fixture.readFile('/persistent-counter-standalone/index.html');
		const $ = cheerioLoad(html);

		expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1);

		const href = $('link[rel=stylesheet]').attr('href');
		const css = await fixture.readFile(href);

		expect(css).to.match(/tomato/, 'Svelte styles are added');
	});

	it('Includes CSS from components that use CSS modules', async () => {
		const html = await fixture.readFile('/css-modules/index.html');
		const $ = cheerioLoad(html);
		expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
	});

	it('Includes CSS from package components', async () => {
		const html = await fixture.readFile('/pkg/index.html');
		const $ = cheerioLoad(html);
		expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
	});
});

describe('Client only components subpath', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			site: 'https://site.com',
			base: '/blog',
			root: './fixtures/astro-client-only/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: <astro-island> is empty
		expect($('astro-island').html()).to.equal('');

		// test 2: svelte renderer is on the page
		expect($('astro-island').attr('renderer-url')).to.be.ok;
	});

	it('Adds the CSS to the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		const stylesheets = await Promise.all(
			$('link[rel=stylesheet]').map((_, el) => {
				return fixture.readFile(el.attribs.href.replace(/\/blog/, ''));
			})
		);
		const css = stylesheets.join('');

		expect(css).to.match(/yellowgreen/, 'Svelte styles are added');
		expect(css).to.match(/Courier New/, 'Global styles are added');
	});

	it('Adds the CSS to the page for TSX components', async () => {
		const html = await fixture.readFile('/tsx-no-extension/index.html');
		const $ = cheerioLoad(html);

		const href = $('link[rel=stylesheet]').attr('href');
		const css = await fixture.readFile(href.replace(/\/blog/, ''));

		expect(css).to.match(/purple/, 'Global styles from tsx component are added');
	});
});
