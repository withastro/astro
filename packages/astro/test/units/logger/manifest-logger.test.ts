import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroLoggerDestination, AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import {
	getLogger,
	resolveLoggerDestination,
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

describe('resolveLoggerDestination', () => {
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
		const resolved = await resolveLoggerDestination(manifest);
		// Identity-stable: the destination is mutated in place, so every holder
		// of the logger writes to the new destination immediately.
		assert.equal(resolved, before);
		resolved.info(null, 'hello');
		assert.equal(messages.length, 1);
		assert.equal(messages[0].message, 'hello');

		// Memoized single-flight: the thunk is only invoked once.
		assert.equal(await resolveLoggerDestination(manifest), resolved);
		assert.equal(thunkCalls, 1);
	});

	it('keeps the console destination when the manifest has no logger thunk', async () => {
		const manifest = createManifest();
		const logger = getLogger(manifest);
		assert.equal(await resolveLoggerDestination(manifest), logger);
	});

	it('propagates a rejecting thunk to the first caller and never retries', async () => {
		let thunkCalls = 0;
		const manifest = createManifest({
			logLevel: 'info',
			logger: () => {
				thunkCalls++;
				return Promise.reject(new Error('logger load failed'));
			},
		});

		await assert.rejects(resolveLoggerDestination(manifest), {
			message: 'logger load failed',
		});
		// Later calls proceed on the unswapped (console) logger.
		assert.equal(await resolveLoggerDestination(manifest), getLogger(manifest));
		assert.equal(thunkCalls, 1);
	});
});
