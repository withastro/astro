/**
 * Hand-rolled rendering profiler for comparing branches.
 *
 * Usage (from benchmark/):
 *   node bench/profile-render.mjs [--iterations=10000] [--warmup=1000] [--label=advanced]
 *
 * Requires `pnpm build:bench` to have been run first so the render-bench
 * project is built.
 *
 * Runs each of the 6 scenarios from render.bench.js (streaming x 3 files
 * + non-streaming x 3 files), records per-request timing, and prints a
 * per-scenario summary (mean, median, p95, p99, stddev) plus a total.
 *
 * Output is tab-separated so two runs (one per branch) can be diffed
 * quickly.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		iterations: { type: 'string', default: '5000' },
		warmup: { type: 'string', default: '500' },
		label: { type: 'string', default: 'run' },
	},
});

const ITERATIONS = Number(values.iterations);
const WARMUP = Number(values.warmup);
const LABEL = values.label;

const renderRoot = new URL('../projects/render-bench/', import.meta.url);
const entry = new URL('./dist/server/entry.mjs', renderRoot);

if (!existsSync(fileURLToPath(entry))) {
	console.error(
		'render-bench project not built. Run `pnpm build:bench` from benchmark/ first.',
	);
	process.exit(1);
}

const { manifest, createApp } = await import(entry.href);

const scenarios = [
	{ name: 'streaming=true, .astro', streaming: true, path: '/astro' },
	{ name: 'streaming=true, .md', streaming: true, path: '/md' },
	{ name: 'streaming=true, .mdx', streaming: true, path: '/mdx' },
	{ name: 'streaming=false, .astro', streaming: false, path: '/astro' },
	{ name: 'streaming=false, .md', streaming: false, path: '/md' },
	{ name: 'streaming=false, .mdx', streaming: false, path: '/mdx' },
];

/** @param {number[]} xs */
function stats(xs) {
	const sorted = [...xs].sort((a, b) => a - b);
	const n = sorted.length;
	const mean = sorted.reduce((a, b) => a + b, 0) / n;
	const median = sorted[Math.floor(n / 2)];
	const p95 = sorted[Math.floor(n * 0.95)];
	const p99 = sorted[Math.floor(n * 0.99)];
	const min = sorted[0];
	const max = sorted[n - 1];
	const variance = sorted.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
	const stddev = Math.sqrt(variance);
	return { mean, median, p95, p99, min, max, stddev };
}

async function runScenario(app, path, count) {
	const timings = new Float64Array(count);
	const url = `http://example.com${path}`;
	for (let i = 0; i < count; i++) {
		const req = new Request(url);
		const t0 = performance.now();
		const res = await app.render(req);
		// Drain body — for streaming cases the server work isn't done
		// until the body has been consumed.
		await res.text();
		timings[i] = performance.now() - t0;
	}
	return Array.from(timings);
}

console.log(`# label=${LABEL} iterations=${ITERATIONS} warmup=${WARMUP} node=${process.version}`);
console.log(
	[
		'scenario',
		'mean_ms',
		'median_ms',
		'p95_ms',
		'p99_ms',
		'min_ms',
		'max_ms',
		'stddev_ms',
	].join('\t'),
);

const allTimings = [];
for (const scenario of scenarios) {
	const app = createApp(manifest, scenario.streaming);
	// Warmup — discarded.
	await runScenario(app, scenario.path, WARMUP);
	// Measure.
	const timings = await runScenario(app, scenario.path, ITERATIONS);
	allTimings.push(...timings);
	const s = stats(timings);
	console.log(
		[
			scenario.name,
			s.mean.toFixed(4),
			s.median.toFixed(4),
			s.p95.toFixed(4),
			s.p99.toFixed(4),
			s.min.toFixed(4),
			s.max.toFixed(4),
			s.stddev.toFixed(4),
		].join('\t'),
	);
}

const total = stats(allTimings);
console.log(
	[
		'TOTAL',
		total.mean.toFixed(4),
		total.median.toFixed(4),
		total.p95.toFixed(4),
		total.p99.toFixed(4),
		total.min.toFixed(4),
		total.max.toFixed(4),
		total.stddev.toFixed(4),
	].join('\t'),
);
