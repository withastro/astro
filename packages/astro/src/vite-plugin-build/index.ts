import type { Plugin, InputOption } from 'rollup';
import type { AstroConfig, ComponentInstance, Renderer, RouteCache, RouteData } from '../@types/astro-core';
import type { InputHTMLOptions } from '@web/rollup-plugin-html';
import type { LogOptions } from '../core/logger';
import type { ComponentPreload } from '../core/ssr';
import { ViteDevServer, Plugin as VitePlugin, resolveConfig } from 'vite';
import type { OutputChunk, EmittedFile, ResolveIdHook, LoadHook } from 'rollup';
import type { AllPagesData } from '../core/build/types';
import { addRollupInput } from './add-rollup-input.js';
import { findAssets, findInlineScripts, findInlineStyles, findStyleLinks, getSourcePaths, getTextContent, isStylesheetLink } from './extract-assets.js';
import { render as ssrRender } from '../core/ssr/index.js';
import { getAttribute, getTagName, setTextContent, insertBefore, remove, removeAttribute, setAttribute, createScript, createElement } from '@web/parse5-utils';
import { resolveDependency, viteifyPath } from '../core/util.js';
import { STYLE_EXTENSIONS } from '../core/ssr/css.js';
import { getViteResolve, getViteLoad } from './resolve.js';
import { getViteTransform, transformWithVite, TransformHook } from '../vite-plugin-astro/styles.js';
import parse5 from 'parse5';
import * as path from 'path';
import { transform } from '@babel/core';

type AllPages = Record<string, RouteData & { paths: string[] }>;

const PLUGIN_NAME = '@astro/rollup-plugin-build';
const ASTRO_PAGE_PREFIX = '@astro-page';
const ASTRO_SCRIPT_PREFIX = '@astro-script';
const ASTRO_STYLE_PREFIX = '@astro-style';
const ASTRO_ASSET_PREFIX = '@astro-asset';

const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
const cssLangRE = new RegExp(cssLangs);
const isCSSRequest = (request: string) => STYLE_EXTENSIONS.has(path.extname(request));
const isAstroInjectedLink = (node: parse5.Element) => isStylesheetLink(node) && getAttribute(node, 'data-astro-injected') === '';

interface PluginOptions {
  astroConfig: AstroConfig;
  logging: LogOptions;
  allPages: AllPagesData;
  origin: string;
  routeCache: RouteCache;
  viteServer: ViteDevServer;
}

export function rollupPluginAstroBuild(options: PluginOptions): VitePlugin {
  const { astroConfig, logging, origin, allPages, routeCache, viteServer } = options;

  const srcRoot = astroConfig.src.pathname;

  const prerenderCache = new Map<string, string>();
  const scriptCache = new Map<string, string>();

  // A map of pages to rendered HTML
  const renderedPageMap = new Map<string, string>();

  //
  const astroScriptMap = new Map<string, string>();
  const astroPageMap = new Map<string, string>();
  const astroAssetMap = new Map<string, string>();

  const cssChunkMap = new Map<string, string>();
  const chunkToRefMap = new Map<string, string>();
  const styleSourceMap = new Map<string, string>();

  let viteResolve: ResolveIdHook;
  let viteLoad: LoadHook;
  let viteTransform: TransformHook;

  return {
    name: PLUGIN_NAME,

    enforce: 'pre',

    configResolved(resolvedConfig) {
      viteResolve = getViteResolve(resolvedConfig);
      viteLoad = getViteLoad(resolvedConfig);
      viteTransform = getViteTransform(resolvedConfig);
    },

    async options(inputOptions) {
      let projectRoot = astroConfig.projectRoot.pathname;

      const htmlInput: Set<string> = new Set();
      const assetInput: Set<string> = new Set(); // TODO remove?
      const jsInput: Set<string> = new Set();

      for(const [component, pageData] of Object.entries(allPages)) {
        const [renderers, mod] = pageData.preload;

        for(const path of mod.$$metadata.getAllHydratedComponentPaths()) {
          jsInput.add(path);
        }

        for(const pathname of pageData.paths) {
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
            if(isAstroInjectedLink(node)) {
              const pathname = getAttribute(node, 'href')!;
              const id = viteifyPath(pathname);
              //imports.push(id); // TODO should this be a top-level input instead?
              assetInput.add(id);
            }
          }

          if(styles) {
            const styleId = ASTRO_STYLE_PREFIX + pathname + '.css';
            astroAssetMap.set(styleId, styles);
          }

          htmlInput.add(id);
          const jsSource = imports.map(id => `import '${id}';`).join('\n');
          astroPageMap.set(id, jsSource);
        }
      }

      const allInputs = new Set([...jsInput, ...htmlInput, ...assetInput]);
      let out = addRollupInput(inputOptions, Array.from(allInputs));
      return out;
    },

    async resolveId(id, importer, options) {
      switch(true) {
        case astroScriptMap.has(id):
        case astroPageMap.has(id): {
          return id;
        }
      }

      if(isCSSRequest(id)) {
        let resolved = await viteResolve.call(this, id, importer, options as any);
        return resolved;
      }

      return undefined;
    },

    async load(id) {
      // Load pages
      if(astroPageMap.has(id)) {
        return astroPageMap.get(id);
      }
      if(astroAssetMap.has(id)) {
        return astroAssetMap.get(id)!;
      }
      // Load scripts
      if(astroScriptMap.has(id)) {
        return astroScriptMap.get(id)!;
      }

      if(isCSSRequest(id)) {
        let result = await viteLoad.call(this, id);
        return result || null;
      }

      return null;
    },

    async transform(value, id) {
      if(isCSSRequest(id)) {
        let result = await transformWithVite({
          id,
          value,
          attrs: {
            lang: path.extname(id).substr(1)
          },
          transformHook: viteTransform,
          ssr: false
        });
        if(result) {
          styleSourceMap.set(id, result.code);
        } else {
          styleSourceMap.set(id, value);
        }

        return result;
      }

      return null;
    },

    renderChunk(_code, chunk) {
      let chunkCSS = '';
      let isPureCSS = true;
      const chunks = [];
      for(const [id] of Object.entries(chunk.modules)) {
        if(!isCSSRequest(id)) {
          isPureCSS = false;
        }
        if(styleSourceMap.has(id)) {
          chunkCSS += styleSourceMap.get(id)!;
          chunks.push(id);
        }
      }

      if(isPureCSS) {
        const referenceId = this.emitFile({
          name: chunk.name + '.css',
          type: 'asset',
          source: chunkCSS
        });
        for(const id of chunks) {
          cssChunkMap.set(id, referenceId);
        }
      }

      return null;
    },

    async generateBundle(_options, bundle) {
      const facadeIdMap = new Map<string, string>();
      for(const [, output] of Object.entries(bundle)) {
        if(output.type === 'chunk') {
          const chunk = output as OutputChunk;
          const id = chunk.facadeModuleId;
          if(id) {
            facadeIdMap.set(id, chunk.fileName);
          }
        } else {
          
        }
      }

      // Emit out our assets
      const assetIdMap = new Map<string, string>(); 
      for(const [id, content] of astroAssetMap) {
        let fileName = 'assets/' + id.substr(ASTRO_STYLE_PREFIX.length + 1);
        this.emitFile({
          type: 'asset',
          fileName,
          source: content
        });
        assetIdMap.set(id, fileName);
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
                //removeAttribute(script, 'astro-script');
                //setAttribute(script, 'src', bundlePath);
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
                const relPath = path.relative(pathname, '/' + assetIdMap.get(styleId)!);
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
          if(isAstroInjectedLink(link) && href && cssChunkMap.has(href)) {
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
