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
      renderers: [42],
      buildOptions: { pageUrlFormat: 'invalid' },
      pages: {},
    };
    const configError = await validateConfig(veryBadConfig, process.cwd()).catch((err) => err);
    expect(configError instanceof z.ZodError).to.equal(true);
    const formattedError = stripAnsi(formatConfigError(configError));
    expect(formattedError).to.equal(
      `[config] Astro found issue(s) with your configuration:
  ! pages  Expected string, received object.
  ! renderers.0  Expected string, received number.
  ! buildOptions.pageUrlFormat  Invalid input.`
    );
  });
});
