import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroInstance } from 'astro';
import { resolveComponentImports } from '../../dist/runtime.js';

type MarkdocConfig = Parameters<typeof resolveComponentImports>[0];
type NodeComponentMap = Parameters<typeof resolveComponentImports>[2];

const Component = (() => null) as unknown as AstroInstance['default'];
const noNodeComponents = {} as NodeComponentMap;

describe('Markdoc - resolveComponentImports', () => {
	it('keeps a render-respecting transform for tag names that need bracket access', () => {
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

	it('keeps a render-respecting transform using dot notation', () => {
		const markdocConfig: MarkdocConfig = {
			tags: {
				sidenote: {
					transform(node, config) {
						if (config.tags?.sidenote?.render) return [];
						return node.transformChildren(config);
					},
				},
			},
			nodes: {},
		};

		const resolved = resolveComponentImports(
			markdocConfig,
			{ sidenote: Component },
			noNodeComponents,
		);

		assert.equal(resolved.tags['sidenote'].render, Component);
		assert.equal(
			typeof resolved.tags['sidenote'].transform,
			'function',
			'a render-respecting transform should be preserved for simple tag names',
		);
	});
});
