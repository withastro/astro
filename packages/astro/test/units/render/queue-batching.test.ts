import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createKey } from '../../../dist/core/encryption.js';
import type { SSRResult } from '../../../dist/types/public/internal.js';
import type {
	RenderDestination,
	RenderDestinationChunk,
} from '../../../dist/runtime/server/render/common.js';
import { buildRenderQueue } from '../../../dist/runtime/server/render/queue/builder.js';
import { renderQueue } from '../../../dist/runtime/server/render/queue/renderer.js';
import { NodePool } from '../../../dist/runtime/server/render/queue/pool.js';
import { markHTMLString } from '../../../dist/runtime/server/index.js';

async function createMockResult(): Promise<SSRResult> {
	const key = await createKey();
	return {
		cancelled: false,
		base: '/',
		userAssetsBase: undefined,
		styles: new Set(),
		scripts: new Set(),
		links: new Set(),
		componentMetadata: new Map(),
		inlinedScripts: new Map(),
		createAstro() {
			throw new Error('createAstro() not available in unit tests');
		},
		params: {},
		resolve: async (s: string) => s,
		response: { status: 200, statusText: 'OK', headers: new Headers() },
		request: new Request('http://localhost/'),
		renderers: [],
		clientDirectives: new Map(),
		compressHTML: false,
		partial: false,
		pathname: '/',
		cookies: undefined,
		serverIslandNameMap: new Map(),
		trailingSlash: 'never',
		key: Promise.resolve(key),
		_metadata: {
			hasHydrationScript: false,
			rendererSpecificHydrationScripts: new Set<string>(),
			hasRenderedHead: false,
			renderedScripts: new Set<string>(),
			hasDirectives: new Set<string>(),
			hasRenderedServerIslandRuntime: false,
			headInTree: false,
			extraHead: [],
			extraStyleHashes: [],
			extraScriptHashes: [],
			propagators: new Set(),
		},
		cspDestination: 'header',
		shouldInjectCspMetaTags: false,
		cspAlgorithm: 'SHA-256',
		scriptHashes: [],
		scriptResources: [],
		styleHashes: [],
		styleResources: [],
		directives: [],
		isStrictDynamic: false,
		internalFetchHeaders: {},
	};
}

// Create a NodePool for testing
function createMockPool() {
	return new NodePool(1000);
}

describe('Queue batching optimization', () => {
	it('should batch consecutive text nodes', async () => {
		const result = await createMockResult();
		const pool = createMockPool();
		const items = ['Hello', ' ', 'world', '!'];

		const queue = await buildRenderQueue(items, result, pool);

		// All text nodes should be in the queue
		assert.equal(queue.nodes.length, 4);
		assert.equal(
			queue.nodes.every((n) => n.type === 'text'),
			true,
		);

		// When rendered, they should be batched into one write
		let writeCount = 0;
		let output = '';
		const destination: RenderDestination = {
			write(chunk: RenderDestinationChunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		assert.equal(output, 'Hello world!');
		assert.equal(writeCount, 1); // All 4 nodes batched into 1 write!
	});

	it('should batch consecutive html-string nodes', async () => {
		const result = await createMockResult();
		const pool = createMockPool();

		const items = [markHTMLString('<div>'), markHTMLString('content'), markHTMLString('</div>')];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination: RenderDestination = {
			write(chunk: RenderDestinationChunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// Should batch into single write
		assert.equal(writeCount, 1, 'Should batch consecutive html-string nodes');
		assert.equal(output, '<div>content</div>');
	});

	it('should NOT batch across component boundaries', async () => {
		const result = await createMockResult();
		const pool = createMockPool();

		// Create a simple component
		const componentInstance = {
			render(dest: RenderDestination) {
				dest.write('<p>Component</p>');
			},
		};

		const items = ['before', componentInstance, 'after'];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination: RenderDestination = {
			write(chunk: RenderDestinationChunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// Should have 3 writes: batched 'before', component output, batched 'after'
		assert.equal(writeCount, 3, 'Should NOT batch across component boundaries');
		assert.equal(output, 'before<p>Component</p>after');
	});

	it('should demonstrate performance improvement with large arrays', async () => {
		const result = await createMockResult();
		const pool = createMockPool();

		// Create a large array of text items (simulating a list)
		const items = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);

		const queue = await buildRenderQueue(items, result, pool);

		assert.equal(queue.nodes.length, 1000);

		let writeCount = 0;
		const destination: RenderDestination = {
			write() {
				writeCount++;
			},
		};

		await renderQueue(queue, destination);

		// With batching: 1 write (all text nodes batched together)
		// Without batching: 1000 writes (one per node)
		assert.equal(writeCount, 1, 'Should batch 1000 text nodes into 1 write (99.9% reduction!)');
	});

	it('should batch mixed text and html-string nodes', async () => {
		const result = await createMockResult();
		const pool = createMockPool();

		const items = [
			'Text 1',
			markHTMLString('<b>Bold</b>'),
			'Text 2',
			markHTMLString('<i>Italic</i>'),
		];

		const queue = await buildRenderQueue(items, result, pool);

		let writeCount = 0;
		let output = '';
		const destination: RenderDestination = {
			write(chunk: RenderDestinationChunk) {
				writeCount++;
				output += String(chunk);
			},
		};

		await renderQueue(queue, destination);

		// All should be batched since they're all batchable types
		assert.equal(writeCount, 1);
		assert.equal(output, 'Text 1<b>Bold</b>Text 2<i>Italic</i>');
	});
});
