import integration from '@astrojs/html';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('HTML Page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/html-page/', import.meta.url),
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

			const h1 = document.querySelector('h1');

			expect(h1.textContent).to.equal('Hello page!');
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

			const h1 = document.querySelector('h1');

			expect(h1.textContent).to.equal('Hello page!');
		});
	});
});
