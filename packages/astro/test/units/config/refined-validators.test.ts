import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import {
	validateAssetsPrefix,
	validateFontsCssVariables,
	validateI18nDefaultLocale,
	validateI18nDomains,
	validateI18nFallback,
	validateI18nRedirectToDefaultLocale,
	validateOutDirNotInPublicDir,
	validateRemotePatterns,
} from '../../../dist/core/config/schemas/refined-validators.js';

/** Cast partial test data to a strict Pick type via `unknown`. */
const build = (v: unknown) => ({ build: v }) as Pick<AstroConfig, 'build'>;
const i18n = (v: unknown) => v as NonNullable<AstroConfig['i18n']>;
const domains = (v: unknown) => v as Pick<AstroConfig, 'site' | 'output' | 'i18n'>;
const font = (v: unknown) => v as NonNullable<AstroConfig['fonts']>[number];

// #region validateAssetsPrefix
describe('validateAssetsPrefix', () => {
	it('returns no issues for a string prefix', () => {
		const issues = validateAssetsPrefix(build({ assetsPrefix: 'https://cdn.example.com' }));
		assert.equal(issues.length, 0);
	});

	it('returns no issues when assetsPrefix is undefined', () => {
		const issues = validateAssetsPrefix(build({}));
		assert.equal(issues.length, 0);
	});

	it('returns no issues for an object with fallback', () => {
		const issues = validateAssetsPrefix(
			build({ assetsPrefix: { css: 'https://css.cdn.com', fallback: 'https://cdn.com' } }),
		);
		assert.equal(issues.length, 0);
	});

	it('returns an issue for an object without fallback', () => {
		const issues = validateAssetsPrefix(build({ assetsPrefix: { css: 'https://css.cdn.com' } }));
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /fallback/i);
		assert.deepEqual(issues[0].path, ['build', 'assetsPrefix']);
	});
});
// #endregion

// #region validateRemotePatterns
describe('validateRemotePatterns', () => {
	it('returns no issues for empty array', () => {
		const issues = validateRemotePatterns([]);
		assert.equal(issues.length, 0);
	});

	it('returns no issues for valid hostname wildcard at start', () => {
		const issues = validateRemotePatterns([{ hostname: '*.example.com' }]);
		assert.equal(issues.length, 0);
	});

	it('returns no issues for double-star hostname wildcard at start', () => {
		const issues = validateRemotePatterns([{ hostname: '**.example.com' }]);
		assert.equal(issues.length, 0);
	});

	it('returns an issue for wildcard in the middle of hostname', () => {
		const issues = validateRemotePatterns([{ hostname: 'cdn.*.example.com' }]);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /beginning of the hostname/);
		assert.deepEqual(issues[0].path, ['image', 'remotePatterns', 0, 'hostname']);
	});

	it('returns an issue for wildcard at the end of hostname', () => {
		const issues = validateRemotePatterns([{ hostname: 'example.*' }]);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /beginning of the hostname/);
	});

	it('returns no issues for valid pathname wildcard at end', () => {
		const issues = validateRemotePatterns([{ pathname: '/images/*' }]);
		assert.equal(issues.length, 0);
	});

	it('returns no issues for double-star pathname wildcard at end', () => {
		const issues = validateRemotePatterns([{ pathname: '/images/**' }]);
		assert.equal(issues.length, 0);
	});

	it('returns an issue for wildcard at the start of pathname', () => {
		const issues = validateRemotePatterns([{ pathname: '/*/images' }]);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /end of a pathname/);
		assert.deepEqual(issues[0].path, ['image', 'remotePatterns', 0, 'pathname']);
	});

	it('returns issues for multiple invalid patterns', () => {
		const issues = validateRemotePatterns([
			{ hostname: 'cdn.*.example.com' },
			{ hostname: '*.valid.com' },
			{ pathname: '/*/bad' },
		]);
		assert.equal(issues.length, 2);
	});

	it('returns no issues for patterns without wildcards', () => {
		const issues = validateRemotePatterns([{ hostname: 'example.com', pathname: '/images' }]);
		assert.equal(issues.length, 0);
	});
});
// #endregion

