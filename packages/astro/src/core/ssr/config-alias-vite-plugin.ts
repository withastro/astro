import * as tsr from 'tsconfig-resolver';
import * as path from 'path';
import * as url from 'url';

import type * as vite from 'vite';

/** Result of successfully parsed tsconfig.json or jsconfig.json. */
interface ConfigAliasResult {
  /** Resolved baseUrl directory path. */
  baseUrl: string;
  /** Resolved aliasing paths. */
  paths: {
    [key: string]: string[];
  };
}

/** Matches any absolute or relative posix path. */
const matchResolvablePath = /^\.*\//;

/** Matches any trailing `/*` used by configurations. */
const matchTrailingAsterisk = /\/\*$/;

/** Returns the results of a config file if it exists, otherwise null. */
const getExistingConfig = (searchName: string, cwd: string | undefined): tsr.TsConfigResultSuccess | null => {
  const config = tsr.tsconfigResolverSync({ cwd, searchName });

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
        [alias.replace(matchTrailingAsterisk, '/')]: []
          .concat(compilerOptions.paths[alias])
          .map((aliasPath) => path.posix.resolve(baseUrl, aliasPath).replace(matchTrailingAsterisk, '/')),
      }),
    {}
  );

  return { baseUrl, paths };
};

/** Return a Vite plugin used to alias pathes from tsconfig.json and jsconfig.json. */
export default function configAliasVitePlugin(astroConfig: { projectRoot?: URL; [key: string]: unknown }): vite.PluginOption {
  /** Aliases from the tsconfig.json or jsconfig.json configuration. */
  const configAlias = getConfigAlias(astroConfig.projectRoot && url.fileURLToPath(astroConfig.projectRoot));

  // if no config alias was found, bypass this plugin
  if (!configAlias) return {} as vite.PluginOption;

  return {
    name: '@astrojs/vite-plugin-tsconfig-alias',
    enforce: 'pre',
    async resolveId(source: string, importer, options) {
      /** Resolved source id from existing resolvers. */
      const resolvedId = await this.resolve(source, importer, { skipSelf: true, ...options });

      // if the existing resolvers find the file, return that resolution
      if (resolvedId) return resolvedId;

      // condition bypass this resolver if the source id is a relative or absolute path
      if (matchResolvablePath.test(source)) return null;

      // conditionally resolve the source id from any matching alias
      for (let [alias, values] of Object.entries(configAlias.paths)) {
        if (source.startsWith(alias)) {
          for (const value of values) {
            return source.replace(alias, value);
          }
        }
      }

      // otherwise, conditionally resolve the source id from the baseUrl
      return path.posix.resolve(configAlias.baseUrl, source);
    },
  };
}
