import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SessionSchema } from '../../../dist/core/session/config.js';
import {
	sessionConfigToManifest,
	sessionsDisabled,
} from '../../../dist/core/session/utils.js';
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

		it('sessionsDisabled(false) returns true', () => {
			assert.equal(sessionsDisabled(false), true);
		});

		it('sessionsDisabled(undefined) returns false', () => {
			assert.equal(sessionsDisabled(undefined), false);
		});

		it('sessionsDisabled(<config>) returns false', () => {
			assert.equal(sessionsDisabled({ ttl: 60 }), false);
		});
	});

	describe('disabled provider', () => {
		it('registers a session provider whose getter throws SessionDisabledError', () => {
			let registeredKey: string | undefined;
			let registeredProvider: { create: () => unknown } | undefined;
			const fakeState = {
				pipeline: { usedFeatures: 0 },
				provide(key: string, provider: { create: () => unknown }) {
					registeredKey = key;
					registeredProvider = provider;
				},
			};
			provideSession(fakeState as never);
			assert.equal(registeredKey, 'session');
			assert.ok(registeredProvider, 'expected provider to be registered');
			assert.throws(
				() => registeredProvider!.create(),
				(err: Error & { name?: string }) => {
					return err.name === 'SessionDisabledError';
				},
			);
		});
	});
});
