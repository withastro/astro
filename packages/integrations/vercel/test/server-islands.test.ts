import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('Server Islands', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-islands/',
		});
		await fixture.build({});
	});

	it('server islands route is in the config', async () => {
		const config = await getVercelConfig(fixture);
		let found = null;
		for (const route of config.routes) {
			if (route.src?.includes('_server-islands')) {
				found = route;
				break;
			}
		}
		assert.notEqual(found, null, 'Default server islands route included');
	});
});
