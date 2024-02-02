import {
	getLocaleRelativeUrl,
	getLocaleRelativeUrlList,
	getLocaleAbsoluteUrl,
	getLocaleAbsoluteUrlList,
} from '../../../dist/i18n/index.js';
import { parseLocale } from '../../../dist/core/render/context.js';
import { expect } from 'chai';
import { validateConfig } from '../../../dist/core/config/config.js';

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
					locales: [
						'en',
						'en_US',
						'es',
						{
							path: 'italiano',
							codes: ['it', 'it-VA'],
						},
					],
				},
			},
		};

		// directory format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.experimental.i18n,
			})
		).to.eq('/blog/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.throw;

		// file format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.throw;

		expect(
			getLocaleRelativeUrl({
				locale: 'it-VA',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/italiano/');
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
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/',
				...config.experimental.i18n,
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
			i18n: {
				defaultLocale: 'en',
				locales: [
					'en',
					'es',
					{
						path: 'italiano',
						codes: ['it', 'it-VA'],
					},
				],
			},
		};
		// directory format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.eq('/blog');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'it-VA',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/italiano/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.eq('/blog/');

		// directory file
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.eq('/blog');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				// ignore + file => no trailing slash
				base: '/blog',
				...config.i18n,
				trailingSlash: 'ignore',
				format: 'file',
			})
		).to.eq('/blog');
	});

	it('should normalize locales by default', () => {
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
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-us/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
				normalizeLocale: false,
			})
		).to.eq('/blog/en_US/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_AU',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/en-au/');
	});

	it('should return the default locale when routing strategy is [pathname-prefix-always]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			base: '/blog',
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es', 'en_US', 'en_AU'],
					routing: 'pathname-prefix-always',
				},
			},
		};

		// directory format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.experimental.i18n,
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.throw;

		// file format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.throw;
	});

	it('should return the default locale when routing strategy is [pathname-prefix-always-no-redirect]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			base: '/blog',
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es', 'en_US', 'en_AU'],
					routing: 'pathname-prefix-always-no-redirect',
				},
			},
		};

		// directory format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.experimental.i18n,
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.throw;

		// file format
		expect(
			getLocaleRelativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/en/');
		expect(
			getLocaleRelativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.eq('/blog/es/');

		expect(
			getLocaleRelativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.throw;
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
					locales: [
						'en',
						'en_US',
						'es',
						{
							path: 'italiano',
							codes: ['it', 'it-VA'],
						},
					],
				},
			},
		};
		// directory format
		expect(
			getLocaleRelativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.have.members(['/blog', '/blog/en-us', '/blog/es', '/blog/italiano']);
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
					locales: [
						'en',
						'en_US',
						'es',
						{
							path: 'italiano',
							codes: ['it', 'it-VA'],
						},
					],
				},
			},
		};
		// directory format
		expect(
			getLocaleRelativeUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			})
		).to.have.members(['/blog/', '/blog/en-us/', '/blog/es/', '/blog/italiano/']);
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
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			})
		).to.have.members(['/blog/', '/blog/en-us/', '/blog/es/']);
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
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
			})
		).to.have.members(['/blog', '/blog/en-us', '/blog/es']);
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
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'file',
			})
		).to.have.members(['/blog', '/blog/en-us', '/blog/es']);
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
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
			})
		).to.have.members(['/blog/', '/blog/en-us/', '/blog/es/']);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never, routingStategy: pathname-prefix-always]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: 'pathname-prefix-always',
				},
			},
		};
		// directory format
		expect(
			getLocaleRelativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.have.members(['/blog/en', '/blog/en-us', '/blog/es']);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never, routingStategy: pathname-prefix-always-no-redirect]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: 'pathname-prefix-always-no-redirect',
				},
			},
		};
		// directory format
		expect(
			getLocaleRelativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'directory',
			})
		).to.have.members(['/blog/en', '/blog/en-us', '/blog/es']);
	});
});

