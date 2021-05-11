import type { AstroConfig } from './@types/astro';

import 'source-map-support/register.js';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync } from 'fs';

/** Type util */
const type = (thing: any): string => (Array.isArray(thing) ? 'Array' : typeof thing);

/** Throws error if a user provided an invalid config. Manually-implemented to avoid a heavy validation library. */
function validateConfig(config: any): void {
  // basic
  if (config === undefined || config === null) throw new Error(`[config] Config empty!`);
  if (typeof config !== 'object') throw new Error(`[config] Expected object, received ${typeof config}`);

  // strings
  for (const key of ['projectRoot', 'astroRoot', 'dist', 'public']) {
    if (config[key] !== undefined && config[key] !== null && typeof config[key] !== 'string') {
      throw new Error(`[config] ${key}: ${JSON.stringify(config[key])}\n  Expected string, received ${type(config[key])}.`);
    }
  }

  // booleans
  for (const key of ['sitemap']) {
    if (config[key] !== undefined && config[key] !== null && typeof config[key] !== 'boolean') {
      throw new Error(`[config] ${key}: ${JSON.stringify(config[key])}\n  Expected boolean, received ${type(config[key])}.`);
    }
  }

  // buildOptions
  if (config.buildOptions && config.buildOptions.site !== undefined) {
    if (typeof config.buildOptions.site !== 'string') throw new Error(`[config] buildOptions.site is not a string`);
    try {
      new URL(config.buildOptions.site);
    } catch (err) {
      throw new Error('[config] buildOptions.site must be a valid URL');
    }
  }

  // devOptions
  if (typeof config.devOptions?.port !== 'number') {
    throw new Error(`[config] devOptions.port: Expected number, received ${type(config.devOptions?.port)}`);
  }
}

/** Set default config values */
function configDefaults(userConfig?: any): any {
  const config: any = { ...(userConfig || {}) };

  if (!config.projectRoot) config.projectRoot = '.';
  if (!config.astroRoot) config.astroRoot = './src';
  if (!config.dist) config.dist = './dist';
  if (!config.public) config.public = './public';
  if (!config.devOptions) config.devOptions = {};
  if (!config.devOptions.port) config.devOptions.port = 3000;
  if (!config.buildOptions) config.buildOptions = {};
  if (typeof config.buildOptions.sitemap === 'undefined') config.buildOptions.sitemap = true;

  return config;
}

/** Turn raw config values into normalized values */
function normalizeConfig(userConfig: any, root: string): AstroConfig {
  const config: any = { ...(userConfig || {}) };

  const fileProtocolRoot = `file://${root}/`;
  config.projectRoot = new URL(config.projectRoot + '/', fileProtocolRoot);
  config.astroRoot = new URL(config.astroRoot + '/', fileProtocolRoot);
  config.public = new URL(config.public + '/', fileProtocolRoot);

  return config as AstroConfig;
}

/** Attempt to load an `astro.config.mjs` file */
export async function loadConfig(rawRoot: string | undefined, configFileName = 'astro.config.mjs'): Promise<AstroConfig> {
  if (typeof rawRoot === 'undefined') {
    rawRoot = process.cwd();
  }

  const root = pathResolve(rawRoot);
  const astroConfigPath = pathJoin(root, configFileName);

  // load
  let config: any;
  if (existsSync(astroConfigPath)) {
    config = configDefaults((await import(astroConfigPath)).default);
  } else {
    config = configDefaults();
  }

  // validate
  validateConfig(config);

  // normalize
  config = normalizeConfig(config, root);

  return config as AstroConfig;
}
