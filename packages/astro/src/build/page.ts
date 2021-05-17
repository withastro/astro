import type { ImportDeclaration } from '@babel/types';
import type { AstroConfig, BuildOutput, RuntimeMode, ValidExtensionPlugins } from '../@types/astro';
import type { AstroRuntime, LoadResult } from '../runtime';
import type { LogOptions } from '../logger';

import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { fileURLToPath } from 'url';
import babelParser from '@babel/parser';
import { parse } from 'astro-parser';
import esbuild from 'esbuild';
import { walk } from 'estree-walker';
import { generateRSS } from './rss.js';
import { getAttrValue } from '../ast.js';
import { convertMdToAstroSource } from '../compiler/index.js';
import { transform } from '../compiler/transform/index.js';

type DynamicImportMap = Map<'vue' | 'react' | 'react-dom' | 'preact' | 'svelte', string>;

interface PageBuildOptions {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  logging: LogOptions;
  filepath: URL;
  mode: RuntimeMode;
  resolvePackageUrl: (s: string) => Promise<string>;
  runtime: AstroRuntime;
  site?: string;
}

/** Collection utility */
export function getPageType(filepath: URL): 'collection' | 'static' {
  if (/\$[^.]+.astro$/.test(filepath.pathname)) return 'collection';
  return 'static';
}

