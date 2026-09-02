import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	AstroLogger,
	astroToRuntimeLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
} from '../../../dist/core/logger/core.js';

function createLogger(level: AstroLoggerLevel = 'info') {
	const messages: AstroLoggerMessage[] = [];
	const destination: AstroLoggerDestination = {
		write(chunk) {
			messages.push(chunk);
		},
	};
	return { logger: new AstroLogger({ level, destination }), messages };
}

describe('astroToRuntimeLogger', () => {
	it('forwards info, warn and error with a null label', () => {
		const { logger, messages } = createLogger();
		const runtimeLogger = astroToRuntimeLogger(logger);

		runtimeLogger.info('an info');
		runtimeLogger.warn('a warning');
		runtimeLogger.error('an error');

		// A null label keeps user messages unprefixed: the runtime logger is the
		// user-facing surface, so Astro's internal labels must not leak into it.
		assert.deepEqual(
			messages.map(({ label, level, message }) => ({ label, level, message })),
			[
				{ label: null, level: 'info', message: 'an info' },
				{ label: null, level: 'warn', message: 'a warning' },
				{ label: null, level: 'error', message: 'an error' },
			],
		);
	});

	it('exposes only the three user-facing methods', () => {
		const { logger } = createLogger();
		const runtimeLogger = astroToRuntimeLogger(logger);

		assert.deepEqual(Object.keys(runtimeLogger).sort(), ['error', 'info', 'warn']);
		// `debug` and `setDestination` stay internal to `AstroLogger`.
		assert.equal((runtimeLogger as any).debug, undefined);
		assert.equal((runtimeLogger as any).setDestination, undefined);
	});

	it("honors the underlying logger's level", () => {
		const { logger, messages } = createLogger('error');
		const runtimeLogger = astroToRuntimeLogger(logger);

		runtimeLogger.info('dropped');
		runtimeLogger.warn('dropped');
		runtimeLogger.error('kept');

		assert.deepEqual(
			messages.map((m) => m.message),
			['kept'],
		);
	});

	it('writes nothing at the silent level', () => {
		const { logger, messages } = createLogger('silent');
		const runtimeLogger = astroToRuntimeLogger(logger);

		runtimeLogger.info('a');
		runtimeLogger.warn('b');
		runtimeLogger.error('c');

		assert.deepEqual(messages, []);
	});

	it('follows a destination swapped in after the wrapper was created', () => {
		const { logger } = createLogger();
		const runtimeLogger = astroToRuntimeLogger(logger);

		const messages: AstroLoggerMessage[] = [];
		logger.setDestination({
			write(chunk) {
				messages.push(chunk);
			},
		});

		// The wrapper closes over the logger, not over its options snapshot, so
		// the configured destination applies to wrappers created before it loaded.
		runtimeLogger.info('after swap');
		assert.deepEqual(
			messages.map((m) => m.message),
			['after swap'],
		);
	});

	it('sends every message with a trailing newline', () => {
		const { logger, messages } = createLogger();
		astroToRuntimeLogger(logger).info('hello');
		assert.equal(messages[0].newLine, true);
	});
});
