import type ts from 'typescript/lib/tsserverlibrary';
import { ConfigManager, Configuration } from './config-manager';
import { SvelteSnapshotManager } from './svelte-snapshots';
import { getConfigPathForProject, isSvelteFilePath } from './utils';

export interface TsFilesSpec {
    include?: readonly string[];
    exclude?: readonly string[];
}

export class ProjectSvelteFilesManager {
    private files = new Set<string>();
    private directoryWatchers = new Set<ts.FileWatcher>();

    private static instances = new Map<string, ProjectSvelteFilesManager>();

    static getInstance(projectName: string) {
        return this.instances.get(projectName);
    }

    constructor(
        private readonly typescript: typeof ts,
        private readonly project: ts.server.Project,
        private readonly serverHost: ts.server.ServerHost,
        private readonly snapshotManager: SvelteSnapshotManager,
        private parsedCommandLine: ts.ParsedCommandLine,
        configManager: ConfigManager
    ) {
        if (configManager.getConfig().enable) {
            this.setupWatchers();
            this.updateProjectSvelteFiles();
        }

        configManager.onConfigurationChanged(this.onConfigChanged.bind(this));
        ProjectSvelteFilesManager.instances.set(project.getProjectName(), this);
    }

    updateProjectConfig(serviceHost: ts.LanguageServiceHost) {
        const parsedCommandLine = serviceHost.getParsedCommandLine?.(
            getConfigPathForProject(this.project)
        );

        if (!parsedCommandLine) {
            return;
        }

        this.disposeWatchersAndFiles();
        this.parsedCommandLine = parsedCommandLine;
        this.setupWatchers();
        this.updateProjectSvelteFiles();
    }

    getFiles() {
        return Array.from(this.files);
    }

    /**
     * Create directory watcher for include and exclude
     * The watcher in tsserver doesn't support svelte file
     * It won't add new created svelte file to root
     */
    private setupWatchers() {
        for (const directory in this.parsedCommandLine.wildcardDirectories) {
            if (
                !Object.prototype.hasOwnProperty.call(
                    this.parsedCommandLine.wildcardDirectories,
                    directory
                )
            ) {
                continue;
            }

            const watchDirectoryFlags = this.parsedCommandLine.wildcardDirectories[directory];
            const watcher = this.serverHost.watchDirectory(
                directory,
                this.watcherCallback.bind(this),
                watchDirectoryFlags === this.typescript.WatchDirectoryFlags.Recursive,
                this.parsedCommandLine.watchOptions
            );

            this.directoryWatchers.add(watcher);
        }
    }

    private watcherCallback(fileName: string) {
        if (!isSvelteFilePath(fileName)) {
            return;
        }

        // We can't just add the file to the project directly, because
        // - the casing of fileName is different
        // - we don't know whether the file was added or deleted
        this.updateProjectSvelteFiles();
    }

    private updateProjectSvelteFiles() {
        const fileNamesAfter = this.readProjectSvelteFilesFromFs();
        const removedFiles = new Set(...this.files);
        const newFiles = fileNamesAfter.filter((fileName) => {
            const has = this.files.has(fileName);
            if (has) {
                removedFiles.delete(fileName);
            }
            return !has;
        });

        for (const newFile of newFiles) {
            this.addFileToProject(newFile);
            this.files.add(newFile);
        }
        for (const removedFile of removedFiles) {
            this.removeFileFromProject(removedFile, false);
            this.files.delete(removedFile);
        }
    }

    private addFileToProject(newFile: string) {
        this.snapshotManager.create(newFile);
        const snapshot = this.project.projectService.getScriptInfo(newFile);

        if (snapshot) {
            this.project.addRoot(snapshot);
        }
    }

    private readProjectSvelteFilesFromFs() {
        const fileSpec: TsFilesSpec = this.parsedCommandLine.raw;
        const { include, exclude } = fileSpec;

        if (include?.length === 0) {
            return [];
        }

        return this.typescript.sys
            .readDirectory(
                this.project.getCurrentDirectory() || process.cwd(),
                ['.svelte'],
                exclude,
                include
            )
            .map(this.typescript.server.toNormalizedPath);
    }

    private onConfigChanged(config: Configuration) {
        this.disposeWatchersAndFiles();

        if (config.enable) {
            this.setupWatchers();
            this.updateProjectSvelteFiles();
        }
    }

    private removeFileFromProject(file: string, exists = true) {
        const info = this.project.getScriptInfo(file);

        if (info) {
            this.project.removeFile(info, exists, true);
        }
    }

    private disposeWatchersAndFiles() {
        this.directoryWatchers.forEach((watcher) => watcher.close());
        this.directoryWatchers.clear();

        this.files.forEach((file) => this.removeFileFromProject(file));
        this.files.clear();
    }

    dispose() {
        this.disposeWatchersAndFiles();

        ProjectSvelteFilesManager.instances.delete(this.project.getProjectName());
    }
}
