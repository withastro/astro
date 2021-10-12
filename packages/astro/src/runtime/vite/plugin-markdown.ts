import type { Plugin } from 'vite';
import type { AstroConfig, Renderer } from '../../@types/astro.js';

import esbuild from 'esbuild';
import fs from 'fs';
import { transform } from '@astrojs/compiler';
import { AstroDevServer } from '../../dev/index.js';

interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

/** Transform .astro files for Vite */
export default function markdown({ config }: AstroPluginOptions): Plugin {
  return {
    name: '@astrojs/vite-plugin-markdown',
    enforce: 'pre', // run transforms before other plugins can
    async load(id) {
      if (id.endsWith('.md')) {
        let source = await fs.promises.readFile(id, 'utf8');

        // 2. Transform from `.md` to valid `.astro`
        let render = config.markdownOptions.render;
        let renderOpts = {};
        if (Array.isArray(render)) {
          renderOpts = render[1];
          render = render[0];
        }
        if (typeof render === 'string') {
          ({ default: render } = await import(render));
        }
        let { frontmatter, metadata, code: astroResult } = await render(source, renderOpts);

        // Extract special frontmatter keys
        const { layout = '', components = '', setup = '', ...content } = frontmatter;
        const prelude = `---
${layout ? `import Layout from '${layout}';` : ''}
${components ? `import * from '${components}';` : ''}
${setup}
---`;
        // If the user imported "Layout", wrap the content in a Layout
        if (/\bLayout\b/.test(prelude)) {
          astroResult = `${prelude}\n<Layout content={${JSON.stringify(content)}}>\n\n${astroResult}\n\n</Layout>`;
        } else {
          astroResult = `${prelude}\n${astroResult}`;
        }

        // 2. Transform from `.astro` to valid `.ts`
        let { code: tsResult } = await transform(astroResult, { sourcefile: id, sourcemap: 'inline', internalURL: 'astro/internal' });

        tsResult = `\nexport const metadata = ${JSON.stringify(metadata)};
export const frontmatter = ${JSON.stringify(content)};
${tsResult}`;

        // 3. Compile `.ts` to `.js`
        const { code, map } = await esbuild.transform(tsResult, { loader: 'ts', sourcemap: 'inline', sourcefile: id });

        return {
          code,
          map: null,
        };
      }

      return null;
    },
  };
}
