import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroLoggerDestination, AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import {
	getLogger,
	getResolvedLogger,
	setLogger,
} from '../../../dist/core/logger/manifest-logger.js';
import { createConsoleLogger } from '../../../dist/core/logger/impls/console.js';
import { createManifest } from '../app/test-helpers.ts';

function createSpyDestination() {
	const messages: AstroLoggerMessage[] = [];
	const destination: AstroLoggerDestination = {
		write(chunk) {
			messages.push(chunk);
		},
	};
	return { destination, messages };
}

describe('getLogger / setLogger', () => {
	it('creates one identity-stable logger per manifest', () => {
		const manifest = createManifest();
		const logger = getLogger(manifest);
		assert.equal(getLogger(manifest), logger);
		assert.equal(logger.level(), manifest.logLevel);
	});

	it('scopes loggers per manifest object', () => {
		assert.notEqual(getLogger(createManifest()), getLogger(createManifest()));
	});

	it('setLogger replaces the stored instance', () => {
		const manifest = createManifest();
		const injected = createConsoleLogger({ level: 'error' });
		setLogger(manifest, injected);
		assert.equal(getLogger(manifest), injected);
	});
});

describe('getResolvedLogger', () => {
	it('swaps the destination on the same logger instance', async () => {
		const { destination, messages } = createSpyDestination();
		let thunkCalls = 0;
		const manifest = createManifest({
			logLevel: 'info',
			logger: () => {
				thunkCalls++;
				return Promise.resolve({ default: destination });
			},
		});

		const before = getLogger(manifest);
		const resolved = await getResolvedLogger(manifest);
		// Identity-stable: the destination is mutated in place, so every holder
		// of the logger writes to the new destination immediately.
		assert.equal(resolved, before);
		resolved.info(null, 'hello');
		assert.equal(messages.length, 1);
		assert.equal(messages[0].message, 'hello');

		// Memoized single-flight: the thunk is only invoked once.
		assert.equal(await getResolvedLogger(manifest), resolved);
		assert.equal(thunkCalls, 1);
	});

	it('keeps the console destination when the manifest has no logger thunk', async () => {
		const manifest = createManifest();
		const logger = getLogger(manifest);
		assert.equal(await getResolvedLogger(manifest), logger);
	});

	it('reports a failing thunk and continues on the unswapped logger', async () => {
		const { destination, messages } = createSpyDestination();
		let thunkCalls = 0;
		const manifest = createManifest({
			logLevel: 'info',
			logger: () => {
				thunkCalls++;
				return Promise.reject(new Error('logger load failed'));
			},
		});
		// Inject a spy-backed logger so the error report is observable.
		const logger = createConsoleLogger({ level: 'info' });
		logger.setDestination(destination);
		setLogger(manifest, logger);

		// Never rejects: the request keeps its logger.
		assert.equal(await getResolvedLogger(manifest), logger);
		assert.equal(messages.length, 1);
		assert.match(messages[0].message, /Failed to load the configured logger destination/);
		assert.match(messages[0].message, /logger load failed/);

		// The failure is memoized: the thunk is not retried.
		assert.equal(await getResolvedLogger(manifest), logger);
		assert.equal(thunkCalls, 1);
	});
});
