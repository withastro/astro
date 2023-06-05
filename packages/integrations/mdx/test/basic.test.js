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

	describe('[astro-content-css] build css from the component', () => {
		it('including css and js from the component', async () => {
			let res = await fixture.fetch(`/astro-content-css/`);
			expect(res.status).to.equal(200);
			const html = await res.text();
			const $ = cheerio.load(html);
			expect($.html()).to.include('CornflowerBlue');
			expect($('script[src$=".js"]').attr('src')).to.include('astro');
		});
	});

	describe('[script-style-raw]', () => {
		it('works with with raw script and style strings', async () => {
			const res = await fixture.fetch('/script-style-raw/index.html');
			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const scriptContent = document.getElementById('test-script').innerHTML;
			expect(scriptContent).to.include(
				"console.log('raw script')",
				'script should not be html-escaped'
			);

			const styleContent = document.getElementById('test-style').innerHTML;
			expect(styleContent).to.include(
				'h1[id="script-style-raw"]',
				'style should not be html-escaped'
			);
		});
	});

	describe('[slots]', () => {
		it('supports top-level imports', async () => {
			const res = await fixture.fetch('/slots/');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const h1 = document.querySelector('h1');
			const defaultSlot = document.querySelector('[data-default-slot]');
			const namedSlot = document.querySelector('[data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Component.default />', async () => {
			const res = await fixture.fetch('/slots/glob');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-default-export] h1');
			const defaultSlot = document.querySelector('[data-default-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-default-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Content />', async () => {
			const res = await fixture.fetch('/slots/glob');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-content-export] h1');
			const defaultSlot = document.querySelector('[data-content-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-content-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
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

	describe('[astro-content-css] build css from the component', () => {
		it('including css and js from the component', async () => {
			const html = await fixture.readFile('/astro-content-css/index.html');
			const $ = cheerio.load(html);
			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
			expect($('script[src$=".js"]').attr('src')).to.match(/^\/_astro\//);
		});
	});

	describe('[script-style-raw]', () => {
		it('works with with raw script and style strings', async () => {
			const html = await fixture.readFile('/script-style-raw/index.html');
			const { document } = parseHTML(html);

			const scriptContent = document.getElementById('test-script').innerHTML;
			expect(scriptContent).to.include(
				"console.log('raw script')",
				'script should not be html-escaped'
			);

			const styleContent = document.getElementById('test-style').innerHTML;
			expect(styleContent).to.include(
				'h1[id="script-style-raw"]',
				'style should not be html-escaped'
			);
		});
	});

	describe('[slots]', () => {
		it('supports top-level imports', async () => {
			const html = await fixture.readFile('/slots/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('h1');
			const defaultSlot = document.querySelector('[data-default-slot]');
			const namedSlot = document.querySelector('[data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Component.default />', async () => {
			const html = await fixture.readFile('/slots/glob/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-default-export] h1');
			const defaultSlot = document.querySelector('[data-default-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-default-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Content />', async () => {
			const html = await fixture.readFile('/slots/glob/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-content-export] h1');
			const defaultSlot = document.querySelector('[data-content-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-content-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});
	});

	describe('[url-export]', () => {
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

	describe('[vite-env-vars]', () => {
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
