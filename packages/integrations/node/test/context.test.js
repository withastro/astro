import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import { createServer, Server } from 'http';

function buildFixture(path) {
	const cwd = new URL(path, import.meta.url).pathname;
	return new Promise((res, rej) => {
		exec('pnpm astro build', { cwd }, (err) => {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});
}

async function loadFixture(path) {
	const base = new URL(path, import.meta.url);
	const entrypoint = new URL('dist/server/entry.mjs', base + '/');
	const { handler } = await import(entrypoint.pathname);
	return handler;
}

describe('SSR context', () => {
	let handler;
	/** @type {Server} */
	let server;

	before(async () => {
		await buildFixture('./fixtures/context');
		handler = await loadFixture('./fixtures/context');
		server = createServer((req, res) => {
			handler(req, res, { info: 'peek-a-boo' });
		});
		await new Promise((res) => server.listen({ port: 8087 }, res));
	});

	it('should contain information from context', async () => {
		const response = await fetch('http://localhost:8087/');
		const body = await response.text();
		expect(body).to.contain('peek-a-boo');
	});

	after((done) => {
		if (server) {
			server.close(done);
		} else {
			done();
		}
	});
});
