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
			/** @type {Document} */
			let stylesDocument;
			/** @type {Document} */
			let scriptsDocument;

			before(async () => {
				if (mode === 'prod') {
					await fixture.build();
					stylesDocument = parseHTML(await fixture.readFile('/styles/index.html')).document;
					scriptsDocument = parseHTML(await fixture.readFile('/scripts/index.html')).document;
				} else if (mode === 'dev') {
					devServer = await fixture.startDevServer();
					const styleRes = await fixture.fetch('/styles');
					const scriptRes = await fixture.fetch('/scripts');
					stylesDocument = parseHTML(await styleRes.text()).document;
					scriptsDocument = parseHTML(await scriptRes.text()).document;
				}
			});

			after(async () => {
				if (mode === 'dev') devServer?.stop();
			});

			it('Bundles styles', async () => {
				let styleContents;
				if (mode === 'dev') {
					const styles = stylesDocument.querySelectorAll('style');
					expect(styles).to.have.lengthOf(1);
					styleContents = styles[0].textContent;
				} else {
					const links = stylesDocument.querySelectorAll('link[rel="stylesheet"]');
					expect(links).to.have.lengthOf(1);
					styleContents = await fixture.readFile(links[0].href);
				}
				expect(styleContents).to.include('--color-base-purple: 269, 79%;');
			});

			it('[fails] Does not bleed styles to other page', async () => {
				if (mode === 'dev') {
					const styles = scriptsDocument.querySelectorAll('style');
					expect(styles).to.have.lengthOf(0);
				} else {
					const links = scriptsDocument.querySelectorAll('link[rel="stylesheet"]');
					expect(links).to.have.lengthOf(0);
				}
			});
		});
	}
});
