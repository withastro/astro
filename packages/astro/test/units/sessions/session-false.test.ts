import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SessionSchema } from '../../../dist/core/session/config.js';
import { sessionConfigToManifest } from '../../../dist/core/session/utils.js';
import { provideSession } from '../../../dist/core/session/provider-disabled.js';

describe('session: false', () => {
	describe('schema', () => {
		it('accepts `session: false`', () => {
			const result = SessionSchema.safeParse(false);
			assert.equal(result.success, true);
			if (result.success) {
				assert.equal(result.data, false);
			}
		});

		it('still accepts a session object', () => {
			const result = SessionSchema.safeParse({ ttl: 60 });
			assert.equal(result.success, true);
		});

		it('rejects other falsy values', () => {
			assert.equal(SessionSchema.safeParse(0).success, false);
			assert.equal(SessionSchema.safeParse('').success, false);
			assert.equal(SessionSchema.safeParse(null).success, false);
		});
	});

	describe('manifest helpers', () => {
		it('sessionConfigToManifest(false) returns undefined', () => {
			assert.equal(sessionConfigToManifest(false), undefined);
		});
	});

	describe('disabled provider', () => {
		it('registers no session provider, leaving Astro.session undefined', () => {
			let provideCalled = false;
			const fakeState = {
				pipeline: { usedFeatures: 0 },
				provide() {
					provideCalled = true;
				},
			};
			provideSession(fakeState as never);
			assert.equal(provideCalled, false, 'disabled provider should not register a session');
			assert.notEqual(fakeState.pipeline.usedFeatures, 0, 'sessions feature should be marked used');
		});
	});
});
