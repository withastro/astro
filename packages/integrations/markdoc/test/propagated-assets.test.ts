import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture, type DevServer } from './test-utils.ts';

describe('Markdoc - propagated assets', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/propagated-assets/', import.meta.url),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
	});

	const modes = ['dev', 'prod'];

	for (const mode of modes) {
		describe(mode, () => {
			let stylesDocument: Document;
			let scriptsDocument: Document;

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
				if (mode === 'dev') await devServer?.stop();
			});

			it('Bundles styles', async () => {
				let styleContents;
				if (mode === 'dev') {
					const styles = stylesDocument.querySelectorAll<HTMLStyleElement>('style');
					assert.equal(styles.length, 1);
					styleContents = styles[0].textContent;
				} else {
					const links = stylesDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
					assert.equal(links.length, 1);
					styleContents = await fixture.readFile(links[0].href);
				}
				assert.equal(styleContents.includes('--color-base-purple: 269, 79%;'), true);
			});

			it('[fails] Does not bleed styles to other page', async () => {
				if (mode === 'dev') {
					const styles = scriptsDocument.querySelectorAll<HTMLStyleElement>('style');
					assert.equal(styles.length, 0);
				} else {
					const links = scriptsDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
					assert.equal(links.length, 0);
				}
			});
		});
	}
});
