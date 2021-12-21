import type { OutputChunk, PreRenderedChunk, RollupOutput } from 'rollup';
import type { Plugin as VitePlugin } from '../vite';
import type { AstroConfig, RouteCache } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteConfigWithSSR } from '../create-vite';
import type { PageBuildData } from './types';
import type { BuildInternals } from '../../core/build/internal.js';
import type { AstroComponentFactory } from '../../runtime/server';

import fs from 'fs';
import { fileURLToPath } from 'url';
import vite from '../vite.js';
import { debug, info, error } from '../../core/logger.js';
import { createBuildInternals } from '../../core/build/internal.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { renderComponent, getParamsAndProps } from '../ssr/index.js';

export interface StaticBuildOptions {
  allPages: AllPagesData;
  astroConfig: AstroConfig;
  logging: LogOptions;
  origin: string;
  routeCache: RouteCache;
  viteConfig: ViteConfigWithSSR;
}

export async function staticBuild(opts: StaticBuildOptions) {
  const { allPages, astroConfig } = opts;

  // The JavaScript entrypoints.
  const jsInput: Set<string> = new Set();

  // A map of each page .astro file, to the PageBuildData which contains information
  // about that page, such as its paths.
  const facadeIdToPageDataMap = new Map<string, PageBuildData>();

  for (const [component, pageData] of Object.entries(allPages)) {
    const [renderers, mod] = pageData.preload;

    // Hydrated components are statically identified.
    for (const path of mod.$$metadata.getAllHydratedComponentPaths()) {
      // Note that this part is not yet implemented in the static build.
      //jsInput.add(path);
    }

    let astroModuleId = new URL('./' + component, astroConfig.projectRoot).pathname;
    jsInput.add(astroModuleId);
    facadeIdToPageDataMap.set(astroModuleId, pageData);
  }

  // Build internals needed by the CSS plugin
  const internals = createBuildInternals();

  // Perform the SSR build
  const result = (await ssrBuild(opts, internals, jsInput)) as RollupOutput;

  // Generate each of the pages.
  await generatePages(result, opts, internals, facadeIdToPageDataMap);
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
  const { astroConfig, viteConfig } = opts;

  return await vite.build({
    logLevel: 'error',
    mode: 'production',
    build: {
      emptyOutDir: true,
      minify: false, // 'esbuild', // significantly faster than "terser" but may produce slightly-bigger bundles
      outDir: fileURLToPath(astroConfig.dist),
      ssr: true,
      rollupOptions: {
        input: Array.from(input),
        output: {
          format: 'esm',
        },
      },
      target: 'es2020', // must match an esbuild target
    },
    plugins: [
      vitePluginNewBuild(),
      rollupPluginAstroBuildCSS({
        internals,
      }),
      ...(viteConfig.plugins || []),
    ],
    publicDir: viteConfig.publicDir,
    root: viteConfig.root,
    envPrefix: 'PUBLIC_',
    server: viteConfig.server,
    base: astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/',
  });
}

async function generatePages(result: RollupOutput, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
  debug(opts.logging, 'generate', 'End build step, now generating');
  const generationPromises = [];
  for (let output of result.output) {
    if (output.type === 'chunk' && output.facadeModuleId && output.facadeModuleId.endsWith('.astro')) {
      generationPromises.push(generatePage(output, opts, internals, facadeIdToPageDataMap));
    }
  }
  await Promise.all(generationPromises);
}

async function generatePage(output: OutputChunk, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
  const { astroConfig } = opts;

  let url = new URL('./' + output.fileName, astroConfig.dist);
  const facadeId: string = output.facadeModuleId as string;
  let pageData =
    facadeIdToPageDataMap.get(facadeId) ||
    // Check with a leading `/` because on Windows it doesn't have one.
    facadeIdToPageDataMap.get('/' + facadeId);

  if (!pageData) {
    throw new Error(`Unable to find a PageBuildData for the Astro page: ${facadeId}. There are the PageBuilDatas we have ${Array.from(facadeIdToPageDataMap.keys()).join(', ')}`);
  }

  let linkIds = internals.facadeIdToAssetsMap.get(facadeId) || [];
  let compiledModule = await import(url.toString());
  let Component = compiledModule.default;

  const generationOptions: Readonly<GeneratePathOptions> = {
    pageData,
    linkIds,
    Component,
  };

  const renderPromises = pageData.paths.map((path) => {
    return generatePath(path, opts, generationOptions);
  });
  return await Promise.all(renderPromises);
}

interface GeneratePathOptions {
  pageData: PageBuildData;
  linkIds: string[];
  Component: AstroComponentFactory;
}

async function generatePath(path: string, opts: StaticBuildOptions, gopts: GeneratePathOptions) {
  const { astroConfig, logging, origin, routeCache } = opts;
  const { Component, linkIds, pageData } = gopts;

  const [renderers, mod] = pageData.preload;

  try {
    const [params, pageProps] = await getParamsAndProps({
      route: pageData.route,
      routeCache,
      logging,
      pathname: path,
      mod,
    });

    info(logging, 'generate', `Generating: ${path}`);

    const html = await renderComponent(renderers, Component, astroConfig, path, origin, params, pageProps, linkIds);
    const outFolder = new URL('.' + path + '/', astroConfig.dist);
    const outFile = new URL('./index.html', outFolder);
    await fs.promises.mkdir(outFolder, { recursive: true });
    await fs.promises.writeFile(outFile, html, 'utf-8');
  } catch (err) {
    error(opts.logging, 'build', `Error rendering:`, err);
  }
}

export function vitePluginNewBuild(): VitePlugin {
  return {
    name: '@astro/rollup-plugin-new-build',

    configResolved(resolvedConfig) {
      // Delete this hook because it causes assets not to be built
      const plugins = resolvedConfig.plugins as VitePlugin[];
      const viteAsset = plugins.find((p) => p.name === 'vite:asset');
      if (viteAsset) {
        delete viteAsset.generateBundle;
      }
    },

    outputOptions(outputOptions) {
      Object.assign(outputOptions, {
        entryFileNames(_chunk: PreRenderedChunk) {
          return 'assets/[name].[hash].mjs';
        },
        chunkFileNames(_chunk: PreRenderedChunk) {
          return 'assets/[name].[hash].mjs';
        },
      });
      return outputOptions;
    },
  };
}
