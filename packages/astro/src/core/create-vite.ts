import type { AstroConfig } from '../@types/astro-core';
import type { AstroDevServer } from './dev';
import type { LogOptions } from './logger';

import slash from 'slash';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import vite from './vite.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import fetchVitePlugin from '../vite-plugin-fetch/index.js';
import { getPackageJSON, parseNpmName } from './util.js';

const require = createRequire(import.meta.url);

// Some packages are just external, and that’s the way it goes.
const ALWAYS_EXTERNAL = new Set([
  '@sveltejs/vite-plugin-svelte',
  'micromark-util-events-to-acorn',
  'estree-util-value-to-estree',
  'prismjs',
  'shorthash',
  'unified'
]);
const ALWAYS_NOEXTERNAL = new Set([
  // This is only because Vite's native ESM doesn't resolve "exports" correctly.
  'astro'
]);

/*
 * Tailwind fixes
 * These fix Tailwind HMR in dev, and must be declared before Vite initiates.
 * These are Tailwind-specific, so they’re safe to add.
 */
(process.env as any).TAILWIND_MODE = 'watch';

// note: ssr is still an experimental API hence the type omission
type ViteConfigWithSSR = vite.InlineConfig & { ssr?: { external?: string[]; noExternal?: string[] } };

interface CreateViteOptions {
  astroConfig: AstroConfig;
  devServer?: AstroDevServer;
  logging: LogOptions;
}

/** Return a common starting point for all Vite actions */
export async function createVite(inlineConfig: ViteConfigWithSSR, { astroConfig, logging, devServer }: CreateViteOptions): Promise<ViteConfigWithSSR> {
  const packageJSON = (await getPackageJSON(astroConfig.projectRoot)) || {};
  const userDeps = Object.keys(packageJSON?.dependencies || {});
  const userDevDeps = Object.keys(packageJSON?.devDependencies || {});
  const { external, noExternal } = await viteSSRDeps([...userDeps, ...userDevDeps]); // TODO: improve this?

  // First, start with the Vite configuration that Astro core needs
  let viteConfig: ViteConfigWithSSR = {
    cacheDir: fileURLToPath(new URL('./node_modules/.vite/', astroConfig.projectRoot)), // using local caches allows Astro to be used in monorepos, etc.
    clearScreen: false, // we want to control the output, not Vite
    logLevel: 'error', // log errors only
    optimizeDeps: {
      entries: ['src/**/*'], // Try and scan a user’s project (won’t catch everything),
      include: [...userDeps], // tell Vite to prebuild everything in a user’s package.json dependencies
    },
    plugins: [
      astroVitePlugin({ config: astroConfig, devServer }),
      markdownVitePlugin({ config: astroConfig, devServer }),
      jsxVitePlugin({ config: astroConfig, logging }),
      astroPostprocessVitePlugin({ config: astroConfig, devServer }),
      fetchVitePlugin(),
    ],
    publicDir: fileURLToPath(astroConfig.public),
    root: fileURLToPath(astroConfig.projectRoot),
    server: {
      /** disable HMR for test */
      hmr: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' ? false : undefined,
      /** handle Vite URLs */
      proxy: {
        // add proxies here
      },
    },
    /** Note: SSR API is in beta (https://vitejs.dev/guide/ssr.html) */
    ssr: {
      external: [...external, ...ALWAYS_EXTERNAL],
      noExternal: [...noExternal, ...ALWAYS_NOEXTERNAL],
    },
  };

  // Add in Astro renderers, which will extend the base config
  for (const name of astroConfig.renderers) {
    try {
      const { default: renderer } = await import(name);
      if (!renderer) continue;
      // if a renderer provides viteConfig(), call it and pass in results
      if (renderer.viteConfig) {
        if (typeof renderer.viteConfig !== 'function') {
          throw new Error(`${name}: viteConfig(options) must be a function! Got ${typeof renderer.viteConfig}.`);
        }
        const rendererConfig = await renderer.viteConfig({ mode: inlineConfig.mode, command: inlineConfig.mode === 'production' ? 'build' : 'serve' }); // is this command true?
        viteConfig = vite.mergeConfig(viteConfig, rendererConfig) as vite.InlineConfig;
      }
    } catch (err) {
      throw new Error(`${name}: ${err}`);
    }
  }

  // Add in user settings last, followed by any Vite configuration passed in from the parent function (overrides)
  viteConfig = vite.mergeConfig(viteConfig, astroConfig.vite || {}); // merge in Vite config from astro.config.mjs
  viteConfig = vite.mergeConfig(viteConfig, inlineConfig); // merge in inline Vite config
  return viteConfig;
}

/** Try and automatically figure out Vite external & noExternal */
async function viteSSRDeps(deps: string[]): Promise<{ external: Set<string>; noExternal: Set<string> }> {
  const skip = new Set<string>();
  const external = new Set<string>();
  const noExternal = new Set<string>();

  /** categorize package as ESM or CJS */
  async function sortPkg(spec: string): Promise<void> {
    // already sorted; skip
    if (external.has(spec) || noExternal.has(spec) || skip.has(spec)) return;

    // not an npm package: ignore
    const pkg = parseNpmName(spec);
    if (!pkg) {
      skip.add(spec);
      return;
    }

    try {
      const moduleLoc = require.resolve(spec);

      // node can’t find this: skip
      if (!moduleLoc) {
        skip.add(spec);
        return;
      }

      // load module’s package.json
      let cwd = new URL('../', `file://${slash(moduleLoc)}/`);
      let packageJSON = await getPackageJSON(cwd);
      while (!packageJSON) {
        const next = new URL('../', cwd);
        if (next.href === cwd.href) return; // we’re at root; skip
        cwd = next;
        packageJSON = await getPackageJSON(cwd);
      }

      // couldn’t locate: skip
      if (!packageJSON) {
        skip.add(spec);
        return;
      }

      // otherwise, assume external by default
      if (packageJSON.type !== 'module') {
        external.add(spec);
      }

      // recursively load dependencies for package (but not devDeps)
      await Promise.all(Object.keys(packageJSON.dependencies || {}).map(sortPkg));
    } catch (err) {
      // can’t load package: skip
      skip.add(spec);
      return;
    }
  }

  // for top-level, load deps and devDeps (just in case)
  await Promise.all(deps.map(sortPkg));

  // sort (when debugging, makes packages easier to find)
  const externalSorted = [...external];
  externalSorted.sort((a, b) => a.localeCompare(b, 'en-us', { numeric: true }));
  const noExternalSorted = [...noExternal];
  noExternalSorted.sort((a, b) => a.localeCompare(b, 'en-us', { numeric: true }));

  return {
    external: new Set([...externalSorted]),
    noExternal: new Set([...noExternalSorted]),
  };
}
