import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
	fixture = await loadFixture({ projectRoot: './fixtures/astro-component-code/' });
	await fixture.build();
});

describe('<Code>', () => {
	it('<Code> without lang or theme', async () => {
		let html = await fixture.readFile('/no-lang/index.html');
		const $ = cheerio.load(html);
		expect($('pre')).to.have.lengthOf(1);
		expect($('pre').attr('style')).to.equal('background-color: #0d1117; overflow-x: auto;', 'applies default and overflow');
		expect($('pre > code')).to.have.lengthOf(1);

		// test: contains some generated spans
		expect($('pre > code span').length).to.be.greaterThan(1);
	});

	it('<Code lang="...">', async () => {
		let html = await fixture.readFile('/basic/index.html');
		const $ = cheerio.load(html);
		expect($('pre')).to.have.lengthOf(1);
		expect($('pre').attr('class'), 'astro-code');
		expect($('pre > code')).to.have.lengthOf(1);
		// test: contains many generated spans
		expect($('pre > code span').length).to.be.greaterThanOrEqual(6);
	});

	it('<Code theme="...">', async () => {
		let html = await fixture.readFile('/custom-theme/index.html');
		const $ = cheerio.load(html);
		expect($('pre')).to.have.lengthOf(1);
		expect($('pre').attr('class')).to.equal('astro-code');
		expect($('pre').attr('style')).to.equal('background-color: #2e3440ff; overflow-x: auto;', 'applies custom theme');
	});

	it('<Code wrap>', async () => {
		{
			let html = await fixture.readFile('/wrap-true/index.html');
			const $ = cheerio.load(html);
			expect($('pre')).to.have.lengthOf(1);
			// test: applies wrap overflow
			expect($('pre').attr('style')).to.equal('background-color: #0d1117; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;');
		}
		{
			let html = await fixture.readFile('/wrap-false/index.html');
			const $ = cheerio.load(html);
			expect($('pre')).to.have.lengthOf(1);
			// test: applies wrap overflow
			expect($('pre').attr('style')).to.equal('background-color: #0d1117; overflow-x: auto;');
		}
		{
			let html = await fixture.readFile('/wrap-null/index.html');
			const $ = cheerio.load(html);
			expect($('pre')).to.have.lengthOf(1);
			// test: applies wrap overflow
			expect($('pre').attr('style')).to.equal('background-color: #0d1117');
		}
	});

	it('<Code lang="..." theme="css-variables">', async () => {
		let html = await fixture.readFile('/css-theme/index.html');
		const $ = cheerio.load(html);
		expect($('pre')).to.have.lengthOf(1);
		expect($('pre').attr('class')).to.equal('astro-code');
		expect(
			$('pre, pre span')
				.map((i, f) => (f.attribs ? f.attribs.style : 'no style found'))
				.toArray()
		).to.deep.equal([
			'background-color: var(--astro-code-color-background); overflow-x: auto;',
			'color: var(--astro-code-token-constant)',
			'color: var(--astro-code-token-function)',
			'color: var(--astro-code-color-text)',
			'color: var(--astro-code-token-string-expression)',
			'color: var(--astro-code-color-text)',
		]);
	});

	it('<Code> with custom theme and lang', async () => {
		let html = await fixture.readFile('/imported/index.html');
		const $ = cheerio.load(html);

		expect($('#theme > pre')).to.have.lengthOf(1);
		expect($('#theme > pre').attr('style'), 'background-color: #FDFDFE; overflow-x: auto;');

		expect($('#lang > pre')).to.have.lengthOf(1);
		expect($('#lang > pre > code span').length).to.equal(3);
	});
});
