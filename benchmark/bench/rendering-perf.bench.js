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
 * - head-propagation-*: propagator collection in collectPropagatedHeadParts
 *
 * The head-propagation pages run at two sizes (1000 and 2000 propagating
 * <Content /> instances) so complexity-class regressions are visible: with
 * linear collection the 2000-page costs ~2x the 1000-page, while a quadratic
 * scan over the propagator set pushes that ratio toward 4x.
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

// A streaming response resolves before its body is produced, so the body must be read.
async function render(app, pathname) {
	const response = await app.render(new Request(new URL(pathname, 'http://example.com')));
	await response.text();
}

// Non-streaming (prerender path) — this is the primary target for most optimizations
// since it's the path where all the overhead is synchronous and measurable.
describe('Rendering perf (non-streaming)', () => {
	bench('many-components (markHTMLString, isHTMLString, validateProps)', async () => {
		await render(nonStreamingApp, '/many-components');
	});

	bench('many-expressions (renderChild dispatch, escapeHTML)', async () => {
		await render(nonStreamingApp, '/many-expressions');
	});

	bench('many-head-elements (head dedup)', async () => {
		await render(nonStreamingApp, '/many-head-elements');
	});

	bench('many-slots (eager slot prerendering)', async () => {
		await render(nonStreamingApp, '/many-slots');
	});

	bench('large-array (BufferedRenderer per child)', async () => {
		await render(nonStreamingApp, '/large-array');
	});

	bench('static-heavy (markHTMLString baseline)', async () => {
		await render(nonStreamingApp, '/static-heavy');
	});

	bench('head-propagation-1000 (propagator collection)', async () => {
		await render(nonStreamingApp, '/head-propagation-1000');
	});

	bench('head-propagation-2000 (propagator collection, 2x scale)', async () => {
		await render(nonStreamingApp, '/head-propagation-2000');
	});
});

// Streaming path — included for comparison. Optimizations to the sync path
// (#1, #2, #5, #6) should show up here too, but BufferedRenderer (#8) and
// slot prerendering (#9) may behave differently.
describe('Rendering perf (streaming)', () => {
	bench('many-components [streaming]', async () => {
		await render(streamingApp, '/many-components');
	});

	bench('many-expressions [streaming]', async () => {
		await render(streamingApp, '/many-expressions');
	});

	bench('large-array [streaming]', async () => {
		await render(streamingApp, '/large-array');
	});

	bench('head-propagation-2000 [streaming]', async () => {
		await render(streamingApp, '/head-propagation-2000');
	});
});
