import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { globalContentLayer } from '../../../dist/content/instance.js';
import { syncInternal } from '../../../dist/core/sync/index.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';

describe('syncInternal content layer cleanup', () => {
	after(() => {
		globalContentLayer.dispose();
	});

	it('releases the global content layer after a build sync', async () => {
		const fixture = await createFixture({
			'src/content.config.ts': `export const collections = {
				posts: { loader: () => [{ id: 'one' }] },
			};`,
		});
		const settings = await createBasicSettings({ root: fixture.path });

		await syncInternal({
			settings,
			logger: defaultLogger,
			mode: 'production',
			command: 'build',
		});

		assert.equal(globalContentLayer.get(), null);
	});

	it('keeps the global content layer when cleanup is skipped', async () => {
		const fixture = await createFixture({
			'src/content.config.ts': `export const collections = {
				posts: { loader: () => [{ id: 'one' }] },
			};`,
		});
		const settings = await createBasicSettings({ root: fixture.path });

		await syncInternal({
			settings,
			logger: defaultLogger,
			mode: 'production',
			command: 'build',
			skip: { cleanup: true },
		});

		assert.notEqual(globalContentLayer.get(), null);
	});
});
