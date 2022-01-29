import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

describe('Static build', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static build/',
			renderers: ['@astrojs/renderer-preact'],
			buildOptions: {
				experimentalStaticBuild: true,
			},
			ssr: {
				noExternal: ['@astrojs/test-static-build-pkg'],
			},
		});
		await fixture.build();
	});

	it('Builds out .astro pages', async () => {
		const html = await fixture.readFile('/index.html');
		expect(html).to.be.a('string');
	});

	it('can build pages using fetchContent', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const link = $('.posts a');
		const href = link.attr('href');
		expect(href).to.be.equal('/posts/thoughts');
	});

	it('Builds out .md pages', async () => {
		const html = await fixture.readFile('/posts/thoughts/index.html');
		expect(html).to.be.a('string');
	});

	function createFindEvidence(expected) {
		return async function findEvidence(pathname) {
			const html = await fixture.readFile(pathname);
			const $ = cheerio.load(html);
			const links = $('link[rel=stylesheet]');
			for (const link of links) {
				const href = $(link).attr('href');
				const data = await fixture.readFile(addLeadingSlash(href));
				if (expected.test(data)) {
					return true;
				}
			}

			return false;
		};
	}

	describe('Shared CSS', () => {
		const findEvidence = createFindEvidence(/var\(--c\)/);

		it('Included on the index page', async () => {
			const found = await findEvidence('/index.html');
			expect(found).to.equal(true, 'Did not find shared CSS on this page');
		});

		it('Included on a md page', async () => {
			const found = await findEvidence('/posts/thoughts/index.html');
			expect(found).to.equal(true, 'Did not find shared CSS on this page');
		});
	});

	describe('CSS modules', () => {
		const findEvidence = createFindEvidence(/var\(--c-black\)/);

		it('Is included in the index CSS', async () => {
			const found = await findEvidence('/index.html');
			expect(found).to.equal(true, 'Did not find shared CSS module code');
		});
	});

	describe('Hoisted scripts', () => {
		it('Get bundled together on the page', async () => {
			const html = await fixture.readFile('/hoisted/index.html');
			const $ = cheerio.load(html);
			expect($('script[type="module"]').length).to.equal(1, 'hoisted script added');
		});

		it('Do not get added to the wrong page', async () => {
			const hoistedHTML = await fixture.readFile('/hoisted/index.html');
			const $ = cheerio.load(hoistedHTML);
			const href = $('script[type="module"]').attr('src');
			const indexHTML = await fixture.readFile('/index.html');
			const $$ = cheerio.load(indexHTML);
			expect($$(`script[src="${href}"]`).length).to.equal(0, 'no script added to different page');
		});
	});

	it('honors ssr config', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#ssr-config').text()).to.equal('testing');
	});
});
