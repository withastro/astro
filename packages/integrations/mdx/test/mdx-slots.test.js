import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX slots', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-slots/', import.meta.url),
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('supports top-level imports', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('h1');
			const defaultSlot = document.querySelector('[data-default-slot]');
			const namedSlot = document.querySelector('[data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Component.default />', async () => {
			const html = await fixture.readFile('/glob/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-default-export] h1');
			const defaultSlot = document.querySelector('[data-default-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-default-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});

		it('supports glob imports - <Content />', async () => {
			const html = await fixture.readFile('/glob/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('[data-content-export] h1');
			const defaultSlot = document.querySelector('[data-content-export] [data-default-slot]');
			const namedSlot = document.querySelector('[data-content-export] [data-named-slot]');

			expect(h1.textContent).to.equal('Hello slotted component!');
			expect(defaultSlot.textContent).to.equal('Default content.');
			expect(namedSlot.textContent).to.equal('Content for named slot.');
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('supports top-level imports', async () => {
			const res = await fixture.fetch('/');

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
			const res = await fixture.fetch('/glob');

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
			const res = await fixture.fetch('/glob');

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
