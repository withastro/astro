import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionItem, AppCompletionList } from '../interfaces';
import { CompletionContext, Position, FileChangeType } from 'vscode-languageserver';
import * as ts from 'typescript';
import { CompletionsProviderImpl, CompletionEntryWithIdentifer } from './features/CompletionsProvider';
import { LanguageServiceManager } from './LanguageServiceManager';
import { SnapshotManager } from './SnapshotManager';
import { getScriptKindFromFileName } from './utils';

export class TypeScriptPlugin implements CompletionsProvider {
  private readonly docManager: DocumentManager;
  private readonly configManager: ConfigManager;
  private readonly languageServiceManager: LanguageServiceManager;

  private readonly completionProvider: CompletionsProviderImpl;

  constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
    this.docManager = docManager;
    this.configManager = configManager;
    this.languageServiceManager = new LanguageServiceManager(docManager, configManager, workspaceUris);

    this.completionProvider = new CompletionsProviderImpl(this.languageServiceManager);
  }

  async getCompletions(document: Document, position: Position, completionContext?: CompletionContext): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
    const completions = await this.completionProvider.getCompletions(document, position, completionContext);

    return completions;
  }

  async resolveCompletion(document: Document, completionItem: AppCompletionItem<CompletionEntryWithIdentifer>): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
    return this.completionProvider.resolveCompletion(document, completionItem);
  }

  async onWatchFileChanges(onWatchFileChangesParams: any[]): Promise<void> {
    const doneUpdateProjectFiles = new Set<SnapshotManager>();

    for (const { fileName, changeType } of onWatchFileChangesParams) {
      const scriptKind = getScriptKindFromFileName(fileName);

      if (scriptKind === ts.ScriptKind.Unknown) {
        // We don't deal with svelte files here
        continue;
      }

      const snapshotManager = await this.getSnapshotManager(fileName);
      if (changeType === FileChangeType.Created) {
        if (!doneUpdateProjectFiles.has(snapshotManager)) {
          snapshotManager.updateProjectFiles();
          doneUpdateProjectFiles.add(snapshotManager);
        }
      } else if (changeType === FileChangeType.Deleted) {
        snapshotManager.delete(fileName);
        return;
      }

      snapshotManager.updateProjectFile(fileName);
    }
  }

  /**
   *
   * @internal
   */
  public async getSnapshotManager(fileName: string) {
    return this.languageServiceManager.getSnapshotManager(fileName);
  }
}
