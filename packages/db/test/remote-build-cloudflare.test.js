import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../../integrations/cloudflare/dist/index.js';
import { loadFixture } from '../../astro/test/test-utils.js';
import { clearEnvironment } from './test-utils.js';

describe('astro:db remote build with Cloudflare adapter', () => {
	let fixture;
	let resetIndexPage;
	let resetRunPage;

	before(async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://example.turso.io';
		process.env.ASTRO_DB_APP_TOKEN = 'test-token';
		process.env.ASTRO_INTERNAL_TEST_REMOTE = 'true';

		fixture = await loadFixture({
			root: new URL('./fixtures/static-remote/', import.meta.url),
			output: 'static',
			adapter: cloudflare(),
		});

		resetIndexPage = await fixture.editFile(
			'/src/pages/index.astro',
			`<html>
	<head>
		<title>Remote Build</title>
	</head>
	<body>
		<h1>Cloudflare remote build works</h1>
	</body>
</html>
`,
			false,
		);
		resetRunPage = await fixture.editFile(
			'/src/pages/run.astro',
			`<html>
	<head>
		<title>Remote Build</title>
	</head>
	<body>
		<h1>Cloudflare remote build works</h1>
	</body>
</html>
`,
			false,
		);
	});

	after(async () => {
		resetRunPage?.();
		resetIndexPage?.();
		clearEnvironment();
		await fixture?.clean();
	});

	it('builds without throwing an invalid manifest URL error', async () => {
		await assert.doesNotReject(async () => {
			await fixture.build();
		});

		const html = await fixture.readFile('/client/index.html');
		assert.match(html, /Cloudflare remote build works/);
	});
});
