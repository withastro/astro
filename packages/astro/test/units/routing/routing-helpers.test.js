// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasNonPrerenderedRoute } from '../../../dist/core/routing/helpers.js';

describe('hasNonPrerenderedRoute', () => {
	it('returns true when a non-prerendered project page exists', () => {
		const routes = [{ type: 'page', origin: 'project', prerender: false }];
		assert.equal(hasNonPrerenderedRoute(routes), true);
	});

	it('returns false when all project pages are prerendered', () => {
		const routes = [{ type: 'page', origin: 'project', prerender: true }];
		assert.equal(hasNonPrerenderedRoute(routes), false);
	});

	it('excludes endpoints when includeEndpoints is false', () => {
		const routes = [{ type: 'endpoint', origin: 'project', prerender: false }];
		assert.equal(hasNonPrerenderedRoute(routes, { includeEndpoints: false }), false);
		assert.equal(hasNonPrerenderedRoute(routes, { includeEndpoints: true }), true);
	});

	it('returns true for injected (external) non-prerendered pages when includeExternal is true', () => {
		const routes = [{ type: 'page', origin: 'external', prerender: false }];
		assert.equal(hasNonPrerenderedRoute(routes, { includeExternal: true }), true);
		assert.equal(hasNonPrerenderedRoute(routes), false);
	});
});
