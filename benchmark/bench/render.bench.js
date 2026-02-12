import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, bench, describe } from 'vitest';

const renderRoot = new URL('../projects/render-bench/', import.meta.url);

let streamingApp;
let nonStreamingApp;
beforeAll(async () => {
	const entry = new URL('./dist/server/entry.mjs', renderRoot);

	if (!existsSync(fileURLToPath(entry))) {
		throw new Error(
			'render-bench project not built. Please run `pnpm run build:bench` before running the benchmarks.',
		);
	}

	const { manifest, createApp } = await import(entry);
	streamingApp = createApp(manifest, true);
	nonStreamingApp = createApp(manifest, false);
}, 900000);

const queueRenderRoot = new URL('../projects/queue-render-bench/', import.meta.url);

let qStreamingApp;
let qNonStreamingApp;
beforeAll(async () => {
	const entry = new URL('./dist/server/entry.mjs', queueRenderRoot);

	if (!existsSync(fileURLToPath(entry))) {
		throw new Error(
			'queue-render-bench project not built. Please run `pnpm run build:bench` before running the benchmarks.',
		);
	}

	const { manifest, createApp } = await import(entry);
	qStreamingApp = createApp(manifest, true);
	qNonStreamingApp = createApp(manifest, false);
}, 900000);

// Benchmark each combination: streaming [true/false] × file type [.astro/.md/.mdx]
// Each combination compares Classic rendering vs Queue rendering

describe('Rendering: streaming [true], .astro file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/astro'));
		await streamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/astro'));
		await qStreamingApp.render(request);
	});
});

describe('Rendering: streaming [true], .md file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/md'));
		await streamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/md'));
		await qStreamingApp.render(request);
	});
});

describe('Rendering: streaming [true], .mdx file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/mdx'));
		await streamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/mdx'));
		await qStreamingApp.render(request);
	});
});

describe('Rendering: streaming [false], .astro file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/astro'));
		await nonStreamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/astro'));
		await qNonStreamingApp.render(request);
	});
});

describe('Rendering: streaming [false], .md file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/md'));
		await nonStreamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/md'));
		await qNonStreamingApp.render(request);
	});
});

describe('Rendering: streaming [false], .mdx file', () => {
	bench('Classic', async () => {
		const request = new Request(new URL('http://example.com/mdx'));
		await nonStreamingApp.render(request);
	});
	bench('Queue', async () => {
		const request = new Request(new URL('http://example.com/mdx'));
		await qNonStreamingApp.render(request);
	});
});
