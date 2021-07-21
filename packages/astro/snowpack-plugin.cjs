const { readFile } = require('fs').promises;
const getPort = require('get-port');
// Snowpack plugins must be CommonJS :(
const transformPromise = import('./dist/compiler/index.js');

const DEFAULT_HMR_PORT = 12321;

/**
 * @typedef {Object} PluginOptions - creates a new type named 'SpecialType'
 * @prop {import('./src/config_manager').ConfigManager} configManager
 * @prop {'development' | 'production'} mode
 */

/**
 * @type {import('snowpack').SnowpackPluginFactory<PluginOptions>}
 */
module.exports = (snowpackConfig, options = {}) => {
  const { resolvePackageUrl, astroConfig, configManager, mode } = options;
  let hmrPort = DEFAULT_HMR_PORT;
  return {
    name: 'snowpack-astro',
    knownEntrypoints: ['astro/dist/internal/h.js', 'astro/components/Prism.astro', 'shorthash', 'estree-util-value-to-estree', 'astring'],
    resolve: {
      input: ['.astro', '.md'],
      output: ['.js', '.css'],
    },
    async transform({ contents, id, fileExt }) {
      if (configManager.isConfigModule(fileExt, id)) {
        configManager.configModuleId = id;
        const source = await configManager.buildSource(contents);
        return source;
      }
    },
    onChange({ filePath }) {
      // If the astro.config.mjs file changes, mark the generated config module as changed.
      if (configManager.isAstroConfig(filePath) && configManager.configModuleId) {
        this.markChanged(configManager.configModuleId);
        configManager.markDirty();
      }
    },
    async config(snowpackConfig) {
      if (!isNaN(snowpackConfig.devOptions.hmrPort)) {
        hmrPort = snowpackConfig.devOptions.hmrPort;
      } else {
        hmrPort = await getPort({ port: DEFAULT_HMR_PORT, host: snowpackConfig.devOptions.hostname });
        snowpackConfig.devOptions.hmrPort = hmrPort;
      }
    },
    async load({ filePath }) {
      const { compileComponent } = await transformPromise;
      const projectRoot = snowpackConfig.root;
      const contents = await readFile(filePath, 'utf-8');

      /** @type {import('./src/@types/compiler').CompileOptions} */
      const compileOptions = {
        astroConfig,
        hmrPort,
        mode,
        resolvePackageUrl,
      };
      const result = await compileComponent(contents, { compileOptions, filename: filePath, projectRoot });
      const output = {
        '.js': { code: result.contents },
      };
      if (result.css) output['.css'] = result.css;
      return output;
    },
  };
};
