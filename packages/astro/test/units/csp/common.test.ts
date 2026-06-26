import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStyleHashes,
	getStyleResources,
} from '../../../dist/core/csp/common.js';

function buildSettings({ csp, injected }: { csp: any; injected: string[] }): any {
	const settings = {
		config: {
			security: { csp },
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

	it('directive getters return the config entries as-authored (kind kept inline)', () => {
		const csp = {
			algorithm: 'SHA-256',
			scriptDirective: {
				resources: ["'self'", { resource: 'https://cdn', kind: 'element' }],
				hashes: ['sha256-AAA', { hash: 'sha256-BBB', kind: 'attribute' }],
			},
			styleDirective: {
				resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		} as any;

		assert.deepStrictEqual(getScriptResources(csp), [
			"'self'",
			{ resource: 'https://cdn', kind: 'element' },
		]);
		assert.deepStrictEqual(getScriptHashes(csp), [
			'sha256-AAA',
			{ hash: 'sha256-BBB', kind: 'attribute' },
		]);
		assert.deepStrictEqual(getStyleResources(csp), [
			{ resource: "'unsafe-inline'", kind: 'attribute' },
		]);
		assert.deepStrictEqual(getStyleHashes(csp), []);
	});

	it('directive getters return empty arrays for csp: true', () => {
		assert.deepStrictEqual(getScriptResources(true as any), []);
		assert.deepStrictEqual(getScriptHashes(true as any), []);
		assert.deepStrictEqual(getStyleResources(true as any), []);
		assert.deepStrictEqual(getStyleHashes(true as any), []);
	});
});
