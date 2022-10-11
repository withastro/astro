import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Preact component', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/preact-component/',
		});
		await fixture.build();
	});

	it('Can load class component', async () => {
		const html = await fixture.readFile('/class/index.html');
		const $ = cheerio.load(html);

		// test 1: Can use class components
		expect($('#class-component')).to.have.lengthOf(1);
	});

	it('Can load function component', async () => {
		const html = await fixture.readFile('/fn/index.html');
		const $ = cheerio.load(html);

		// test 1: Can use function components
		expect($('#fn-component')).to.have.lengthOf(1);
		// test 2: Can use function components
		expect($('#arrow-fn-component')).to.have.lengthOf(1);
	});

	it('Can load TS component', async () => {
		const html = await fixture.readFile('/ts-components/index.html');
		const $ = cheerio.load(html);

		// test 1: Can use TS components
		expect($('.ts-component')).to.have.lengthOf(1);
	});

	it('Can use hooks', async () => {
		const html = await fixture.readFile('/hooks/index.html');
		const $ = cheerio.load(html);
		expect($('#world')).to.have.lengthOf(1);
	});

	it('Can export a Fragment', async () => {
		const html = await fixture.readFile('/frag/index.html');
		const $ = cheerio.load(html);

		// test 1: nothing rendered but it didn’t throw
		expect($('body').children()).to.have.lengthOf(0);
	});

	it('Can use a pragma comment', async () => {
		const html = await fixture.readFile('/pragma-comment/index.html');
		const $ = cheerio.load(html);

		// test 1: rendered the PragmaComment component
		expect($('.pragma-comment')).to.have.lengthOf(1);
		expect($('.pragma-comment-tsx')).to.have.lengthOf(1);
	});

	// In moving over to Vite, the jsx-runtime import is now obscured. TODO: update the method of finding this.
	it.skip('Uses the new JSX transform', async () => {
		const html = await fixture.readFile('/pragma-comment/index.html');

		// Grab the imports
		const exp = /import\("(.+?)"\)/g;
		let match, componentUrl;
		while ((match = exp.exec(html))) {
			if (match[1].includes('PragmaComment.js')) {
				componentUrl = match[1];
				break;
			}
		}
		const component = await fixture.fetch(componentUrl).then((res) => res.text());
		const jsxRuntime = component.imports.filter((i) => i.specifier.includes('jsx-runtime'));

		// test 1: preact/jsx-runtime is used for the component
		expect(jsxRuntime).to.be.ok;
	});

	it('Can use shared signals between islands', async () => {
		const html = await fixture.readFile('/signals/index.html');
		const $ = cheerio.load(html);
		expect($('.preact-signal')).to.have.a.lengthOf(2);

		const sigs1Raw = $($('astro-island')[0]).attr('data-preact-signals');
		const sigs2Raw = $($('astro-island')[1]).attr('data-preact-signals');

		expect(sigs1Raw).to.not.be.undefined;
		expect(sigs2Raw).to.not.be.undefined;

		const sigs1 = JSON.parse(sigs1Raw);
		const sigs2 = JSON.parse(sigs2Raw);

		expect(sigs1.count).to.not.be.undefined;
		expect(sigs1.count).to.equal(sigs2.count);
	});
});
