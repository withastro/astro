import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Attributes', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-attrs/' });
		await fixture.build();
	});

	it('Passes attributes to elements as expected', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const attrs = {
			'false-str': { attribute: 'attr', value: 'false' },
			'true-str': { attribute: 'attr', value: 'true' },
			false: { attribute: 'attr', value: undefined },
			true: { attribute: 'attr', value: 'true' },
			empty: { attribute: 'attr', value: '' },
			null: { attribute: 'attr', value: undefined },
			undefined: { attribute: 'attr', value: undefined },
			'html-boolean': { attribute: 'async', value: 'async' },
			'html-boolean-true': { attribute: 'async', value: 'async' },
			'html-boolean-false': { attribute: 'async', value: undefined },
			'html-enum': { attribute: 'draggable', value: 'true' },
			'html-enum-true': { attribute: 'draggable', value: 'true' },
			'html-enum-false': { attribute: 'draggable', value: 'false' },
		};

		// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
		assert.equal(
			html.includes('https://example.com/api/og?title=hello&description=somedescription'),
			true,
		);

		// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
		assert.equal(
			html.includes('cmd: echo &#34;foo&#34; &#38;&#38; echo &#34;bar&#34; > /tmp/hello.txt'),
			true,
		);

		for (const id of Object.keys(attrs)) {
			const { attribute, value } = attrs[id];
			const attr = $(`#${id}`).attr(attribute);
			assert.equal(attr, value);
		}
	});

	it('Passes boolean attributes to components as expected', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#true').attr('attr'), 'attr-true');
		assert.equal($('#true').attr('type'), 'boolean');
		assert.equal($('#false').attr('attr'), 'attr-false');
		assert.equal($('#false').attr('type'), 'boolean');
	});

	it('Passes namespaced attributes as expected', async () => {
		const html = await fixture.readFile('/namespaced/index.html');
		const $ = cheerio.load(html);

		assert.equal($('div').attr('xmlns:happy'), 'https://example.com/schemas/happy');
		assert.equal($('img').attr('happy:smile'), 'sweet');
	});

	it('Passes namespaced attributes to components as expected', async () => {
		const html = await fixture.readFile('/namespaced-component/index.html');
		const $ = cheerio.load(html);

		assert.deepEqual($('span').attr('on:click'), '(event) => console.log(event)');
	});
});
