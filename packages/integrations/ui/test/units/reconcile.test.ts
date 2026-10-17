import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { reconcile } from '../../dist/reconcile.js';

function setup(keys: string[]) {
	const { document } = parseHTML('<ul></ul>');
	const ul = document.querySelector('ul')!;
	const els = new Map<string, Element>();
	const el = (key: string) => {
		let e = els.get(key);
		if (!e) {
			e = document.createElement('li');
			e.textContent = key;
			els.set(key, e);
		}
		return e;
	};
	for (const k of keys) ul.append(el(k));
	const order = () =>
		Array.from(ul.children)
			.map((c) => c.textContent)
			.join('');
	return { ul, el, order };
}

describe('reconcile', () => {
	const cases: [string, string][] = [
		['abc', 'abcd'],
		['abc', 'dabc'],
		['abcd', 'abd'],
		['abcd', 'dcba'],
		['abcde', 'aedcb'],
		['abcde', 'ebcda'],
		['abcdef', 'fbdace'],
		['abc', ''],
		['', 'xyz'],
		['abc', 'xaybzc'],
	];
	for (const [from, to] of cases) {
		it(`${from || '(empty)'} -> ${to || '(empty)'}`, () => {
			const { ul, el, order } = setup(from.split('').filter(Boolean));
			const before = new Map(from.split('').map((k) => [k, el(k)]));
			reconcile(ul, from.split('').filter(Boolean), to.split('').filter(Boolean), el);
			assert.equal(order(), to);
			// Kept rows are moved, never recreated.
			for (const [k, node] of before) if (to.includes(k)) assert.equal(el(k), node);
		});
	}
});
