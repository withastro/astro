import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveComponentImports } from '../../dist/runtime.js';

/**
 * A fake Astro component (just needs to be a truthy value for render assignment).
 */
const FakeComponent = () => {};

describe('resolveComponentImports', () => {
	it('removes built-in Markdoc transform when custom render is provided', async () => {
		// Import Markdoc to get a reference to its built-in fence transform
		const Markdoc = (await import('@markdoc/markdoc')).default;
		const markdocConfig = {
			tags: {},
			nodes: {
				fence: {
					...Markdoc.nodes.fence,
				},
			},
		};

		resolveComponentImports(markdocConfig, {}, { fence: FakeComponent });

		assert.equal(markdocConfig.nodes.fence.render, FakeComponent);
		assert.equal(
			markdocConfig.nodes.fence.transform,
			undefined,
			'Built-in Markdoc transform should be removed',
		);
	});

	it('preserves user-written transform when custom render is provided', () => {
		const userTransform = function transform(_node, config) {
			return { tag: config.tags?.myTag?.render, attrs: {} };
		};

		const markdocConfig = {
			tags: {
				myTag: {
					transform: userTransform,
				},
			},
			nodes: {},
		};

		resolveComponentImports(markdocConfig, { myTag: FakeComponent }, {});

		assert.equal(markdocConfig.tags.myTag.render, FakeComponent);
		assert.equal(
			markdocConfig.tags.myTag.transform,
			userTransform,
			'User-written transform should be preserved',
		);
	});

	it('preserves user-written transform with dashed tag name and bracket notation', () => {
		const userTransform = function transform(_node, config) {
			return { tag: config.tags?.['side-note']?.render, attrs: {} };
		};

		const markdocConfig = {
			tags: {
				'side-note': {
					transform: userTransform,
				},
			},
			nodes: {},
		};

		resolveComponentImports(markdocConfig, { 'side-note': FakeComponent }, {});

		assert.equal(markdocConfig.tags['side-note'].render, FakeComponent);
		assert.equal(
			markdocConfig.tags['side-note'].transform,
			userTransform,
			'User transform with dashed name should be preserved',
		);
	});

	it('preserves user-written transform with renamed config parameter', () => {
		const userTransform = function transform(_node, c) {
			return { tag: c.tags?.myTag?.render, attrs: {} };
		};

		const markdocConfig = {
			tags: {
				myTag: {
					transform: userTransform,
				},
			},
			nodes: {},
		};

		resolveComponentImports(markdocConfig, { myTag: FakeComponent }, {});

		assert.equal(
			markdocConfig.tags.myTag.transform,
			userTransform,
			'Transform with renamed param should be preserved',
		);
	});

	it('preserves user-written transform with non-optional chaining', () => {
		const userTransform = function transform(_node, config) {
			return { tag: config.tags.myTag.render, attrs: {} };
		};

		const markdocConfig = {
			tags: {
				myTag: {
					transform: userTransform,
				},
			},
			nodes: {},
		};

		resolveComponentImports(markdocConfig, { myTag: FakeComponent }, {});

		assert.equal(
			markdocConfig.tags.myTag.transform,
			userTransform,
			'Transform with non-optional chaining should be preserved',
		);
	});
});
