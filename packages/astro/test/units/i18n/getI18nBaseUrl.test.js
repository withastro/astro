import { getI18nBaseUrl } from '../../../dist/i18n/index.js';
import { expect } from 'chai';
import { Logger } from '../../../dist/core/logger/core.js';

const logger = new Logger();
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

		expect(getI18nBaseUrl('en', config, logger)).to.eq('/blog/en/');
		expect(getI18nBaseUrl('es', config, logger)).to.eq('/blog/es/');
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

		expect(getI18nBaseUrl('en', config, logger)).to.eq('/en/');
		expect(getI18nBaseUrl('es', config, logger)).to.eq('/es/');
	});

	it('should correctly return the URL when a locale is mapped to a custom domain', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					customDomains: {
						en: 'example.com',
						es: 'es.example.com',
					},
				},
			},
		};

		expect(getI18nBaseUrl('en', config, logger)).to.eq('example.com/');
		expect(getI18nBaseUrl('es', config, logger)).to.eq('es.example.com/');
	});

	it('should correctly return the URL when a locale is mapped to a custom domain with the base set', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			base: '/docs',
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					customDomains: {
						en: 'example.com',
						es: 'es.example.com',
					},
				},
			},
		};

		expect(getI18nBaseUrl('en', config, logger)).to.eq('example.com/docs/');
		expect(getI18nBaseUrl('es', config, logger)).to.eq('es.example.com/docs/');
	});
});
