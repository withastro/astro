import * as ts from 'typescript';
import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import { urlToPath, pathToUrl, debounceSameArg } from '../../utils';
import { getLanguageService, getLanguageServiceForDocument, LanguageServiceContainer, LanguageServiceDocumentContext } from './languageService';
import { DocumentSnapshot, SnapshotManager } from './SnapshotManager';

export class LanguageServiceManager {
  private readonly docManager: DocumentManager;
  private readonly configManager: ConfigManager;
  private readonly workspaceUris: string[];
  private docContext: LanguageServiceDocumentContext;

  constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
    this.docManager = docManager;
    this.configManager = configManager;
    this.workspaceUris = workspaceUris;
    this.docContext = {
      getWorkspaceRoot: (fileName: string) => this.getWorkspaceRoot(fileName),
      createDocument: this.createDocument,
    };

    const handleDocumentChange = (document: Document) => {
      // This refreshes the document in the ts language service
      this.getTypeScriptDoc(document);
    };

    docManager.on(
      'documentChange',
      debounceSameArg(handleDocumentChange, (newDoc, prevDoc) => newDoc.uri === prevDoc?.uri, 1000)
    );
    docManager.on('documentOpen', handleDocumentChange);
  }

  private getWorkspaceRoot(fileName: string) {
    if (this.workspaceUris.length === 1) return urlToPath(this.workspaceUris[0]) as string;
    return this.workspaceUris.reduce((found, curr) => {
      const url = urlToPath(curr) as string;
      if (fileName.startsWith(url) && curr.length < url.length) return url;
      return found;
    }, '');
  }

  private createDocument = (fileName: string, content: string) => {
    const uri = pathToUrl(fileName);
    const document = this.docManager.openDocument({
      languageId: 'astro',
      version: 0,
      text: content,
      uri,
    });
    return document;
  };

  async getSnapshot(document: Document): Promise<DocumentSnapshot>;
  async getSnapshot(pathOrDoc: string | Document): Promise<DocumentSnapshot>;
  async getSnapshot(pathOrDoc: string | Document) {
    const filePath = typeof pathOrDoc === 'string' ? pathOrDoc : pathOrDoc.getFilePath() || '';
    const tsService = await this.getTypeScriptLanguageService(filePath);
    return tsService.updateDocument(pathOrDoc);
  }

  async getTypeScriptDoc(
    document: Document
  ): Promise<{
    tsDoc: DocumentSnapshot;
    lang: ts.LanguageService;
  }> {
    const lang = await getLanguageServiceForDocument(document, this.workspaceUris, this.docContext);
    const tsDoc = await this.getSnapshot(document);

    return { tsDoc, lang };
  }

  async getSnapshotManager(filePath: string): Promise<SnapshotManager> {
    return (await this.getTypeScriptLanguageService(filePath)).snapshotManager;
  }

  private getTypeScriptLanguageService(filePath: string): Promise<LanguageServiceContainer> {
    return getLanguageService(filePath, this.workspaceUris, this.docContext);
  }
}
