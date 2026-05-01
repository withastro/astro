import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import { toRoutingStrategy } from '../../../dist/core/app/common.js';
import { validateConfig } from '../../../dist/core/config/validate.js';
import { MissingLocale } from '../../../dist/core/errors/errors-data.js';
import { AstroError } from '../../../dist/core/errors/index.js';
import {
	getLocaleAbsoluteUrl,
	getLocaleAbsoluteUrlList,
	getLocaleRelativeUrl,
	getLocaleRelativeUrlList,
} from '../../../dist/i18n/index.js';
import { parseLocale } from '../../../dist/i18n/utils.js';

type I18nRouting = NonNullable<AstroConfig['i18n']>['routing'];
type I18nRoutingInput = Partial<Exclude<I18nRouting, 'manual'>> | 'manual' | undefined;

// Helper wrappers that accept partial config objects (matching original JS test behavior).
// The i18n functions require full config types but these tests intentionally pass subsets.
const relativeUrl = (opts: Record<string, unknown>) =>
	getLocaleRelativeUrl(opts as unknown as Parameters<typeof getLocaleRelativeUrl>[0]);
const relativeUrlList = (opts: Record<string, unknown>) =>
	getLocaleRelativeUrlList(opts as unknown as Parameters<typeof getLocaleRelativeUrlList>[0]);
const absoluteUrl = (opts: Record<string, unknown>) =>
	getLocaleAbsoluteUrl(opts as unknown as Parameters<typeof getLocaleAbsoluteUrl>[0]);
const absoluteUrlList = (opts: Record<string, unknown>) =>
	getLocaleAbsoluteUrlList(opts as unknown as Parameters<typeof getLocaleAbsoluteUrlList>[0]);
const routingStrategy = (routing?: I18nRoutingInput, domains?: Record<string, string>) =>
	toRoutingStrategy(routing as I18nRouting, domains);

describe('getLocaleRelativeUrl', () => {
	it('should correctly return the URL with the base', () => {
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
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.experimental.i18n,
			}),
			'/blog/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			}),
			'/blog/es/',
		);

		// file format
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			'/blog/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			'/blog/es/',
		);

		assert.equal(
			relativeUrl({
				locale: 'it-VA',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			'/blog/italiano/',
		);
	});

	it('should correctly return the URL without base', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
				},
			},
		};

		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			}),
			'/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			}),
			'/es/',
		);

		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
			}),
			'/',
		);

		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
			}),
			'/es',
		);

		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'directory',
			}),
			'/',
		);
	});

	it('should correctly handle the trailing slash', () => {
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
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'directory',
			}),
			'/blog',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
			}),
			'/blog/es/',
		);

		assert.equal(
			relativeUrl({
				locale: 'it-VA',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			'/blog/italiano/',
		);

		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
			}),
			'/blog/',
		);

		// directory file
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'file',
			}),
			'/blog',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			'/blog/es/',
		);

		assert.equal(
			relativeUrl({
				locale: 'en',
				// ignore + file => no trailing slash
				base: '/blog',
				...config.i18n,
				trailingSlash: 'ignore',
				format: 'file',
			}),
			'/blog',
		);
	});

	it('should normalize locales by default', () => {
		const config = {
			base: '/blog',
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'en_US', 'en_AU'],
			},
		};

		assert.equal(
			relativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
				strategy: routingStrategy(),
			}),
			'/blog/en-us/',
		);

		assert.equal(
			relativeUrl({
				locale: 'en_US',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
				normalizeLocale: false,
				strategy: routingStrategy(),
			}),
			'/blog/en_US/',
		);

		assert.equal(
			relativeUrl({
				locale: 'en_AU',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
				strategy: routingStrategy(),
			}),
			'/blog/en-au/',
		);
	});

	it('should return the default locale when routing strategy is [pathname-prefix-always]', () => {
		const config = {
			base: '/blog',
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'es', 'en_US', 'en_AU'],
				routing: {
					prefixDefaultLocale: true,
				},
			},
		};

		// directory format
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.i18n,
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/en/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/es/',
		);

		// file format
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/en/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/es/',
		);
	});

	it('should return the default locale when routing strategy is [pathname-prefix-always-no-redirect]', () => {
		const config = {
			base: '/blog',
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'es', 'en_US', 'en_AU'],
				routing: {
					prefixDefaultLocale: true,
					redirectToDefaultLocale: false,
				},
			},
		};

		// directory format
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				trailingSlash: 'always',
				format: 'directory',
				...config.i18n,
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/en/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'directory',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/es/',
		);

		// file format
		assert.equal(
			relativeUrl({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/en/',
		);
		assert.equal(
			relativeUrl({
				locale: 'es',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
				strategy: routingStrategy(config.i18n.routing),
			}),
			'/blog/es/',
		);
	});
});

