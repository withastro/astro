import type { AstroConfig } from '../../@types/astro';
import type { LogOptions } from '../../logger';

import fs from 'fs';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import vite from 'vite';
import { getPackageJSON, parseNpmName } from '../util.js';
import astroVitePlugin from './plugin-astro.js';
import astroPostprocessVitePlugin from './plugin-astro-postprocess.js';
import markdownVitePlugin from './plugin-markdown.js';
import jsxVitePlugin from './plugin-jsx.js';
import { AstroDevServer } from '../../dev';

const require = createRequire(import.meta.url);

// note: ssr is still an experimental API hence the type omission
type ViteConfigWithSSR = vite.InlineConfig & { ssr?: { external?: string[]; noExternal?: string[] } };

/** Return a common starting point for all Vite actions */
export async function loadViteConfig(
  viteConfig: ViteConfigWithSSR,
  { astroConfig, logging, devServer }: { astroConfig: AstroConfig; logging: LogOptions; devServer?: AstroDevServer }
): Promise<ViteConfigWithSSR> {
  const optimizedDeps = new Set<string>(); // dependencies that must be bundled for the client (Vite may not detect all of these)
  const dedupe = new Set<string>(); // dependencies that can’t be duplicated (e.g. React & SolidJS)
  const plugins: Plugin[] = []; // Vite plugins

  // load project deps
  const packageJSON = (await getPackageJSON(astroConfig.projectRoot)) || {};
  const userDeps = Object.keys(packageJSON?.dependencies || {});
  userDeps.forEach((dep) => {
    optimizedDeps.add(dep); // prepare all user deps for client ahead of time
  });
  const userDevDeps = Object.keys(packageJSON?.devDependencies || {});
  const { external, noExternal } = await viteSSRDeps([...userDeps, ...userDevDeps]);
  // console.log(external.has('tiny-glob'), noExternal.has('tiny-glob'));

  // load Astro renderers
  await Promise.all(
    astroConfig.renderers.map(async (name) => {
      const { default: renderer } = await import(name);
      // 1. prepare client-side hydration code for browser
      if (renderer.client) {
        optimizedDeps.add(name + renderer.client.substr(1));
      }
      // 2. knownEntrypoints and polyfills need to be added to the client
      for (let dep of [...(renderer.knownEntrypoints || []), ...(renderer.polyfills || [])]) {
        if (dep[0] === '.') dep = name + dep.substr(1); // if local polyfill, use full path
        optimizedDeps.add(dep);
        dedupe.add(dep); // we can try and dedupe renderers by default
      }
      // 3. let renderer inject Vite plugins
      if (renderer.vitePlugins) {
        plugins.push(...renderer.vitePlugins);
      }
      // 4. mark external packages as external to Vite
      if (renderer.external) {
        for (const dep of renderer.external) {
          external.add(dep);
          noExternal.delete(dep);
        }
      }
    })
  );

  // load client-side hydrations
  fs.readdirSync(new URL('../../client', import.meta.url)).forEach((hydrator) => {
    optimizedDeps.add(`astro/client/${hydrator}`); // always prepare these for client
  });

  return vite.mergeConfig(
    {
      cacheDir: fileURLToPath(new URL('./node_modules/.vite/', astroConfig.projectRoot)), // using local caches allows Astro to be used in monorepos, etc.
      clearScreen: false,
      logLevel: 'error',
      optimizeDeps: {
        /** Try and scan a user’s project (won’t catch everything) */
        entries: ['src/**/*'],
        /** Always include these dependencies for optimization */
        include: [...optimizedDeps],
      },
      plugins: [
        astroVitePlugin({ config: astroConfig, devServer }), 
        markdownVitePlugin({ config: astroConfig, devServer }), 
        jsxVitePlugin({ config: astroConfig, logging }), 
        astroPostprocessVitePlugin({ config: astroConfig, devServer }),
        ...plugins
      ],
      publicDir: fileURLToPath(astroConfig.public),
      resolve: {
        dedupe: [...dedupe],
      },
      root: fileURLToPath(astroConfig.projectRoot),
      server: {
        /** prevent serving outside of project root (will become new default soon) */
        fs: { strict: true },
        /** disable HMR for test */
        hmr: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' ? false : undefined,
        /** handle Vite URLs */
        proxy: {
          // add proxies here
        },
      },
      /** Note: SSR API is in beta (https://vitejs.dev/guide/ssr.html) */
      ssr: {
        external: [...external],
        noExternal: [...noExternal],
      },
    },
    viteConfig
  );
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

      // sort this package
      let isExternal = true; // external by default

      // ESM gets noExternal
      if (packageJSON.type === 'module') isExternal = false;
      // TODO: manual bugfixes for Vite
      if (pkg.name === '@sveltejs/vite-plugin-svelte') isExternal = true;
      if (pkg.name === 'micromark-util-events-to-acorn') isExternal = true;
      if (pkg.name === 'unified') isExternal = true;
      // TODO: add more checks here if needed

      // add to list
      if (isExternal === true) {
        external.add(spec);
      } else {
        noExternal.add(spec);
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