// #region validateI18nRedirectToDefaultLocale
describe('validateI18nRedirectToDefaultLocale', () => {
	it('returns no issues when i18n is undefined', () => {
		const issues = validateI18nRedirectToDefaultLocale(undefined);
		assert.equal(issues.length, 0);
	});

	it('returns no issues when prefixDefaultLocale is true and redirectToDefaultLocale is true', () => {
		const issues = validateI18nRedirectToDefaultLocale(
			i18n({
				routing: {
					prefixDefaultLocale: true,
					redirectToDefaultLocale: true,
					fallbackType: 'redirect',
				},
			}),
		);
		assert.equal(issues.length, 0);
	});

	it('returns no issues when prefixDefaultLocale is false and redirectToDefaultLocale is false', () => {
		const issues = validateI18nRedirectToDefaultLocale(
			i18n({
				routing: {
					prefixDefaultLocale: false,
					redirectToDefaultLocale: false,
					fallbackType: 'redirect',
				},
			}),
		);
		assert.equal(issues.length, 0);
	});

	it('returns an issue when prefixDefaultLocale is false and redirectToDefaultLocale is true', () => {
		const issues = validateI18nRedirectToDefaultLocale(
			i18n({
				routing: {
					prefixDefaultLocale: false,
					redirectToDefaultLocale: true,
					fallbackType: 'redirect',
				},
			}),
		);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /redirectToDefaultLocale/);
		assert.match(issues[0].message, /prefixDefaultLocale/);
		assert.deepEqual(issues[0].path, ['i18n', 'routing', 'redirectToDefaultLocale']);
	});

	it('returns no issues when routing is manual', () => {
		const issues = validateI18nRedirectToDefaultLocale(i18n({ routing: 'manual' }));
		assert.equal(issues.length, 0);
	});
});
// #endregion

// #region validateOutDirNotInPublicDir
describe('validateOutDirNotInPublicDir', () => {
	it('returns no issues when outDir is outside publicDir', () => {
		const issues = validateOutDirNotInPublicDir(
			new URL('file:///project/dist/'),
			new URL('file:///project/public/'),
		);
		assert.equal(issues.length, 0);
	});

	it('returns an issue when outDir equals publicDir', () => {
		const issues = validateOutDirNotInPublicDir(
			new URL('file:///project/public/'),
			new URL('file:///project/public/'),
		);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /outDir/);
		assert.match(issues[0].message, /publicDir/);
		assert.deepEqual(issues[0].path, ['outDir']);
	});

	it('returns an issue when outDir is inside publicDir', () => {
		const issues = validateOutDirNotInPublicDir(
			new URL('file:///project/public/dist/'),
			new URL('file:///project/public/'),
		);
		assert.equal(issues.length, 1);
	});
});
// #endregion

// #region validateI18nDefaultLocale
describe('validateI18nDefaultLocale', () => {
	it('returns no issues when defaultLocale is in locales', () => {
		const issues = validateI18nDefaultLocale({
			defaultLocale: 'en',
			locales: ['en', 'fr', 'de'],
		});
		assert.equal(issues.length, 0);
	});

	it('returns an issue when defaultLocale is not in locales', () => {
		const issues = validateI18nDefaultLocale({
			defaultLocale: 'es',
			locales: ['en', 'fr', 'de'],
		});
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /es/);
		assert.match(issues[0].message, /not present/);
		assert.deepEqual(issues[0].path, ['i18n', 'locales']);
	});

	it('handles object locales (uses path property)', () => {
		const issues = validateI18nDefaultLocale({
			defaultLocale: 'english',
			locales: [{ path: 'english', codes: ['en'] }, 'fr'],
		});
		assert.equal(issues.length, 0);
	});

	it('returns an issue when defaultLocale is missing from object locales', () => {
		const issues = validateI18nDefaultLocale({
			defaultLocale: 'en',
			locales: [{ path: 'english', codes: ['en'] }, 'fr'],
		});
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /en/);
	});
});
// #endregion

// #region validateI18nFallback
describe('validateI18nFallback', () => {
	it('returns no issues when fallback is undefined', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr'],
		});
		assert.equal(issues.length, 0);
	});

	it('returns no issues for valid fallback entries', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr', 'de'],
			fallback: { fr: 'en', de: 'en' },
		});
		assert.equal(issues.length, 0);
	});

	it('returns an issue when fallback key is not in locales', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr'],
			fallback: { es: 'en' },
		});
		assert.ok(issues.some((i) => i.message.includes('es') && i.message.includes('key')));
	});

	it('returns an issue when fallback value is not in locales', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr'],
			fallback: { fr: 'de' },
		});
		assert.ok(issues.some((i) => i.message.includes('de') && i.message.includes('value')));
	});

	it('returns an issue when default locale is used as a fallback key', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr'],
			fallback: { en: 'fr' },
		});
		assert.ok(issues.some((i) => i.message.includes('default locale')));
	});

	it('returns multiple issues for multiple invalid entries', () => {
		const issues = validateI18nFallback({
			defaultLocale: 'en',
			locales: ['en', 'fr'],
			fallback: { es: 'de', en: 'fr' },
		});
		// es not in locales (key issue), de not in locales (value issue), en is default locale
		assert.ok(issues.length >= 3);
	});
});
// #endregion