describe('getLocaleAbsoluteUrl', () => {
	describe('with [prefix-other-locales]', () => {
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
						locales: [
							'en',
							'en_US',
							'es',
							{
								path: 'italiano',
								codes: ['it', 'it-VA'],
							},
						],
						domains: {
							es: 'https://es.example.com',
						},
						routingStrategy: 'prefix-other-locales',
					},
				},
			};

			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					...config.experimental.i18n,
				})
			).to.eq('https://example.com/blog/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					isBuild: true,
				})
			).to.eq('https://es.example.com/blog/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
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
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.throw;
			expect(
				getLocaleAbsoluteUrl({
					locale: 'it-VA',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/italiano/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.throw;

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					isBuild: true,
				})
			).to.eq('https://es.example.com/blog/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					prependWith: 'some-name',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
				})
			).to.eq('https://es.example.com/blog/some-name/first-post/');

			// en isn't mapped to a domain
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					prependWith: 'some-name',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
				})
			).to.eq('/blog/some-name/first-post/');
		});
	});
	describe('with [prefix-always]', () => {
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
						domains: {
							es: 'https://es.example.com',
						},
						routing: 'pathname-prefix-always',
					},
				},
			};

			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					...config.experimental.i18n,
				})
			).to.eq('https://example.com/blog/en/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
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
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.throw;

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					isBuild: true,
				})
			).to.eq('https://es.example.com/blog/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					prependWith: 'some-name',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
				})
			).to.eq('https://es.example.com/blog/some-name/first-post/');
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
						routing: 'pathname-prefix-always',
					},
				},
			};

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/es/');
		});

		it('should correctly handle the trailing slash', () => {
			/**
			 *
			 * @type {import("../../../dist/@types").AstroUserConfig}
			 */
			const config = {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					routing: 'pathname-prefix-always',
				},
			};
			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/en');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'ignore',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/en/');

			// directory file
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.i18n,
					trailingSlash: 'never',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/en');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					// ignore + file => no trailing slash
					base: '/blog',
					...config.i18n,
					trailingSlash: 'ignore',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/en');
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
						routingStrategy: 'pathname-prefix-always',
					},
				},
			};

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('/blog/en-us/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_AU',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('/blog/en-au/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					normalizeLocale: true,
				})
			).to.eq('/blog/en-us/');
		});

		it('should return the default locale when routing strategy is [pathname-prefix-always]', () => {
			/**
			 *
			 * @type {import("../../../dist/@types").AstroUserConfig}
			 */
			const config = {
				base: '/blog',
				experimental: {
					i18n: {
						defaultLocale: 'en',
						locales: ['en', 'es', 'en_US', 'en_AU'],
						routing: 'pathname-prefix-always',
					},
				},
			};

			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					site: 'https://example.com',
					format: 'directory',
					...config.experimental.i18n,
				})
			).to.eq('https://example.com/blog/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.throw;

			// file format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
				})
			).to.eq('https://example.com/blog/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
				})
			).to.throw;
		});

		it('should return the default locale when routing strategy is [pathname-prefix-always-no-redirect]', () => {
			/**
			 *
			 * @type {import("../../../dist/@types").AstroUserConfig}
			 */
			const config = {
				base: '/blog',
				experimental: {
					i18n: {
						defaultLocale: 'en',
						locales: ['en', 'es', 'en_US', 'en_AU'],
						routing: 'pathname-prefix-always-no-redirect',
					},
				},
			};

			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					site: 'https://example.com',
					format: 'directory',
					...config.experimental.i18n,
				})
			).to.eq('https://example.com/blog/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.throw;

			// file format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
				})
			).to.eq('https://example.com/blog/en/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					site: 'https://example.com',
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
						locales: [
							'en',
							'es',
							{
								path: 'italiano',
								codes: ['it', 'it-VA'],
							},
						],
						routingStrategy: 'prefix-other-locales',
					},
				},
			};

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/es/');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'it-VA',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/italiano/');
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
						routingStrategy: 'prefix-other-locales',
					},
				},
			};
			// directory format
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'ignore',
					format: 'directory',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/');

			// directory file
			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog');
			expect(
				getLocaleAbsoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog/es/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en',
					// ignore + file => no trailing slash
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'ignore',
					format: 'file',
					site: 'https://example.com',
				})
			).to.eq('https://example.com/blog');
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
						routingStrategy: 'prefix-other-locales',
					},
				},
			};

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('/blog/en-us/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_AU',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				})
			).to.eq('/blog/en-au/');

			expect(
				getLocaleAbsoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					normalizeLocale: true,
				})
			).to.eq('/blog/en-us/');
		});
	});
});

