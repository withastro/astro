import type ts from 'typescript';
import type { TextDocumentContentChangeEvent } from 'vscode-languageserver';
import type { ConfigManager } from '../../core/config';
import type { AstroDocument, DocumentManager } from '../../core/documents';
import { debounceSameArg, normalizePath, pathToUrl } from '../../utils';
import {
	LanguageServiceContainer,
	LanguageServiceDocumentContext,
	forAllLanguageServices,
	getLanguageService,
} from './language-service';
import type { DocumentSnapshot } from './snapshots/DocumentSnapshot';
import { GlobalSnapshotManager, SnapshotManager } from './snapshots/SnapshotManager';

export class LanguageServiceManager {
	public docContext: LanguageServiceDocumentContext;
	private globalSnapshotManager: GlobalSnapshotManager;

	constructor(
		private readonly docManager: DocumentManager,
		private readonly workspaceUris: string[],
		private readonly configManager: ConfigManager,
		ts: typeof import('typescript/lib/tsserverlibrary'),
		tsLocalized?: Record<string, string> | undefined
	) {
		this.globalSnapshotManager = new GlobalSnapshotManager(ts);
		this.docContext = {
			createDocument: this.createDocument,
			globalSnapshotManager: this.globalSnapshotManager,
			configManager: this.configManager,
			ts,
			tsLocalized: tsLocalized,
		};

		const handleDocumentChange = (document: AstroDocument) => {
			this.getSnapshot(document);
		};

		docManager.on(
			'documentChange',
			debounceSameArg(handleDocumentChange, (newDoc, prevDoc) => newDoc.uri === prevDoc?.uri, 1000)
		);
		docManager.on('documentOpen', handleDocumentChange);
	}

	/**
	 * Create an AstroDocument (only for astro files)
	 */
	private createDocument = (fileName: string, content: string) => {
		const uri = pathToUrl(fileName);
		const document = this.docManager.openDocument({
			text: content,
			uri,
		});
		this.docManager.lockDocument(uri);
		return document;
	};

	async getSnapshot(document: AstroDocument): Promise<DocumentSnapshot>;
	async getSnapshot(pathOrDoc: string | AstroDocument): Promise<DocumentSnapshot>;
	async getSnapshot(pathOrDoc: string | AstroDocument) {
		const filePath = typeof pathOrDoc === 'string' ? pathOrDoc : pathOrDoc.getFilePath() || '';
		const tsService = await this.getTypeScriptLanguageService(filePath);
		return tsService.updateSnapshot(pathOrDoc, this.docContext.ts);
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
		await forAllLanguageServices((service) => service.deleteSnapshot(filePath));
		this.docManager.releaseDocument(pathToUrl(filePath));
	}

	/**
	 * Updates project files in all existing ts services
	 */
	async updateProjectFiles() {
		await forAllLanguageServices((service) => service.updateProjectFiles());
	}

	/**
	 * Updates file in all ts services where it exists
	 */
	async updateExistingNonAstroFile(
		path: string,
		changes?: TextDocumentContentChangeEvent[],
		text?: string
	): Promise<void> {
		path = normalizePath(path);
		// Only update once because all snapshots are shared between
		// services. Since we don't have a current version of TS/JS
		// files, the operation wouldn't be idempotent.
		let didUpdate = false;
		await forAllLanguageServices((service) => {
			if (service.hasFile(path) && !didUpdate) {
				didUpdate = true;
				service.updateNonAstroFile(path, changes, text);
			}
		});
	}

	async getLSAndTSDoc(document: AstroDocument): Promise<{
		tsDoc: DocumentSnapshot;
		lang: ts.LanguageService;
	}> {
		const lang = await this.getLSForPath(document.getFilePath() || '');
		const tsDoc = await this.getSnapshot(document);

		return { tsDoc, lang };
	}

	async getLSForPath(path: string) {
		return (await this.getTypeScriptLanguageService(path)).getService();
	}

	async getTypeScriptLanguageService(filePath: string): Promise<LanguageServiceContainer> {
		return getLanguageService(filePath, this.workspaceUris, this.docContext);
	}

	/**
	 * @internal Public for tests only
	 */
	async getSnapshotManager(filePath: string): Promise<SnapshotManager> {
		return (await this.getTypeScriptLanguageService(filePath)).snapshotManager;
	}
}
