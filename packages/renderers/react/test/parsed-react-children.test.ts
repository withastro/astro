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

	it('decodes character references in text and attribute values', () => {
		const [pVNode] = convert(
			'<p title="Tom &amp; Jerry&#39;s">Don&#39;t panic &amp; carry&nbsp;on &copy;</p>',
		);
		assert.equal(pVNode.props.title, "Tom & Jerry's");
		assert.deepEqual(pVNode.props.children, ["Don't panic & carry\u00a0on ©"]);
	});

	it('keeps a space between inline elements', () => {
		const [pVNode] = convert('<p><strong>Hello</strong> <em>world</em></p>');
		const [strongVNode, space, emVNode] = pVNode.props.children;
		assert.equal(pVNode.props.children.length, 3);
		assert.equal(strongVNode.type, 'strong');
		assert.equal(space, ' ');
		assert.equal(emVNode.type, 'em');
	});

	it('keeps whitespace inside elements', () => {
		const [preVNode] = convert('<pre><b>A</b>\n<b>B</b></pre>');
		assert.equal(preVNode.props.children.length, 3);
		assert.equal(preVNode.props.children[1], '\n');
	});

	it('drops the line break that directly follows a pre start tag, as browsers do', () => {
		const [preVNode] = convert('<pre>\n\n<b>A</b></pre>');
		assert.equal(preVNode.props.children.length, 2);
		assert.equal(preVNode.props.children[0], '\n');
	});

	it('skips whitespace-only text between top-level children', () => {
		const children = convert('\n\t<span>A</span>\n\t<span>B</span>&nbsp;\n');
		assert.equal(children.length, 3);
		assert.equal(children[0].type, 'span');
		assert.equal(children[1].type, 'span');
		assert.equal(children[2], '\u00a0\n');
	});

	it('keeps an encoded space between top-level children', () => {
		const children = convert('<b>A</b>&#32;<i>B</i>');
		assert.equal(children.length, 3);
		assert.equal(children[1], ' ');
	});

	it('keeps text inside script and style elements as written', () => {
		const [scriptVNode, styleVNode] = convert(
			'<script>a = "&amp;";</script><STYLE>a::after { content: "&amp;"; }</STYLE>',
		);
		assert.deepEqual(scriptVNode.props.children, ['a = "&amp;";']);
		assert.deepEqual(styleVNode.props.children, ['a::after { content: "&amp;"; }']);
	});
});
