import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, isMacOS, loadFixture } from './test-utils.ts';

// TODO: fix this tests in macOS
if (!isMacOS) {
	describe('<Debug />', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/debug-component/',
				outDir: './dist/debug-component/',
			});
			await fixture.build();
		});

		it('Works in markdown pages', async () => {
			const html = await fixture.readFile('/posts/first/index.html');
			assert.ok(html, 'Page should build successfully');
		});
	});
}