describe('getLocaleAbsoluteUrlList', () => {
	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			i18n: {
				defaultLocale: 'en',
				locales: [
					'en',
					'en_US',
					'es',
					{
						path: 'italiano',
						codes: ['it', 'it-VA'],
					},
				],
			},
		};
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog',
			'https://example.com/blog/en-us',
			'https://example.com/blog/es',
			'https://example.com/blog/italiano',
		]);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: always]', async () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = await validateConfig(
			{
				trailingSlash: 'always',
				format: 'directory',
				base: '/blog/',
				site: 'https://example.com',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
			process.cwd()
		);
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				...config,
				...config.i18n,
			})
		).to.have.members([
			'https://example.com/blog/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
		]);
	});

	it('should retrieve the correct list of base URL with locales and path [format: directory, trailingSlash: always]', async () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = await validateConfig(
			{
				format: 'directory',
				site: 'https://example.com/',
				trailingSlash: 'always',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: {
						prefixDefaultLocale: true,
					},
				},
			},
			process.cwd()
		);
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				path: 'download',
				...config,
				...config.i18n,
			})
		).to.have.members([
			'https://example.com/en/download/',
			'https://example.com/en-us/download/',
			'https://example.com/es/download/',
		]);
	});

	it('should retrieve the correct list of base URL with locales and path [format: directory, trailingSlash: always, domains]', async () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = await validateConfig(
			{
				format: 'directory',
				site: 'https://example.com/',
				trailingSlash: 'always',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: {
						prefixDefaultLocale: true,
					},
					domains: {
						es: 'https://es.example.com',
					},
				},
			},
			process.cwd()
		);
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				path: 'download',
				...config,
				...config.i18n,
				isBuild: true,
			})
		).to.have.members([
			'https://example.com/en/download/',
			'https://example.com/en-us/download/',
			'https://es.example.com/download/',
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
					locales: [
						'en',
						'en_US',
						'es',
						{
							path: 'italiano',
							codes: ['it', 'it-VA'],
						},
					],
				},
			},
		};
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
			'https://example.com/blog/italiano/',
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
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog',
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
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'file',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog',
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
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
			})
		).to.have.members([
			'https://example.com/blog/',
			'https://example.com/blog/en-us/',
			'https://example.com/blog/es/',
		]);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore,  routingStategy: pathname-prefix-always]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: 'pathname-prefix-always',
				},
			},
		};
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
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

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore,  routingStategy: pathname-prefix-always-no-redirect]', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routing: 'pathname-prefix-always-no-redirect',
				},
			},
		};
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
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

	it('should retrieve the correct list of base URLs, swapped with the correct domain', () => {
		/**
		 *
		 * @type {import("../../../dist/@types").AstroUserConfig}
		 */
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					routingStrategy: 'pathname-prefix-always',
					domains: {
						es: 'https://es.example.com',
						en: 'https://example.uk',
					},
				},
			},
		};
		// directory format
		expect(
			getLocaleAbsoluteUrlList({
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
				isBuild: true,
			})
		).to.have.members([
			'https://example.uk/blog/',
			'https://example.com/blog/en-us/',
			'https://es.example.com/blog/',
		]);
	});
});

describe('parse accept-header', () => {
	it('should be parsed correctly', () => {
		expect(parseLocale('*')).to.have.deep.members([{ locale: '*', qualityValue: undefined }]);
		expect(parseLocale('fr')).to.have.deep.members([{ locale: 'fr', qualityValue: undefined }]);
		expect(parseLocale('fr;q=0.6')).to.have.deep.members([{ locale: 'fr', qualityValue: 0.6 }]);
		expect(parseLocale('fr;q=0.6,fr-CA;q=0.5')).to.have.deep.members([
			{ locale: 'fr', qualityValue: 0.6 },
			{ locale: 'fr-CA', qualityValue: 0.5 },
		]);

		expect(parseLocale('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5')).to.have.deep.members([
			{ locale: 'fr-CH', qualityValue: undefined },
			{ locale: 'fr', qualityValue: 0.9 },
			{ locale: 'en', qualityValue: 0.8 },
			{ locale: 'de', qualityValue: 0.7 },
			{ locale: '*', qualityValue: 0.5 },
		]);
	});

	it('should not return incorrect quality values', () => {
		expect(parseLocale('wrong')).to.have.deep.members([
			{ locale: 'wrong', qualityValue: undefined },
		]);
		expect(parseLocale('fr;f=0.7')).to.have.deep.members([
			{ locale: 'fr', qualityValue: undefined },
		]);
		expect(parseLocale('fr;q=something')).to.have.deep.members([
			{ locale: 'fr', qualityValue: undefined },
		]);

		expect(parseLocale('fr;q=1000')).to.have.deep.members([
			{ locale: 'fr', qualityValue: undefined },
		]);
	});
});
