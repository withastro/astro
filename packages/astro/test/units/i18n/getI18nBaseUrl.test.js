import { getI18nBaseUrl, getLocalesBaseUrl } from '../../../dist/i18n/index.js';
import { expect } from 'chai';

describe('getI18nBaseUrl', () => {
	it('should correctly return the URL with the base', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			base: '/blog',
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
				},
			},
		};

		// directory format
		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en/');
		expect(
			getI18nBaseUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getI18nBaseUrl({
				locale: 'en-US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.throw;

		// file format
		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/en/');
		expect(
			getI18nBaseUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getI18nBaseUrl({
				locale: 'en-US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.throw;
	});

	it('should correctly return the URL without base', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
				},
			},
		};

		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/en/');
		expect(
			getI18nBaseUrl({
				locale: 'es',
				base: '/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/es/');
	});

	it('should correctly handle the trailing slash', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
				},
			},
		};
		// directory format
		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.eq('/blog/en');
		expect(
			getI18nBaseUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.eq('/blog/en/');

		// directory file
		expect(
			getI18nBaseUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.eq('/blog/en');
		expect(
			getI18nBaseUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getI18nBaseUrl({
				locale: 'en',
				// ignore + file => no trailing slash
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'file',
			})
		).to.eq('/blog/en');
	});

	it('should normalize locales', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			base: '/blog',
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'en_AU'],
				},
			},
		};

		expect(
			getI18nBaseUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-us/');

		expect(
			getI18nBaseUrl({
				locale: 'en_AU',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-au/');
	});
});

describe('getLocalesBaseUrl', () => {
	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.have.members(['/blog/en', '/blog/en-us', '/blog/es']);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: always]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.have.members(['/blog/en/', '/blog/en-us/', '/blog/es/']);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: always]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.have.members(['/blog/en/', '/blog/en-us/', '/blog/es/']);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: never]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.have.members(['/blog/en', '/blog/en-us', '/blog/es']);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: ignore]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'file',
			})
		).to.have.members(['/blog/en', '/blog/en-us', '/blog/es']);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		expect(
			getLocalesBaseUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.have.members(['/blog/en/', '/blog/en-us/', '/blog/es/']);
	});
});
