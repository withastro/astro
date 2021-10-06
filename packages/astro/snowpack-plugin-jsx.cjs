const esbuild = require('esbuild');
const colors = require('kleur/colors');
const loggerPromise = import('./dist/logger.js');
const { promises: fs } = require('fs');

const babel = require('@babel/core');
const eslexer = require('es-module-lexer');
let error = (...args) => {};

/**
 * @typedef {Object} PluginOptions - creates a new type named 'SpecialType'
 * @prop {import('./src/config_manager').ConfigManager} configManager
 * @prop {'development' | 'production'} mode
 */

/**
 * Returns esbuild loader for a given file
 * @param filePath {string}
 * @returns {import('esbuild').Loader}
 */
function getLoader(fileExt) {
  /** @type {any} */
  return fileExt.substr(1);
}

// The `tsx` loader in esbuild will remove unused imports, so we need to
// be careful about esbuild not treating h, React, Fragment, etc. as unused.
const PREVENT_UNUSED_IMPORTS = ';;(React,Fragment,h);';

/**
 * @type {import('snowpack').SnowpackPluginFactory<PluginOptions>}
 */
module.exports = function jsxPlugin(config, options = {}) {
  const { configManager, logging } = options;

  let didInit = false;
  return {
    name: '@astrojs/snowpack-plugin-jsx',
    resolve: {
      input: ['.jsx', '.tsx'],
      output: ['.js'],
    },
    async load({ filePath, fileExt, ...transformContext }) {
      if (!didInit) {
        const logger = await loggerPromise;
        error = logger.error;
        await eslexer.init;
        didInit = true;
      }

      const contents = await fs.readFile(filePath, 'utf8');
      const loader = getLoader(fileExt);

      const { code, warnings } = await esbuild.transform(contents, {
        loader,
        jsx: 'preserve',
        sourcefile: filePath,
        sourcemap: config.buildOptions.sourcemap ? 'inline' : undefined,
        charset: 'utf8',
        sourcesContent: config.mode !== 'production',
      });
      for (const warning of warnings) {
        error(
          logging,
          'renderer',
          `${colors.bold('!')} ${filePath}
  ${warning.text}`
        );
      }

      let renderers = await configManager.getRenderers();
      const importSources = new Set(renderers.map(({ jsxImportSource }) => jsxImportSource).filter((i) => i));
      const getRenderer = (importSource) => renderers.find(({ jsxImportSource }) => jsxImportSource === importSource);
      const getTransformOptions = async (importSource) => {
        const { name } = getRenderer(importSource);
        const { default: renderer } = await import(name);
        return renderer.jsxTransformOptions(transformContext);
      };

      if (importSources.size === 0) {
        throw new Error(`${colors.yellow(filePath)}
Unable to resolve a renderer that handles JSX transforms! Please include a \`renderer\` plugin which supports JSX in your \`astro.config.mjs\` file.`);
      }

      // If we only have a single renderer, we can skip a bunch of work!
      if (importSources.size === 1) {
        const result = transform(code, filePath, await getTransformOptions(Array.from(importSources)[0]));

        return {
          '.js': {
            code: result.code || '',
          },
        };
      }

      // we need valid JS here, so we can use `h` and `Fragment` as placeholders
      // NOTE(fks, matthewp): Make sure that you're transforming the original contents here.
      const { code: codeToScan } = await esbuild.transform(contents + PREVENT_UNUSED_IMPORTS, {
        loader,
        jsx: 'transform',
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
      });

      let imports = [];
      if (/import/.test(codeToScan)) {
        let [i] = eslexer.parse(codeToScan);
        // @ts-ignore
        imports = i;
      }

      let importSource;

      if (imports.length > 0) {
        for (let { n: name } of imports) {
          if (name.indexOf('/') > -1) name = name.split('/')[0];
          if (importSources.has(name)) {
            importSource = name;
            break;
          }
        }
      }

      if (!importSource) {
        const multiline = contents.match(/\/\*\*[\S\s]*\*\//gm) || [];

        for (const comment of multiline) {
          const [_, lib] = comment.match(/@jsxImportSource\s*(\S+)/) || [];
          if (lib) {
            importSource = lib;
            break;
          }
        }
      }

      if (!importSource) {
        const importStatements = {
          react: "import React from 'react'",
          preact: "import { h } from 'preact'",
          'solid-js': "import 'solid-js/web'",
        };
        if (importSources.size > 1) {
          const defaultRenderer = Array.from(importSources)[0];
          error(
            logging,
            'renderer',
            `${colors.yellow(filePath)}
Unable to resolve a renderer that handles this file! With more than one renderer enabled, you should include an import or use a pragma comment.
Add ${colors.cyan(importStatements[defaultRenderer] || `import '${defaultRenderer}';`)} or ${colors.cyan(`/* jsxImportSource: ${defaultRenderer} */`)} to this file.
`
          );
        }

        return {
          '.js': {
            code: contents,
          },
        };
      }

      const result = transform(code, filePath, await getTransformOptions(importSource));

      return {
        '.js': {
          code: result.code || '',
        },
      };
    },
    cleanup() {},
  };
};

/**
 *
 * @param code {string}
 * @param id {string}
 * @param opts {{ plugins?: import('@babel/core').PluginItem[], presets?: import('@babel/core').PluginItem[] }|undefined}
 */
const transform = (code, id, { alias, plugins = [], presets = [] } = {}) =>
  babel.transformSync(code, {
    presets,
    plugins: [...plugins, alias ? ['babel-plugin-module-resolver', { root: process.cwd(), alias }] : undefined].filter((v) => v),
    cwd: process.cwd(),
    filename: id,
    ast: false,
    compact: false,
    sourceMaps: false,
    configFile: false,
    babelrc: false,
  });
