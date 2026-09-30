import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Vue with React integration', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multi-renderer/',
		});
		await fixture.build();
	});

	it('builds a render-function-only .vue SFC', async () => {
		const html = await fixture.readFile('/render-function/index.html');
		const { document } = parseHTML(html);
		const el = document.querySelector('#render-counter');
		assert.notEqual(el, null, 'render-function Vue component should produce #render-counter');
	});

	it('builds a .js Vue component using defineComponent', async () => {
		const html = await fixture.readFile('/js-component/index.html');
		const { document } = parseHTML(html);
		const el = document.querySelector('#js-counter');
		assert.notEqual(el, null, '.js Vue component should produce #js-counter');
	});
});
