import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Node middleware socket listener cleanup', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
			output: 'static',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
		const { handler } = await fixture.loadAdapterEntryModule();
		const app = Fastify({ logger: false });
		await app
			.register(fastifyStatic, {
				root: fileURLToPath(new URL('./fixtures/node-middleware/dist/client', import.meta.url)),
			})
			.register(fastifyMiddie);
		app.use(handler);

		await app.listen({ port: 8890 });
		server = app;
	});

	after(async () => {
		server.close();
		await fixture.clean();
		delete process.env.PRERENDER;
	});

	it('should not leak socket listeners when serving static files', async () => {
		const agent = new (await import('node:http')).Agent({
			keepAlive: true,
		});

		let listenerWarningEmitted = false;
		const warningListener = (warning) => {
			if (warning.name === 'MaxListenersExceededWarning') {
				listenerWarningEmitted = true;
			}
		};
		process.on('warning', warningListener);

		try {
			// Make multiple back-to-back requests to a static page
			for (let i = 0; i < 30; i++) {
				const response = await fetch('http://localhost:8890', {
					agent,
					headers: {
						Connection: 'keep-alive',
					},
				});

				await response.text();
			}
		} finally {
			process.off('warning', warningListener);
			agent.destroy();
		}

		assert.equal(
			listenerWarningEmitted,
			false,
			'MaxListenersExceededWarning should not be emitted',
		);
	});
});
