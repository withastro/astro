import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, bench, describe } from 'vitest';

const queueRenderRoot = new URL('../projects/queue-render-bench/', import.meta.url);

let app;
beforeAll(async () => {
	const entry = new URL('./dist/server/entry.mjs', queueRenderRoot);

	if (!existsSync(fileURLToPath(entry))) {
		throw new Error(
			'queue-render-bench project not built. Please run `pnpm run build:bench` before running the benchmarks.',
		);
	}

	const { manifest, createApp } = await import(entry);
	app = createApp(manifest, false);
}, 900000);

describe('Bench queue-based rendering', () => {
	bench('Queue rendering: .astro file', async () => {
		const request = new Request(new URL('http://example.com/astro'));
		await app.render(request);
	});
});
