import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import cloudflare from '../dist/index.js';

describe('Cloudflare prerenderer render errors', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerenderer-render-errors/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
	});

	after(async () => {
		await fixture.clean();
	});

	it('fails the build when a component throws during rendering', async () => {
		await assert.rejects(
			async () => {
				await fixture.build({}, { teardownCompiler: true });
			},
			(error) => {
				assert.ok(error instanceof Error);
				assert.match(
					error.message,
					/Failed to prerender page from the Cloudflare prerender server/,
				);
				return true;
			},
		);
	});
});