/** Build collection */
export async function buildCollectionPage({ astroConfig, filepath, logging, mode, runtime, site, resolvePackageUrl, buildState }: PageBuildOptions): Promise<void> {
  const pagesPath = new URL('./pages/', astroConfig.astroRoot);
  const srcURL = filepath.pathname.replace(pagesPath.pathname, '/');
  const outURL = srcURL.replace(/\$([^.]+)\.astro$/, '$1');

  const builtURLs = new Set<string>(); // !important: internal cache that prevents building the same URLs

  /** Recursively build collection URLs */
  async function loadCollection(url: string): Promise<LoadResult | undefined> {
    if (builtURLs.has(url)) return; // this stops us from recursively building the same pages over and over
    const result = await runtime.load(url);
    builtURLs.add(url);
    if (result.statusCode === 200) {
      const outPath = path.posix.join(url, '/index.html');
      buildState[outPath] = {
        srcPath: filepath,
        contents: result.contents,
        contentType: 'text/html',
        encoding: 'utf8',
      };
    }
    return result;
  }

  const [result] = await Promise.all([
    loadCollection(outURL) as Promise<LoadResult>, // first run will always return a result so assert type here
    gatherRuntimes({ astroConfig, buildState, filepath, logging, resolvePackageUrl, mode, runtime }),
  ]);

  if (result.statusCode >= 500) {
    throw new Error((result as any).error);
  }
  if (result.statusCode === 200 && !result.collectionInfo) {
    throw new Error(`[${srcURL}]: Collection page must export createCollection() function`);
  }

  // note: for pages that require params (/tag/:tag), we will get a 404 but will still get back collectionInfo that tell us what the URLs should be
  if (result.collectionInfo) {
    // build subsequent pages
    await Promise.all(
      [...result.collectionInfo.additionalURLs].map(async (url) => {
        // for the top set of additional URLs, we render every new URL generated
        const addlResult = await loadCollection(url);
        builtURLs.add(url);
        if (addlResult && addlResult.collectionInfo) {
          // believe it or not, we may still have a few unbuilt pages left. this is our last crawl:
          await Promise.all([...addlResult.collectionInfo.additionalURLs].map(async (url2) => loadCollection(url2)));
        }
      })
    );

    if (result.collectionInfo.rss) {
      if (!site) throw new Error(`[${srcURL}] createCollection() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
      let feedURL = outURL === '/' ? '/index' : outURL;
      feedURL = '/feed' + feedURL + '.xml';
      const rss = generateRSS({ ...(result.collectionInfo.rss as any), site }, { srcFile: srcURL, feedURL });
      buildState[feedURL] = {
        srcPath: filepath,
        contents: rss,
        contentType: 'application/rss+xml',
        encoding: 'utf8',
      };
    }
  }
}

/** Build static page */
export async function buildStaticPage({ astroConfig, buildState, filepath, logging, mode, resolvePackageUrl, runtime }: PageBuildOptions): Promise<void> {
  const pagesPath = new URL('./pages/', astroConfig.astroRoot);
  const url = filepath.pathname.replace(pagesPath.pathname, '/').replace(/(index)?\.(astro|md)$/, '');

  // build page in parallel with gathering runtimes
  await Promise.all([
    runtime.load(url).then((result) => {
      if (result.statusCode !== 200) throw new Error((result as any).error);
      const outFile = path.posix.join(url, '/index.html');
      buildState[outFile] = {
        srcPath: filepath,
        contents: result.contents,
        contentType: 'text/html',
        encoding: 'utf8',
      };
    }),
    gatherRuntimes({ astroConfig, buildState, filepath, logging, resolvePackageUrl, mode, runtime }),
  ]);
}

/** Evaluate mustache expression (safely) */
function compileExpressionSafe(raw: string): string {
  let { code } = esbuild.transformSync(raw, {
    loader: 'tsx',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    charset: 'utf8',
  });
  return code;
}

/** Add framework runtimes when needed */
async function acquireDynamicComponentImports(plugins: Set<ValidExtensionPlugins>, resolvePackageUrl: (s: string) => Promise<string>): Promise<DynamicImportMap> {
  const importMap: DynamicImportMap = new Map();
  for (let plugin of plugins) {
    switch (plugin) {
      case 'svelte': {
        importMap.set('svelte', await resolvePackageUrl('svelte'));
        break;
      }
      case 'vue': {
        importMap.set('vue', await resolvePackageUrl('vue'));
        break;
      }
      case 'react': {
        importMap.set('react', await resolvePackageUrl('react'));
        importMap.set('react-dom', await resolvePackageUrl('react-dom'));
        break;
      }
      case 'preact': {
        importMap.set('preact', await resolvePackageUrl('preact'));
        break;
      }
    }
  }
  return importMap;
}

const defaultExtensions: Readonly<Record<string, ValidExtensionPlugins>> = {
  '.jsx': 'react',
  '.tsx': 'react',
  '.svelte': 'svelte',
  '.vue': 'vue',
};

/** Gather necessary framework runtimes (React, Vue, Svelte, etc.) for dynamic components */
async function gatherRuntimes({ astroConfig, buildState, filepath, logging, resolvePackageUrl, mode, runtime }: PageBuildOptions): Promise<Set<string>> {
  const imports = new Set<string>();

  // Only astro files
  if (!filepath.pathname.endsWith('.astro') && !filepath.pathname.endsWith('.md')) {
    return imports;
  }

  const extensions = astroConfig.extensions || defaultExtensions;

  let source = await fs.promises.readFile(filepath, 'utf8');
  if (filepath.pathname.endsWith('.md')) {
    source = await convertMdToAstroSource(source, { filename: fileURLToPath(filepath) });
  }

  const ast = parse(source, { filepath });

  if (!ast.module) {
    return imports;
  }

  await transform(ast, {
    filename: fileURLToPath(filepath),
    fileID: '',
    compileOptions: {
      astroConfig,
      resolvePackageUrl,
      logging,
      mode,
    },
  });

  const componentImports: ImportDeclaration[] = [];
  const components: Record<string, { plugin: ValidExtensionPlugins; type: string; specifier: string }> = {};
  const plugins = new Set<ValidExtensionPlugins>();

  const program = babelParser.parse(ast.module.content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'topLevelAwait'],
  }).program;

  const { body } = program;
  let i = body.length;
  while (--i >= 0) {
    const node = body[i];
    if (node.type === 'ImportDeclaration') {
      componentImports.push(node);
    }
  }

  for (const componentImport of componentImports) {
    const importUrl = componentImport.source.value;
    const componentType = path.posix.extname(importUrl);
    for (const specifier of componentImport.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        const componentName = specifier.local.name;
        const plugin = extensions[componentType] || defaultExtensions[componentType];
        plugins.add(plugin);
        components[componentName] = {
          plugin,
          type: componentType,
          specifier: importUrl,
        };
        break;
      }
    }
  }

  const dynamic = await acquireDynamicComponentImports(plugins, resolvePackageUrl);

  /** Add dynamic component runtimes to imports */
  function appendImports(rawName: string, importUrl: URL) {
    const [componentName, componentType] = rawName.split(':');
    if (!componentType) {
      return;
    }

    if (!components[componentName]) {
      throw new Error(`Unknown Component: ${componentName}`);
    }

    const defn = components[componentName];
    const fileUrl = new URL(defn.specifier, importUrl);
    let rel = path.posix.relative(astroConfig.astroRoot.pathname, fileUrl.pathname);

    switch (defn.plugin) {
      case 'preact': {
        const preact = dynamic.get('preact');
        if (!preact) throw new Error(`Unable to load Preact plugin`);
        imports.add(preact);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'react': {
        const [react, reactDOM] = [dynamic.get('react'), dynamic.get('react-dom')];
        if (!react || !reactDOM) throw new Error(`Unable to load React plugin`);
        imports.add(react);
        imports.add(reactDOM);
        rel = rel.replace(/\.[^.]+$/, '.js');
        break;
      }
      case 'vue': {
        const vue = dynamic.get('vue');
        if (!vue) throw new Error('Unable to load Vue plugin');
        imports.add(vue);
        rel = rel.replace(/\.[^.]+$/, '.vue.js');
        break;
      }
      case 'svelte': {
        const svelte = dynamic.get('svelte');
        if (!svelte) throw new Error('Unable to load Svelte plugin');
        imports.add(svelte);
        imports.add('/_astro_internal/runtime/svelte.js');
        rel = rel.replace(/\.[^.]+$/, '.svelte.js');
        break;
      }
    }

    imports.add(`/_astro/${rel}`);
  }

  walk(ast.html, {
    enter(node) {
      switch (node.type) {
        case 'Element': {
          if (node.name !== 'script') return;
          if (getAttrValue(node.attributes, 'type') !== 'module') return;

          const src = getAttrValue(node.attributes, 'src');

          if (src && src.startsWith('/')) {
            imports.add(src);
          }
          break;
        }

        case 'MustacheTag': {
          let code: string;
          try {
            code = compileExpressionSafe(node.content);
          } catch {
            return;
          }

          let matches: RegExpExecArray[] = [];
          let match: RegExpExecArray | null | undefined;
          const H_COMPONENT_SCANNER = /h\(['"]?([A-Z].*?)['"]?,/gs;
          const regex = new RegExp(H_COMPONENT_SCANNER);
          while ((match = regex.exec(code))) {
            matches.push(match);
          }
          for (const foundImport of matches.reverse()) {
            const name = foundImport[1];
            appendImports(name, filepath);
          }
          break;
        }
        case 'InlineComponent': {
          if (/^[A-Z]/.test(node.name)) {
            appendImports(node.name, filepath);
            return;
          }

          break;
        }
      }
    },
  });

  // add all imports to build output
  await Promise.all(
    [...imports].map(async (url) => {
      if (buildState[url]) return; // don’t build already-built URLs

      // add new results to buildState
      const result = await runtime.load(url);
      if (result.statusCode === 200) {
        buildState[url] = {
          srcPath: filepath,
          contents: result.contents,
          contentType: result.contentType || mime.getType(url) || '',
          encoding: 'utf8',
        };
      }
    })
  );

  return imports;
}
