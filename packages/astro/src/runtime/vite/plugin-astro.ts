import type { TransformResult } from '@astrojs/compiler';
import type { Plugin } from 'vite';
import type { AstroConfig, Renderer } from '../../@types/astro.js';

import esbuild from 'esbuild';
import fs from 'fs';
import { transform } from '@astrojs/compiler';
import { decode } from 'sourcemap-codec';
import { AstroDevServer } from '../../dev/index.js';

interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

/** Transform .astro files for Vite */
export default function astro({ config, devServer }: AstroPluginOptions): Plugin {
  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // run transforms before other plugins can
    // note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
    async load(id) {
      if (id.endsWith('.astro')) {
        // const isPage = id.startsWith(fileURLToPath(config.pages));
        let source = await fs.promises.readFile(id, 'utf8');
        let tsResult: TransformResult | undefined;

        try {
          // 1. Transform from `.astro` to valid `.ts`
          // use `sourcemap: "inline"` so that the sourcemap is included in the "code" result that we pass to esbuild.
          tsResult = await transform(source, { sourcefile: id, sourcemap: 'both', internalURL: 'astro/internal' });
          // 2. Compile `.ts` to `.js`
          const { code, map } = await esbuild.transform(tsResult.code, { loader: 'ts', sourcemap: 'external', sourcefile: id });
          
          return {
            code,
            map,
          };
        } catch (err: any) {
          // if esbuild threw the error, find original code source to display
          if (err.errors && tsResult?.map) {
            const json = JSON.parse(tsResult.map);
            const mappings = decode(json.mappings);
            const focusMapping = mappings[err.errors[0].location.line + 1];
            err.sourceLoc = { file: id, line: (focusMapping[0][2] || 0) + 1, column: (focusMapping[0][3] || 0) + 1 };
          }
          throw err;
        }
      }

      return null;
    },
    async handleHotUpdate(context) {
      if (devServer) {
        return devServer.handleHotUpdate(context);
      }
    },
  };
}
