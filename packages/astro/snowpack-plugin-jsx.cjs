const esbuild = require('esbuild');
const colors = require('kleur/colors');
const { logger } = require('snowpack');
const path = require('path');
const { promises: fs } = require('fs');

const babel = require('@babel/core')
const eslexer = require('es-module-lexer');

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

/**
 * @type {import('snowpack').SnowpackPluginFactory<PluginOptions>}
 */
module.exports = function jsxPlugin(config, options = {}) {
  const {
    configManager
  } = options;

  let didInit = false;
  return {
    name: '@astrojs/snowpack-plugin-jsx',
    resolve: {
      input: ['.jsx', '.tsx'],
      output: ['.js'],
    },
    async load({ filePath, fileExt, ...transformContext }) {
      if (!didInit) {
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
        logger.error(`${colors.bold('!')} ${filePath}
  ${warning.text}`);
      }

      let renderers = await configManager.getRenderers();
      const importSources = new Set(renderers.map(({ jsxImportSource }) => jsxImportSource).filter(i => i));
      const getRenderer = (importSource) => renderers.find(({ jsxImportSource }) => jsxImportSource === importSource);
      const getTransformOptions = async (importSource) => {
        const { name } = getRenderer(importSource);
        const { default: renderer } = await import(name);
        return renderer.jsxTransformOptions(transformContext);
      }

      // If we only have a single renderer, we can skip a bunch of work!
      if (importSources.size === 1) {
        const result = transform(code, filePath, await getTransformOptions(Array.from(importSources)[0]))

        return {
          '.js': {
            code: result.code || ''
          },
        };
      }

      // we need valid JS to scan for imports
      // so let's just use `h` and `Fragment` as placeholders
      const { code: codeToScan } = await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'transform',
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
      });

      const [imports] = eslexer.parse(codeToScan);
      let importSource;

      if (imports) {
        for (let { n: name } of imports) {
          if (name.indexOf('/') > -1) name = name.split('/')[0];
          if (importSources.has(name)) {
            importSource = name;
            break;
          }
        }
      }

      if (!importSource) {
        let match;

        while ((match = /\/\*\*(?:[^*][^/]|\s)*@jsxImportSource\s+(.+)\s*\*\//gm.exec(contents)) !== null) {
          importSource = match[1].trim();
          break;
        }
      }

      if (!importSource) {
        console.log(`${filePath}
Unable to resolve JSX transformer! If you have more than one renderer enabled, you should use a pragma comment.
/* jsxImportSource: preact */
`);
        return {
          '.js': {
            code: ''
          },
        }
      }

      const result = transform(code, filePath, await getTransformOptions(importSource));

      return {
        '.js': {
          code: result.code || ''
        },
      };
    },
    cleanup() {},
  };
}

/**
 * 
 * @param code {string}
 * @param id {string}
 * @param opts {{ plugins?: import('@babel/core').PluginItem[], presets?: import('@babel/core').PluginItem[] }|undefined}
 */
const transform = (code, id, { alias, plugins = [], presets = [] } = {}) =>
  babel.transformSync(code, {
    presets,
    plugins: [...plugins, alias ? ['babel-plugin-module-resolver', { root: process.cwd(), alias }] : undefined].filter(v => v),
    cwd: process.cwd(),
    filename: id,
    ast: false,
    compact: false,
    sourceMaps: false,
    configFile: false,
    babelrc: false,
  });
