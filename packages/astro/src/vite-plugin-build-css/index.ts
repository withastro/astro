
import type { ResolveIdHook, LoadHook, RenderedChunk, OutputChunk } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';

import { STYLE_EXTENSIONS } from '../core/ssr/css.js';
import { getViteResolve, getViteLoad } from './resolve.js';
import { getViteTransform, transformWithVite, TransformHook } from '../vite-plugin-astro/styles.js';
import * as path from 'path';


const PLUGIN_NAME = '@astro/rollup-plugin-build-css';

// This is a virtual module that represents the .astro <style> usage on a page
const ASTRO_STYLE_PREFIX = '@astro-inline-style';

const ASTRO_PAGE_STYLE_PREFIX = '@astro-page-all-styles';

const isCSSRequest = (request: string) => STYLE_EXTENSIONS.has(path.extname(request));

export function getAstroPageStyleId(pathname: string) {
  let styleId = ASTRO_PAGE_STYLE_PREFIX + pathname;
  if(styleId.endsWith('/')) {
    styleId += 'index';
  }
  styleId += '.js';
  return styleId;
}

export function getAstroStyleId(pathname: string) {
  let styleId = ASTRO_STYLE_PREFIX + pathname;
  if(styleId.endsWith('/')) {
    styleId += 'index';
  }
  styleId += '.css';
  return styleId;
}

export function getAstroStylePathFromId(id: string) {
  return id.substr(ASTRO_STYLE_PREFIX.length + 1);
}

function isStyleVirtualModule(id: string) {
  return id.startsWith(ASTRO_STYLE_PREFIX);
}

function isPageStyleVirtualModule(id: string) {
  return id.startsWith(ASTRO_PAGE_STYLE_PREFIX);
}

interface PluginOptions {
  astroStyleMap: Map<string, string>;
  astroPageStyleMap: Map<string, string>;
  chunkToReferenceIdMap: Map<string, string>;
  pureCSSChunks: Set<RenderedChunk>;
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin {
  const { astroPageStyleMap, astroStyleMap, chunkToReferenceIdMap, pureCSSChunks } = options;
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


    async resolveId(id, importer, options) {
      if(isPageStyleVirtualModule(id)) {
        return id;
      }
      if(isStyleVirtualModule(id)) {
        return id;
      }
      if(isCSSRequest(id)) {
        let resolved = await viteResolve.call(this, id, importer, options as any);
        return resolved;
      }

      return undefined;
    },

    async load(id) {
      if(isPageStyleVirtualModule(id)) {
        const source = astroPageStyleMap.get(id)!;
        return source;
      }
      if(isStyleVirtualModule(id)) {
        return astroStyleMap.get(id)!;
      }
      if(isCSSRequest(id)) {
        let result = await viteLoad.call(this, id);
        return result || null;
      }

      return null;
    },

    async transform(value, id) {
      if(isStyleVirtualModule(id)) {
        styleSourceMap.set(id, value);
        return null;
      }
      if(isCSSRequest(id)) {
        const extension = path.extname(id).substr(1);
        let result = await transformWithVite({
          id,
          value,
          attrs: {
            lang: extension
          },
          transformHook: viteTransform,
          ssr: false,
          force: true
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
      for(const [id] of Object.entries(chunk.modules)) {
        if(!isCSSRequest(id) && !isPageStyleVirtualModule(id)) {
          isPureCSS = false;
        }
        if(styleSourceMap.has(id)) {
          chunkCSS += styleSourceMap.get(id)!;
        }
      }

      if(isPureCSS) {
        const referenceId = this.emitFile({
          name: chunk.name + '.css',
          type: 'asset',
          source: chunkCSS
        });
        pureCSSChunks.add(chunk);
        chunkToReferenceIdMap.set(chunk.fileName, referenceId);
      }

      return null;
    },

    // Delete CSS chunks so JS is not produced for them.
    generateBundle(_options, bundle) {
      for(const [chunkId, chunk] of Object.entries(bundle)) {
        if(chunk.type === 'chunk' && pureCSSChunks.has(chunk)) {
          delete bundle[chunkId];
        }
      }
    }
  }
}
