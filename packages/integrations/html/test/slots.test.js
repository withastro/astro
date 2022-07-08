import integration from '@astrojs/html';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('HTML Slots', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/slots/', import.meta.url),
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

			const slotDefault = document.querySelector('#default');
			expect(slotDefault.textContent).to.equal('Default');

			const a = document.querySelector('#a');
			expect(a.textContent.trim()).to.equal('A');

			const b = document.querySelector('#b');
			expect(b.textContent.trim()).to.equal('B');

			const c = document.querySelector('#c');
			expect(c.textContent.trim()).to.equal('C');

			const inline = document.querySelector('#inline');
			expect(inline.innerHTML).to.equal('<slot is:inline=""></slot>');
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

			const slotDefault = document.querySelector('#default');
			expect(slotDefault.textContent).to.equal('Default');

			const a = document.querySelector('#a');
			expect(a.textContent.trim()).to.equal('A');

			const b = document.querySelector('#b');
			expect(b.textContent.trim()).to.equal('B');

			const c = document.querySelector('#c');
			expect(c.textContent.trim()).to.equal('C');

			const inline = document.querySelector('#inline');
			expect(inline.innerHTML).to.equal('<slot is:inline=""></slot>');
		});
	});
});
