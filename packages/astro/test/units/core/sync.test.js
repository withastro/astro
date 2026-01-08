// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { syncFeatures as _syncFeatures } from '../../../dist/core/sync/features.js';

/**
 * @param {Omit<Parameters<typeof _syncFeatures>[0], 'injectedTypes'>} options
 */
function syncFeatures(options) {
	/** @type {Parameters<typeof _syncFeatures>[0]['injectedTypes']} */
	const injectedTypes = [];
	_syncFeatures({ injectedTypes, ...options });
	return injectedTypes[0].content ?? '';
}

describe('sync', () => {
	describe('syncFeatures()', () => {
		it('handles enabled features', () => {
			const types = syncFeatures({
				csp: true,
				i18n: {
					defaultLocale: 'en',
					locales: [
						'es',
						'en',
						{
							path: 'french',
							codes: ['fr', 'fr-BR', 'fr-CA'],
						},
					],
				},
				routePatterns: ['foo', 'bar'],
				session: true,
				site: true,
			});
			assert.equal(types.includes(`type Site = 'enabled'`), true);
			assert.equal(types.includes(`type Session = 'enabled'`), true);
			assert.equal(types.includes(`type I18n = 'enabled'`), true);
			assert.equal(types.includes(`type Csp = 'enabled'`), true);
			assert.equal(types.includes(`type RoutePattern = (["foo","bar"])[number]`), true);
			assert.equal(
				types.includes(`type I18nLocale = (["es","en","fr","fr-BR","fr-CA"])[number]`),
				true,
			);
			assert.equal(types.includes(`type I18nDefaultLocale = "en"`), true);
		});

		it('handles disabled features', () => {
			const types = syncFeatures({
				csp: false,
				i18n: undefined,
				routePatterns: ['foo', 'bar'],
				session: false,
				site: false,
			});
			assert.equal(types.includes(`type Site = 'maybe'`), true);
			assert.equal(types.includes(`type Session = 'maybe'`), true);
			assert.equal(types.includes(`type I18n = 'maybe'`), true);
			assert.equal(types.includes(`type Csp = 'maybe'`), true);
		});
	});
});
