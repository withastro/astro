import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Directives', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-directives/' });
		await fixture.build();
	});

	it('Passes define:vars to script elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		expect($('script#inline')).to.have.lengthOf(1);
		expect($('script#inline').toString()).to.include('let foo = "bar"');
	});

	it('Passes define:vars to style elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		expect($('style')).to.have.lengthOf(2);
		expect($('style').toString()).to.include('--bg: white;');
		expect($('style').toString()).to.include('--fg: black;');

		const scopedClass = $('html')
			.attr('class')
			.split(' ')
			.find((name) => /^astro-[A-Za-z0-9-]+/.test(name));

		expect($($('style').get(0)).toString().replace(/\s+/g, '')).to.equal(
			`<style>.${scopedClass}{--bg:white;--fg:black;}body{background:var(--bg);color:var(--fg)}</style>`
		);

		const scopedTitleClass = $('.title')
			.attr('class')
			.split(' ')
			.find((name) => /^astro-[A-Za-z0-9-]+/.test(name));

		expect($($('style').get(1)).toString().replace(/\s+/g, '')).to.equal(
			`<style>.${scopedTitleClass}{--textColor:red;}</style>`
		);
	});

	it('set:html', async () => {
		const html = await fixture.readFile('/set-html/index.html');
		const $ = cheerio.load(html);

		expect($('#text')).to.have.lengthOf(1);
		expect($('#text').text()).to.equal('a');

		expect($('#zero')).to.have.lengthOf(1);
		expect($('#zero').text()).to.equal('0');

		expect($('#number')).to.have.lengthOf(1);
		expect($('#number').text()).to.equal('1');

		expect($('#undefined')).to.have.lengthOf(1);
		expect($('#undefined').text()).to.equal('');

		expect($('#null')).to.have.lengthOf(1);
		expect($('#null').text()).to.equal('');

		expect($('#false')).to.have.lengthOf(1);
		expect($('#false').text()).to.equal('');

		expect($('#true')).to.have.lengthOf(1);
		expect($('#true').text()).to.equal('true');
	});
});
