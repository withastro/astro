import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

describe('Component Libraries', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/component-library/',
		});
	});

	describe('build', async () => {
		before(async () => {
			await fixture.build();
		});

		function createFindEvidence(expected, prefix) {
			return async function findEvidence(pathname) {
				const html = await fixture.readFile(pathname);
				const $ = cheerioLoad(html);
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

		it('Built .astro pages', async () => {
			let html = await fixture.readFile('/with-astro/index.html');
			expect(html).to.be.a('string');

			html = await fixture.readFile('/with-react/index.html');
			expect(html).to.be.a('string');

			html = await fixture.readFile('/internal-hydration/index.html');
			expect(html).to.be.a('string');
		});

		it('Works with .astro components', async () => {
			const html = await fixture.readFile('/with-astro/index.html');
			const $ = cheerioLoad(html);

			expect($('button').text()).to.equal('Click me', "Rendered the component's slot");

			const findEvidence = createFindEvidence(/border-radius:( )*1rem/);
			expect(await findEvidence('with-astro/index.html')).to.equal(
				true,
				"Included the .astro component's <style>"
			);
		});

		it('Works with react components', async () => {
			const html = await fixture.readFile('/with-react/index.html');
			const $ = cheerioLoad(html);

			expect($('#react-static').text()).to.equal('Hello static!', 'Rendered the static component');

			expect($('#react-idle').text()).to.equal(
				'Hello idle!',
				'Rendered the client hydrated component'
			);

			expect($('astro-island[uid]')).to.have.lengthOf(1, 'Included one hydration island');
		});

		it('Works with components hydrated internally', async () => {
			const html = await fixture.readFile('/internal-hydration/index.html');
			const $ = cheerioLoad(html);

			expect($('.counter').length).to.equal(1, 'Rendered the svelte counter');
			expect($('.counter-message').text().trim()).to.equal(
				'Hello, Svelte!',
				"rendered the counter's slot"
			);

			expect($('astro-island[uid]')).to.have.lengthOf(1, 'Included one hydration island');
		});
	});

	describe('dev', async () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		function createFindEvidence(expected, prefix) {
			return async function findEvidence(pathname) {
				const html = await fixture.fetch(pathname).then((res) => res.text());
				const $ = cheerioLoad(html);

				// Most styles are inlined in a <style> block in the dev server
				const allInjectedStyles = $('style[data-astro-injected]').text().replace(/\s*/g, '');
				if (expected.test(allInjectedStyles)) {
					return true;
				}

				// Also check for <link> stylesheets
				const links = $('link[rel=stylesheet]');
				for (const link of links) {
					const href = $(link).attr('href');

					const data = await fixture.fetch(addLeadingSlash(href)).then((res) => res.text());
					if (expected.test(data)) {
						return true;
					}
				}

				return false;
			};
		}

		it('Works with .astro components', async () => {
			const html = await fixture.fetch('/with-astro/').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('button').text()).to.equal('Click me', "Rendered the component's slot");

			const findEvidence = createFindEvidence(/border-radius:( )*1rem/);
			expect(await findEvidence('/with-astro/')).to.equal(
				true,
				"Included the .astro component's <style>"
			);
		});

		it('Works with react components', async () => {
			const html = await fixture.fetch('/with-react/').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('#react-static').text()).to.equal('Hello static!', 'Rendered the static component');

			expect($('#react-idle').text()).to.equal(
				'Hello idle!',
				'Rendered the client hydrated component'
			);

			expect($('astro-island[uid]')).to.have.lengthOf(1, 'Included one hydration island');
		});

		it('Works with components hydrated internally', async () => {
			const html = await fixture.fetch('/internal-hydration/').then((res) => res.text());
			const $ = cheerioLoad(html);

			expect($('.counter').length).to.equal(1, 'Rendered the svelte counter');
			expect($('.counter-message').text().trim()).to.equal(
				'Hello, Svelte!',
				"rendered the counter's slot"
			);

			expect($('astro-island[uid]')).to.have.lengthOf(1, 'Included one hydration island');
		});
	});
});
