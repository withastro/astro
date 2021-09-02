import { z } from 'zod';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import stripAnsi from 'strip-ansi';
import { formatConfigError, validateConfig } from '#astro/config';

const ConfigValidate = suite('Config Validation');

ConfigValidate('empty user config is valid', async (context) => {
  const configError = await validateConfig({}, process.cwd()).catch(err => err);
  assert.ok(!(configError instanceof Error));
});

ConfigValidate('Zod errors are returned when invalid config is used', async (context) => {
  const configError = await validateConfig({buildOptions: {sitemap: 42}}, process.cwd()).catch(err => err);
  assert.ok(configError instanceof z.ZodError);
});

ConfigValidate('A validation error can be formatted correctly', async (context) => {
  const configError = await validateConfig({buildOptions: {sitemap: 42}}, process.cwd()).catch(err => err);
  assert.ok(configError instanceof z.ZodError);
  const formattedError = stripAnsi(formatConfigError(configError));
  assert.equal(formattedError, `[config] Astro found issue(s) with your configuration:
  ! buildOptions.sitemap  Expected boolean, received number.`);
});

ConfigValidate('Multiple validation errors can be formatted correctly', async (context) => {
  const veryBadConfig = {
    renderers: [42],
    buildOptions: {pageUrlFormat: 'invalid'},
    pages: {},
  };
  const configError = await validateConfig(veryBadConfig, process.cwd()).catch(err => err);
  assert.ok(configError instanceof z.ZodError);
  const formattedError = stripAnsi(formatConfigError(configError));
  assert.equal(formattedError, `[config] Astro found issue(s) with your configuration:
  ! pages  Expected string, received object.
  ! renderers.0  Expected string, received number.
  ! buildOptions.pageUrlFormat  Invalid input.`);
});

ConfigValidate.run();
