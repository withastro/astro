import { tsconfigResolverSync, TsConfigResultSuccess } from 'tsconfig-resolver';
import path from 'path';
import url from 'url';
import type * as vite from 'vite';
import astro from '../../vite-plugin-astro';

interface ConfigAliasResult {
  baseUrl: string;
  paths: {
    [key: string]: string[];
  };
}

const matchResolvablePath = /^\.*\//;

const matchTailingAsterisk = /\/\*$/;

/** Returns the results of a config file if it exists, otherwise null. */
const getExistingConfig = (searchName: string, cwd: string | undefined): TsConfigResultSuccess | null => {
  const config = tsconfigResolverSync({ cwd, searchName });

  return config.exists ? config : null;
};

/** Return the nearest tsconfig.json or jsconfig.json configuration result. */
const getConfigAlias = (cwd: string | undefined): ConfigAliasResult | null => {
  /** Closest tsconfig.json or jsconfig.json */
  const config = getExistingConfig('tsconfig.json', cwd) || getExistingConfig('jsconfig.json', cwd);

  // if no config was found, return null
  if (!config) return null;

  const compilerOptions = Object(config.config.compilerOptions);

  // if no compilerOptions.baseUrl was defined, return null
  if (!compilerOptions.baseUrl) return null;

  // resolve the base url from the configuration file directory
  const baseUrl = path.posix.resolve(path.posix.dirname(config.path), compilerOptions.baseUrl);

  // sanitize all aliases from the configuration file directory
  const paths = Object.keys(Object(compilerOptions.paths)).reduce(
    (paths, alias) =>
      Object.assign(paths, {
        [alias.replace(matchTailingAsterisk, '/')]: []
          .concat(compilerOptions.paths[alias])
          .map((aliasPath) => path.posix.resolve(baseUrl, aliasPath).replace(matchTailingAsterisk, '/')),
      }),
    {}
  );

  return { baseUrl, paths };
};

export default function configAliasVitePlugin(astroConfig: { projectRoot?: URL; [key: string]: unknown }): vite.PluginOption {
  /** Aliases from the tsconfig.json or jsconfig.json configuration. */
  const configAlias = getConfigAlias(astroConfig.projectRoot && url.fileURLToPath(astroConfig.projectRoot));

  if (!configAlias) return {} as vite.PluginOption;

  return {
    name: '@astrojs/vite-plugin-tsconfig-alias',
    enforce: 'pre',
    async resolveId(source: string, importer, options) {
      const resolution = await this.resolve(source, importer, { skipSelf: true, ...options });

      if (resolution) return resolution;

      // if this is a relative or absolute path, return null
      if (matchResolvablePath.test(source)) {
        return null;
      }

      // conditionally resolve from each alias
      for (let [alias, values] of Object.entries(configAlias.paths)) {
        if (source.startsWith(alias)) {
          for (const value of values) {
            const resolvedSource = source.replace(alias, value);

            return resolvedSource;
          }
        }
      }

      // otherwise, conditionally resolve from the baseUrl
      return path.posix.resolve(configAlias.baseUrl, source);
    },
  };
}
