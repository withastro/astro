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
		const headers = JSON.parse(await fixture.readFile('../dist/_headers.json'));

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
			outDir: './dist/root-base',
			output: 'server',
			adapter: nodejs({ mode: 'standalone', staticHeaders: true }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		process.env.PORT = '4322';
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

describe('Static headers with non-root base', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers/',
			outDir: './dist/non-root-base',
			base: '/docs',
			output: 'server',
			adapter: nodejs({ mode: 'standalone', staticHeaders: true }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		process.env.PORT = '4323';
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
	});

	it('CSP headers are added to the index route under the base path', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/docs/`);
		const csp = res.headers.get('Content-Security-Policy');
		assert.ok(csp, 'Content-Security-Policy header must be present for the index route');
		assert.ok(
			csp.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});

	it('CSP headers are added to a dynamic route under the base path', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/docs/one`);
		const csp = res.headers.get('Content-Security-Policy');
		assert.ok(csp, 'Content-Security-Policy header must be present for dynamic routes');
		assert.ok(
			csp.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});
});
