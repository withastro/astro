import type { Plugin, InputOption } from 'rollup';
import type { AstroConfig, ComponentInstance, Renderer, RouteCache, RouteData } from '../@types/astro-core';
import type { InputHTMLOptions } from '@web/rollup-plugin-html';
import type { LogOptions } from '../core/logger';
import type { ComponentPreload } from '../core/ssr';
import type { ViteDevServer } from 'vite';
import type { OutputChunk, EmittedFile } from 'rollup';
import type { AllPagesData } from '../core/build/types';
import { addRollupInput } from './add-rollup-input.js';
import { findAssets, findInlineScripts, findInlineStyles, getSourcePaths, getTextContent } from './extract-assets.js';
import { render as ssrRender } from '../core/ssr/index.js';
import { getAttribute, getTagName, setTextContent, insertBefore, remove, removeAttribute, setAttribute, createScript, createElement } from '@web/parse5-utils';
import { resolveDependency, viteifyPath } from '../core/util.js';
import parse5 from 'parse5';
import * as path from 'path';

type AllPages = Record<string, RouteData & { paths: string[] }>;

const PLUGIN_NAME = '@astro/rollup-plugin-build';
const ASTRO_PAGE_PREFIX = '@astro-page';
const ASTRO_SCRIPT_PREFIX = '@astro-script';
const ASTRO_STYLE_PREFIX = '@astro-style';
const ASTRO_ASSET_PREFIX = '@astro-asset';

const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
const cssLangRE = new RegExp(cssLangs);
const isCSSRequest = (request: string) => cssLangRE.test(request);

interface PluginOptions {
  astroConfig: AstroConfig;
  logging: LogOptions;
  allPages: AllPagesData;
  origin: string;
  routeCache: RouteCache;
  viteServer: ViteDevServer;
}

export function rollupPluginAstroBuild(options: PluginOptions): Plugin {
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

  return {
    name: PLUGIN_NAME,

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
            if(getTagName(node) === 'link' && getAttribute(node, 'rel') === 'stylesheet' && getAttribute(node, 'href')) {
              const pathname = getAttribute(node, 'href')!;
              if(pathname.startsWith(srcRoot)) {
                const id = viteifyPath(pathname);
                //imports.push(id); // TODO should this be a top-level input instead?
                assetInput.add(id);
                console.log('LINK', id);
              }
            }
          }

          if(styles) {
            const styleId = ASTRO_STYLE_PREFIX + pathname + '.css';
            astroAssetMap.set(styleId, styles);
            //assetInput.add(styleId);
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

    resolveId(source) {
      switch(true) {
        case astroScriptMap.has(source):
        case astroPageMap.has(source): {
          return source;
        }
      }

      return undefined;
    },

    async load(id) {
      // Load pages
      if(astroPageMap.has(id)) {
        return astroPageMap.get(id);
      }
      if(astroAssetMap.has(id)) {
        console.log("ASKING FOR", id);
        return astroAssetMap.get(id)!;
      }
      // Load scripts
      if(astroScriptMap.has(id)) {
        return astroScriptMap.get(id)!;
      }

      return null;
    },

    /*
    async renderChunk(code, chunk, opts) {
      console.log('rendering', chunk.facadeModuleId)
      debugger;
      return null;
    },
    */

    /*
    buildStart(options) {
      debugger;
    },
    */
    

    renderChunk(code, chunk) {
      let isPureCSS = false;
      for(const [name] of Object.entries(chunk.modules)) {
        if(!isCSSRequest(name)) {
          isPureCSS = false;
        }
      }

      if(isPureCSS) {
        // DO What?
        cssChunkMap.set(chunk.fileName, '');
      }

      return null;
    },

    renderStart() {

      const emitFile = this.emitFile;
      this.emitFile = function(emittedFile: EmittedFile) {
        const refId = emitFile.call(this, emittedFile);
        if(emittedFile.fileName) {
          chunkToRefMap.set(emittedFile.fileName, refId);
        }
        return refId;
      };
    },

    async generateBundle(_options, bundle) {
      console.log(Object.keys(bundle));
      const c = chunkToRefMap;
      const s = cssChunkMap;
      debugger;
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
                insertBefore(script.parentNode, createScript({
                  type: 'module',
                  src: bundlePath
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
          for(let style of findInlineStyles(document)) {
            if(getAttribute(style, 'astro-style')) {
              if(i === 0) {
                let relPath = path.relative(pathname, '/' + assetIdMap.get(styleId)!);
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

        const outHTML = parse5.serialize(document);
        const outPath = path.join(pathname.substr(1), 'index.html');
        this.emitFile({
          fileName: outPath,
          source: outHTML,
          type: 'asset'
        })
        console.log(outPath)
      }
    }
  }
}

/*
export function rollupPluginAstroBuildNext({ allPages }: PluginOptions): Plugin {
  const idToRouteMap = new Map(Object.entries(allPages).flatMap(([, route]) => route.paths.map(p => [pageId(p), route])));

  return {
    name: PLUGIN_NAME,

    options(inputOptions) {
      //reset();

      let input: InputOption[] = [];
      if(Array.isArray(inputOptions.input)) {
        input.push(...inputOptions.input);
      }

      //input.push('hello world')
      input.push(...idToRouteMap.keys())
      console.log("INPUT", input);

      return Object.assign(inputOptions, {
        input
      });
    },

    resolveId(spec) {
      if(spec === PLUGIN_NAME) {
        return PLUGIN_NAME;
      }
      if(idToRouteMap.has(spec)) {
        return spec;
      }
    },

    load(id) {
      if(idToRouteMap.has(id)) {
        console.log("OK", idToRouteMap.get(id))
      }
    }

    async generateBundle(options, bundle) {
      
    }
  };
}
*/