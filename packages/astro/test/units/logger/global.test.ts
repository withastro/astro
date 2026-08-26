import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { AstroLoggerDestination, AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import { getGlobalLogger } from '../../../dist/core/logger/global.js';
import { createConsoleLogger } from '../../../dist/core/logger/impls/console.js';
import { getLogger, setLogger } from '../../../dist/core/logger/manifest-logger.js';
import { setAmbientManifest } from '../../../dist/core/manifest/ambient.js';
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

/** Captures `console.info`/`console.error`, the destinations of the fallback logger. */
function captureConsole<T>(fn: () => T): { result: T; info: string[]; error: string[] } {
	const info: string[] = [];
	const error: string[] = [];
	const originalInfo = console.info;
	const originalError = console.error;
	console.info = (...args: any[]) => void info.push(args.join(' '));
	console.error = (...args: any[]) => void error.push(args.join(' '));
	try {
		return { result: fn(), info, error };
	} finally {
		console.info = originalInfo;
		console.error = originalError;
	}
}

describe('getGlobalLogger', () => {
	// The ambient registration is process-global, and unit test files share a
	// process. Leaving a manifest registered would leak into every other suite.
	afterEach(() => {
		setAmbientManifest(undefined);
	});

	describe('with an ambient manifest', () => {
		it("returns the manifest's identity-stable logger", () => {
			const manifest = createManifest();
			setAmbientManifest(manifest);
			assert.equal(getGlobalLogger(), getLogger(manifest));
			// Stable across calls: two module-level call sites share one logger.
			assert.equal(getGlobalLogger(), getGlobalLogger());
		});

		it("uses the manifest's log level", () => {
			setAmbientManifest(createManifest({ logLevel: 'error' }));
			assert.equal(getGlobalLogger().level(), 'error');
		});

		it('returns the injected logger when one was set for the manifest', () => {
			const manifest = createManifest();
			const injected = createConsoleLogger({ level: 'debug' });
			setLogger(manifest, injected);
			setAmbientManifest(manifest);
			assert.equal(getGlobalLogger(), injected);
		});

		it('writes to the configured destination rather than the console', () => {
			const manifest = createManifest({ logLevel: 'info' });
			const { destination, messages } = createSpyDestination();
			getLogger(manifest).setDestination(destination);
			setAmbientManifest(manifest);

			const { info, error } = captureConsole(() => {
				getGlobalLogger().warn('content', 'Entry blog → nope was not found.');
			});

			assert.equal(messages.length, 1);
			assert.deepEqual(
				{ label: messages[0].label, level: messages[0].level, message: messages[0].message },
				{ label: 'content', level: 'warn', message: 'Entry blog → nope was not found.' },
			);
			assert.deepEqual(info, []);
			assert.deepEqual(error, []);
		});

		it("honors the manifest's level when filtering messages", () => {
			const manifest = createManifest({ logLevel: 'error' });
			const { destination, messages } = createSpyDestination();
			getLogger(manifest).setDestination(destination);
			setAmbientManifest(manifest);

			const logger = getGlobalLogger();
			logger.warn('content', 'dropped');
			logger.error('content', 'kept');

			assert.deepEqual(
				messages.map((m) => m.message),
				['kept'],
			);
		});

		it('follows a destination swapped in after the logger was captured', () => {
			const manifest = createManifest({ logLevel: 'info' });
			setAmbientManifest(manifest);
			// A module-level consumer captures the logger before the configured
			// destination has been resolved.
			const captured = getGlobalLogger();

			const { destination, messages } = createSpyDestination();
			getLogger(manifest).setDestination(destination);

			captured.info('content', 'after swap');
			assert.deepEqual(
				messages.map((m) => m.message),
				['after swap'],
			);
		});

		it('scopes loggers per manifest', () => {
			const first = createManifest();
			setAmbientManifest(first);
			const firstLogger = getGlobalLogger();

			setAmbientManifest(createManifest());
			assert.notEqual(getGlobalLogger(), firstLogger);
		});
	});

	describe('without an ambient manifest', () => {
		it('does not throw, unlike getAmbientManifest', () => {
			setAmbientManifest(undefined);
			assert.doesNotThrow(() => getGlobalLogger());
		});

		it('falls back to a console logger at the info level', () => {
			setAmbientManifest(undefined);
			assert.equal(getGlobalLogger().level(), 'info');
		});

		it('writes warnings to console.info and errors to console.error', () => {
			setAmbientManifest(undefined);
			const { info, error } = captureConsole(() => {
				getGlobalLogger().warn('content', 'a warning');
				getGlobalLogger().error('content', 'an error');
			});

			assert.equal(info.length, 1);
			assert.match(info[0], /a warning/);
			assert.equal(error.length, 1);
			assert.match(error[0], /an error/);
		});

		it('drops debug-level messages that the info fallback filters out', () => {
			setAmbientManifest(undefined);
			const { info, error } = captureConsole(() => {
				// `logger.debug` goes through the global debug hook, so exercise the
				// level filter through the destination the fallback actually uses.
				getGlobalLogger().options.destination.write({
					label: 'content',
					level: 'debug',
					message: 'noisy',
					newLine: true,
				});
			});
			assert.deepEqual(info, []);
			assert.deepEqual(error, []);
		});

		it('returns a fresh logger per call, so mutating it does not stick', () => {
			setAmbientManifest(undefined);
			const first = getGlobalLogger();
			assert.notEqual(getGlobalLogger(), first);

			const { destination, messages } = createSpyDestination();
			first.setDestination(destination);
			captureConsole(() => {
				getGlobalLogger().warn('content', 'not captured');
			});
			assert.deepEqual(messages, []);
		});

		it('picks up a manifest registered after an earlier fallback call', () => {
			setAmbientManifest(undefined);
			captureConsole(() => getGlobalLogger().info('content', 'console'));

			const manifest = createManifest({ logLevel: 'info' });
			const { destination, messages } = createSpyDestination();
			getLogger(manifest).setDestination(destination);
			setAmbientManifest(manifest);

			getGlobalLogger().info('content', 'manifest');
			assert.deepEqual(
				messages.map((m) => m.message),
				['manifest'],
			);
		});
	});
});
