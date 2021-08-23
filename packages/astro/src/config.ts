import { existsSync } from 'fs';
import getPort from 'get-port';
import path from 'path';
import { z } from 'zod';
import { AstroConfig, AstroUserConfig } from './@types/astro';
import { addTrailingSlash } from './util.js';

export const AstroConfigSchema = z.object({
  projectRoot: z
    .string()
    .optional()
    .default('.')
    .transform((val) => new URL(val)),
  src: z
    .string()
    .optional()
    .default('./src')
    .transform((val) => new URL(val)),
  pages: z
    .string()
    .optional()
    .default('./src/pages')
    .transform((val) => new URL(val)),
  public: z
    .string()
    .optional()
    .default('./public')
    .transform((val) => new URL(val)),
  dist: z
    .string()
    .optional()
    .default('./dist')
    .transform((val) => new URL(val)),
  renderers: z.array(z.string()).optional().default(['@astrojs/renderer-svelte', '@astrojs/renderer-vue', '@astrojs/renderer-react', '@astrojs/renderer-preact']),
  markdownOptions: z
    .object({
      footnotes: z.boolean().optional(),
      gfm: z.boolean().optional(),
      remarkPlugins: z.array(z.any()).optional(),
      rehypePlugins: z.array(z.any()).optional(),
    })
    .optional()
    .default({}),
  buildOptions: z
    .object({
      site: z.string().optional(),
      sitemap: z.boolean().optional().default(true),
      pageUrlFormat: z
        .union([z.literal('file'), z.literal('directory')])
        .optional()
        .default('directory'),
    })
    .optional()
    .default({}),
  devOptions: z
    .object({
      hostname: z.string().optional().default('localhost'),
      port: z
        .number()
        .optional()
        .transform((val) => val || getPort({ port: getPort.makeRange(3000, 3050) })),
      tailwindConfig: z.string().optional(),
      trailingSlash: z
        .union([z.literal('always'), z.literal('never'), z.literal('ignore')])
        .optional()
        .default('ignore'),
    })
    .optional()
    .default({}),
});

/** Turn raw config values into normalized values */
async function validateConfig(userConfig: any, root: string): Promise<AstroConfig> {
  const fileProtocolRoot = `file://${root}/`;
  // We need to extend the global schema to add transforms that are relative to root.
  // This is type checked against the global schema to make sure we still match.
  const AstroConfigRelativeSchema = AstroConfigSchema.extend({
    projectRoot: z
      .string()
      .default('.')
      .transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
    src: z
      .string()
      .default('./src')
      .transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
    pages: z
      .string()
      .default('./src/pages')
      .transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
    public: z
      .string()
      .default('./public')
      .transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
    dist: z
      .string()
      .default('./dist')
      .transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
  });
  return AstroConfigRelativeSchema.parseAsync(userConfig);
}

/** Attempt to load an `astro.config.mjs` file */
export async function loadConfig(rawRoot: string | undefined, configFileName = 'astro.config.mjs'): Promise<AstroConfig> {
  const root = rawRoot ? path.resolve(rawRoot) : process.cwd();
  const astroConfigPath = new URL(`./${configFileName}`, `file://${root}/`);
  let userConfig: AstroUserConfig = {};
  // Load a user-config, if one exists and is provided
  if (existsSync(astroConfigPath)) {
    userConfig = (await import(astroConfigPath.href)).default;
  }
  // normalize, validate, and return
  const config = await validateConfig(userConfig, root);
  return config;
}
