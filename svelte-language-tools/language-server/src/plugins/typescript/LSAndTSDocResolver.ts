import ts from 'typescript';
import { TextDocumentContentChangeEvent } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../lib/documents';
import { LSConfigManager } from '../../ls-config';
import { debounceSameArg, normalizePath, pathToUrl } from '../../utils';
import { DocumentSnapshot, SvelteDocumentSnapshot } from './DocumentSnapshot';
import {
    getService,
    getServiceForTsconfig,
    forAllServices,
    LanguageServiceContainer,
    LanguageServiceDocumentContext
} from './service';
import { GlobalSnapshotsManager, SnapshotManager } from './SnapshotManager';

export class LSAndTSDocResolver {
    /**
     *
     * @param docManager
     * @param workspaceUris
     * @param configManager
     * @param notifyExceedSizeLimit
     * @param isSvelteCheck True, if used in the context of svelte-check
     * @param tsconfigPath This should only be set via svelte-check. Makes sure all documents are resolved to that tsconfig. Has to be absolute.
     */
    constructor(
        private readonly docManager: DocumentManager,
        private readonly workspaceUris: string[],
        private readonly configManager: LSConfigManager,
        private readonly notifyExceedSizeLimit?: () => void,
        private readonly isSvelteCheck = false,
        private readonly tsconfigPath?: string
    ) {
        const handleDocumentChange = (document: Document) => {
            // This refreshes the document in the ts language service
            this.getSnapshot(document);
        };
        docManager.on(
            'documentChange',
            debounceSameArg(
                handleDocumentChange,
                (newDoc, prevDoc) => newDoc.uri === prevDoc?.uri,
                1000
            )
        );

        // New files would cause typescript to rebuild its type-checker.
        // Open it immediately to reduce rebuilds in the startup
        // where multiple files and their dependencies
        // being loaded in a short period of times
        docManager.on('documentOpen', handleDocumentChange);
    }

    /**
     * Create a svelte document -> should only be invoked with svelte files.
     */
    private createDocument = (fileName: string, content: string) => {
        const uri = pathToUrl(fileName);
        const document = this.docManager.openDocument({
            text: content,
            uri
        });
        this.docManager.lockDocument(uri);
        return document;
    };

    private globalSnapshotsManager = new GlobalSnapshotsManager();

    private get lsDocumentContext(): LanguageServiceDocumentContext {
        return {
            ambientTypesSource: this.isSvelteCheck ? 'svelte-check' : 'svelte2tsx',
            createDocument: this.createDocument,
            useNewTransformation: this.configManager.getConfig().svelte.useNewTransformation,
            transformOnTemplateError: !this.isSvelteCheck,
            globalSnapshotsManager: this.globalSnapshotsManager,
            notifyExceedSizeLimit: this.notifyExceedSizeLimit
        };
    }

    async getLSForPath(path: string) {
        return (await this.getTSService(path)).getService();
    }

    async getLSAndTSDoc(document: Document): Promise<{
        tsDoc: SvelteDocumentSnapshot;
        lang: ts.LanguageService;
        userPreferences: ts.UserPreferences;
    }> {
        const lang = await this.getLSForPath(document.getFilePath() || '');
        const tsDoc = await this.getSnapshot(document);
        const userPreferences = this.getUserPreferences(tsDoc.scriptKind);

        return { tsDoc, lang, userPreferences };
    }

    /**
     * Retrieves and updates the snapshot for the given document or path from
     * the ts service it primarely belongs into.
     * The update is mirrored in all other services, too.
     */
    async getSnapshot(document: Document): Promise<SvelteDocumentSnapshot>;
    async getSnapshot(pathOrDoc: string | Document): Promise<DocumentSnapshot>;
    async getSnapshot(pathOrDoc: string | Document) {
        const filePath = typeof pathOrDoc === 'string' ? pathOrDoc : pathOrDoc.getFilePath() || '';
        const tsService = await this.getTSService(filePath);
        return tsService.updateSnapshot(pathOrDoc);
    }

    /**
     * Updates snapshot path in all existing ts services and retrieves snapshot
     */
    async updateSnapshotPath(oldPath: string, newPath: string): Promise<DocumentSnapshot> {
        await this.deleteSnapshot(oldPath);
        return this.getSnapshot(newPath);
    }

    /**
     * Deletes snapshot in all existing ts services
     */
    async deleteSnapshot(filePath: string) {
        await forAllServices((service) => service.deleteSnapshot(filePath));
        this.docManager.releaseDocument(pathToUrl(filePath));
    }

    /**
     * Updates project files in all existing ts services
     */
    async updateProjectFiles() {
        await forAllServices((service) => service.updateProjectFiles());
    }

    /**
     * Updates file in all ts services where it exists
     */
    async updateExistingTsOrJsFile(
        path: string,
        changes?: TextDocumentContentChangeEvent[]
    ): Promise<void> {
        path = normalizePath(path);
        // Only update once because all snapshots are shared between
        // services. Since we don't have a current version of TS/JS
        // files, the operation wouldn't be idempotent.
        let didUpdate = false;
        await forAllServices((service) => {
            if (service.hasFile(path) && !didUpdate) {
                didUpdate = true;
                service.updateTsOrJsFile(path, changes);
            }
        });
    }

    /**
     * @internal Public for tests only
     */
    async getSnapshotManager(filePath: string): Promise<SnapshotManager> {
        return (await this.getTSService(filePath)).snapshotManager;
    }

    async getTSService(filePath?: string): Promise<LanguageServiceContainer> {
        if (this.tsconfigPath) {
            return getServiceForTsconfig(this.tsconfigPath, this.lsDocumentContext);
        }
        if (!filePath) {
            throw new Error('Cannot call getTSService without filePath and without tsconfigPath');
        }
        return getService(filePath, this.workspaceUris, this.lsDocumentContext);
    }

    private getUserPreferences(scriptKind: ts.ScriptKind): ts.UserPreferences {
        const configLang =
            scriptKind === ts.ScriptKind.TS || scriptKind === ts.ScriptKind.TSX
                ? 'typescript'
                : 'javascript';

        return this.configManager.getTsUserPreferences(configLang);
    }
}
