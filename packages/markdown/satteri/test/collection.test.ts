import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MdastPluginDefinition } from 'satteri';
import { satteri } from '../dist/index.js';

const collection = {
	name: 'docs',
	type: 'build-time',
	loader: { name: 'docs-loader' },
	descriptors: { library: 'docs' },
} as const;

describe('collection metadata', () => {
	function createSpy() {
		const seen: unknown[] = [];
		const plugin: MdastPluginDefinition = {
			name: 'collection-spy',
			heading(_node, ctx) {
				seen.push(ctx.data.astro?.collection);
			},
		};
		return { seen, plugin };
	}

	it('exposes the collection of a Markdown entry to plugins', async () => {
		const { seen, plugin } = createSpy();
		const renderer = await satteri({ mdastPlugins: [plugin] }).createRenderer({});

		await renderer.render('# Hello', { collection });
		await renderer.render('# Hello');

		assert.deepEqual(seen, [collection, undefined]);
	});

	it('exposes the collection of an MDX file to plugins', async () => {
		const { seen, plugin } = createSpy();
		const renderer = await satteri({ mdastPlugins: [plugin] }).createMdxRenderer!(
			{ syntaxHighlight: false, shikiConfig: {} },
			{ optimize: false },
		);

		await renderer.process('# Hello', '/project/src/docs/intro.mdx', {}, { collection });

		assert.deepEqual(seen, [collection]);
	});
});