describe('getLocaleRelativeUrlList', () => {
	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never]', () => {
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
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'directory',
			}),
			['/blog', '/blog/en-us', '/blog/es', '/blog/italiano'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: always]', () => {
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
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'directory',
			}),
			['/blog/', '/blog/en-us/', '/blog/es/', '/blog/italiano/'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: always]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'always',
				format: 'file',
			}),
			['/blog/', '/blog/en-us/', '/blog/es/'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: never]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
			}),
			['/blog', '/blog/en-us', '/blog/es'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: ignore]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'file',
			}),
			['/blog', '/blog/en-us', '/blog/es'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
			}),
			['/blog/', '/blog/en-us/', '/blog/es/'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never, routingStrategy: pathname-prefix-always]', () => {
		const config = {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'en_US', 'es'],
				routing: {
					prefixDefaultLocale: true,
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'directory',
				strategy: routingStrategy(config.i18n.routing),
			}),
			['/blog/en', '/blog/en-us', '/blog/es'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never, routingStrategy: pathname-prefix-always-no-redirect]', () => {
		const config = {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'en_US', 'es'],
				routing: {
					prefixDefaultLocale: true,
					redirectToDefaultLocale: false,
				},
			},
		};
		// directory format
		assert.deepEqual(
			relativeUrlList({
				locale: 'en',
				base: '/blog',
				...config.i18n,
				trailingSlash: 'never',
				format: 'directory',
				strategy: routingStrategy(config.i18n.routing),
			}),
			['/blog/en', '/blog/en-us', '/blog/es'],
		);
	});
});

