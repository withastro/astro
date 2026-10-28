import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroInstance } from 'astro';
import { resolveComponentImports } from '../dist/runtime.js';

type MarkdocConfig = Parameters<typeof resolveComponentImports>[0];
type NodeComponentMap = Parameters<typeof resolveComponentImports>[2];

// Minimal stand-in for an Astro component; only referential identity matters here.
const Component = (() => null) as unknown as AstroInstance['default'];
const noNodeComponents = {} as NodeComponentMap;

/**
 * When a custom `render` component is set, only built-in Markdoc transforms are
 * removed (they ignore `render`); user-written transforms are always preserved,
 * regardless of the tag/node name. See issues #9708, #17118, and #17458.
 */
describe('Markdoc - resolveComponentImports', () => {
	it('keeps a user-written transform for tag names that need bracket access (e.g. dashes)', () => {
		const markdocConfig: MarkdocConfig = {
			tags: {
				'side-note': {
					transform(node, config) {
						if (config.tags?.['side-note']?.render) return [];
						return node.transformChildren(config);
					},
				},
			},
			nodes: {},
		};

		const resolved = resolveComponentImports(
			markdocConfig,
			{ 'side-note': Component },
			noNodeComponents,
		);

		assert.equal(resolved.tags['side-note'].render, Component);
		assert.equal(
			typeof resolved.tags['side-note'].transform,
			'function',
			'a render-respecting transform should be preserved for dashed tag names',
		);
	});

	it('preserves a user-written transform even when it does not read render', () => {
		const markdocConfig: MarkdocConfig = {
			tags: {
				'side-note': {
					transform(node, config) {
						return node.transformChildren(config);
					},
				},
			},
			nodes: {},
		};

		const resolved = resolveComponentImports(
			markdocConfig,
			{ 'side-note': Component },
			noNodeComponents,
		);

		assert.equal(resolved.tags['side-note'].render, Component);
		assert.equal(
			typeof resolved.tags['side-note'].transform,
			'function',
			'user-written transforms are preserved; only built-in Markdoc transforms are removed',
		);
	});
});
