import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { AstroLoggerMessage } from '../dist/core/logger/core.js';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

/**
 * Messages recorded by `fixtures/runtime-logger/src/logger.mjs`, which is bundled
 * into the server output as the configured logger destination. The built server
 * runs in the test process, so `globalThis` is shared with it.
 */
function recordedMessages(): AstroLoggerMessage[] {
	return ((globalThis as any).__astroRuntimeLoggerMessages ??= []) as AstroLoggerMessage[];
}

function matching(messages: AstroLoggerMessage[], pattern: RegExp): AstroLoggerMessage[] {
	return messages.filter((message) => pattern.test(message.message));
}

/**
 * `astro:content` used to `console.warn`/`console.error` from code with no access
 * to a logger. Its runtime factories are now built with one, injected by the
 * template that generates the module — so their output reaches the user-configured
 * destination even where there is no request state to carry a logger.
 */
describe('Runtime logger', () => {
	let fixture: Fixture;
	let app: Awaited<ReturnType<Fixture['loadTestAdapterApp']>>;
	/**
	 * Everything logged up to and including the first request. The middleware
	 * entrypoint is evaluated once per process, so its module-scope logging can
	 * only be observed here — reloading the app returns the cached ES module.
	 */
	let bootstrapMessages: AstroLoggerMessage[];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/runtime-logger/',
			output: 'server',
			adapter: testAdapter(),
			// `loadFixture` defaults to `silent`, which would filter every message out
			// before it reached the destination. `warn` lets the warnings under test
			// through while keeping the build's own info logs quiet.
			logLevel: 'warn',
			logger: { entrypoint: './src/logger.mjs' },
		});
		await fixture.build();

		app = await fixture.loadTestAdapterApp();
		recordedMessages().length = 0;
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
		bootstrapMessages = [...recordedMessages()];
	});

	beforeEach(() => {
		recordedMessages().length = 0;
	});

	it('uses the configured destination, not the console', () => {
		assert.ok(bootstrapMessages.length > 0, 'the configured destination received nothing');
		// Every message carries the AstroLoggerMessage shape, so it went through
		// AstroLogger rather than being handed straight to `console`.
		for (const message of bootstrapMessages) {
			assert.equal(typeof message.message, 'string');
			assert.equal(typeof message.newLine, 'boolean');
			assert.ok(['debug', 'info', 'warn', 'error'].includes(message.level));
		}
	});

	// `fixtures/runtime-logger/src/middleware.ts` calls `getEntry()` at module
	// scope: it runs when the middleware entrypoint is first imported, before any
	// middleware handler. There is no request state to carry a logger, so the
	// warning is only routed correctly because the logger was baked into
	// `astro:content` rather than read from the manifest at call time.
	describe('getEntry() outside of a request', () => {
		it('routes the missing-entry warning to the configured destination', () => {
			const [message, ...rest] = matching(bootstrapMessages, /missing-at-module-scope/);
			assert.ok(message, 'the module-scope getEntry() warning never reached the destination');
			assert.deepEqual(rest, [], 'the module-scope warning should be logged once');
			assert.equal(message.level, 'warn');
			assert.equal(message.label, 'content');
			assert.equal(message.message, 'Entry blog → missing-at-module-scope was not found.');
		});

		it('logs it before the middleware handler runs', () => {
			// The destination is resolved at the start of `App.render`, so the
			// module-scope call already writes to the user's destination even though
			// it happens before any handler.
			const order = matching(bootstrapMessages, /missing-(?:at-module-scope|in-handler)/).map(
				(message) => message.message,
			);
			assert.deepEqual(order, [
				'Entry blog → missing-at-module-scope was not found.',
				'Entry blog → missing-in-handler was not found.',
			]);
		});

		it('does not log again on later requests', async () => {
			await app.render(new Request('http://example.com/'));
			assert.deepEqual(matching(recordedMessages(), /missing-at-module-scope/), []);
		});
	});

	describe('getEntry() inside a request', () => {
		it('routes a middleware handler warning to the configured destination', async () => {
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const [message] = matching(recordedMessages(), /missing-in-handler/);
			assert.ok(message);
			assert.equal(message.level, 'warn');
			assert.equal(message.label, 'content');
		});

		it('routes a page warning to the configured destination', async () => {
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const [message] = matching(recordedMessages(), /missing-from-page/);
			assert.ok(message);
			assert.equal(message.level, 'warn');
			assert.equal(message.label, 'content');
			assert.equal(message.message, 'Entry blog → missing-from-page was not found.');
		});
	});
});
