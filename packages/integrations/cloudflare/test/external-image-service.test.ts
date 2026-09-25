import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('ExternalImageService', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-image-service/',
		});
		await fixture.build();
	});

	after(async () => {
		// await fixture.clean();
	});

	it('has correct image service', async () => {
		const files = await fixture.glob('server/**/image-service*');
		// the image service seems to be bundled inside the entry point
		const outFileToCheck = await fixture.readFile(files[0]);
		assert.equal(outFileToCheck.includes('cdn-cgi/image'), true);
	});
});

describe('ExternalImageService dev mode', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-image-service/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('does not generate /cdn-cgi/image/ URLs in dev mode', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		assert.ok(!html.includes('/cdn-cgi/image/'), 'expected no cdn-cgi URL in dev mode');
	});
});
