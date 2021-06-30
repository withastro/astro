const esbuild = require('esbuild');
const colors = require('kleur/colors');
const { logger } = require('snowpack');
const path = require('path');
const { promises: fs } = require('fs');

const babel = require('@babel/core')
const babelPluginTransformJsx = require('@babel/plugin-transform-react-jsx').default;
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
function getLoader(filePath) {
  /** @type {any} */
  const ext = path.extname(filePath);
  return ext.substr(1);
}

const transformJsx = ({ code, filePath: filename, sourceMap: sourceMaps }, importSource) => {
  return babel.transformSync(code, {
      filename,
      plugins: [
        babelPluginTransformJsx({}, { runtime: 'automatic', importSource })
      ],
      sourceMaps,
    }
  )
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
    async load({ filePath }) {
      if (!didInit) {
        await eslexer.init;
        didInit = true;
      }

      const contents = await fs.readFile(filePath, 'utf8');
      const loader = getLoader(filePath);

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

      // If we only have a single renderer, we can skip a bunch of work!
      if (importSources.size === 1) {
        const result = transformJsx({ 
          code,
          filePath,
          sourceMap: config.buildOptions.sourcemap ? 'inline' : false,
        }, Array.from(importSources)[0])

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

      const result = transformJsx({ 
        code,
        filePath,
        sourceMap: config.buildOptions.sourcemap ? 'inline' : false,
      }, importSource)

      return {
        '.js': {
          code: result.code || ''
        },
      };
    },
    cleanup() {},
  };
}
