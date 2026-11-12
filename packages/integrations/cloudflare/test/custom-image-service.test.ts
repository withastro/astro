import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Custom image service endpoint in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-image-service/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('/_image does not 500 from workerd-incompatible imports', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=webp');
		assert.notEqual(
			res.status,
			500,
			`/_image returned 500: ${(await res.text()).substring(0, 300)}`,
		);
	});

	it('returns 200 for valid local image transform', async () => {
		const res = await fixture.fetch('/_image?href=/placeholder.jpg&f=webp&w=100');
		assert.equal(res.status, 200);
	});
});
