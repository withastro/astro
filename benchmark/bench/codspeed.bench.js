import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { beforeAll, bench, describe } from 'vitest';

const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));
const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));
const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));
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

describe('Bench build time', () => {
	bench(
		'Build: full static site',
		async () => {
			await build({
				root: staticRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);

	bench(
		'Build: hybrid site (static + server)',
		async () => {
			await build({
				root: hybridRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);

	bench(
		'Build: full server site',
		async () => {
			await build({
				root: serverRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
