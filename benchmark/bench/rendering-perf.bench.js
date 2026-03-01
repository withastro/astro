import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, bench, describe } from 'vitest';

/**
 * Rendering performance benchmarks targeting specific hot paths from RENDERING_PERF_PLAN.md.
 *
 * Each page isolates a different performance pattern:
 * - many-components:    #1 markHTMLString, #2 isHTMLString, #6 validateComponentProps
 * - many-expressions:   #2 isHTMLString, #5 renderChild dispatch, #10 escapeHTML
 * - many-head-elements: #3 head dedup O(N²)
 * - many-slots:         #9 eager slot prerendering
 * - large-array:        #8 BufferedRenderer per array child
 * - static-heavy:       #1 markHTMLString baseline, #11/#12 future comparison
 *
 * Requires: pnpm run build:bench
 */

const projectRoot = new URL('../projects/rendering-perf/', import.meta.url);

let streamingApp;
let nonStreamingApp;

beforeAll(async () => {
	const entry = new URL('./dist/server/entry.mjs', projectRoot);

	if (!existsSync(fileURLToPath(entry))) {
		throw new Error(
			'rendering-perf project not built. Please run `pnpm run build:bench` before running the benchmarks.',
		);
	}

	const { createApp } = await import(entry);
	streamingApp = createApp(true);
	nonStreamingApp = createApp(false);
}, 900000);

// Non-streaming (prerender path) — this is the primary target for most optimizations
// since it's the path where all the overhead is synchronous and measurable.
describe('Rendering perf (non-streaming)', () => {
	bench('many-components (markHTMLString, isHTMLString, validateProps)', async () => {
		const request = new Request(new URL('http://example.com/many-components'));
		await nonStreamingApp.render(request);
	});

	bench('many-expressions (renderChild dispatch, escapeHTML)', async () => {
		const request = new Request(new URL('http://example.com/many-expressions'));
		await nonStreamingApp.render(request);
	});

	bench('many-head-elements (head dedup)', async () => {
		const request = new Request(new URL('http://example.com/many-head-elements'));
		await nonStreamingApp.render(request);
	});

	bench('many-slots (eager slot prerendering)', async () => {
		const request = new Request(new URL('http://example.com/many-slots'));
		await nonStreamingApp.render(request);
	});

	bench('large-array (BufferedRenderer per child)', async () => {
		const request = new Request(new URL('http://example.com/large-array'));
		await nonStreamingApp.render(request);
	});

	bench('static-heavy (markHTMLString baseline)', async () => {
		const request = new Request(new URL('http://example.com/static-heavy'));
		await nonStreamingApp.render(request);
	});
});

// Streaming path — included for comparison. Optimizations to the sync path
// (#1, #2, #5, #6) should show up here too, but BufferedRenderer (#8) and
// slot prerendering (#9) may behave differently.
describe('Rendering perf (streaming)', () => {
	bench('many-components [streaming]', async () => {
		const request = new Request(new URL('http://example.com/many-components'));
		await streamingApp.render(request);
	});

	bench('many-expressions [streaming]', async () => {
		const request = new Request(new URL('http://example.com/many-expressions'));
		await streamingApp.render(request);
	});

	bench('large-array [streaming]', async () => {
		const request = new Request(new URL('http://example.com/large-array'));
		await streamingApp.render(request);
	});
});