describe('getLocaleAbsoluteUrl', () => {
	describe('with [prefix-other-locales]', () => {
		it('should correctly return the URL with the base', () => {
			const config = {
				base: '/blog',
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
			};

			// directory format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					...config.i18n,
				}),
				'https://example.com/blog/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					isBuild: true,
				}),
				'https://es.example.com/blog/',
			);

			assert.throws(
				() =>
					absoluteUrl({
						locale: 'ff',
						base: '/blog/',
						...config.i18n,
						trailingSlash: 'always',
						format: 'directory',
						site: 'https://example.com',
					}),

				new AstroError({
					...MissingLocale,
					message: MissingLocale.message('ff'),
				}),
			);

			// file format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'it-VA',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog/italiano/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					isBuild: true,
				}),
				'https://es.example.com/blog/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					prependWith: 'some-name',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
				}),
				'https://es.example.com/blog/some-name/first-post/',
			);

			// en isn't mapped to a domain
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					prependWith: 'some-name',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
				}),
				'https://example.com/blog/some-name/first-post/',
			);
		});
	});
	describe('with [prefix-always]', () => {
		it('should correctly return the URL with the base', () => {
			const config = {
				base: '/blog',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
					domains: {
						es: 'https://es.example.com',
					},
					routing: {
						prefixDefaultLocale: true,
					},
				},
			};

			// directory format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					...config.i18n,
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			// file format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					isBuild: true,
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://es.example.com/blog/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					prependWith: 'some-name',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					path: 'first-post',
					isBuild: true,
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://es.example.com/blog/some-name/first-post/',
			);
		});
		it('should correctly return the URL without base', () => {
			const config = {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					routing: {
						prefixDefaultLocale: true,
					},
				},
			};

			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/es/',
			);
		});

		it('should correctly handle the trailing slash', () => {
			const config = {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					routing: {
						prefixDefaultLocale: true,
					},
				},
			};
			// directory format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'ignore',
					format: 'directory',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);

			// directory file
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.i18n,
					trailingSlash: 'never',
					format: 'file',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en',
					// ignore + file => no trailing slash
					base: '/blog',
					...config.i18n,
					trailingSlash: 'ignore',
					format: 'file',
					site: 'https://example.com',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en',
			);
		});

		it('should normalize locales', () => {
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

			assert.equal(
				absoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				}),
				'/blog/en-us/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en_AU',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				}),
				'/blog/en-au/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					normalizeLocale: true,
				}),
				'/blog/en-us/',
			);
		});

		it('should return the default locale when routing strategy is [pathname-prefix-always]', () => {
			const config = {
				base: '/blog',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es', 'en_US', 'en_AU'],
					routing: {
						prefixDefaultLocale: true,
					},
				},
			};

			// directory format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					site: 'https://example.com',
					format: 'directory',
					...config.i18n,
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			// file format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);
		});

		it('should return the default locale when routing strategy is [pathname-prefix-always-no-redirect]', () => {
			const config = {
				base: '/blog',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es', 'en_US', 'en_AU'],
					routing: {
						prefixDefaultLocale: true,
						redirectToDefaultLocale: false,
					},
				},
			};

			// directory format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					trailingSlash: 'always',
					site: 'https://example.com',
					format: 'directory',
					...config.i18n,
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'directory',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);

			// file format
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/en/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.i18n,
					site: 'https://example.com',
					trailingSlash: 'always',
					format: 'file',
					strategy: routingStrategy(config.i18n.routing),
				}),
				'https://example.com/blog/es/',
			);
		});
	});
	describe('with [prefix-other-locales]', () => {
		it('should correctly return the URL without base', () => {
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

			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/es/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'it-VA',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/italiano/',
			);
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/es',
			);
			assert.equal(
				absoluteUrl({
					locale: 'it-VA',
					base: '/',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/italiano',
			);
		});

		it('should correctly handle the trailing slash', () => {
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
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/blog',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'ignore',
					format: 'directory',
					site: 'https://example.com',
				}),
				'https://example.com/blog/',
			);

			// directory file
			assert.equal(
				absoluteUrl({
					locale: 'en',
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'never',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog',
			);
			assert.equal(
				absoluteUrl({
					locale: 'es',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog/es/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en',
					// ignore + file => no trailing slash
					base: '/blog',
					...config.experimental.i18n,
					trailingSlash: 'ignore',
					format: 'file',
					site: 'https://example.com',
				}),
				'https://example.com/blog',
			);
		});

		it('should normalize locales', () => {
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

			assert.equal(
				absoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				}),
				'/blog/en-us/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en_AU',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
				}),
				'/blog/en-au/',
			);

			assert.equal(
				absoluteUrl({
					locale: 'en_US',
					base: '/blog/',
					...config.experimental.i18n,
					trailingSlash: 'always',
					format: 'directory',
					normalizeLocale: true,
				}),
				'/blog/en-us/',
			);
		});
	});
});

