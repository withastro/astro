import { expect } from 'chai';
import { z } from 'zod';
import stripAnsi from 'strip-ansi';
import { formatConfigErrorMessage } from '../../../dist/core/messages.js';
import { validateConfig } from '../../../dist/core/config/config.js';

describe('Config Validation', () => {
	it('empty user config is valid', async () => {
		expect(() => validateConfig({}, process.cwd()).catch((err) => err)).not.to.throw();
	});

	it('Zod errors are returned when invalid config is used', async () => {
		const configError = await validateConfig({ site: 42 }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
	});

	it('A validation error can be formatted correctly', async () => {
		const configError = await validateConfig({ site: 42 }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		const formattedError = stripAnsi(formatConfigErrorMessage(configError));
		expect(formattedError).to.equal(
			`[config] Astro found issue(s) with your configuration:
  ! site  Expected string, received number.`
		);
	});

	it('Multiple validation errors can be formatted correctly', async () => {
		const veryBadConfig = {
			integrations: [42],
			build: { format: 'invalid' },
		};
		const configError = await validateConfig(veryBadConfig, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		const formattedError = stripAnsi(formatConfigErrorMessage(configError));
		expect(formattedError).to.equal(
			`[config] Astro found issue(s) with your configuration:
  ! integrations.0  Expected object, received number.
  ! build.format  Invalid input.`
		);
	});

	it('ignores falsey "integration" values', async () => {
		const result = await validateConfig(
			{ integrations: [0, false, null, undefined] },
			process.cwd()
		);
		expect(result.integrations).to.deep.equal([]);
	});
	it('normalizes "integration" values', async () => {
		const result = await validateConfig({ integrations: [{ name: '@astrojs/a' }] }, process.cwd());
		expect(result.integrations).to.deep.equal([{ name: '@astrojs/a', hooks: {} }]);
	});
	it('flattens array "integration" values', async () => {
		const result = await validateConfig(
			{ integrations: [{ name: '@astrojs/a' }, [{ name: '@astrojs/b' }, { name: '@astrojs/c' }]] },
			process.cwd()
		);
		expect(result.integrations).to.deep.equal([
			{ name: '@astrojs/a', hooks: {} },
			{ name: '@astrojs/b', hooks: {} },
			{ name: '@astrojs/c', hooks: {} },
		]);
	});
	it('ignores null or falsy "integration" values', async () => {
		const configError = await validateConfig(
			{ integrations: [null, undefined, false, '', ``] },
			process.cwd()
		).catch((err) => err);
		expect(configError).to.be.not.instanceOf(Error);
	});
	it('Error when outDir is placed within publicDir', async () => {
		const configError = await validateConfig({ outDir: './public/dist' }, process.cwd()).catch(
			(err) => err
		);
		expect(configError instanceof z.ZodError).to.equal(true);
		expect(configError.errors[0].message).to.equal(
			'The value of `outDir` must not point to a path within the folder set as `publicDir`, this will cause an infinite loop'
		);
	});

	describe('i18n', async () => {
		it('defaultLocale is not in locales', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es'],
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				'The default locale `en` is not present in the `i18n.locales` array.'
			);
		});

		it('errors if a fallback value does not exist', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es', 'en'],
							fallback: {
								es: 'it',
							},
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				"The locale `it` value in the `i18n.fallback` record doesn't exist in the `i18n.locales` array."
			);
		});

		it('errors if a fallback key does not exist', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es', 'en'],
							fallback: {
								it: 'en',
							},
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				"The locale `it` key in the `i18n.fallback` record doesn't exist in the `i18n.locales` array."
			);
		});

		it('errors if a fallback key contains the default locale', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es', 'en'],
							fallback: {
								en: 'es',
							},
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				"You can't use the default locale as a key. The default locale can only be used as value."
			);
		});

		it('errors if a domains key does not exist', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es', 'en'],
							domains: {
								lorem: 'https://example.com',
							},
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				"The locale `lorem` key in the `i18n.domains` record doesn't exist in the `i18n.locales` array."
			);
		});

		it('errors if a domains value is not an URL', async () => {
			const configError = await validateConfig(
				{
					experimental: {
						i18n: {
							defaultLocale: 'en',
							locales: ['es', 'en'],
							domains: {
								en: 'www.example.com',
							},
						},
					},
				},
				process.cwd()
			).catch((err) => err);
			expect(configError instanceof z.ZodError).to.equal(true);
			expect(configError.errors[0].message).to.equal(
				"The domain value must be a valid URL, and it has to start with 'https' or 'http'."
			);
		});
	});
});
