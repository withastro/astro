import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
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

		assert.equal(p.textContent, 'Hello world');
	});

	it('mdx renders fine', async () => {
		const html = await fixture.readFile('/post/index.html');
		const { document } = parseHTML(html);
		const h = document.querySelector('#testing');
		assert.equal(h.textContent, 'Testing');
	});

	it('does not get a invalid hook call warning', () => {
		const errors = unhook();
		assert.equal(errors.length === 0, true);
	});

	it('renders inline mdx component', async () => {
		const html = await fixture.readFile('/inline-component/index.html');
		assert.match(html, /This is an inline component: <span>Comp<\/span>/);
	});

	it('hydrates React component in Astro.slots.render()', async () => {
		const fooHtml = await fixture.readFile('/foo/index.html');
		assert.match(fooHtml, /<astro-island/, 'foo should have astro-island element');

		// bar slot should also work (this was the bug - bar had no hydration)
		const barHtml = await fixture.readFile('/bar/index.html');
		assert.match(barHtml, /<astro-island/, 'bar should have astro-island element');
	});
});
