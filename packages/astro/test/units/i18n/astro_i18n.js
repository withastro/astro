import {
	getLocaleRelativeUrl,
	getLocaleRelativeUrlList,
	getLocaleAbsoluteUrl,
	getLocaleAbsoluteUrlList,
} from '../../../dist/i18n/index.js';
import { expect } from 'chai';

describe('getLocaleRelativeUrl', () => {
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
					locales: ['en', 'en_US', 'es'],
				},
			},
		};

		// directory format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.throw;

		// file format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
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
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/en/');
		expect(
			getLocaleRelativeUrl({
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
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.eq('/blog/en');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.eq('/blog/en/');

		// directory file
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.eq('/blog/en');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
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
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-us/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_AU',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-au/');
	});
});

describe('getLocaleRelativeUrlList', () => {
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
			getLocaleRelativeUrlList({
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
			getLocaleRelativeUrlList({
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
			getLocaleRelativeUrlList({
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
			getLocaleRelativeUrlList({
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
			getLocaleRelativeUrlList({
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
			getLocaleRelativeUrlList({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.have.members(['/blog/en/', '/blog/en-us/', '/blog/es/']);
	});
});

describe('getLocaleAbsoluteUrl', () => {
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
					locales: ['en', 'en_US', 'es'],
				},
			},
		};

		// directory format
		expect(
			getLocaleAbsoluteUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.eq('https://example.com/blog/en/');
		expect(
			getLocaleAbsoluteUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.eq('https://example.com/blog/es/');

		expect(
			getLocaleAbsoluteUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.throw;

		// file format
		expect(
			getLocaleAbsoluteUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
			})
		).to.eq('https://example.com/blog/en/');
		expect(
			getLocaleAbsoluteUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
			})
		).to.eq('https://example.com/blog/es/');

		expect(
			getLocaleAbsoluteUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
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
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.eq('/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
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
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.eq('/blog/en');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.eq('/blog/en/');

		// directory file
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.eq('/blog/en');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
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
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-us/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_AU',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-au/');
	});
});

describe('getLocaleAbsoluteUrlList', () => {
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en',
			'https://example.com/blog/en-us',
			'https://example.com/blog/es',
		]);
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
		]);
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
		]);
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'never',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en',
			'https://example.com/blog/en-us',
			'https://example.com/blog/es',
		]);
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en',
			'https://example.com/blog/en-us',
			'https://example.com/blog/es',
		]);
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
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				locales: config.experimental.i18n.locales,
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/en/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
		]);
	});
});
