import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type AdapterServer, type Fixture, loadFixture, waitServerListen } from './test-utils.ts';

type StaticHeaderEntry = { pathname: string; headers: Array<{ key: string; value: string }> };

describe('Static headers route matching', () => {
	let fixture: Fixture;
	let server: AdapterServer;
	let entries: StaticHeaderEntry[];

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/static-headers-match/' });
		await fixture.build();
		entries = JSON.parse(await fixture.readFile('../dist/_headers.json'));
		const { startServer } = await fixture.loadAdapterEntryModule();
		process.env.PORT = '4325';
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
	});

	it('sends the CSP header of /about for /about/', async () => {
		const expected = entries
			.find((entry) => entry.pathname === '/about')
			?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
		const res = await fetch(`http://${server.host}:${server.port}/about/`);
		assert.equal(res.headers.get('Content-Security-Policy'), expected);
	});

	for (const pathname of ['/', '/about', '/blog', '/blog/post']) {
		it(`sends the CSP header generated for ${pathname}`, async () => {
			const expected = entries
				.find((entry) => entry.pathname === pathname)
				?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
			assert.ok(expected, `_headers.json must have a CSP entry for ${pathname}`);

			const res = await fetch(`http://${server.host}:${server.port}${pathname}`);
			assert.equal(res.headers.get('Content-Security-Policy'), expected);
		});
	}
});
