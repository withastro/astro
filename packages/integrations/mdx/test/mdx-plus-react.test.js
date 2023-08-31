import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

function hookError() {
	const error = console.error;
	const errors = [];
	console.error = function (...args) {
		errors.push(args);
	};
	return () => {
		console.error = error;
		return errors;
	};
}

describe('MDX and React', () => {
	let fixture;
	let unhook;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-plus-react/', import.meta.url),
		});
		unhook = hookError();
		await fixture.build();
	});

	it('can be used in the same project', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const p = document.querySelector('p');

		expect(p.textContent).to.equal('Hello world');
	});

	it('mdx renders fine', async () => {
		const html = await fixture.readFile('/post/index.html');
		const { document } = parseHTML(html);
		const h = document.querySelector('#testing');
		expect(h.textContent).to.equal('Testing');
	});

	it('does not get a invalid hook call warning', () => {
		const errors = unhook();
		expect(errors).to.have.a.lengthOf(0);
	});
});
