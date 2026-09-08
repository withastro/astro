import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Environment } from 'vite';
import { isAstroClientEnvironment, isAstroServerEnvironment } from '../../dist/environments.js';

/** Create a minimal mock Environment with only the `name` property. */
function env(name: string) {
	return { name } as unknown as Environment;
}

describe('isAstroServerEnvironment', () => {
	it('should return true for the ssr environment', () => {
		assert.equal(isAstroServerEnvironment(env('ssr')), true);
	});

	it('should return true for the prerender environment', () => {
		assert.equal(isAstroServerEnvironment(env('prerender')), true);
	});

	it('should return true for the astro environment', () => {
		assert.equal(isAstroServerEnvironment(env('astro')), true);
	});

	it('should return false for the client environment', () => {
		assert.equal(isAstroServerEnvironment(env('client')), false);
	});
});

describe('isAstroClientEnvironment', () => {
	it('should return true for the client environment', () => {
		assert.equal(isAstroClientEnvironment(env('client')), true);
	});

	it('should return false for server environments', () => {
		assert.equal(isAstroClientEnvironment(env('ssr')), false);
		assert.equal(isAstroClientEnvironment(env('prerender')), false);
		assert.equal(isAstroClientEnvironment(env('astro')), false);
	});
});