describe('getLocaleAbsoluteUrlList', () => {
	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: never]', async () => {
		const config: AstroConfig = await validateConfig(
			{
				trailingSlash: 'never',
				format: 'directory',
				site: 'https://example.com',
				base: '/blog',
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
			process.cwd(),
			'build',
		);
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				...config,
				...config.i18n,
				isBuild: true,
			}),
			[
				'https://example.com/blog',
				'https://example.com/blog/en-us',
				'https://example.com/blog/es',
				'https://example.com/blog/italiano',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: always]', async () => {
		const config: AstroConfig = await validateConfig(
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
			process.cwd(),
			'build',
		);
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				...config,
				...config.i18n,
			}),
			[
				'https://example.com/blog/',
				'https://example.com/blog/en-us/',
				'https://example.com/blog/es/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales and path [format: directory, trailingSlash: always]', async () => {
		const config: AstroConfig = await validateConfig(
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
			process.cwd(),
			'build',
		);
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				path: 'download',
				...config,
				...config.i18n!,
				strategy: routingStrategy(config.i18n!.routing),
			}),
			[
				'https://example.com/en/download/',
				'https://example.com/en-us/download/',
				'https://example.com/es/download/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales and path [format: directory, trailingSlash: always, domains]', async () => {
		const config: AstroConfig = await validateConfig(
			{
				format: 'directory',
				output: 'server',
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
			process.cwd(),
			'build',
		);
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				path: 'download',
				...config,
				...config.i18n!,
				strategy: routingStrategy(config.i18n!.routing),
				isBuild: true,
			}),
			[
				'https://example.com/en/download/',
				'https://example.com/en-us/download/',
				'https://es.example.com/download/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: always]', () => {
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
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				trailingSlash: 'always',
				format: 'file',
				site: 'https://example.com',
			}),
			[
				'https://example.com/blog/',
				'https://example.com/blog/en-us/',
				'https://example.com/blog/es/',
				'https://example.com/blog/italiano/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: never]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'never',
				format: 'file',
				site: 'https://example.com',
			}),
			['https://example.com/blog', 'https://example.com/blog/en-us', 'https://example.com/blog/es'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: file, trailingSlash: ignore]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'file',
				site: 'https://example.com',
			}),
			['https://example.com/blog', 'https://example.com/blog/en-us', 'https://example.com/blog/es'],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore]', () => {
		const config = {
			experimental: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'en_US', 'es'],
				},
			},
		};
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
			}),
			[
				'https://example.com/blog/',
				'https://example.com/blog/en-us/',
				'https://example.com/blog/es/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore,  routingStrategy: pathname-prefix-always]', () => {
		const config = {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'en_US', 'es'],
				routing: {
					prefixDefaultLocale: true,
				},
			},
		};
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				strategy: routingStrategy(config.i18n.routing),
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
			}),
			[
				'https://example.com/blog/en/',
				'https://example.com/blog/en-us/',
				'https://example.com/blog/es/',
			],
		);
	});

	it('should retrieve the correct list of base URL with locales [format: directory, trailingSlash: ignore,  routingStrategy: pathname-prefix-always-no-redirect]', () => {
		const config = {
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'en_US', 'es'],
				routing: {
					prefixDefaultLocale: true,
					redirectToDefaultLocale: false,
				},
			},
		};
		// directory format
		assert.deepEqual(
			absoluteUrlList({
				locale: 'en',
				base: '/blog/',
				...config.i18n,
				strategy: routingStrategy(config.i18n.routing),
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
			}),
			[
				'https://example.com/blog/en/',
				'https://example.com/blog/en-us/',
				'https://example.com/blog/es/',
			],
		);
	});

	it('should retrieve the correct list of base URLs, swapped with the correct domain', () => {
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
		assert.deepEqual(
			absoluteUrlList({
				base: '/blog/',
				...config.experimental.i18n,
				trailingSlash: 'ignore',
				format: 'directory',
				site: 'https://example.com',
				isBuild: true,
			}),
			[
				'https://example.uk/blog/',
				'https://example.com/blog/en-us/',
				'https://es.example.com/blog/',
			],
		);
	});
});

describe('parse accept-header', () => {
	it('should be parsed correctly', () => {
		assert.deepEqual(parseLocale('*'), [{ locale: '*', qualityValue: undefined }]);
		assert.deepEqual(parseLocale('fr'), [{ locale: 'fr', qualityValue: undefined }]);
		assert.deepEqual(parseLocale('fr;q=0.6'), [{ locale: 'fr', qualityValue: 0.6 }]);
		assert.deepEqual(parseLocale('fr;q=0.6,fr-CA;q=0.5'), [
			{ locale: 'fr', qualityValue: 0.6 },
			{ locale: 'fr-CA', qualityValue: 0.5 },
		]);

		assert.deepEqual(parseLocale('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5'), [
			{ locale: 'fr-CH', qualityValue: undefined },
			{ locale: 'fr', qualityValue: 0.9 },
			{ locale: 'en', qualityValue: 0.8 },
			{ locale: 'de', qualityValue: 0.7 },
			{ locale: '*', qualityValue: 0.5 },
		]);
	});

	it('should not return incorrect quality values', () => {
		assert.deepEqual(parseLocale('wrong'), [{ locale: 'wrong', qualityValue: undefined }]);
		assert.deepEqual(parseLocale('fr;f=0.7'), [{ locale: 'fr', qualityValue: undefined }]);
		assert.deepEqual(parseLocale('fr;q=something'), [{ locale: 'fr', qualityValue: undefined }]);
		assert.deepEqual(parseLocale('fr;q=1000'), [{ locale: 'fr', qualityValue: undefined }]);
	});
});
