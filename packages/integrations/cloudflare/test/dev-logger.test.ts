import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Regression test for #17823: in dev, a non-runnable adapter boots the app through
// `astro/app/entrypoint/dev`, which built the console logger with the manifest's log
// level passed positionally. `createConsoleLogger` destructures `{ level }`, so the
// logger ended up with `level: undefined` and `isLogLevelEnabled` silently dropped
// every record — `Astro.logger` produced no output at all.
describe('Astro.logger in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		// `loadFixture` defaults fixtures to `logLevel: 'silent'`, which would drop the
		// records for a legitimate reason and hide the regression.
		fixture = await loadFixture({ root: './fixtures/dev-logger/', logLevel: 'info' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('writes records at the configured log level', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);

		const $ = cheerio.load(await res.text());
		const written: string[] = JSON.parse($('#written').text());

		assert.equal(written.length, 2, `Expected two log records, got ${JSON.stringify(written)}`);
		assert.ok(
			written[0].includes('info-from-astro-logger'),
			`Expected the info record, got ${JSON.stringify(written)}`,
		);
		assert.ok(
			written[1].includes('error-from-astro-logger'),
			`Expected the error record, got ${JSON.stringify(written)}`,
		);
	});
});
