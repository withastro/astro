import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import convert from '../dist/vnode-children.js';

describe('experimental react children', () => {
	it('has undefined as children for direct children', () => {
		const [imgVNode] = convert('<img src="abc"></img>');
		assert.deepEqual(imgVNode.props.children, undefined);
	});

	it('has undefined as children for nested children', () => {
		const [divVNode] = convert('<div><img src="xyz"></img></div>');
		const [imgVNode] = divVNode.props.children;
		assert.deepEqual(imgVNode.props.children, undefined);
	});

	it('maps class attribute to className', () => {
		const [spanVNode] = convert('<span class="title">Hello</span>');
		assert.equal(spanVNode.props.className, 'title');
		assert.equal(spanVNode.props.class, undefined);
	});

	it('generates unique keys for children', () => {
		const children = convert('<span class="first">A</span><span class="second">B</span>');
		assert.equal(children.length, 2);
		assert.ok(children[0].key, 'First child should have a key');
		assert.ok(children[1].key, 'Second child should have a key');
		assert.notEqual(children[0].key, children[1].key, 'Children should have unique keys');
	});

	it('preserves other attributes alongside className', () => {
		const [spanVNode] = convert('<span class="title" id="main" data-test="value">Hello</span>');
		assert.equal(spanVNode.props.className, 'title');
		assert.equal(spanVNode.props.id, 'main');
		assert.equal(spanVNode.props['data-test'], 'value');
	});
});
