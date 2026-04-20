import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroLoggerMessage, AstroLoggerDestination } from '../../../dist/core/logger/core.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';

describe('AstroLogger', () => {
	function createSpyDestination() {
		const calls: { method: string }[] = [];
		const destination: AstroLoggerDestination<AstroLoggerMessage> = {
			write: () => {},
			flush: () => {
				calls.push({ method: 'flush' });
			},
			close: () => {
				calls.push({ method: 'close' });
			},
		};
		return { destination, calls };
	}

	describe('flush', () => {
		it('calls destination.flush when present', () => {
			const { destination, calls } = createSpyDestination();
			const logger = new AstroLogger({ destination, level: 'info' });

			logger.flush();

			assert.equal(calls.length, 1);
			assert.equal(calls[0].method, 'flush');
		});

		it('does not throw when destination has no flush', () => {
			const destination: AstroLoggerDestination<AstroLoggerMessage> = {
				write: () => {},
			};
			const logger = new AstroLogger({ destination, level: 'info' });

			assert.doesNotThrow(() => logger.flush());
		});
	});

	describe('close', () => {
		it('calls destination.close when present', () => {
			const { destination, calls } = createSpyDestination();
			const logger = new AstroLogger({ destination, level: 'info' });

			logger.close();

			assert.equal(calls.length, 1);
			assert.equal(calls[0].method, 'close');
		});

		it('does not throw when destination has no close', () => {
			const destination: AstroLoggerDestination<AstroLoggerMessage> = {
				write: () => {},
			};
			const logger = new AstroLogger({ destination, level: 'info' });

			assert.doesNotThrow(() => logger.close());
		});
	});

	describe('setDestination', () => {
		it('replaces the destination', () => {
			const writes: string[] = [];
			const originalDestination: AstroLoggerDestination<AstroLoggerMessage> = {
				write: (msg) => {
					writes.push('original:' + msg.message);
				},
			};
			const newDestination: AstroLoggerDestination<AstroLoggerMessage> = {
				write: (msg) => {
					writes.push('new:' + msg.message);
				},
			};
			const logger = new AstroLogger({ destination: originalDestination, level: 'info' });

			logger.info(null, 'before');
			logger.setDestination(newDestination);
			logger.info(null, 'after');

			assert.equal(writes.length, 2);
			assert.match(writes[0], /^original:/);
			assert.match(writes[1], /^new:/);
		});
	});
});
