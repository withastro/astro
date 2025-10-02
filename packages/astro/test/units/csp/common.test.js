// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDirectives } from '../../../dist/core/csp/common.js';

/**
 *
 * @param {{
 *  csp: import('../../../dist/types/astro.js').AstroSettings['config']['experimental']['csp'];
 *  injected: Array<string>
 * }} param0
 * @returns {import('../../../dist/types/astro.js').AstroSettings}
 */
function buildSettings({ csp, injected }) {
	/** @type {any} */
	const settings = {
		config: {
			experimental: { csp },
		},
		injectedCsp: {
			fontResources: new Set(injected),
		},
	};
	return settings;
}

describe('CSP common', () => {
	it('getDirectives()', () => {
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: false,
					injected: [],
				}),
			),
			[],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: true,
					injected: [],
				}),
			),
			[],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ['font-src test'],
					},
					injected: [],
				}),
			),
			['font-src test'],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ['img-src test'],
					},
					injected: ["'self'", 'foo'],
				}),
			),
			['img-src test', "font-src 'self' foo"],
		);
		assert.deepStrictEqual(
			getDirectives(
				buildSettings({
					csp: {
						algorithm: 'SHA-256',
						directives: ["font-src 'self' ", 'img-src test'],
					},
					injected: ["'self'", 'foo'],
				}),
			),
			["font-src 'self' foo", 'img-src test'],
		);
	});
});
