import { dirname, resolve } from 'path';
import { decorateLanguageService, isPatched } from './language-service';
import { Logger } from './logger';
import { patchModuleLoader } from './module-loader';
import { SvelteSnapshotManager } from './svelte-snapshots';
import type ts from 'typescript/lib/tsserverlibrary';
import { ConfigManager, Configuration } from './config-manager';
import { ProjectSvelteFilesManager } from './project-svelte-files';
import { getConfigPathForProject } from './utils';

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
    const configManager = new ConfigManager();

    function create(info: ts.server.PluginCreateInfo) {
        const logger = new Logger(info.project.projectService.logger);
        if (!isSvelteProject(info.project.getCompilerOptions())) {
            logger.log('Detected that this is not a Svelte project, abort patching TypeScript');
            return info.languageService;
        }

        if (isPatched(info.languageService)) {
            logger.log('Already patched. Checking tsconfig updates.');

            ProjectSvelteFilesManager.getInstance(
                info.project.getProjectName()
            )?.updateProjectConfig(info.languageServiceHost);

            return info.languageService;
        }

        configManager.updateConfigFromPluginConfig(info.config);
        if (configManager.getConfig().enable) {
            logger.log('Starting Svelte plugin');
        } else {
            logger.log('Svelte plugin disabled');
            logger.log(info.config);
        }

        // This call the ConfiguredProject.getParsedCommandLine
        // where it'll try to load the cached version of the parsedCommandLine
        const parsedCommandLine = info.languageServiceHost.getParsedCommandLine?.(
            getConfigPathForProject(info.project)
        );

        const svelteOptions = parsedCommandLine?.raw?.svelteOptions || { namespace: 'svelteHTML' };
        logger.log('svelteOptions:', svelteOptions);
        logger.debug(parsedCommandLine?.wildcardDirectories);

        const snapshotManager = new SvelteSnapshotManager(
            modules.typescript,
            info.project.projectService,
            svelteOptions,
            logger,
            configManager
        );

        const projectSvelteFilesManager = parsedCommandLine
            ? new ProjectSvelteFilesManager(
                  modules.typescript,
                  info.project,
                  info.serverHost,
                  snapshotManager,
                  parsedCommandLine,
                  configManager
              )
            : undefined;

        patchModuleLoader(
            logger,
            snapshotManager,
            modules.typescript,
            info.languageServiceHost,
            info.project,
            configManager
        );

        configManager.onConfigurationChanged(() => {
            // enabling/disabling the plugin means TS has to recompute stuff
            info.languageService.cleanupSemanticCache();
            info.project.markAsDirty();

            // updateGraph checks for new root files
            // if there's no tsconfig there isn't root files to check
            if (projectSvelteFilesManager) {
                info.project.updateGraph();
            }
        });

        return decorateLanguageServiceDispose(
            decorateLanguageService(info.languageService, snapshotManager, logger, configManager),
            projectSvelteFilesManager ?? {
                dispose() {}
            }
        );
    }

    function getExternalFiles(project: ts.server.Project) {
        if (!isSvelteProject(project.getCompilerOptions()) || !configManager.getConfig().enable) {
            return [];
        }

        // Needed so the ambient definitions are known inside the tsx files
        const svelteTsPath = dirname(require.resolve('svelte2tsx'));
        const svelteTsxFiles = [
            './svelte-shims.d.ts',
            './svelte-jsx.d.ts',
            './svelte-native-jsx.d.ts'
        ].map((f) => modules.typescript.sys.resolvePath(resolve(svelteTsPath, f)));

        // let ts know project svelte files to do its optimization
        return svelteTsxFiles.concat(
            ProjectSvelteFilesManager.getInstance(project.getProjectName())?.getFiles() ?? []
        );
    }

    function isSvelteProject(compilerOptions: ts.CompilerOptions) {
        // Add more checks like "no Svelte file found" or "no config file found"?
        try {
            const isSvelteProject =
                typeof compilerOptions.configFilePath !== 'string' ||
                require.resolve('svelte', { paths: [compilerOptions.configFilePath] });
            return isSvelteProject;
        } catch (e) {
            // If require.resolve fails, we end up here
            return false;
        }
    }

    function onConfigurationChanged(config: Configuration) {
        configManager.updateConfigFromPluginConfig(config);
    }

    function decorateLanguageServiceDispose(
        languageService: ts.LanguageService,
        disposable: { dispose(): void }
    ) {
        const dispose = languageService.dispose;

        languageService.dispose = () => {
            disposable.dispose();
            dispose();
        };

        return languageService;
    }

    return { create, getExternalFiles, onConfigurationChanged };
}

export = init;
