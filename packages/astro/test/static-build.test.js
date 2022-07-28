import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

function removeBasePath(path) {
	// `/subpath` is defined in the test fixture's Astro config
	return path.replace('/subpath', '');
}

/**
 * @typedef {import('../src/core/logger/core').LogMessage} LogMessage
 */

describe('Static build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {LogMessage[]} */
	let logs = [];

	before(async () => {
		/** @type {import('../src/core/logger/core').LogOptions} */
		const logging = {
			dest: {
				write(chunk) {
					logs.push(chunk);
				},
			},
			level: 'warn',
		};

		fixture = await loadFixture({
			root: './fixtures/static-build/',
		});
		await fixture.build({ logging });
	});

	it('Builds out .astro pages', async () => {
		const html = await fixture.readFile('/index.html');
		expect(html).to.be.a('string');
	});

	it('can build pages using Astro.glob()', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const link = $('.posts a');
		const href = link.attr('href');
		expect(href).to.be.equal('/subpath/posts/thoughts');
	});

	it('Builds out .md pages', async () => {
		const html = await fixture.readFile('/posts/thoughts/index.html');
		expect(html).to.be.a('string');
	});

	it('Builds out .json files', async () => {
		const content = await fixture.readFile('/company.json').then((text) => JSON.parse(text));
		expect(content.name).to.equal('Astro Technology Company');
		expect(content.url).to.equal('https://astro.build/');
	});

	it('Builds out async .json files', async () => {
		const content = await fixture.readFile('/posts.json').then((text) => JSON.parse(text));
		expect(Array.isArray(content)).to.equal(true);
		expect(content).deep.equal([
			{
				filename: './posts/nested/more.md',
				title: 'More post',
			},
			{
				filename: './posts/thoughts.md',
				title: 'Thoughts post',
			},
		]);
	});

	it('Builds out dynamic .json files', async () => {
		const slugs = ['thing1', 'thing2'];

		for (const slug of slugs) {
			const content = await fixture.readFile(`/data/${slug}.json`).then((text) => JSON.parse(text));
			expect(content.name).to.equal('Astro Technology Company');
			expect(content.url).to.equal('https://astro.build/');
			expect(content.slug).to.equal(slug);
		}
	});

	function createFindEvidence(expected, prefix) {
		return async function findEvidence(pathname) {
			const html = await fixture.readFile(pathname);
			const $ = cheerioLoad(html);
			const links = $('link[rel=stylesheet]');
			for (const link of links) {
				const href = $(link).attr('href');

				// The imported .scss file should include the base subpath in the href
				expect(href.startsWith('/subpath/')).to.be.true;

				/**
				 * The link should be built with the config's `base` included
				 * as a subpath.
				 *
				 * The test needs to verify that the file will be found once the `/dist`
				 * output is deployed to a subpath in production by ignoring the subpath here.
				 */
				const data = await fixture.readFile(removeBasePath(addLeadingSlash(href)));
				if (expected.test(data)) {
					return true;
				}
			}

			return false;
		};
	}

	describe('Page CSS', () => {
		const findEvidence = createFindEvidence(/height:( )*45vw/);

		it('Page level CSS is added', async () => {
			const found = await findEvidence('/index.html');
			expect(found).to.equal(true, 'Did not find page-level CSS on this page');
		});
	});

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
			const $ = cheerioLoad(html);
			expect($('script[type="module"]').length).to.equal(1, 'hoisted script added');
		});

		it('Do not get added to the wrong page', async () => {
			const hoistedHTML = await fixture.readFile('/hoisted/index.html');
			const $ = cheerioLoad(hoistedHTML);
			const href = $('script[type="module"]').attr('src');
			const indexHTML = await fixture.readFile('/index.html');
			const $$ = cheerioLoad(indexHTML);
			expect($$(`script[src="${href}"]`).length).to.equal(0, 'no script added to different page');
		});
	});

	it('honors ssr config', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		expect($('#ssr-config').text()).to.equal('testing');
	});

	it('warns when accessing headers', async () => {
		let found = false;
		for (const log of logs) {
			if (
				log.type === 'ssg' &&
				/[hH]eaders are not exposed in static \(SSG\) output mode/.test(log.args[0])
			) {
				found = true;
			}
		}
		expect(found).to.equal(true, 'Found the log message');
	});
});

describe('Static build SSR', () => {
	it('Copies public files', async () => {
		const fixture = await loadFixture({
			root: './fixtures/static-build-ssr/',
		});
		await fixture.build();
		const asset = await fixture.readFile('/client/nested/asset2.txt');
	});
});
