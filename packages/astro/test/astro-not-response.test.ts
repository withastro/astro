import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Asset bundling
describe('Not returning responses', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-not-response/',
		});

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Does not work from a page', async () => {
		try {
			await fixture.build();
		} catch (e) {
			assert.equal(
				e instanceof Error,
				true,
				'Only instance of Response can be returned from an Astro file',
			);
			return;
		}

		assert.fail('Should have thrown an error');
	});
});
