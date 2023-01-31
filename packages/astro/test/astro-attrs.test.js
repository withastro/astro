import { expect } from 'chai';
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

		for (const id of Object.keys(attrs)) {
			const { attribute, value } = attrs[id];
			const attr = $(`#${id}`).attr(attribute);
			expect(attr).to.equal(value);
		}
	});

	it('Passes boolean attributes to components as expected', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('#true').attr('attr')).to.equal('attr-true');
		expect($('#true').attr('type')).to.equal('boolean');
		expect($('#false').attr('attr')).to.equal('attr-false');
		expect($('#false').attr('type')).to.equal('boolean');
	});

	it('Passes namespaced attributes as expected', async () => {
		const html = await fixture.readFile('/namespaced/index.html');
		const $ = cheerio.load(html);

		expect($('div').attr('xmlns:happy')).to.equal('https://example.com/schemas/happy');
		expect($('img').attr('happy:smile')).to.equal('sweet');
	});

	it('Passes namespaced attributes to components as expected', async () => {
		const html = await fixture.readFile('/namespaced-component/index.html');
		const $ = cheerio.load(html);

		expect($('span').attr('on:click')).to.deep.equal('(event) => console.log(event)');
	});
});
