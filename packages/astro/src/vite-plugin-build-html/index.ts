
import type { AstroConfig,  RouteCache, RouteData } from '../@types/astro-core';
import type { LogOptions } from '../core/logger';
import type { ViteDevServer, Plugin as VitePlugin } from 'vite';
import type { OutputChunk, PreRenderedChunk } from 'rollup';
import type { AllPagesData } from '../core/build/types';
import { addRollupInput } from './add-rollup-input.js';
import { findAssets, findInlineScripts, findInlineStyles, findStyleLinks, getTextContent, isStylesheetLink } from './extract-assets.js';
import { render as ssrRender } from '../core/ssr/index.js';
import { getAttribute, insertBefore, remove, createScript, createElement } from '@web/parse5-utils';
import { viteifyPath } from '../core/util.js';
import parse5 from 'parse5';
import * as path from 'path';

const PLUGIN_NAME = '@astro/rollup-plugin-build';
const ASTRO_PAGE_PREFIX = '@astro-page';
const ASTRO_SCRIPT_PREFIX = '@astro-script';
const ASTRO_STYLE_PREFIX = '@astro-style';
const ASTRO_EMPTY = '@astro-empty';

const isAstroInjectedLink = (node: parse5.Element) => isStylesheetLink(node) && getAttribute(node, 'data-astro-injected') === '';
const isBuildableLink = (node: parse5.Element, srcRoot: string) => isAstroInjectedLink(node) || (getAttribute(node, 'href') && getAttribute(node, 'href')?.startsWith(srcRoot));

interface PluginOptions {
  astroConfig: AstroConfig;
  cssChunkMap: Map<string, string>;
  logging: LogOptions;
  allPages: AllPagesData;
  pageNames: string[];
  origin: string;
  routeCache: RouteCache;
  viteServer: ViteDevServer;
}

