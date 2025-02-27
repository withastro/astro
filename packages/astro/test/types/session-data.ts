import "./session-env";
import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { AstroCookies, AstroUserConfig } from '../../dist/types/public/index.js';
import { AstroSession } from '../../dist/core/session.js';

const defaultMockCookies = {
	set: () => {},
	delete: () => {},
	get: () => 'astro cookie',
};


const defaultConfig: AstroUserConfig<never, 'memory'>['session'] = {
	driver: 'memory',
	cookie: 'test-session',
	ttl: 60,
	options: {},
};

// Helper to create a new session instance with mocked dependencies
function createSession(config = defaultConfig, cookies = defaultMockCookies) {
	return new AstroSession(cookies as unknown as AstroCookies, config);
}

describe('Session', () => {
	it('Types session.get return values', () => {
		const session = createSession();
		
		expectTypeOf(session.get('value')).toEqualTypeOf<Promise<string>>();

		expectTypeOf(session.get('cart')).toEqualTypeOf<Promise<Array<string>>>();

		expectTypeOf(session.get('unknown')).toEqualTypeOf<Promise<any>>();
		
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
	