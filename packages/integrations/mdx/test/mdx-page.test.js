import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom'
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ 
			root: new URL('./fixtures/mdx-page/', import.meta.url),
			integrations: [
				mdx()
			]
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
	})

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
	})
})
