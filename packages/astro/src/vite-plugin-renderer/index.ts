import type { TransformResult } from '@astrojs/compiler';
import type { SourceMapInput } from 'rollup';
import type vite from '../core/vite';
import { pathToFileURL } from 'url';
import type { AstroConfig } from '../@types/astro-core';

import esbuild from 'esbuild';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';
import { transform } from '@astrojs/compiler';
import { decode } from 'sourcemap-codec';
import { AstroDevServer } from '../core/dev/index.js';

function needsAstroLoader(id: string): URL | null {
  try {
    const url = new URL(`file://${id}`);
    if(url.searchParams.has('astro')) {
      return url;
    }
  } catch {}
  return null;
}


/** Transform .astro files for Vite */
export default function renderer({  }: any): vite.Plugin {
  return {
    name: '@astrojs/vite-plugin-renderer',
    enforce: 'pre', // run transforms before other plugins can
    /*configResolved(resolvedConfig) {
      
    },*/

    resolveId(id, importer) {
      if(id.startsWith('.')) {
        const url = new URL(id, new URL(`file://${importer}`));
        if(url.searchParams.has('astro')) {
          url.pathname += '.noop';
          // Remove file:// because Vite doesn't like it
          return url.toString().substr(5);
        }
      }

      return null;
    },
    
    async load(id, opts) {
      const url = needsAstroLoader(id);
      if(url === null) {
        return null;
      }

      const renderer = url.searchParams.get('renderer');
      const rendererSpecifier = `@astrojs/renderer-${renderer}`;
      console.log(rendererSpecifier)

      const source = `
        import RealComponent from '/@fs${url.pathname.substr(0, url.pathname.length - 5)}';
        import { renderComponent } from 'astro/internal';
        import { h } from 'preact';
        import d from '@astrojs/renderer-vue/server.js';

        export default function FrameworkComponent(props) {
          //return h('div', null, 'works');
          debugger;
          return d.renderToStaticMarkup(RealComponent, props, null);
        }
      `;

      return {
        code: source
      }
    }
  };
}
