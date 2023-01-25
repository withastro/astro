import { fetch } from '../dist/index.js';
import { expect } from 'chai';
import getPort from 'get-port';
import enableDestroy from 'server-destroy';
import http from 'node:http';

describe('fetch()', () => {
	let server, port;
	before(async () => {
		port = await getPort();
		server = http.createServer(function(_req, res) {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ ok: true }));
		}).listen(port);
		enableDestroy(server);
	});
	after(function(done) {
		server.destroy(() => done());
	});
	it('gets the response', async () => {
		let response = await fetch(`http://localhost:${port}/api/test`);
		expect(response.status).to.equal(200);
		let json = await response.json();
		expect(json).to.deep.equal({ ok: true });
	});
});
