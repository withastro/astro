
import type { ResolveIdHook, LoadHook, RenderedChunk, OutputChunk } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';

import { STYLE_EXTENSIONS } from '../core/ssr/css.js';
import { getViteResolve, getViteLoad } from './resolve.js';
import { getViteTransform, transformWithVite, TransformHook } from '../vite-plugin-astro/styles.js';
import * as path from 'path';


const PLUGIN_NAME = '@astro/rollup-plugin-build-css';

const isCSSRequest = (request: string) => STYLE_EXTENSIONS.has(path.extname(request));


interface PluginOptions {
  cssChunkMap: Map<string, string>;
}

export function rollupPluginAstroBuildCSS(options: PluginOptions): VitePlugin {
  const { cssChunkMap } = options;
  const styleSourceMap = new Map<string, string>();
  const pureCSSChunks = new Set<RenderedChunk>();

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
      if(isCSSRequest(id)) {
        let resolved = await viteResolve.call(this, id, importer, options as any);
        return resolved;
      }

      return undefined;
    },

    async load(id) {
      if(isCSSRequest(id)) {
        let result = await viteLoad.call(this, id);
        return result || null;
      }

      return null;
    },

    async transform(value, id) {
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
        pureCSSChunks.add(chunk);
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
