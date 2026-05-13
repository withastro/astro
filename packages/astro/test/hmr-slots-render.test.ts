import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

describe('HMR: slots.render with callback args after style change', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hmr-slots-render/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
		fixture.resetAllFiles();
	});

	function verifyRendering($: cheerio.CheerioAPI, label: string) {
		const items = $('#result .item-wrapper');
		assert.ok(
			items.length >= 3,
			`[${label}] Expected 3 item-wrappers, got ${items.length}. HTML:\n${$('#result').html()?.substring(0, 500)}`,
		);
		assert.equal($(items[0]).text(), 'one');
		assert.equal($(items[1]).text(), 'two');
		assert.equal($(items[2]).text(), 'three');

		// Verify no escaped HTML source code visible (the bug symptom from #15925)
		const resultText = $('#result').text();
		assert.ok(
			!resultText.includes('data-astro-cid'),
			`[${label}] Found escaped data-astro-cid in output: ${resultText.substring(0, 300)}`,
		);
	}

	it('should render after style change in the slot-render component', {
		skip: isWindows,
	}, async () => {
		// Initial fetch - verify correct rendering
		let res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		verifyRendering(cheerio.load(await res.text()), 'initial');

		// Style-only edit (triggers HMR style-only path)
		await fixture.editFile('/src/components/Each.astro', (c) =>
			c.replace('font-size: 0.5rem;', 'font-size: 1rem;'),
		);
		await new Promise((r) => setTimeout(r, 500));

		// Page refresh after HMR - must still render correctly
		res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		verifyRendering(cheerio.load(await res.text()), 'after style change');

		// Second style edit + refresh
		await fixture.editFile('/src/components/Each.astro', (c) =>
			c.replace('font-size: 1rem;', 'font-size: 2rem;'),
		);
		await new Promise((r) => setTimeout(r, 500));

		res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		verifyRendering(cheerio.load(await res.text()), 'after 2nd style change');
	});
});
