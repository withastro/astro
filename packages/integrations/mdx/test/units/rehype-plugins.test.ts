import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as hast from 'hast';
import { VFile } from 'vfile';
import { rehypeInjectHeadingsExport } from '../../dist/rehype-collect-headings.js';
import rehypeMetaString from '../../dist/rehype-meta-string.js';

describe('rehypeMetaString', () => {
	function createCodeNode(meta: string | undefined): hast.Element {
		return {
			type: 'element',
			tagName: 'code',
			data: meta != null ? { meta } : undefined,
			children: [{ type: 'text', value: 'const x = 1;' }],
			position: undefined,
			properties: {},
		};
	}

	function createTree(children: hast.RootContent[]): hast.Root {
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

		assert.equal(codeNode.properties!.metastring, '{1:3}');
	});

	it('does not set metastring when no data.meta', () => {
		const codeNode = createCodeNode(undefined);
		// Ensure no data property at all
		delete codeNode.data;
		const tree = createTree([codeNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(codeNode.properties!.metastring, undefined);
	});

	it('handles code elements without properties', () => {
		const codeNode: hast.Element = {
			type: 'element',
			tagName: 'code',
			data: { meta: 'title="test"' },
			children: [],
			position: undefined,
			properties: {},
		};
		const tree = createTree([codeNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(codeNode.properties!.metastring, 'title="test"');
	});

	it('ignores non-code elements', () => {
		const divNode: hast.Element = {
			type: 'element',
			tagName: 'div',
			properties: {},
			data: { meta: 'should-not-copy' },
			children: [],
		};
		const tree = createTree([divNode]);

		const transform = rehypeMetaString();
		transform(tree);

		assert.equal(divNode.properties!.metastring, undefined);
	});
});

describe('rehypeInjectHeadingsExport', () => {
	it('injects getHeadings export from vfile headings data', () => {
		const headings = [
			{ depth: 1, slug: 'hello1', text: 'Hello2' },
			{ depth: 2, slug: 'world3', text: 'World4' },
		];

		const tree: hast.Root = { type: 'root', children: [] };
		const vfile = new VFile({
			data: {
				astro: {
					headings,
				},
			},
		});

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 1);
		const injectedNode = tree.children[0] as hast.Element & {
			data: { estree: { type: string; body: unknown } };
		};
		assert.equal(injectedNode.type, 'mdxjsEsm');
		// The node should contain a getHeadings function with our headings data
		assert.ok(injectedNode.data.estree);
		assert.equal(injectedNode.data.estree.type, 'Program');
		// The function should contain the injected heading data
		const functionBody = JSON.stringify(injectedNode.data.estree.body);
		assert.match(functionBody, /hello1/);
		assert.match(functionBody, /Hello2/);
		assert.match(functionBody, /world3/);
		assert.match(functionBody, /World4/);
	});

	it('injects empty array when no headings', () => {
		const tree: hast.Root = { type: 'root', children: [] };
		const vfile = new VFile({
			data: {
				astro: {},
			},
		});

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 1);
		const injectedNode = tree.children[0];
		assert.equal(injectedNode.type, 'mdxjsEsm');
	});

	it('prepends to existing children', () => {
		const existingChild: hast.Element = {
			type: 'element',
			tagName: 'p',
			children: [],
			position: undefined,
			properties: {},
		};
		const tree: hast.Root = { type: 'root', children: [existingChild] };
		const vfile = new VFile({
			data: {
				astro: { headings: [] },
			},
		});

		const transform = rehypeInjectHeadingsExport();
		transform(tree, vfile);

		assert.equal(tree.children.length, 2);
		assert.equal(tree.children[0].type, 'mdxjsEsm');
		assert.equal(tree.children[1], existingChild);
	});
});
