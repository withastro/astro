import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { AstroLoggerMessage } from '../dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';
import testAdapter from './test-adapter.ts';

/**
 * Messages recorded by `fixtures/streaming-error-logger/src/logger.mjs`, the configured
 * logger destination. The dev server runs in the test process, so `globalThis` is shared.
 */
function recordedMessages(): AstroLoggerMessage[] {
	return ((globalThis as any).__astroStreamingErrorLoggerMessages ??= []) as AstroLoggerMessage[];
}

describe('Streaming error logging in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming-error-logger/',
			// `loadFixture` defaults to `silent`, which would filter the error out before it
			// reached the destination.
			logLevel: 'error',
			logger: { entrypoint: './src/logger.mjs' },
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('logs an error thrown after the page started streaming exactly once', async () => {
		recordedMessages().length = 0;
		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
		await response.text().catch(() => {});
		await new Promise((resolve) => setTimeout(resolve, 300));

		const errors = recordedMessages().filter(
			(message) =>
				message.level === 'error' &&
				message.message.includes('Failed after the page started streaming'),
		);
		assert.equal(errors.length, 1, JSON.stringify(recordedMessages(), null, 2));
	});
});

describe('Streaming error logging while prerendering a server build', () => {
	it('logs an error thrown after the page started streaming exactly once', async () => {
		const fixture = await loadFixture({
			root: './fixtures/streaming-error-logger/',
			outDir: './dist/server-prerender/',
			output: 'server',
			adapter: testAdapter(),
			logLevel: 'error',
			logger: { entrypoint: './src/logger.mjs' },
		});
		recordedMessages().length = 0;

		await assert.rejects(fixture.build(), /Failed after the page started streaming/);

		const errors = recordedMessages().filter(
			(message) =>
				message.level === 'error' &&
				message.message.includes('Failed after the page started streaming'),
		);
		assert.equal(errors.length, 1, JSON.stringify(recordedMessages(), null, 2));
	});
});
