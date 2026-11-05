import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';
import { createAppHandler } from '../../dist/serve-app.js';

describe('createAppHandler unhandled rejections', () => {
	it('reports an in-request rejection once when multiple handlers exist', async () => {
		const messages: string[] = [];
		let listener: ((reason: unknown) => void) | undefined;
		const app = {
			adapterLogger: { error: (message: string) => messages.push(message) },
			getAllowedDomains: () => [],
			match: () => ({ type: 'page', prerender: false }),
			render: async () => {
				// Emit the event from inside the request, as Node does for a
				// rejection created while rendering.
				listener!(new Error('Rejected on purpose'));
				return new Response('ok');
			},
		};
		const options = {
			client: new URL('../../dist-client-missing/', import.meta.url).href,
			server: new URL('../../dist/', import.meta.url).href,
			port: 0,
		};

		const before = process.listeners('unhandledRejection');
		// The standalone entrypoint creates two handlers per process (#18624).
		createAppHandler(app as any, options as any);
		const handler = createAppHandler(app as any, options as any);
		const added = process.listeners('unhandledRejection').filter((l) => !before.includes(l));
		assert.ok(added.length <= 1, `expected at most one listener, got ${added.length}`);
		listener = (reason) => {
			for (const l of added) l(reason, Promise.resolve());
		};

		const server = http.createServer((req, res) => handler(req, res));
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const { port } = server.address() as AddressInfo;
		const previousExitCode = process.exitCode;
		try {
			const response = await fetch(`http://127.0.0.1:${port}/page`);
			assert.equal(await response.text(), 'ok');
			assert.equal(messages.length, 1, messages.join('\n---\n'));
			assert.match(messages[0], /^Unhandled rejection while rendering /);
			assert.equal(process.exitCode, previousExitCode);
		} finally {
			process.exitCode = previousExitCode;
			server.close();
		}
	});
});
