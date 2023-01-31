import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Namespace', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-namespace/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works for object', async () => {
			const html = await fixture.readFile('/object/index.html');
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component');

			expect(island).not.undefined;
			expect(component.textContent).equal('Hello world');
		});

		it('works for star', async () => {
			const html = await fixture.readFile('/star/index.html');
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component');

			expect(island).not.undefined;
			expect(component.textContent).equal('Hello world');
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

		it('works for object', async () => {
			const res = await fixture.fetch('/object');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component');

			expect(island).not.undefined;
			expect(component.textContent).equal('Hello world');
		});

		it('works for star', async () => {
			const res = await fixture.fetch('/star');

			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component');

			expect(island).not.undefined;
			expect(component.textContent).equal('Hello world');
		});
	});
});
