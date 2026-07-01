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

describe('Bench rendering', () => {
	bench('Rendering: streaming [true], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await streamingApp.render(request);
	});
	bench('Rendering: streaming [true], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await streamingApp.render(request);
	});
	bench('Rendering: streaming [true], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await streamingApp.render(request);
	});

	bench('Rendering: streaming [false], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await nonStreamingApp.render(request);
	});
	bench('Rendering: streaming [false], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await nonStreamingApp.render(request);
	});
	bench('Rendering: streaming [false], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await nonStreamingApp.render(request);
	});
});
