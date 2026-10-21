import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('MDX Namespace', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-namespace/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works for object', async () => {
			const html = await fixture.readFile('/object/index.html');
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component')!;

			assert.notEqual(island, undefined);
			assert.equal(component.textContent, 'Hello world');
		});

		it('works for star', async () => {
			const html = await fixture.readFile('/star/index.html');
			const { document } = parseHTML(html);

			const island = document.querySelector('astro-island');
			const component = document.querySelector('#component')!;

			assert.notEqual(island, undefined);
			assert.equal(component.textContent, 'Hello world');
		});
	});
});
