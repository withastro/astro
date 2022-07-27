import { expect } from 'chai';
import { z } from 'zod';
import stripAnsi from 'strip-ansi';
import { formatConfigErrorMessage } from '../dist/core/messages.js';
import { validateConfig } from '../dist/core/config.js';

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
});
