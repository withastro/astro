import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { createRuntime } from '../../dist/runtime.js';

const instance = (cid: string, html: string) => `<!--ui:i ${cid}-->${html}<!--/ui:i-->`;
const slot = (html: string) => `<!--ui:s-->${html}<!--/ui:s-->`;

function load(body: string) {
	const { document } = parseHTML(`<!doctype html><html><body>${body}</body></html>`);
	return { document, runtime: createRuntime(document as unknown as Document) };
}

describe('runtime', () => {
	it('runs a scoped script once per instance with its own elements', () => {
		const { runtime } = load(
			instance('c', '<output>1</output>') + instance('c', '<output>2</output>'),
		);
		const seen: string[] = [];
		runtime.register('c', 'Counter', (scope) => {
			seen.push(scope('output').el.textContent!);
		});
		assert.deepEqual(seen, ['1', '2']);
	});

	it('hides child internals but shows slotted content to the outer instance', () => {
		const { runtime } = load(
			instance(
				'card',
				`<b class="x">card</b>${slot(`<i class="x">slotted</i>${instance('inner', '<u class="x">inner</u>')}`)}`,
			),
		);
		let found: string[] = [];
		runtime.register('card', 'Card', (scope) => {
			found = scope.all('.x').map((r) => r.el.textContent!);
		});
		assert.deepEqual(found, ['card']);

		runtime.register(null, 'page', (scope) => {
			found = scope.all('.x').map((r) => r.el.textContent!);
		});
		assert.deepEqual(found, ['slotted']);
	});

	it('throws a helpful error when a selector matches nothing', () => {
		const { runtime } = load(instance('c', '<p></p>'));
		assert.throws(
			() => runtime.register('c', 'Counter', (scope) => scope('.missing')),
			/scope\('\.missing'\) matched nothing in <Counter>/,
		);
	});

	it('revives a server signal once and shares it between bindings', () => {
		const value = encodeURIComponent(JSON.stringify(3));
		const { document, runtime } = load(
			`<p id="a"><!--ui:t s1 ${value}-->3<!--/ui:t--></p><p id="b"><!--ui:t s1 ${value}-->3<!--/ui:t--></p>` +
				instance('c', `<output><!--ui:t s1 ${value}-->3<!--/ui:t--></output>`),
		);
		runtime.register('c', 'Counter', (scope) => {
			const count = scope('output').text();
			assert.equal(count(), 3);
			count(count() + 1);
		});
		assert.equal(document.querySelector('#a')!.textContent, '4');
		assert.equal(document.querySelector('#b')!.textContent, '4');
	});

	it('adopts list rows and clones the template for new ones', () => {
		const { document, runtime } = load(
			instance(
				'l',
				'<ul><li><span>a</span></li><li><span>b</span></li></ul><template><li><span></span></li></template>',
			),
		);
		runtime.register('l', 'List', (scope) => {
			const list = scope.list('ul', 'template', (row) => ({ text: row('span').text() }));
			assert.deepEqual(
				list.items().map((i) => i.text()),
				['a', 'b'],
			);
			list.add({ text: 'c' });
			list.items([...list.items()].reverse());
		});
		assert.equal(
			Array.from(document.querySelectorAll('li'))
				.map((li) => li.textContent)
				.join(''),
			'cba',
		);
	});
});
