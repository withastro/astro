import integration from '@astrojs/html';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('HTML Escape', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/escape/', import.meta.url),
			integrations: [integration()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const div = document.querySelector('div');
			expect(div.textContent).to.equal('${foo}');

			const span = document.querySelector('span');
			expect(span.getAttribute('${attr}')).to.equal("");

			const ce = document.querySelector('custom-element');
			expect(ce.getAttribute('x-data')).to.equal("`${test}`");

			const script = document.querySelector('script');
			expect(script.textContent).to.equal('console.log(`hello ${"world"}!`)');
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

		it('works', async () => {
			const res = await fixture.fetch('/');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const div = document.querySelector('div');
			expect(div.textContent).to.equal('${foo}');

			const span = document.querySelector('span');
			expect(span.getAttribute('${attr}')).to.equal("");

			const ce = document.querySelector('custom-element');
			expect(ce.getAttribute('x-data')).to.equal("`${test}`");

			const script = document.querySelector('script');
			expect(script.textContent).to.equal('console.log(`hello ${"world"}!`)');
		});
	});
});
