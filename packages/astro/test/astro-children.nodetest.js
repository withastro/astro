import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Component children', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-children/' });
		await fixture.build();
	});

	it('Passes string children to framework components', async () => {
		const html = await fixture.readFile('/strings/index.html');
		const $ = cheerio.load(html);

		// test 1: Can pass text to Preact components
		const $preact = $('#preact');
		assert.strictEqual($preact.text().trim(), 'Hello world');

		// test 2: Can pass text to Vue components
		const $vue = $('#vue');
		assert.strictEqual($vue.text().trim(), 'Hello world');

		// test 3: Can pass text to Svelte components
		const $svelte = $('#svelte');
		assert.strictEqual($svelte.text().trim(), 'Hello world');
	});

	it('Passes markup children to framework components', async () => {
		const html = await fixture.readFile('/markup/index.html');
		const $ = cheerio.load(html);

		// test 1: Can pass markup to Preact components
		const $preact = $('#preact h1');
		assert.strictEqual($preact.text().trim(), 'Hello world');

		// test 2: Can pass markup to Vue components
		const $vue = $('#vue h1');
		assert.strictEqual($vue.text().trim(), 'Hello world');

		// test 3: Can pass markup to Svelte components
		const $svelte = $('#svelte h1');
		assert.strictEqual($svelte.text().trim(), 'Hello world');
	});

	it('Passes multiple children to framework components', async () => {
		const html = await fixture.readFile('/multiple/index.html');
		const $ = cheerio.load(html);

		// test 1: Can pass multiple children to Preact components
		const $preact = $('#preact');
		assert.strictEqual($preact.children().length, 2);
		assert.strictEqual($preact.children(':first-child').text().trim(), 'Hello world');
		assert.strictEqual($preact.children(':last-child').text().trim(), 'Goodbye world');

		// test 2: Can pass multiple children to Vue components
		const $vue = $('#vue');
		assert.strictEqual($vue.children().length, 2);
		assert.strictEqual($vue.children(':first-child').text().trim(), 'Hello world');
		assert.strictEqual($vue.children(':last-child').text().trim(), 'Goodbye world');

		// test 3: Can pass multiple children to Svelte components
		const $svelte = $('#svelte');
		assert.strictEqual($svelte.children().length, 2);
		assert.strictEqual($svelte.children(':first-child').text().trim(), 'Hello world');
		assert.strictEqual($svelte.children(':last-child').text().trim(), 'Goodbye world');
	});

	it('Renders a template when children are not rendered for client components', async () => {
		const html = await fixture.readFile('/no-render/index.html');
		const $ = cheerio.load(html);

		// test 1: If SSR only, no children are rendered.
		assert.strictEqual($('#ssr-only').children().length, 0);

		// test 2: If client, and no children are rendered, a template is.
		assert.strictEqual(
			$('#client').parent().children().length,
			2,
			'rendered the client component and a template'
		);
		assert.strictEqual(
			$('#client').parent().find('template[data-astro-template]').length,
			1,
			'Found 1 template'
		);

		// test 3: If client, and children are rendered, no template is.
		assert.strictEqual($('#client-render').parent().children().length, 1);
		assert.strictEqual($('#client-render').parent().find('template').length, 0);

		// test 4: If client and no children are provided, no template is.
		assert.strictEqual($('#client-no-children').parent().children().length, 1);
		assert.strictEqual($('#client-no-children').parent().find('template').length, 0);
	});
});
