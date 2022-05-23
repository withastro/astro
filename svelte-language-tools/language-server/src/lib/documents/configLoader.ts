import { Logger } from '../../logger';
import { CompileOptions } from 'svelte/types/compiler/interfaces';
import { PreprocessorGroup } from 'svelte/types/compiler/preprocess/types';
import { importSveltePreprocess } from '../../importPackage';
import _glob from 'fast-glob';
import _path from 'path';
import _fs from 'fs';
import { pathToFileURL, URL } from 'url';

export type InternalPreprocessorGroup = PreprocessorGroup & {
    /**
     * svelte-preprocess has this since 4.x
     */
    defaultLanguages?: {
        markup?: string;
        script?: string;
        style?: string;
    };
};

export interface SvelteConfig {
    compilerOptions?: CompileOptions;
    preprocess?: InternalPreprocessorGroup | InternalPreprocessorGroup[];
    loadConfigError?: any;
}

const DEFAULT_OPTIONS: CompileOptions = {
    dev: true
};

const NO_GENERATE: CompileOptions = {
    generate: false
};

/**
 * This function encapsulates the import call in a way
 * that TypeScript does not transpile `import()`.
 * https://github.com/microsoft/TypeScript/issues/43329
 */
const _dynamicImport = new Function('modulePath', 'return import(modulePath)') as (
    modulePath: URL
) => Promise<any>;

/**
 * Loads svelte.config.{js,cjs,mjs} files. Provides both a synchronous and asynchronous
 * interface to get a config file because snapshots need access to it synchronously.
 * This means that another instance (the ts service host on startup) should make
 * sure that all config files are loaded before snapshots are retrieved.
 * Asynchronousity is needed because we use the dynamic `import()` statement.
 */
export class ConfigLoader {
    private configFiles = new Map<string, SvelteConfig>();
    private configFilesAsync = new Map<string, Promise<SvelteConfig>>();
    private filePathToConfigPath = new Map<string, string>();
    private disabled = false;

    constructor(
        private globSync: typeof _glob.sync,
        private fs: Pick<typeof _fs, 'existsSync'>,
        private path: Pick<typeof _path, 'dirname' | 'relative' | 'join'>,
        private dynamicImport: typeof _dynamicImport
    ) {}

    /**
     * Enable/disable loading of configs (for security reasons for example)
     */
    setDisabled(disabled: boolean): void {
        this.disabled = disabled;
    }

    /**
     * Tries to load all `svelte.config.js` files below given directory
     * and the first one found inside/above that directory.
     *
     * @param directory Directory where to load the configs from
     */
    async loadConfigs(directory: string): Promise<void> {
        Logger.log('Trying to load configs for', directory);

        try {
            const pathResults = this.globSync('**/svelte.config.{js,cjs,mjs}', {
                cwd: directory,
                ignore: ['**/node_modules/**']
            });
            const someConfigIsImmediateFileInDirectory =
                pathResults.length > 0 && pathResults.some((res) => !this.path.dirname(res));
            if (!someConfigIsImmediateFileInDirectory) {
                const configPathUpwards = this.searchConfigPathUpwards(directory);
                if (configPathUpwards) {
                    pathResults.push(this.path.relative(directory, configPathUpwards));
                }
            }
            if (pathResults.length === 0) {
                this.addFallbackConfig(directory);
                return;
            }

            const promises = pathResults
                .map((pathResult) => this.path.join(directory, pathResult))
                .filter((pathResult) => {
                    const config = this.configFiles.get(pathResult);
                    return !config || config.loadConfigError;
                })
                .map(async (pathResult) => {
                    await this.loadAndCacheConfig(pathResult, directory);
                });
            await Promise.all(promises);
        } catch (e) {
            Logger.error(e);
        }
    }

    private addFallbackConfig(directory: string) {
        const fallback = this.useFallbackPreprocessor(directory, false);
        const path = this.path.join(directory, 'svelte.config.js');
        this.configFilesAsync.set(path, Promise.resolve(fallback));
        this.configFiles.set(path, fallback);
    }

