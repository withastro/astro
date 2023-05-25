import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-optimize/', import.meta.url);

describe('MDX optimize', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
		});
		await fixture.build();
	});

	it('renders an MDX page fine', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('h1').textContent).include('MDX page');
		expect(document.querySelector('p').textContent).include(
			'I once heard a very inspirational quote:'
		);

		const blockquote = document.querySelector('blockquote.custom-blockquote');
		expect(blockquote).to.not.be.null;
		expect(blockquote.textContent).to.include('I like pancakes');

		const code = document.querySelector('pre.astro-code');
		expect(code).to.not.be.null;
		expect(code.textContent).to.include(`const pancakes = 'yummy'`);
	});

	it('renders an Astro page that imports MDX fine', async () => {
		const html = await fixture.readFile('/import/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('h1').textContent).include('Astro page');
		expect(document.querySelector('p').textContent).include(
			'I once heard a very inspirational quote:'
		);

		const blockquote = document.querySelector('blockquote.custom-blockquote');
		expect(blockquote).to.not.be.null;
		expect(blockquote.textContent).to.include('I like pancakes');
	});
});
