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

	const { createApp } = await import(entry);
	streamingApp = createApp(true);
	nonStreamingApp = createApp(false);
}, 900000);

// A streaming response resolves before its body is produced, so the body must be read.
async function render(app, pathname) {
	const response = await app.render(new Request(new URL(pathname, 'http://example.com')));
	await response.text();
}

describe('Bench rendering', () => {
	bench('Rendering: streaming [true], .astro file', async () => {
		await render(streamingApp, '/astro');
	});
	bench('Rendering: streaming [true], .md file', async () => {
		await render(streamingApp, '/md');
	});
	bench('Rendering: streaming [true], .mdx file', async () => {
		await render(streamingApp, '/mdx');
	});

	bench('Rendering: streaming [false], .astro file', async () => {
		await render(nonStreamingApp, '/astro');
	});
	bench('Rendering: streaming [false], .md file', async () => {
		await render(nonStreamingApp, '/md');
	});
	bench('Rendering: streaming [false], .mdx file', async () => {
		await render(nonStreamingApp, '/mdx');
	});
});