    private searchConfigPathUpwards(path: string) {
        let currentDir = path;
        let nextDir = this.path.dirname(path);
        while (currentDir !== nextDir) {
            const tryFindConfigPath = (ending: string) => {
                const path = this.path.join(currentDir, `svelte.config.${ending}`);
                return this.fs.existsSync(path) ? path : undefined;
            };
            const configPath =
                tryFindConfigPath('js') || tryFindConfigPath('cjs') || tryFindConfigPath('mjs');
            if (configPath) {
                return configPath;
            }

            currentDir = nextDir;
            nextDir = this.path.dirname(currentDir);
        }
    }

    private async loadAndCacheConfig(configPath: string, directory: string) {
        const loadingConfig = this.configFilesAsync.get(configPath);
        if (loadingConfig) {
            await loadingConfig;
        } else {
            const newConfig = this.loadConfig(configPath, directory);
            this.configFilesAsync.set(configPath, newConfig);
            this.configFiles.set(configPath, await newConfig);
        }
    }

    private async loadConfig(configPath: string, directory: string) {
        try {
            let config = this.disabled
                ? {}
                : (await this.dynamicImport(pathToFileURL(configPath)))?.default;

            if (!config) {
                throw new Error(
                    'Missing exports in the config. Make sure to include "export default config" or "module.exports = config"'
                );
            }
            config = {
                ...config,
                compilerOptions: {
                    ...DEFAULT_OPTIONS,
                    ...config.compilerOptions,
                    ...NO_GENERATE
                }
            };
            Logger.log('Loaded config at ', configPath);
            return config;
        } catch (err) {
            Logger.error('Error while loading config at ', configPath);
            Logger.error(err);
            const config = {
                ...this.useFallbackPreprocessor(directory, true),
                compilerOptions: {
                    ...DEFAULT_OPTIONS,
                    ...NO_GENERATE
                },
                loadConfigError: err
            };
            return config;
        }
    }

    /**
     * Returns config associated to file. If no config is found, the file
     * was called in a context where no config file search was done before,
     * which can happen
     * - if TS intellisense is turned off and the search did not run on tsconfig init
     * - if the file was opened not through the TS service crawl, but through the LSP
     *
     * @param file
     */
    getConfig(file: string): SvelteConfig | undefined {
        const cached = this.filePathToConfigPath.get(file);
        if (cached) {
            return this.configFiles.get(cached);
        }

        let currentDir = file;
        let nextDir = this.path.dirname(file);
        while (currentDir !== nextDir) {
            currentDir = nextDir;
            const config =
                this.tryGetConfig(file, currentDir, 'js') ||
                this.tryGetConfig(file, currentDir, 'cjs') ||
                this.tryGetConfig(file, currentDir, 'mjs');
            if (config) {
                return config;
            }
            nextDir = this.path.dirname(currentDir);
        }
    }

    /**
     * Like `getConfig`, but will search for a config above if no config found.
     */
    async awaitConfig(file: string): Promise<SvelteConfig | undefined> {
        const config = this.getConfig(file);
        if (config) {
            return config;
        }

        const fileDirectory = this.path.dirname(file);
        const configPath = this.searchConfigPathUpwards(fileDirectory);
        if (configPath) {
            await this.loadAndCacheConfig(configPath, fileDirectory);
        } else {
            this.addFallbackConfig(fileDirectory);
        }
        return this.getConfig(file);
    }

    private tryGetConfig(file: string, fromDirectory: string, configFileEnding: string) {
        const path = this.path.join(fromDirectory, `svelte.config.${configFileEnding}`);
        const config = this.configFiles.get(path);
        if (config) {
            this.filePathToConfigPath.set(file, path);
            return config;
        }
    }

    private useFallbackPreprocessor(path: string, foundConfig: boolean): SvelteConfig {
        Logger.log(
            (foundConfig
                ? 'Found svelte.config.js but there was an error loading it. '
                : 'No svelte.config.js found. ') +
                'Using https://github.com/sveltejs/svelte-preprocess as fallback'
        );
        const sveltePreprocess = importSveltePreprocess(path);
        return {
            preprocess: sveltePreprocess({
                // 4.x does not have transpileOnly anymore, but if the user has version 3.x
                // in his repo, that one is loaded instead, for which we still need this.
                typescript: <any>{
                    transpileOnly: true,
                    compilerOptions: { sourceMap: true, inlineSourceMap: false }
                }
            })
        };
    }
}

export const configLoader = new ConfigLoader(_glob.sync, _fs, _path, _dynamicImport);
