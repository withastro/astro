import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import astro from '../dist/index.js';

const root = fileURLToPath(new URL('./fixtures/public-script/', import.meta.url));

describe('<script src> with a root-relative path', () => {
	let server: ViteDevServer;

	before(async () => {
		server = await createServer({
			configFile: false,
			logLevel: 'silent',
			root,
			server: { middlewareMode: true, ws: false },
			plugins: [astro()],
		});
	});

	after(async () => {
		await server.close();
	});

	/** Compiles `component`, then loads its first `<script>` module in the client environment. */
	async function loadScript(component: string) {
		const client = server.environments.client;
		await client.transformRequest(`/src/${component}`);
		return client.transformRequest(`/src/${component}?astro&type=script&index=0&lang.ts`);
	}

	it('bundles a source file', async () => {
		const result = await loadScript('Bundled.astro');
		assert.match(result?.code ?? '', /local\.ts/);
	});

	it('bundles a project file outside src/', async () => {
		const result = await loadScript('Lib.astro');
		assert.match(result?.code ?? '', /util\.ts/);
	});

	it('errors on a file in publicDir', async () => {
		await assert.rejects(
			loadScript('Public.astro'),
			/references an asset in the "public\/" directory/,
		);
	});
});
