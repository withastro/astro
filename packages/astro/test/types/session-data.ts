import './session-env';
import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { AstroSession } from '../../dist/core/session.js';
import type { AstroCookies, ResolvedSessionConfig } from '../../dist/types/public/index.js';

const defaultMockCookies = {
	set: () => {},
	delete: () => {},
	get: () => 'astro cookie',
};

const defaultConfig: ResolvedSessionConfig<'memory'> = {
	driver: 'memory',
	cookie: 'test-session',
	ttl: 60,
	options: {},
};

// Helper to create a new session instance with mocked dependencies
function createSession() {
	return new AstroSession(defaultMockCookies as unknown as AstroCookies, defaultConfig);
}

describe('Session', () => {
	it('Types session.get return values', () => {
		const session = createSession();

		expectTypeOf(session.get('value')).resolves.toEqualTypeOf<string | undefined>();

		expectTypeOf(session.get('cart')).resolves.toEqualTypeOf<Array<string> | undefined>();

		expectTypeOf(session.get('unknown')).resolves.toEqualTypeOf<any>();
	});

	it('Types session.set arguments', () => {
		const session = createSession();

		expectTypeOf(session.set('value', 'test')).toEqualTypeOf<void>();
		expectTypeOf(session.set('cart', ['item1', 'item2'])).toEqualTypeOf<void>();
		expectTypeOf(session.set('unknown', {})).toEqualTypeOf<void>();

		// Testing invalid types
		// @ts-expect-error This should fail because the value is not a string
		expectTypeOf(session.set('value', 1)).toEqualTypeOf<void>();
		// @ts-expect-error This should fail because the value is not an array
		expectTypeOf(session.set('cart', 'invalid')).toEqualTypeOf<void>();
	});
});
