import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

function addLeadingSlash(path: string) {
	return path.startsWith('/') ? path : '/' + path;
}

describe('Component Libraries', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/component-library/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
			outDir: './dist/component-library/',
		});
	});

	describe('build', async () => {
		before(async () => {
			await fixture.build();
		});

		function createFindEvidence(expected: RegExp) {
			return async function findEvidence(pathname: string) {
				const html = await fixture.readFile(pathname);
				const $ = cheerioLoad(html);
				const links = $('link[rel=stylesheet]');
				for (const link of links) {
					const href = $(link).attr('href')!;

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
			assert.equal(typeof html, 'string');

			html = await fixture.readFile('/with-react/index.html');
			assert.equal(typeof html, 'string');

			html = await fixture.readFile('/internal-hydration/index.html');
			assert.equal(typeof html, 'string');
		});

		it('Works with .astro components', async () => {
			const html = await fixture.readFile('/with-astro/index.html');
			const $ = cheerioLoad(html);

			assert.equal($('button').text(), 'Click me', "Rendered the component's slot");

			const findEvidence = createFindEvidence(/border-radius:\s*1rem/);
			assert.equal(
				await findEvidence('with-astro/index.html'),
				true,
				"Included the .astro component's <style>",
			);
		});

		it('Works with react components', async () => {
			const html = await fixture.readFile('/with-react/index.html');
			const $ = cheerioLoad(html);

			assert.equal($('#react-static').text(), 'Hello static!', 'Rendered the static component');

			assert.equal(
				$('#react-idle').text(),
				'Hello idle!',
				'Rendered the client hydrated component',
			);

			assert.equal($('astro-island[uid]').length, 1, 'Included one hydration island');
		});

		it('Works with components hydrated internally', async () => {
			const html = await fixture.readFile('/internal-hydration/index.html');
			const $ = cheerioLoad(html);

			assert.equal($('.counter').length, 1, 'Rendered the svelte counter');
			assert.equal(
				$('.counter-message').text().trim(),
				'Hello, Svelte!',
				"rendered the counter's slot",
			);

			assert.equal($('astro-island[uid]').length, 1, 'Included one hydration island');
		});
	});
});
