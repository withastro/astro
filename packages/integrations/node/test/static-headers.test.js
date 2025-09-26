import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture, waitServerListen } from './test-utils.js';

describe('Static headers', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/static-headers' });
		await fixture.build();
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const headers = JSON.parse(await fixture.readFile('../dist/_experimentalHeaders.json'));

		const csp = headers
			.find((x) => x.pathname === '/')
			.headers.find((x) => x.key === 'Content-Security-Policy');

		assert.notEqual(csp, undefined, 'the index must have CSP headers');
		assert.ok(
			csp.value.includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});

	it('CSP headers are added to the request', async () => {});
});

describe('Static headers', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone', experimentalStaticHeaders: true }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		// await fixture.clean();
	});

	it('CSP headers are added to the request', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/`);
		const cps = res.headers.get('Content-Security-Policy');
		assert.ok(
			cps.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});

	it('CSP headers are added to dynamic orute', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/one`);
		const cps = res.headers.get('Content-Security-Policy');
		assert.ok(
			cps.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});
});
