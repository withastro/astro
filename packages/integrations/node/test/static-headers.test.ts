import * as assert from 'node:assert/strict';
import net from 'node:net';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture, waitServerListen, type AdapterServer } from './test-utils.ts';

/**
 * Sends a raw HTTP request with a hand-written Host header and resolves with
 * the status line. `fetch` rewrites the Host header, so a socket is the only
 * way to exercise a client-supplied host with a malformed port.
 */
function requestWithHost(host: string, port: number, hostHeader: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const socket = net.connect(port, host, () => {
			socket.write(`GET / HTTP/1.1\r\nHost: ${hostHeader}\r\nConnection: close\r\n\r\n`);
		});
		let body = '';
		socket.setEncoding('utf8');
		socket.on('data', (chunk) => (body += chunk));
		socket.on('end', () => resolve(body.split('\r\n')[0] ?? ''));
		socket.on('error', reject);
	});
}

type StaticHeaderEntry = { pathname: string; headers: Array<{ key: string; value: string }> };

describe('Static headers', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/static-headers' });
		await fixture.build();
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const headers: StaticHeaderEntry[] = JSON.parse(
			await fixture.readFile('../dist/_headers.json'),
		);

		const csp = headers
			.find((x) => x.pathname === '/')!
			.headers.find((x) => x.key === 'Content-Security-Policy')!;

		assert.notEqual(csp, undefined, 'the index must have CSP headers');
		assert.ok(
			csp.value.includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});

	it('CSP headers are added to the request', async () => {});
});

describe('Static headers', () => {
	let fixture: Fixture;
	let server: AdapterServer;

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
		const cps = res.headers.get('Content-Security-Policy')!;
		assert.ok(
			cps.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});

	it('CSP headers are added to dynamic orute', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/one`);
		const cps = res.headers.get('Content-Security-Policy')!;
		assert.ok(
			cps.includes('script-src'),
			'should contain script-src directive due to server island',
		);
	});

	it('survives a request with a malformed port in the Host header', async () => {
		// A malformed port makes the URL unparseable while the static handler
		// builds a Request to look up per-route headers. The request must not
		// take the process down; a follow-up request must still be served.
		await requestWithHost(server.host ?? '127.0.0.1', server.port, 'example.com:65536');
		const res = await fetch(`http://${server.host}:${server.port}/`);
		assert.equal(res.status, 200);
	});
});

describe('Static headers listener cleanup', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers/',
			outDir: './dist/listener-cleanup',
			output: 'server',
			adapter: nodejs({ mode: 'standalone', staticHeaders: true }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		process.env.PORT = '4324';
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
	});

	it('does not leak socket close listeners on keep-alive connections', async () => {
		const http = await import('node:http');
		const agent = new http.Agent({ keepAlive: true });

		let warningEmitted = false;
		const onWarning = (warning: Error) => {
			if (warning.name === 'MaxListenersExceededWarning') {
				warningEmitted = true;
			}
		};
		process.on('warning', onWarning);

		try {
			for (let i = 0; i < 30; i++) {
				const res = await fetch(`http://${server.host}:${server.port}/`, {
					// @ts-expect-error Node fetch doesn't type `agent`
					agent,
					headers: { Connection: 'keep-alive' },
				});
				await res.text();
			}
		} finally {
			process.off('warning', onWarning);
			agent.destroy();
		}

		assert.equal(warningEmitted, false, 'MaxListenersExceededWarning should not be emitted');
	});
});

describe('Static headers with non-root base', () => {
	let fixture: Fixture;
	let server: AdapterServer;

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