export function rollupPluginAstroBuildHTML(options: PluginOptions): VitePlugin {
  const { astroConfig, cssChunkMap, logging, origin, allPages, routeCache, viteServer, pageNames } = options;

  const srcRoot = astroConfig.src.pathname;

  // A map of pages to rendered HTML
  const renderedPageMap = new Map<string, string>();

  //
  const astroScriptMap = new Map<string, string>();
  const astroPageMap = new Map<string, string>();
  const astroAssetMap = new Map<string, string>();

  return {
    name: PLUGIN_NAME,

    enforce: 'pre',

    async options(inputOptions) {
      const htmlInput: Set<string> = new Set();
      const assetInput: Set<string> = new Set(); // TODO remove?
      const jsInput: Set<string> = new Set();

      for(const [component, pageData] of Object.entries(allPages)) {
        const [renderers, mod] = pageData.preload;

        for(const path of mod.$$metadata.getAllHydratedComponentPaths()) {
          jsInput.add(path);
        }

        for(const pathname of pageData.paths) {
          pageNames.push(pathname.replace(/\/?$/, '/index.html').replace(/^\//, ''));
          const id = ASTRO_PAGE_PREFIX + pathname;
          const html = await ssrRender(renderers, mod, {
            astroConfig,
            filePath: new URL(`./${component}`, astroConfig.projectRoot),
            logging,
            mode: 'production',
            origin,
            pathname,
            route: pageData.route,
            routeCache,
            viteServer,
          });
          renderedPageMap.set(id, html);

          const document = parse5.parse(html, {
            sourceCodeLocationInfo: true
          });

          const imports = [];
          for(const script of findInlineScripts(document)) {
            const astroScript = getAttribute(script, 'astro-script');
            if(astroScript) {
              const js = getTextContent(script);
              const id = ASTRO_SCRIPT_PREFIX + astroScript;
              imports.push(id);
              astroScriptMap.set(id, js);
            }
          }

          let styles = '';
          for(const node of findInlineStyles(document)) {
            if(getAttribute(node, 'astro-style')) {
              styles += getTextContent(node);
            }
          }
          
          for(let node of findAssets(document)) {
            if(isBuildableLink(node, srcRoot)) {
              const pathname = getAttribute(node, 'href')!;
              const id = viteifyPath(pathname);
              //imports.push(id); // TODO should this be a top-level input instead?
              assetInput.add(id);
            }
          }

          if(styles) {
            let styleId = ASTRO_STYLE_PREFIX + pathname;
            if(styleId.endsWith('/')) {
              styleId += 'index';
            }
            styleId += '.css';
            astroAssetMap.set(styleId, styles);
          }

          if(imports.length) {
            htmlInput.add(id);
            const jsSource = imports.map(id => `import '${id}';`).join('\n');
            astroPageMap.set(id, jsSource);
          }
        }
      }

      const allInputs = new Set([...jsInput, ...htmlInput, ...assetInput]);
      // You always need at least 1 input, so add an placeholder just so we can build HTML/CSS
      if(!allInputs.size) {
        allInputs.add(ASTRO_EMPTY);
      }
      const outOptions = addRollupInput(inputOptions, Array.from(allInputs));
      return outOptions;
    },


    async resolveId(id) {
      switch(true) {
        case astroScriptMap.has(id):
        case astroPageMap.has(id):
        case id === ASTRO_EMPTY: {
          return id;
        }
      }

      return undefined;
    },

    async load(id) {
      // Load pages
      if(astroPageMap.has(id)) {
        return astroPageMap.get(id)!;
      }
      if(astroAssetMap.has(id)) {
        return astroAssetMap.get(id)!;
      }
      // Load scripts
      if(astroScriptMap.has(id)) {
        return astroScriptMap.get(id)!;
      }
      // Give this module actual code so it doesnt warn about an empty chunk
      if(id === ASTRO_EMPTY) {
        return 'console.log("empty");';
      }

      return null;
    },

    outputOptions(outputOptions) {
      Object.assign(outputOptions, {
        entryFileNames(chunk: PreRenderedChunk) {
          // Removes the `@astro-page` prefix from JS chunk names.
          if(chunk.name.startsWith(ASTRO_PAGE_PREFIX)) {
            let pageName = chunk.name.substr(ASTRO_PAGE_PREFIX.length + 1);
            if(!pageName) {
              pageName = 'index';
            }
            return `assets/${pageName}.[hash].js`;
          }
          return 'assets/[name].[hash].js';
        }
      });
      return outputOptions;
    },

    async generateBundle(_options, bundle) {
      const facadeIdMap = new Map<string, string>();
      for(const [chunkId, output] of Object.entries(bundle)) {
        if(output.type === 'chunk') {
          const chunk = output as OutputChunk;
          const id = chunk.facadeModuleId;
          if(id === ASTRO_EMPTY) {
            delete bundle[chunkId];
          } else if(id) {
            facadeIdMap.set(id, chunk.fileName);
          }
        }
      }

      // Emit out our assets
      const assetIdMap = new Map<string, string>(); 
      for(const [id, content] of astroAssetMap) {
        let pathCSSName = id.substr(ASTRO_STYLE_PREFIX.length + 1);
        // Index page
        if(pathCSSName === '.css') {
          pathCSSName = 'index.css';
        }
        const referenceId = this.emitFile({
          type: 'asset',
          name: pathCSSName,
          source: content
        });
        assetIdMap.set(id, referenceId);
      }

      for(const [id, html] of renderedPageMap) {
        const pathname = id.substr(ASTRO_PAGE_PREFIX.length);
        const document = parse5.parse(html, {
          sourceCodeLocationInfo: true
        });

        if(facadeIdMap.has(id)) {
          const bundleId = facadeIdMap.get(id)!;
          const bundlePath = '/' + bundleId;

          // Update scripts
          let i = 0;
          for(let script of findInlineScripts(document)) {
            if(getAttribute(script, 'astro-script')) {
              if(i === 0) {
                const relPath = path.relative(pathname, bundlePath);
                insertBefore(script.parentNode, createScript({
                  type: 'module',
                  src: relPath
                }), script);
              }
              remove(script);
            }
            i++;
          }
        }

        const styleId = ASTRO_STYLE_PREFIX + pathname + '.css';
        if(astroAssetMap.has(styleId)) {
          let i = 0;
          for(const style of findInlineStyles(document)) {
            if(getAttribute(style, 'astro-style')) {
              if(i === 0) {
                const fileName = this.getFileName(assetIdMap.get(styleId)!);
                const relPath = path.relative(pathname, '/' + fileName);
                insertBefore(style.parentNode, createElement('link', {
                  rel: 'stylesheet',
                  href: relPath
                }), style);
              }
  
              remove(style);
              i++;
            }
          }
        }

        for(const link of findStyleLinks(document)) {
          const href = getAttribute(link, 'href');
          if(isBuildableLink(link, srcRoot) && href && cssChunkMap.has(href)) {
            const referenceId = cssChunkMap.get(href)!;
            const fileName = this.getFileName(referenceId);
            const relPath = path.relative(pathname, '/' + fileName);
            insertBefore(link.parentNode, createElement('link', {
              rel: 'stylesheet',
              href: relPath
            }), link);
            remove(link);
          }
        }

        const outHTML = parse5.serialize(document);
        const outPath = path.join(pathname.substr(1), 'index.html');
        this.emitFile({
          fileName: outPath,
          source: outHTML,
          type: 'asset'
        });
      }
    }
  }
}
