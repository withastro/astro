import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import cloudflare from '../dist/index.js';

describe('Cloudflare prerenderer errors', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerenderer-errors/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
	});

	after(async () => {
		await fixture.clean();
	});

	it('includes workerd error details when getStaticPaths fails', async () => {
		await assert.rejects(
			async () => {
				await fixture.build({}, { teardownCompiler: true });
			},
			(error) => {
				assert.ok(error instanceof Error);
				assert.match(
					error.message,
					/Failed to get static paths from the Cloudflare prerender server/,
				);
				assert.match(error.message, /getStaticPaths\(\).*required for dynamic routes/);
				return true;
			},
		);
	});
});
