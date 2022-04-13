import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Custom Elements', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-elements/',
			experimental: {
				integrations: true
			}
		});
		await fixture.build();
	});

	it('Work as constructors', async () => {
		const html = await fixture.readFile('/ctr/index.html');
		const $ = cheerioLoad(html);

		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendererd
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
	});

	it('Works with exported tagName', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendered
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);
	});

	it('Hydration works with exported tagName', async () => {
		const html = await fixture.readFile('/load/index.html');
		const $ = cheerioLoad(html);

		// SSR
		// test 1: Element rendered
		expect($('my-element')).to.have.lengthOf(1);

		// test 2: shadow rendered
		expect($('my-element template[shadowroot=open]')).to.have.lengthOf(1);

		// Hydration
		// test 3: Component and polyfill scripts bundled separately
		expect($('script[type=module]')).to.have.lengthOf(1);
	});

	it('Custom elements not claimed by renderer are rendered as regular HTML', async () => {
		const html = await fixture.readFile('/nossr/index.html');
		const $ = cheerioLoad(html);

		// test 1: Rendered the client-only element
		expect($('client-element')).to.have.lengthOf(1);
		// No children
		expect($('client-element').text()).to.equal('');
	});

	it('Can import a client-only element that is nested in JSX', async () => {
		const html = await fixture.readFile('/nested/index.html');
		const $ = cheerioLoad(html);

		// test 1: Element rendered
		expect($('client-only-element')).to.have.lengthOf(1);
	});
});
