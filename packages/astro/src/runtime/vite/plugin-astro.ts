import type { Plugin } from 'vite';
import type { AstroConfig, Renderer } from '../../@types/astro.js';
import type { LogOptions } from '../../logger';

import esbuild from 'esbuild';
import fs from 'fs';
import { transform } from '@astrojs/compiler';
import { AstroDevServer } from '../../dev/index.js';

interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

/** Transform .astro files for Vite */
export default function astro({ devServer }: AstroPluginOptions): Plugin {
  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // run transforms before other plugins can
    // note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
    async load(id) {
      if (id.endsWith('.astro') || id.endsWith('.md')) {
        let source = await fs.promises.readFile(id, 'utf8');

        // 1. Transform from `.astro` to valid `.ts`
        // use `sourcemap: "inline"` so that the sourcemap is included in the "code" result that we pass to esbuild.
        const tsResult = await transform(source, { sourcefile: id, sourcemap: 'inline' });
        // 2. Compile `.ts` to `.js`
        const { code, map } = await esbuild.transform(tsResult.code, { loader: 'ts', sourcemap: 'inline', sourcefile: id });

        return {
          code,
          map,
        };
      }

      // UNCOMMENT WHEN MARKDOWN SUPPORT LANDS
      // } else if (id.endsWith('.md')) {
      //   let contents = await fs.promises.readFile(id, 'utf8');
      //   const filename = slash(id.replace(fileURLToPath(config.projectRoot), ''));
      //   return markdownToH(filename, contents);
      // }
      return null;
    },
    async handleHotUpdate(context) {
      if (devServer) {
        return devServer.handleHotUpdate(context);
      }
    },
  };
}
