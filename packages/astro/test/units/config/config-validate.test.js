// @ts-check
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { z } from 'zod';
import { fontProviders } from '../../../dist/assets/fonts/providers/index.js';
import { validateConfig as _validateConfig } from '../../../dist/core/config/validate.js';
import { formatConfigErrorMessage } from '../../../dist/core/messages.js';
import { envField } from '../../../dist/env/config.js';

/**
 *
 * @param {any} userConfig
 */
async function validateConfig(userConfig) {
	return _validateConfig(userConfig, process.cwd(), '');
}

describe('Config Validation', () => {
	it('empty user config is valid', async () => {
		assert.doesNotThrow(() => validateConfig({}).catch((err) => err));
	});

	it('Zod errors are returned when invalid config is used', async () => {
		const configError = await validateConfig({ site: 42 }).catch((err) => err);
		assert.equal(configError instanceof z.ZodError, true);
	});

	it('A validation error can be formatted correctly', async () => {
		const configError = await validateConfig({ site: 42 }).catch((err) => err);
		assert.equal(configError instanceof z.ZodError, true);
		const formattedError = stripVTControlCharacters(formatConfigErrorMessage(configError));
		assert.equal(
			formattedError,
			`[config] Astro found issue(s) with your configuration:

! site: Expected type "string", received "number"`,
		);
	});

	it('Multiple validation errors can be formatted correctly', async () => {
		const veryBadConfig = {
			integrations: [42],
			build: { format: 'invalid' },
		};
		const configError = await validateConfig(veryBadConfig).catch((err) => err);
		assert.equal(configError instanceof z.ZodError, true);
		const formattedError = stripVTControlCharacters(formatConfigErrorMessage(configError));
		assert.equal(
			formattedError,
			`[config] Astro found issue(s) with your configuration:

! integrations.0: Expected type "object", received "number"

! build.format: Did not match union.
  > Expected "file" | "directory" | "preserve", received "invalid"`,
		);
	});

	it('ignores falsey "integration" values', async () => {
		const result = await validateConfig({ integrations: [0, false, null, undefined] });
		assert.deepEqual(result.integrations, []);
	});
	it('normalizes "integration" values', async () => {
		const result = await validateConfig({ integrations: [{ name: '@astrojs/a' }] });
		assert.deepEqual(result.integrations, [{ name: '@astrojs/a', hooks: {} }]);
	});
	it('flattens array "integration" values', async () => {
		const result = await validateConfig({
			integrations: [{ name: '@astrojs/a' }, [{ name: '@astrojs/b' }, { name: '@astrojs/c' }]],
		});
		assert.deepEqual(result.integrations, [
			{ name: '@astrojs/a', hooks: {} },
			{ name: '@astrojs/b', hooks: {} },
			{ name: '@astrojs/c', hooks: {} },
		]);
	});
	it('ignores null or falsy "integration" values', async () => {
		const configError = await validateConfig({
			integrations: [null, undefined, false, '', ``],
		}).catch((err) => err);
		assert.equal(configError instanceof Error, false);
	});
	it('Error when outDir is placed within publicDir', async () => {
		const configError = await validateConfig({ outDir: './public/dist' }).catch((err) => err);
		assert.equal(configError instanceof z.ZodError, true);
		assert.equal(
			configError.errors[0].message,
			'The value of `outDir` must not point to a path within the folder set as `publicDir`, this will cause an infinite loop',
		);
	});

	describe('i18n', async () => {
		it('defaultLocale is not in locales', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'en',
					locales: ['es'],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				'The default locale `en` is not present in the `i18n.locales` array.',
			);
		});

		it('errors if codes are empty', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'uk',
					locales: [
						'es',
						{
							path: 'something',
							codes: [],
						},
					],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				'**i18n.locales.1.codes**: Array must contain at least 1 element(s)',
			);
		});

		it('errors if the default locale is not in path', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'uk',
					locales: [
						'es',
						{
							path: 'something',
							codes: ['en-UK'],
						},
					],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				'The default locale `uk` is not present in the `i18n.locales` array.',
			);
		});

		it('errors if a fallback value does not exist', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					fallback: {
						es: 'it',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The locale `it` value in the `i18n.fallback` record doesn't exist in the `i18n.locales` array.",
			);
		});

		it('errors if a fallback key does not exist', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					fallback: {
						it: 'en',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The locale `it` key in the `i18n.fallback` record doesn't exist in the `i18n.locales` array.",
			);
		});

		it('errors if a fallback key contains the default locale', async () => {
			const configError = await validateConfig({
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					fallback: {
						en: 'es',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"You can't use the default locale as a key. The default locale can only be used as value.",
			);
		});

		it(
			'errors if `i18n.prefixDefaultLocale` is `false` and `i18n.redirectToDefaultLocale` is `true`',
			{ todo: 'Enable in Astro 6.0', skip: 'Removed validation' },
			async () => {
				const configError = await validateConfig({
					i18n: {
						defaultLocale: 'en',
						locales: ['es', 'en'],
						routing: {
							prefixDefaultLocale: false,
							redirectToDefaultLocale: true,
						},
					},
				}).catch((err) => err);
				assert.equal(configError instanceof z.ZodError, true);
				assert.equal(
					configError.errors[0].message,
					'The option `i18n.routing.redirectToDefaultLocale` can be used only when `i18n.routing.prefixDefaultLocale` is set to `true`, otherwise redirects might cause infinite loops. Remove the option `i18n.routing.redirectToDefaultLocale`, or change its value to `false`.',
				);
			},
		);

		it('errors if a domains key does not exist', async () => {
			const configError = await validateConfig({
				output: 'server',
				site: 'https://www.example.com',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						lorem: 'https://example.com',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The locale `lorem` key in the `i18n.domains` record doesn't exist in the `i18n.locales` array.",
			);
		});

		it('errors if a domains value is not an URL', async () => {
			const configError = await validateConfig({
				output: 'server',
				site: 'https://www.example.com',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						en: 'www.example.com',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
			);
		});

		it('errors if a domains value is not an URL with incorrect protocol', async () => {
			const configError = await validateConfig({
				output: 'server',
				site: 'https://www.example.com',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						en: 'tcp://www.example.com',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
			);
		});

		it('errors if a domain is a URL with a pathname that is not the home', async () => {
			const configError = await validateConfig({
				output: 'server',
				site: 'https://www.example.com',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						en: 'https://www.example.com/blog/page/',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The URL `https://www.example.com/blog/page/` must contain only the origin. A subsequent pathname isn't allowed here. Remove `/blog/page/`.",
			);
		});

		it('errors if domains is enabled but site is not provided', async () => {
			const configError = await validateConfig({
				output: 'server',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						en: 'https://www.example.com/',
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				"The option `site` isn't set. When using the 'domains' strategy for `i18n`, `site` is required to create absolute URLs for locales that aren't mapped to a domain.",
			);
		});

		it('errors if domains is enabled but the `output` is not "server"', async () => {
			const configError = await validateConfig({
				output: 'static',
				i18n: {
					defaultLocale: 'en',
					locales: ['es', 'en'],
					domains: {
						en: 'https://www.example.com/',
					},
				},
				site: 'https://foo.org',
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				'Domain support is only available when `output` is `"server"`.',
			);
		});
	});

	describe('env', () => {
		it('Should allow not providing a schema', () => {
			assert.doesNotThrow(() =>
				validateConfig({
					env: {
						schema: undefined,
					},
				}),
			);
		});

		it('Should allow schema variables with numbers', () => {
			assert.doesNotThrow(() =>
				validateConfig({
					env: {
						schema: {
							ABC123: envField.string({ access: 'public', context: 'server' }),
						},
					},
				}),
			);
		});

		it('Should not allow schema variables starting with a number', async () => {
			const configError = await validateConfig({
				env: {
					schema: {
						'123ABC': envField.string({ access: 'public', context: 'server' }),
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message,
				'A valid variable name cannot start with a number.',
			);
		});

		it('Should provide a useful error for access/context invalid combinations', async () => {
			const configError = await validateConfig({
				env: {
					schema: {
						// @ts-expect-error we test an invalid combination
						BAR: envField.string({ access: 'secret', context: 'client' }),
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message.includes(
					'**Invalid combination** of "access" and "context" options',
				),
				true,
			);
		});
	});

	describe('fonts', () => {
		it('Should allow empty fonts', () => {
			assert.doesNotThrow(() =>
				validateConfig({
					experimental: {
						fonts: [],
					},
				}),
			);
		});

		it('Should error on invalid css variable', async () => {
			let configError = await validateConfig({
				experimental: {
					fonts: [{ name: 'Roboto', cssVariable: 'test', provider: { entrypoint: '' } }],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message.includes(
					'contains invalid characters for CSS variable generation',
				),
				true,
			);

			configError = await validateConfig({
				experimental: {
					fonts: [{ name: 'Roboto', cssVariable: '-test', provider: { entrypoint: '' } }],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message.includes(
					'contains invalid characters for CSS variable generation',
				),
				true,
			);

			configError = await validateConfig({
				experimental: {
					fonts: [{ name: 'Roboto', cssVariable: '--test ', provider: { entrypoint: '' } }],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message.includes(
					'contains invalid characters for CSS variable generation',
				),
				true,
			);

			configError = await validateConfig({
				experimental: {
					fonts: [{ name: 'Roboto', cssVariable: '--test:x', provider: { entrypoint: '' } }],
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
			assert.equal(
				configError.errors[0].message.includes(
					'contains invalid characters for CSS variable generation',
				),
				true,
			);

			assert.doesNotThrow(() =>
				validateConfig({
					experimental: {
						fonts: [{ name: 'Roboto', cssVariable: '--test', provider: { entrypoint: '' } }],
					},
				}),
			);
		});

		it('Should allow empty font fallbacks', () => {
			assert.doesNotThrow(() =>
				validateConfig({
					experimental: {
						fonts: [
							{
								provider: fontProviders.google(),
								name: 'Roboto',
								fallbacks: [],
								cssVariable: '--font-roboto',
							},
						],
					},
				}),
			);
		});
	});

	describe('csp', () => {
		it('should throw an error if incorrect scriptHashes are passed', async () => {
			let configError = await validateConfig({
				experimental: {
					csp: {
						scriptDirective: {
							hashes: ['fancy-1234567890'],
						},
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
		});

		it('should throw an error if incorrect styleHashes are passed', async () => {
			let configError = await validateConfig({
				experimental: {
					csp: {
						styleDirective: {
							hashes: ['fancy-1234567890'],
						},
					},
				},
			}).catch((err) => err);
			assert.equal(configError instanceof z.ZodError, true);
		});

		it('should not throw an error for correct hashes', async () => {
			assert.doesNotThrow(() => {
				validateConfig({
					experimental: {
						csp: {
							styleDirective: {
								hashes: ['sha256-1234567890'],
							},
						},
					},
				});
			});
		});

		it('should not throw an error when the directives are correct', () => {
			assert.doesNotThrow(() =>
				validateConfig({
					experimental: {
						csp: {
							directives: ["image-src 'self'"],
						},
					},
				}).catch((err) => err),
			);
		});
	});
});
