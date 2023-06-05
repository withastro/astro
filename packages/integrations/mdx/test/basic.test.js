import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('basic - dev', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;
	/** @type {import('../../../astro/test/test-utils.js').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basic/', import.meta.url),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('build css from the component', () => {
		it('including css and js from the component', async () => {
			let res = await fixture.fetch(`/astro-content-css/`);
			expect(res.status).to.equal(200);
			const html = await res.text();
			const $ = cheerio.load(html);
			expect($.html()).to.include('CornflowerBlue');
			expect($('script[src$=".js"]').attr('src')).to.include('astro');
		});
	});
});

describe('basic - build', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basic/', import.meta.url),
		});
		await fixture.build();
	});

	describe('build css from the component', () => {
		it('including css and js from the component', async () => {
			const html = await fixture.readFile('/astro-content-css/index.html');
			const $ = cheerio.load(html);
			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
			expect($('script[src$=".js"]').attr('src')).to.match(/^\/_astro\//);
		});
	});

	describe('url export', () => {
		it('generates correct urls in glob result', async () => {
			const { urls } = JSON.parse(await fixture.readFile('/url-export/pages.json'));
			expect(urls).to.include('/url-export/test-1');
			expect(urls).to.include('/url-export/test-2');
		});

		it('respects "export url" overrides in glob result', async () => {
			const { urls } = JSON.parse(await fixture.readFile('/url-export/pages.json'));
			expect(urls).to.include('/AH!');
		});
	});

	describe('vite env vars', () => {
		it('Avoids transforming `import.meta.env` outside JSX expressions', async () => {
			const html = await fixture.readFile('/vite-env-vars/index.html');
			const { document } = parseHTML(html);

			expect(document.querySelector('h1')?.innerHTML).to.contain('import.meta.env.SITE');
			expect(document.querySelector('code')?.innerHTML).to.contain('import.meta.env.SITE');
			expect(document.querySelector('pre')?.innerText).to.contain('import.meta.env.SITE');
		});

		it('Allows referencing `import.meta.env` in frontmatter', async () => {
			const { title = '' } = JSON.parse(await fixture.readFile('/vite-env-vars/frontmatter.json'));
			expect(title).to.contain('import.meta.env.SITE');
		});

		it('Transforms `import.meta.env` in {JSX expressions}', async () => {
			const html = await fixture.readFile('/vite-env-vars/index.html');
			const { document } = parseHTML(html);

			expect(document.querySelector('[data-env-site]')?.innerHTML).to.contain(
				'https://mdx-is-neat.com/blog/cool-post'
			);
		});

		it('Transforms `import.meta.env` in variable exports', async () => {
			const html = await fixture.readFile('/vite-env-vars/index.html');
			const { document } = parseHTML(html);

			expect(document.querySelector('[data-env-variable-exports]')?.innerHTML).to.contain(
				'MODE works'
			);
		});

		it('Transforms `import.meta.env` in HTML attributes', async () => {
			const html = await fixture.readFile('/vite-env-vars/index.html');
			const { document } = parseHTML(html);

			const dataAttrDump = document.querySelector('[data-env-dump]');
			expect(dataAttrDump).to.not.be.null;

			expect(dataAttrDump.getAttribute('data-env-prod')).to.not.be.null;
			expect(dataAttrDump.getAttribute('data-env-dev')).to.be.null;
			expect(dataAttrDump.getAttribute('data-env-base-url')).to.equal('/');
			expect(dataAttrDump.getAttribute('data-env-mode')).to.equal('production');
		});
	});
});
