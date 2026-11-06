import * as assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import testAdapter from './test-adapter.ts';
import { loadFixture, type App, type Fixture } from './test-utils.ts';

/** Every file under `dir`, recursively. */
async function listFiles(dir: URL): Promise<URL[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map((entry) => {
			const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
			return entry.isDirectory() ? listFiles(url) : [url];
		}),
	);
	return files.flat();
}

// `render` from `astro:content` dynamically imports every renderable entry. When no
// server-rendered route uses it, the server bundle must not keep it, or each entry
// rendered only by prerendered pages is compiled into the server output.
describe('Content render() tree-shaking in the server bundle', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-render-tree-shaking/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('renders entries on prerendered pages', async () => {
		const html = await fixture.readFile('/client/posts/first/index.html');
		assert.match(html, /PRERENDER_ONLY_POST_BODY_FIRST/);
	});

	it('serves the server-rendered page that only reads collection data', async () => {
		const response = await app.render(new Request('http://example.com/list'));
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /First post/);
		assert.match(html, /Second post/);
	});

	it('does not compile prerender-only entries into the server bundle', async () => {
		const serverDir = new URL('./server/', fixture.config.outDir);
		const files = (await listFiles(serverDir)).filter((file) => /\.m?js$/.test(file.pathname));
		assert.ok(files.length > 0, 'expected server output');
		for (const file of files) {
			const code = await readFile(file, 'utf8');
			assert.doesNotMatch(
				code,
				/PRERENDER_ONLY_POST_BODY/,
				`${fileURLToPath(file)} contains an entry that only prerendered pages render`,
			);
		}
	});
});
