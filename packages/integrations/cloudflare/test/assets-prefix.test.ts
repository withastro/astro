import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('build.assetsPrefix', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/assets-prefix/' });
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build({ vite: { logLevel: 'info' } });
	});

	after(async () => {
		await fixture.clean();
	});

	it('does not create or modify _headers when assetsPrefix is set', async () => {
		assert.equal(
			fixture.pathExists('client/_headers'),
			false,
			'_headers should not be created when assetsPrefix is set',
		);
	});
});
