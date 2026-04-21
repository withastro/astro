import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.js';

describe('Special chars in component import paths', () => {
	let fixture: Fixture;

	const componentIds = [
		'caret',
		'rocket',
		// Not supported as import identifier in Vite
		// 'percent',
		'space',
		'round-bracket',
		'square-bracket',
	];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/special-chars-in-component-imports/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Build succeeds', async () => {
			const html = await fixture.readFile('/index.html');
			assert.equal(html.includes('<html>'), true);
		});

		it('Output JS filenames do not contain unsafe characters', async () => {
			const files = await fixture.readdir('/_astro');
			const jsFiles = files.filter((f) => f.endsWith('.js'));
			for (const file of jsFiles) {
				assert.equal(
					/[!~#{}<>]/.test(file),
					false,
					`File "${file}" contains unsafe characters that break some hosting platforms`,
				);
			}
		});

		it('Special chars in imports work from .astro files', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			assert.equal($('h1').text().includes('.astro'), true);

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId}`).length, 1, `Component #${componentId} does not exist`);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId} > div`).text(), `${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			assert.equal($('astro-island[uid]').length, componentIds.length);
		});

		it('Special chars in imports work from .mdx files', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			assert.equal($('h1').text().includes('.mdx'), true);

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId}`).length, 1, `Component #${componentId} does not exist`);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId} > div`).text(), `${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			assert.equal($('astro-island[uid]').length, componentIds.length);
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Special chars in imports work from .astro files', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			assert.equal($('h1').text().includes('.astro'), true);

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId}`).length, 1, `Component #${componentId} does not exist`);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId} > div`).text(), `${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			assert.equal($('astro-island[uid]').length, componentIds.length);
		});

		it('Special chars in imports work from .mdx files', async () => {
			const html = await fixture.fetch('/mdx').then((res) => res.text());
			const $ = cheerioLoad(html);

			// Test 1: Correct page
			assert.equal($('h1').text().includes('.mdx'), true);

			// Test 2: All components exist
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId}`).length, 1, `Component #${componentId} does not exist`);
			});

			// Test 3: Component contents were rendered properly
			componentIds.forEach((componentId) => {
				assert.equal($(`#${componentId} > div`).text(), `${componentId}: 0`);
			});

			// Test 4: There is an island for each component
			assert.equal($('astro-island[uid]').length, componentIds.length);
		});
	});
});
