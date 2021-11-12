import type { RenderedChunk } from 'rollup';
import type { Plugin as VitePlugin } from '../core/vite';

import { STYLE_EXTENSIONS } from '../core/ssr/css.js';
import { getViteTransform, TransformHook } from '../vite-plugin-astro/styles.js';
import * as path from 'path';
import esbuild from 'esbuild';

const PLUGIN_NAME = '@astrojs/rollup-plugin-build-css';

// This is a virtual module that represents the .astro <style> usage on a page
const ASTRO_STYLE_PREFIX = '@astro-inline-style';

const ASTRO_PAGE_STYLE_PREFIX = '@astro-page-all-styles';

const isCSSRequest = (request: string) => STYLE_EXTENSIONS.has(path.extname(request));

export function getAstroPageStyleId(pathname: string) {
  let styleId = ASTRO_PAGE_STYLE_PREFIX + pathname;
  if (styleId.endsWith('/')) {
    styleId += 'index';
  }
  styleId += '.js';
  return styleId;
}

export function getAstroStyleId(pathname: string) {
  let styleId = ASTRO_STYLE_PREFIX + pathname;
  if (styleId.endsWith('/')) {
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

  let viteTransform: TransformHook;

  return {
    name: PLUGIN_NAME,

    enforce: 'pre',

    configResolved(resolvedConfig) {
      viteTransform = getViteTransform(resolvedConfig);

      const viteCSSPost = resolvedConfig.plugins.find((p) => p.name === 'vite:css-post');
      if (viteCSSPost) {
        // Prevent this plugin's bundling behavior from running since we need to
        // do that ourselves in order to handle updating the HTML.
        delete viteCSSPost.renderChunk;
        delete viteCSSPost.generateBundle;
      }
    },

    async resolveId(id) {
      if (isPageStyleVirtualModule(id)) {
        return id;
      }
      if (isStyleVirtualModule(id)) {
        return id;
      }
      return undefined;
    },

    async load(id) {
      if (isPageStyleVirtualModule(id)) {
        const source = astroPageStyleMap.get(id)!;
        return source;
      }
      if (isStyleVirtualModule(id)) {
        return astroStyleMap.get(id)!;
      }
      return null;
    },

    async transform(value, id) {
      if (isStyleVirtualModule(id)) {
        styleSourceMap.set(id, value);
        return null;
      }
      if (isCSSRequest(id)) {
        let result = await viteTransform(value, id);
        if (result) {
          styleSourceMap.set(id, result.code);
        } else {
          styleSourceMap.set(id, value);
        }

        return result;
      }

      return null;
    },

    async renderChunk(_code, chunk) {
      let chunkCSS = '';
      let isPureCSS = true;
      for (const [id] of Object.entries(chunk.modules)) {
        if (!isCSSRequest(id) && !isPageStyleVirtualModule(id)) {
          isPureCSS = false;
        }
        if (styleSourceMap.has(id)) {
          chunkCSS += styleSourceMap.get(id)!;
        }
      }

      if (isPureCSS) {
        const { code: minifiedCSS } = await esbuild.transform(chunkCSS, {
          loader: 'css',
          minify: true,
        });
        const referenceId = this.emitFile({
          name: chunk.name + '.css',
          type: 'asset',
          source: minifiedCSS,
        });
        pureCSSChunks.add(chunk);
        chunkToReferenceIdMap.set(chunk.fileName, referenceId);
      }

      return null;
    },

    // Delete CSS chunks so JS is not produced for them.
    generateBundle(_options, bundle) {
      for (const [chunkId, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && pureCSSChunks.has(chunk)) {
          delete bundle[chunkId];
        }
      }
    },
  };
}
