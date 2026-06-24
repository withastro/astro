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
 * Regression test for issue #17118: tag/node names containing characters that
 * require bracket access (e.g. `side-note`) were always treated as not respecting
 * `render`, because the detection only matched dot notation.
 */
describe('Markdoc - resolveComponentImports', () => {
	it('keeps a render-respecting transform for tag names that need bracket access (e.g. dashes)', () => {
		const markdocConfig: MarkdocConfig = {
			tags: {
				'side-note': {
					// A dashed key can only read `render` through bracket notation.
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

	it('removes a transform that does not respect render so the custom component wins', () => {
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
			resolved.tags['side-note'].transform,
			undefined,
			'a non-render-respecting transform should be removed so `render` wins',
		);
	});
});
