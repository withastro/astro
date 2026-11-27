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

	it('maps for attribute to htmlFor', () => {
		const [labelVNode] = convert('<label for="name">Name</label>');
		assert.equal(labelVNode.props.htmlFor, 'name');
		assert.equal(labelVNode.props.for, undefined);
	});

	it('passes boolean attributes written without a value as true', () => {
		const [detailsVNode, buttonVNode, imgVNode] = convert(
			'<details open></details><button disabled>Send</button><img alt="" src="a.png">',
		);
		assert.equal(detailsVNode.props.open, true);
		assert.equal(buttonVNode.props.disabled, true);
		assert.equal(imgVNode.props.alt, '');
	});

	it('passes inert written without a value as true on React 19', () => {
		const [divVNode] = convert('<div inert><button>Send</button></div>');
		assert.equal(divVNode.props.inert, true);
	});

	it('passes input value and checked attributes as default props', () => {
		const [textVNode, checkboxVNode, optionVNode] = convert(
			'<input value="Hello"><input type="checkbox" value="yes" checked><option value="a" selected>A</option>',
		);
		assert.equal(textVNode.props.defaultValue, 'Hello');
		assert.equal(textVNode.props.value, undefined);
		assert.equal(checkboxVNode.props.defaultChecked, true);
		assert.equal(checkboxVNode.props.checked, undefined);
		assert.equal(checkboxVNode.props.value, 'yes');
		assert.equal(optionVNode.props.value, 'a');
		assert.equal(optionVNode.props.selected, true);
	});

	it('keeps the value of submit inputs', () => {
		const [submitVNode, emptyTypeVNode] = convert(
			'<input type="submit" value="Publish"><input type="" value="Hello">',
		);
		assert.equal(submitVNode.props.value, 'Publish');
		assert.equal(submitVNode.props.defaultValue, undefined);
		assert.equal(emptyTypeVNode.props.defaultValue, 'Hello');
	});

	it('keeps the attributes of custom elements as written', () => {
		const [customVNode, customizedVNode] = convert(
			'<x-toggle class="on" disabled for="name"></x-toggle><label is="x-label" for="name">Name</label>',
		);
		assert.equal(customVNode.props.className, 'on');
		assert.equal(customVNode.props.disabled, '');
		assert.equal(customVNode.props.for, 'name');
		assert.equal(customizedVNode.props.for, 'name');
	});

	it('decodes character references in text and attribute values', () => {
		const [pVNode] = convert(
			'<p title="Tom &amp; Jerry&#39;s">Don&#39;t panic &amp; carry&nbsp;on &copy;</p>',
		);
		assert.equal(pVNode.props.title, "Tom & Jerry's");
		assert.deepEqual(pVNode.props.children, ["Don't panic & carry\u00a0on ©"]);
	});

	it('keeps text inside script and style elements as written', () => {
		const [scriptVNode, styleVNode] = convert(
			'<script>a = "&amp;";</script><STYLE>a::after { content: "&amp;"; }</STYLE>',
		);
		assert.deepEqual(scriptVNode.props.children, ['a = "&amp;";']);
		assert.deepEqual(styleVNode.props.children, ['a::after { content: "&amp;"; }']);
	});
});