// #region validateI18nDomains
describe('validateI18nDomains', () => {
	it('returns no issues when i18n is undefined', () => {
		const issues = validateI18nDomains(domains({ i18n: undefined }));
		assert.equal(issues.length, 0);
	});

	it('returns no issues when domains is undefined', () => {
		const issues = validateI18nDomains(domains({ i18n: { locales: ['en'], defaultLocale: 'en' } }));
		assert.equal(issues.length, 0);
	});

	it('returns an issue when site is not set', () => {
		const issues = validateI18nDomains(
			domains({
				site: undefined,
				output: 'server',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { fr: 'https://fr.example.com' },
				},
			}),
		);
		assert.ok(issues.some((i) => i.message.includes('site')));
	});

	it('returns an issue when output is not server', () => {
		const issues = validateI18nDomains(
			domains({
				site: 'https://example.com',
				output: 'static',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { fr: 'https://fr.example.com' },
				},
			}),
		);
		assert.ok(issues.some((i) => i.message.includes('output') && i.message.includes('server')));
	});

	it('returns an issue when domain locale key is not in locales', () => {
		const issues = validateI18nDomains(
			domains({
				site: 'https://example.com',
				output: 'server',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { de: 'https://de.example.com' },
				},
			}),
		);
		assert.ok(issues.some((i) => i.message.includes('de')));
	});

	it('returns an issue when domain value is not a URL', () => {
		const issues = validateI18nDomains(
			domains({
				site: 'https://example.com',
				output: 'server',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { fr: 'not-a-url' },
				},
			}),
		);
		assert.ok(issues.some((i) => i.message.includes('http')));
	});

	it('returns an issue when domain URL has a pathname', () => {
		const issues = validateI18nDomains(
			domains({
				site: 'https://example.com',
				output: 'server',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { fr: 'https://fr.example.com/blog' },
				},
			}),
		);
		assert.ok(issues.some((i) => i.message.includes('/blog')));
	});

	it('returns no issues for valid domain configuration', () => {
		const issues = validateI18nDomains(
			domains({
				site: 'https://example.com',
				output: 'server',
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'en',
					domains: { fr: 'https://fr.example.com' },
				},
			}),
		);
		assert.equal(issues.length, 0);
	});
});
// #endregion

// #region validateFontsCssVariables
describe('validateFontsCssVariables', () => {
	it('returns no issues for valid CSS variable names', () => {
		const issues = validateFontsCssVariables([
			font({ cssVariable: '--font-body' }),
			font({ cssVariable: '--heading-font' }),
		]);
		assert.equal(issues.length, 0);
	});

	it('returns an issue when cssVariable does not start with --', () => {
		const issues = validateFontsCssVariables([font({ cssVariable: 'font-body' })]);
		assert.equal(issues.length, 1);
		assert.match(issues[0].message, /cssVariable/);
		assert.deepEqual(issues[0].path, ['fonts', 0, 'cssVariable']);
	});

	it('returns an issue when cssVariable contains a space', () => {
		const issues = validateFontsCssVariables([font({ cssVariable: '--font body' })]);
		assert.equal(issues.length, 1);
	});

	it('returns an issue when cssVariable contains a colon', () => {
		const issues = validateFontsCssVariables([font({ cssVariable: '--font:body' })]);
		assert.equal(issues.length, 1);
	});

	it('returns issues for multiple invalid entries', () => {
		const issues = validateFontsCssVariables([
			font({ cssVariable: '--valid' }),
			font({ cssVariable: 'no-prefix' }),
			font({ cssVariable: '--has space' }),
		]);
		assert.equal(issues.length, 2);
		assert.deepEqual(issues[0].path, ['fonts', 1, 'cssVariable']);
		assert.deepEqual(issues[1].path, ['fonts', 2, 'cssVariable']);
	});

	it('returns no issues for empty array', () => {
		const issues = validateFontsCssVariables([]);
		assert.equal(issues.length, 0);
	});
});
// #endregion
