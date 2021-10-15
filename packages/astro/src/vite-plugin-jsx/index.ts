import type { Plugin } from 'vite';
import type { TransformResult } from 'rollup';
import type { AstroConfig, Renderer } from '../@types/astro';
import type { LogOptions } from '../core/logger';

import babel from '@babel/core';
import esbuild from 'esbuild';
import * as colors from 'kleur/colors';
import * as eslexer from 'es-module-lexer';
import path from 'path';
import { error } from '../core/logger.js';
import { parseNpmName } from '../core/util.js';

const JSX_RENDERERS = new Map<string, Renderer>();
const JSX_EXTENSIONS = new Set(['.jsx', '.tsx']);
const IMPORT_STATEMENTS: Record<string, string> = {
  react: "import React from 'react'",
  preact: "import { h } from 'preact'",
  'solid-js': "import 'solid-js/web'",
};
// The `tsx` loader in esbuild will remove unused imports, so we need to
// be careful about esbuild not treating h, React, Fragment, etc. as unused.
const PREVENT_UNUSED_IMPORTS = ';;(React,Fragment,h);';

interface AstroPluginJSXOptions {
  config: AstroConfig;
  logging: LogOptions;
}

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function jsx({ config, logging }: AstroPluginJSXOptions): Plugin {
  return {
    name: '@astrojs/vite-plugin-jsx',
    enforce: 'pre', // run transforms before other plugins
    async transform(code, id, ssr) {
      if (!JSX_EXTENSIONS.has(path.extname(id))) {
        return null;
      }

      // load renderers (on first run only)
      if (JSX_RENDERERS.size === 0) {
        const jsxRenderers = await loadJSXRenderers(config.renderers);
        if (jsxRenderers.size === 0) {
          // note: we have filtered out all non-JSX files, so this error should only show if a JSX file is loaded with no matching renderers
          throw new Error(
            `${colors.yellow(
              id
            )}\nUnable to resolve a renderer that handles JSX transforms! Please include a \`renderer\` plugin which supports JSX in your \`astro.config.mjs\` file.`
          );
        }
        for (const [importSource, renderer] of jsxRenderers) {
          JSX_RENDERERS.set(importSource, renderer);
        }
      }

      // attempt 0: if we only have one renderer, we can skip a bunch of work!
      if (JSX_RENDERERS.size === 1) {
        return transformJSX({ code, id, renderer: [...JSX_RENDERERS.values()][0], ssr: ssr || false });
      }

      // attempt 1: try and guess framework from imports (file can’t import React and Preact)

      // we need valid JS here, so we can use `h` and `Fragment` as placeholders
      // NOTE(fks, matthewp): Make sure that you're transforming the original contents here.
      const { code: codeToScan } = await esbuild.transform(code + PREVENT_UNUSED_IMPORTS, {
        loader: getLoader(path.extname(id)),
        jsx: 'transform',
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
      });
      let imports: eslexer.ImportSpecifier[] = [];
      if (/import/.test(codeToScan)) {
        let [i] = eslexer.parse(codeToScan);
        imports = i as any;
      }
      let importSource: string | undefined;
      if (imports.length > 0) {
        for (let { n: spec } of imports) {
          const pkg = spec && parseNpmName(spec);
          if (!pkg) continue;
          if (JSX_RENDERERS.has(pkg.name)) {
            importSource = pkg.name;
            break;
          }
        }
      }

      // attempt 2: look for @jsxImportSource comment
      if (!importSource) {
        const multiline = code.match(/\/\*\*[\S\s]*\*\//gm) || [];
        for (const comment of multiline) {
          const [_, lib] = comment.match(/@jsxImportSource\s*(\S+)/) || [];
          if (lib) {
            importSource = lib;
            break;
          }
        }
      }

      // if JSX renderer found, then use that
      if (importSource) {
        const jsxRenderer = JSX_RENDERERS.get(importSource);
        // if renderer not installed for this JSX source, throw error
        if (!jsxRenderer) {
          error(logging, 'renderer', `${colors.yellow(id)} No renderer installed for ${importSource}. Try adding \`@astrojs/renderer-${importSource}\` to your dependencies.`);
          return null;
        }
        return transformJSX({ code, id, renderer: JSX_RENDERERS.get(importSource) as Renderer, ssr: ssr || false });
      }

      // if we still can’t tell, throw error
      const defaultRenderer = [...JSX_RENDERERS.keys()][0];
      error(
        logging,
        'renderer',
        `${colors.yellow(id)}
Unable to resolve a renderer that handles this file! With more than one renderer enabled, you should include an import or use a pragma comment.
Add ${colors.cyan(IMPORT_STATEMENTS[defaultRenderer] || `import '${defaultRenderer}';`)} or ${colors.cyan(`/* jsxImportSource: ${defaultRenderer} */`)} to this file.
`
      );
      return null;
    },
  };
}

/** Returns esbuild loader for a given file */
function getLoader(fileExt: string): esbuild.Loader {
  return fileExt.substr(1) as any;
}

/** Load JSX renderers from config */
async function loadJSXRenderers(rendererNames: string[]): Promise<Map<string, Renderer>> {
  const renderers = new Map<string, Renderer>();
  await Promise.all(
    rendererNames.map((name) =>
      import(name).then(({ default: renderer }) => {
        if (!renderer.jsxImportSource) return;
        renderers.set(renderer.jsxImportSource, renderer);
      })
    )
  );
  return renderers;
}

interface TransformJSXOptions {
  code: string;
  id: string;
  ssr: boolean;
  renderer: Renderer; // note MUST check for JSX beforehand!
}

/** Transform JSX with Babel */
async function transformJSX({ code, id, ssr, renderer }: TransformJSXOptions): Promise<TransformResult> {
  const { jsxTransformOptions } = renderer;
  const options = await jsxTransformOptions!({ isSSR: ssr || false }); // must filter for this beforehand
  const result = await new Promise<babel.BabelFileResult | null>((resolve, reject) => {
    const plugins = [...(options.plugins || [])];
    babel.transform(
      code,
      {
        presets: options.presets,
        plugins,
        cwd: process.cwd(),
        filename: id,
        ast: false,
        compact: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
      },
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          return resolve(res);
        }
      }
    );
  });
  if (!result) return null;
  return {
    code: result.code || '',
    map: result.map,
  };
}
