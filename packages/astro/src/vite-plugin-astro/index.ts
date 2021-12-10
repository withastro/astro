import type { TransformResult } from '@astrojs/compiler';
import type { SourceMapInput } from 'rollup';
import type vite from '../core/vite';
import type { AstroConfig } from '../@types/astro';

import esbuild from 'esbuild';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { transform } from '@astrojs/compiler';
import { AstroDevServer } from '../core/dev/index.js';
import { getViteTransform, TransformHook, transformWithVite } from './styles.js';

const FRONTMATTER_PARSE_REGEXP = /^\-\-\-(.*)^\-\-\-/ms;
interface AstroPluginOptions {
  config: AstroConfig;
  devServer?: AstroDevServer;
}

// https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
function isSSR(options: undefined | boolean | { ssr: boolean }): boolean {
  if (options === undefined) {
    return false;
  }
  if (typeof options === 'boolean') {
    return options;
  }
  if (typeof options == 'object') {
    return !!options.ssr;
  }
  return false;
}

/** Transform .astro files for Vite */
export default function astro({ config, devServer }: AstroPluginOptions): vite.Plugin {
  let viteTransform: TransformHook;
  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // run transforms before other plugins can
    configResolved(resolvedConfig) {
      viteTransform = getViteTransform(resolvedConfig);
    },
    // note: don’t claim .astro files with resolveId() — it prevents Vite from transpiling the final JS (import.meta.globEager, etc.)
    async load(id, opts) {
      if (!id.endsWith('.astro')) {
        return null;
      }
      // pages and layouts should be transformed as full documents (implicit <head> <body> etc)
      // everything else is treated as a fragment
      const normalizedID = fileURLToPath(new URL(`file://${id}`));
      const isPage = normalizedID.startsWith(fileURLToPath(config.pages)) || normalizedID.startsWith(fileURLToPath(config.layouts));
      let source = await fs.promises.readFile(id, 'utf8');
      let tsResult: TransformResult | undefined;
      let cssTransformError: Error | undefined;

      try {
        // Transform from `.astro` to valid `.ts`
        // use `sourcemap: "both"` so that sourcemap is included in the code
        // result passed to esbuild, but also available in the catch handler.
        tsResult = await transform(source, {
          as: isPage ? 'document' : 'fragment',
          projectRoot: config.projectRoot.toString(),
          site: config.buildOptions.site,
          sourcefile: id,
          sourcemap: 'both',
          internalURL: 'astro/internal',
          preprocessStyle: async (value: string, attrs: Record<string, string>) => {
            const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
            try {
              const result = await transformWithVite({ value, lang, id, transformHook: viteTransform, ssr: isSSR(opts) });
              let map: SourceMapInput | undefined;
              if (!result) return null as any; // TODO: add type in compiler to fix "any"
              if (result.map) {
                if (typeof result.map === 'string') {
                  map = result.map;
                } else if (result.map.mappings) {
                  map = result.map.toString();
                }
              }
              return { code: result.code, map };
            } catch (err) {
              // save error to throw in plugin context
              cssTransformError = err as any;
              return null;
            }
          },
        });

        // throw CSS transform errors here if encountered
        if (cssTransformError) throw cssTransformError;

        // Compile all TypeScript to JavaScript.
        // Also, catches invalid JS/TS in the compiled output before returning.
        const { code, map } = await esbuild.transform(tsResult.code, { loader: 'ts', sourcemap: 'external', sourcefile: id });

        return {
          code,
          map,
        };
      } catch (err: any) {
        // Verify frontmatter: a common reason that this plugin fails is that
        // the user provided invalid JS/TS in the component frontmatter.
        // If the frontmatter is invalid, the `err` object may be a compiler
        // panic or some other vague/confusing compiled error message.
        //
        // Before throwing, it is better to verify the frontmatter here, and
        // let esbuild throw a more specific exception if the code is invalid.
        // If frontmatter is valid or cannot be parsed, then continue.
        const scannedFrontmatter = FRONTMATTER_PARSE_REGEXP.exec(source);
        if (scannedFrontmatter) {
          try {
            await esbuild.transform(scannedFrontmatter[1], { loader: 'ts', sourcemap: false, sourcefile: id });
          } catch (frontmatterErr: any) {
            // Improve the error by replacing the phrase "unexpected end of file"
            // with "unexpected end of frontmatter" in the esbuild error message.
            if (frontmatterErr && frontmatterErr.message) {
              frontmatterErr.message = frontmatterErr.message.replace('end of file', 'end of frontmatter');
            }
            throw frontmatterErr;
          }
        }

        // improve compiler errors
        if (err.stack.includes('wasm-function')) {
          const search = new URLSearchParams({
            labels: 'compiler',
            title: '🐛 BUG: `@astrojs/compiler` panic',
            body: `### Describe the Bug

\`@astrojs/compiler\` encountered an unrecoverable error when compiling the following file.

**${id.replace(fileURLToPath(config.projectRoot), '')}**
\`\`\`astro
${source}
\`\`\`
`,
          });
          err.url = `https://github.com/withastro/astro/issues/new?${search.toString()}`;
          err.message = `Error: Uh oh, the Astro compiler encountered an unrecoverable error!

Please open
a GitHub issue using the link below:
${err.url}`;
          // TODO: remove stack replacement when compiler throws better errors
          err.stack = `    at ${id}`;
        }

        throw err;
      }
    },
    // async handleHotUpdate(context) {
    //   if (devServer) {
    //     return devServer.handleHotUpdate(context);
    //   }
    // },
  };
}
