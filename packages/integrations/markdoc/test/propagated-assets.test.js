import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Markdoc - propagated assets', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/propagated-assets/', import.meta.url),
		});
	});

	const modes = ['dev', 'prod'];

	for (const mode of modes) {
		describe(mode, () => {
			before(async () => {
				if (mode === 'prod') {
					await fixture.build();
				} else if (mode === 'dev') {
					devServer = await fixture.startDevServer();
				}
			});

			after(async () => {
				if (mode === 'dev') devServer?.stop();
			});

			describe('Styles', () => {
				/** @type {Document} */
				let document;

				before(async () => {
					if (mode === 'prod') {
						const html = await fixture.readFile('/styles/index.html');
						document = parseHTML(html).document;
					} else if (mode === 'dev') {
						const res = await fixture.fetch('/styles');
						const html = await res.text();
						document = parseHTML(html).document;
					}
				});

				it('Bundles styles', async () => {
					let styleContents;
					if (mode === 'dev') {
						const styles = document.querySelectorAll('style');
						expect(styles).to.have.lengthOf(1);
						styleContents = styles[0].textContent;
					} else {
						console.log(document.head.innerHTML);
						const links = document.querySelectorAll('link[rel="stylesheet"]');
						expect(links).to.have.lengthOf(1);
						styleContents = await fixture.readFile(links[0].href);
					}
					expect(styleContents).to.include('--color-base-purple: 269, 79%;');
				});
			});
		});
	}
});
