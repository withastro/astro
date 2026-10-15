import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import StaticHtml from '../../dist/static-html.js';

describe('StaticHtml', () => {
	it('passes slot HTML given as a String object to innerHTML as a primitive string', () => {
		const render = (StaticHtml as any).setup(
			{ value: new String('<p>slot</p>'), name: 'actions', hydrate: true },
			{},
		);
		const vnode = render();
		assert.equal(typeof vnode.props.innerHTML, 'string');
		assert.equal(vnode.props.innerHTML, '<p>slot</p>');
		assert.equal(vnode.type, 'astro-slot');
	});
});
