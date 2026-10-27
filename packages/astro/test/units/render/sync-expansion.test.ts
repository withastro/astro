import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { experimental_AstroContainer } from '../../../dist/container/index.js';
import {
	createComponent,
	render,
	renderComponent,
	renderSlotToString,
} from '../../../dist/runtime/server/index.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';

describe('sync subtree expansion', () => {
	it('keeps scripts carried alongside a slot rendered into a sync component', async () => {
		const Child = createComponent((_result, props) => render`<div>${props.content}</div>`);
		const Page = createComponent(async (result) => {
			const content = await renderSlotToString(
				result,
				() =>
					render`<p>slot</p>${createRenderInstruction({
						type: 'script',
						id: 'sync-expansion-script',
						content: '<script type="module">/* island */</script>',
					})}`,
			);
			return render`<main>${renderComponent(result, 'Child', Child, { content }, {})}</main>`;
		});

		const container = await experimental_AstroContainer.create();
		const html = await container.renderToString(Page);

		assert.ok(html.includes('<p>slot</p>'), `slot content missing: ${html}`);
		assert.ok(html.includes('/* island */'), `script carried by the slot was dropped: ${html}`);
	});

	it('skips only null, undefined and false', async () => {
		const Page = createComponent(
			() =>
				render`<p>${Number.NaN}</p><p>${0n}</p><p>${0}</p><p>${''}</p><p>${false}</p><p>${null}</p>`,
		);

		const container = await experimental_AstroContainer.create();
		const html = await container.renderToString(Page);

		assert.equal(html, '<p>NaN</p><p>0</p><p>0</p><p></p><p></p><p></p>');
	});

	it('rethrows when the same template is rendered twice', async () => {
		const template = render`<p>${Promise.reject(new Error('boom'))}</p>`;
		const Page = createComponent(() => template);

		const container = await experimental_AstroContainer.create();
		await assert.rejects(() => container.renderToString(Page), /boom/);
		await assert.rejects(() => container.renderToString(Page), /boom/);
	});
});
