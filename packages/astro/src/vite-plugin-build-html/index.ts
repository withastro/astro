
import type { AstroConfig,  RouteCache } from '../@types/astro-core';
import type { LogOptions } from '../core/logger';
import type { ViteDevServer, Plugin as VitePlugin } from 'vite';
import type { OutputChunk, PreRenderedChunk, RenderedChunk } from 'rollup';
import type { AllPagesData } from '../core/build/types';
import parse5 from 'parse5';
import srcsetParse from 'srcset-parse';
import * as npath from 'path';
import { promises as fs } from 'fs';
import { getAttribute, getTagName, insertBefore, remove, createScript, createElement, setAttribute } from '@web/parse5-utils';
import { addRollupInput } from './add-rollup-input.js';
import { findAssets, findInlineScripts, findInlineStyles, getTextContent, isStylesheetLink } from './extract-assets.js';
import { render as ssrRender } from '../core/ssr/index.js';
import { getAstroStyleId, getAstroPageStyleId } from '../vite-plugin-build-css/index.js';
import { viteifyPath } from '../core/util.js';

// This package isn't real ESM, so have to coerce it
const matchSrcset: typeof srcsetParse = (srcsetParse as any).default;

const PLUGIN_NAME = '@astro/rollup-plugin-build';
const ASTRO_PAGE_PREFIX = '@astro-page';
const ASTRO_SCRIPT_PREFIX = '@astro-script';

const ASTRO_EMPTY = '@astro-empty';

const tagsWithSrcSet = new Set(['img', 'source']);

const isAstroInjectedLink = (node: parse5.Element) => isStylesheetLink(node) && getAttribute(node, 'data-astro-injected') === '';
const isBuildableLink = (node: parse5.Element, srcRoot: string) => isAstroInjectedLink(node) || getAttribute(node, 'href')?.startsWith(srcRoot);
const isBuildableImage = (node: parse5.Element, srcRoot: string) => getTagName(node) === 'img' && getAttribute(node, 'src')?.startsWith(srcRoot);
const hasSrcSet = (node: parse5.Element) => tagsWithSrcSet.has(getTagName(node)) && !!getAttribute(node, 'srcset');

interface PluginOptions {
  astroConfig: AstroConfig;
  astroStyleMap: Map<string, string>;
  astroPageStyleMap: Map<string, string>;
  chunkToReferenceIdMap: Map<string, string>;
  logging: LogOptions;
  allPages: AllPagesData;
  pageNames: string[];
  pureCSSChunks: Set<RenderedChunk>;
  origin: string;
  routeCache: RouteCache;
  viteServer: ViteDevServer;
}

