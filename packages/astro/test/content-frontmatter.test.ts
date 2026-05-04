import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('frontmatter (loadFixture)', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let blogPath: string;
	let originalContent: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-frontmatter/',
		});
		blogPath = path.join(fileURLToPath(fixture.config.root), 'src/content/posts/blog.md');
		originalContent = fs.readFileSync(blogPath, 'utf-8');
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
		fs.writeFileSync(blogPath, originalContent);
	});

	it('errors in content/ does not crash server', { timeout: 2000 }, async () => {
		// Verify server is alive
		const res1 = await fixture.fetch('/');
		assert.equal(res1.status, 200);

		// Write invalid frontmatter (duplicate YAML key)
		try {
			fs.writeFileSync(blogPath, `---\ntitle: One\ntitle: two\n---\n`);
			//
			// // Give the watcher time to pick up the change
			await new Promise((resolve) => setTimeout(resolve, 1000));
			//
			// // The server should still be alive
			const res2 = await fixture.fetch('/');
			assert.equal(res2.status, 200, 'Server should still respond after a content error');
		} catch (err) {
			assert.fail(err as Error);
		}
	});
});
