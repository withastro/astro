import { expect } from 'chai';
import { z } from 'zod';
import stripAnsi from 'strip-ansi';
import { formatConfigError, validateConfig } from '../dist/core/config.js';

describe('Config Validation', () => {
	it('empty user config is valid', async () => {
		expect(() => validateConfig({}, process.cwd()).catch((err) => err)).not.to.throw();
	});

	it('Zod errors are returned when invalid config is used', async () => {
		const configError = await validateConfig({ buildOptions: { sitemap: 42 } }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
	});

	it('errors when an older markdownOptions format is used', async () => {
		const configError = await validateConfig({ markdownOptions: { rehypePlugins: ['rehype-autolink-headings'] } }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		expect(configError.issues[0].message).to.equal("Unrecognized key(s) in object: 'rehypePlugins'");
	});

	it('A validation error can be formatted correctly', async () => {
		const configError = await validateConfig({ buildOptions: { sitemap: 42 } }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		const formattedError = stripAnsi(formatConfigError(configError));
		expect(formattedError).to.equal(
			`[config] Astro found issue(s) with your configuration:
  ! buildOptions.sitemap  Expected boolean, received number.`
		);
	});

	it('Multiple validation errors can be formatted correctly', async () => {
		const veryBadConfig = {
			integrations: [42],
			buildOptions: { pageUrlFormat: 'invalid' },
			pages: {},
		};
		const configError = await validateConfig(veryBadConfig, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		const formattedError = stripAnsi(formatConfigError(configError));
		expect(formattedError).to.equal(
			`[config] Astro found issue(s) with your configuration:
  ! pages  Expected string, received object.
  ! integrations.0  Expected object, received number.
  ! buildOptions.pageUrlFormat  Invalid input.`
		);
	});

	it('ignores falsey "integration" values', async () => {
		const result = await validateConfig({ integrations: [0, false, null, undefined] }, process.cwd());
		expect(result.integrations).to.deep.equal([]);
	});
	it('normalizes "integration" values', async () => {
		const result = await validateConfig({ integrations: [{ name: '@astrojs/a' }] }, process.cwd());
		expect(result.integrations).to.deep.equal([{ name: '@astrojs/a', hooks: {} }]);
	});
	it('flattens array "integration" values', async () => {
		const result = await validateConfig({ integrations: [{ name: '@astrojs/a' }, [{ name: '@astrojs/b' }, { name: '@astrojs/c' }]] }, process.cwd());
		expect(result.integrations).to.deep.equal([
			{ name: '@astrojs/a', hooks: {} },
			{ name: '@astrojs/b', hooks: {} },
			{ name: '@astrojs/c', hooks: {} },
		]);
	});
	it('blocks third-party "integration" values', async () => {
		const configError = await validateConfig({ integrations: [{ name: '@my-plugin/a' }] }, process.cwd()).catch((err) => err);
		expect(configError instanceof z.ZodError).to.equal(true);
		const formattedError = stripAnsi(formatConfigError(configError));
		expect(formattedError).to.equal(
			`[config] Astro found issue(s) with your configuration:
  ! integrations  Astro integrations are still experimental, and only official integrations are currently supported.`
		);
	});
});