export function rollupPluginAstroBuildHTML(options: PluginOptions): VitePlugin {
  const { astroConfig, astroStyleMap, astroPageStyleMap, chunkToReferenceIdMap, pureCSSChunks, logging, origin, allPages, routeCache, viteServer, pageNames } = options;

  const srcRoot = astroConfig.src.pathname;

  // A map of pages to rendered HTML
  const renderedPageMap = new Map<string, string>();

  //
  const astroScriptMap = new Map<string, string>();
  const astroPageMap = new Map<string, string>();
  const astroAssetMap = new Map<string, Promise<Buffer>>();

  const cssChunkMap = new Map<string, string[]>();

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

          const frontEndImports = [];
          for(const script of findInlineScripts(document)) {
            const astroScript = getAttribute(script, 'astro-script');
            if(astroScript) {
              const js = getTextContent(script);
              const scriptId = ASTRO_SCRIPT_PREFIX + astroScript;
              frontEndImports.push(scriptId);
              astroScriptMap.set(scriptId, js);
            }
          }

          let styles = '';
          for(const node of findInlineStyles(document)) {
            if(getAttribute(node, 'astro-style')) {
              styles += getTextContent(node);
            }
          }
          
          const assetImports = [];
          for(let node of findAssets(document)) {
            if(isBuildableLink(node, srcRoot)) {
              const href = getAttribute(node, 'href')!;
              const linkId = viteifyPath(href);
              assetImports.push(linkId);
            }

            if(isBuildableImage(node, srcRoot)) {
              const src = getAttribute(node, 'src');
              if(src?.startsWith(srcRoot) && !astroAssetMap.has(src)) {
                astroAssetMap.set(src, fs.readFile(new URL(`file://${src}`)));
              }
            }

            if(hasSrcSet(node)) {
              const candidates = matchSrcset(getAttribute(node, 'srcset')!);
              for(const {url} of candidates) {
                if(url.startsWith(srcRoot) && !astroAssetMap.has(url)) {
                  astroAssetMap.set(url, fs.readFile(new URL(`file://${url}`)));
                }
              }
            }
          }

          if(styles) {
            const styleId = getAstroStyleId(pathname);
            astroStyleMap.set(styleId, styles);
            // Put this at the front of imports
            assetImports.unshift(styleId);
          }

          if(frontEndImports.length) {
            htmlInput.add(id);
            const jsSource = frontEndImports.map(sid => `import '${sid}';`).join('\n');
            astroPageMap.set(id, jsSource);
          }

          if(assetImports.length) {
            const pageStyleId = getAstroPageStyleId(pathname);
            const jsSource = assetImports.map(sid => `import '${sid}';`).join('\n');
            astroPageStyleMap.set(pageStyleId, jsSource);
            assetInput.add(pageStyleId);
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

      // Emit assets (images, etc)
      const assetIdMap = new Map<string, string>(); 
      for(const [assetPath, dataPromise] of astroAssetMap) {
        const referenceId = this.emitFile({
          type: 'asset',
          name: npath.basename(assetPath),
          source: await dataPromise
        });
        assetIdMap.set(assetPath, referenceId);
      }

      // Create a mapping of chunks to dependent chunks, used to add the proper
      // link tags for CSS.
      for(const chunk of pureCSSChunks) {
        const referenceId = chunkToReferenceIdMap.get(chunk.fileName)!;
        const chunkReferenceIds = [referenceId];
        for(const imp of chunk.imports) {
          if(chunkToReferenceIdMap.has(imp)) {
            chunkReferenceIds.push(chunkToReferenceIdMap.get(imp)!);
          }
        }
        for(const [id] of Object.entries(chunk.modules)) {
          cssChunkMap.set(id, chunkReferenceIds);
        }
      }

      // Keep track of links added so we don't do so twice.
      const linkChunksAdded = new Set<string>();
      const appendStyleChunksBefore = (ref: parse5.Element, pathname: string, referenceIds: string[] | undefined, attrs: Record<string, any> = {}) => {
        let added = false;
        if(referenceIds) {
          const lastNode = ref;
          for(const referenceId of referenceIds) {
            const chunkFileName = this.getFileName(referenceId);
            const relPath = npath.posix.relative(pathname, '/' + chunkFileName);

            // This prevents added links more than once per type.
            const key = pathname + relPath + attrs.rel || 'stylesheet';
            if(!linkChunksAdded.has(key)) {
              linkChunksAdded.add(key);
              insertBefore(lastNode.parentNode, createElement('link', {
                rel: 'stylesheet',
                ...attrs,
                href: relPath
              }), lastNode);
              added = true;
            }

          }
        }
        return added;
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
                const relPath = npath.posix.relative(pathname, bundlePath);
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

        const styleId = getAstroPageStyleId(pathname);
        let pageCSSAdded = false;
        for(const node of findAssets(document)) {
          if(isBuildableLink(node, srcRoot)) {
            const rel = getAttribute(node, 'rel');
            switch(rel) {
              case 'stylesheet': {
                if(!pageCSSAdded) {
                  const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr.value]));
                  delete attrs['data-astro-injected'];
                  pageCSSAdded = appendStyleChunksBefore(node, pathname, cssChunkMap.get(styleId), attrs);
                }
                remove(node);
                break;
              }
              case 'preload': {
                if(getAttribute(node, 'as') === 'style') {
                  const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr.value]));
                  appendStyleChunksBefore(node, pathname, cssChunkMap.get(styleId), attrs);
                  remove(node);
                }
              }
            }
          }

          if(isBuildableImage(node, srcRoot)) {
            const src = getAttribute(node, 'src')!;
            const referenceId = assetIdMap.get(src);
            if(referenceId) {
              const fileName = this.getFileName(referenceId);
              const relPath = npath.posix.relative(pathname, '/' + fileName);
              setAttribute(node, 'src', relPath);
            }
          }

          // Could be a `source` or an `img`.
          if(hasSrcSet(node)) {
            const srcset = getAttribute(node, 'srcset')!;
            let changedSrcset = srcset;
            const urls = matchSrcset(srcset).map(c => c.url);
            for(const url of urls) {
              if(assetIdMap.has(url)) {
                const referenceId = assetIdMap.get(url)!;
                const fileName = this.getFileName(referenceId);
                const relPath = npath.posix.relative(pathname, '/' + fileName);
                changedSrcset = changedSrcset.replace(url, relPath);
              }
            }
            // If anything changed, update it
            if(changedSrcset !== srcset) {
              setAttribute(node, 'srcset', changedSrcset);
            }
          }
        }

        // Page styles for <style> usage, if not already appended via links.
        for(const style of findInlineStyles(document)) {
          if(getAttribute(style, 'astro-style')) {
            if(!pageCSSAdded) {
              pageCSSAdded = appendStyleChunksBefore(style, pathname, cssChunkMap.get(styleId));
            }

            remove(style);
          }
        }

        const outHTML = parse5.serialize(document);
        const outPath = npath.posix.join(pathname.substr(1), 'index.html');
        this.emitFile({
          fileName: outPath,
          source: outHTML,
          type: 'asset'
        });
      }
    }
  }
}
