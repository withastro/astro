import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import rehypeMetaString from '../../dist/rehype-meta-string.js';
import { rehypeInjectHeadingsExport } from '../../dist/rehype-collect-headings.js';

describe('rehypeMetaString', () => {
	function createCodeNode(meta) {
		return {
			type: 'element',
			tagName: 'code',
			properties: {},
			data: meta != null ? { meta } : undefined,
			children: [{ type: 'text', value: 'const x = 1;' }],
		};
	}

	function createTree(children) {
		return { type: 'root', children };
	}

	it('copies data.meta to properties.metastring', () => {
		const codeNode = createCodeNode('{1:3}');
		const tree = createTree([
			{
				type: 'element',
				tagName: 'pre',
				properties: {},
				children: [codeNode],
			},
		]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(codeNode.properties.metastring, '{1:3}');
	});

	it('does not set metastring when no data.meta', () => {
		const codeNode = createCodeNode(undefined);
		// Ensure no data property at all
		delete codeNode.data;
		const tree = createTree([codeNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(codeNode.properties.metastring, undefined);
	});

	it('handles code elements without properties', () => {
		const codeNode = {
			type: 'element',
			tagName: 'code',
			data: { meta: 'title="test"' },
			children: [],
		};
		const tree = createTree([codeNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(codeNode.properties.metastring, 'title="test"');
	});

	it('ignores non-code elements', () => {
		const divNode = {
			type: 'element',
			tagName: 'div',
			properties: {},
			data: { meta: 'should-not-copy' },
			children: [],
		};
		const tree = createTree([divNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(divNode.properties.metastring, undefined);
	});
});

describe('rehypeInjectHeadingsExport', () => {
	it('injects getHeadings export from vfile headings data', () => {
		const headings = [
			{ depth: 1, slug: 'hello', text: 'Hello' },
			{ depth: 2, slug: 'world', text: 'World' },
		];

		const tree = { type: 'root', children: [] };
		const vfile = {
			data: {
				astro: { headings },
			},
		};

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 1);
		const injectedNode = tree.children[0];
		assert.equal(injectedNode.type, 'mdxjsEsm');
		// The node should contain a getHeadings function with our headings data
		assert.ok(injectedNode.data.estree);
		assert.equal(injectedNode.data.estree.type, 'Program');
	});

	it('injects empty array when no headings', () => {
		const tree = { type: 'root', children: [] };
		const vfile = {
			data: {
				astro: {},
			},
		};

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 1);
		const injectedNode = tree.children[0];
		assert.equal(injectedNode.type, 'mdxjsEsm');
	});

	it('prepends to existing children', () => {
		const existingChild = { type: 'element', tagName: 'p', children: [] };
		const tree = { type: 'root', children: [existingChild] };
		const vfile = {
			data: {
				astro: { headings: [] },
			},
		};

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 2);
		assert.equal(tree.children[0].type, 'mdxjsEsm');
		assert.equal(tree.children[1], existingChild);
	});
});
