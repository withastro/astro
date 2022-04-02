import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// TODO(fks): This seemed to test a custom renderer, but it seemed to be a copy
// fixture of lit. Should this be moved into a publicly published integration now,
// and then tested as an example? Or, should we just remove. Skipping now
// to tackle later, since our lit tests cover similar code paths.
describe.skip('Custom Elements', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-elements/',
			intergrations: ['@test/custom-element-renderer'],
		});
		await fixture.build();
	});

	it('Work as constructors', async () => {
		const html = await fixture.readFile('/ctr/index.html');
		const $ = cheerio.load(html);

		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendererd
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
	});

	it('Works with exported tagName', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendered
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
	});

	it('Hydration works with exported tagName', async () => {
		const html = await fixture.readFile('/load/index.html');
		const $ = cheerio.load(html);

		// SSR
		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendered
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);

		// Hydration
		// test 3: Component and polyfill scripts bundled separately
		expect($('script[type=module]')).to.have.lengthOf(2);
	});

	it('Polyfills are added even if not hydrating', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('script[type=module]')).to.have.lengthOf(1);
	});

	it('Custom elements not claimed by renderer are rendered as regular HTML', async () => {
		const html = await fixture.readFile('/nossr/index.html');
		const $ = cheerio.load(html);

		// test 1: Rendered the client-only element
		expect($('client-element')).to.have.lengthOf(1);
	});

	it('Can import a client-only element that is nested in JSX', async () => {
		const html = await fixture.readFile('/nested/index.html');
		const $ = cheerio.load(html);

		// test 1: Element rendered
		expect($('client-only-element')).to.have.lengthOf(1);
	});
});
