import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionItem, AppCompletionList } from '../interfaces';
import { CompletionContext, DefinitionLink, FileChangeType, Position, LocationLink } from 'vscode-languageserver';
import * as ts from 'typescript';
import { CompletionsProviderImpl, CompletionEntryWithIdentifer } from './features/CompletionsProvider';
import { LanguageServiceManager } from './LanguageServiceManager';
import { SnapshotManager } from './SnapshotManager';
import { convertToLocationRange, isVirtualFilePath, getScriptKindFromFileName } from './utils';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './features/utils';
import { isNotNullOrUndefined, pathToUrl } from '../../utils';

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

  async getDefinitions(document: Document, position: Position): Promise<DefinitionLink[]> {
    const { lang, tsDoc } = await this.languageServiceManager.getTypeScriptDoc(document);
    const mainFragment = await tsDoc.getFragment();

    const filePath = tsDoc.filePath;
    const tsFilePath = filePath.endsWith('.ts') ? filePath : filePath + '.ts';

    const defs = lang.getDefinitionAndBoundSpan(tsFilePath, mainFragment.offsetAt(mainFragment.getGeneratedPosition(position)));

    if (!defs || !defs.definitions) {
      return [];
    }

    const docs = new SnapshotFragmentMap(this.languageServiceManager);
    docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

    const result = await Promise.all(
      defs.definitions.map(async (def) => {
        const { fragment, snapshot } = await docs.retrieve(def.fileName);

        if (isNoTextSpanInGeneratedCode(snapshot.getFullText(), def.textSpan)) {
          const fileName = isVirtualFilePath(def.fileName) ? def.fileName.substr(0, def.fileName.length - 3) : def.fileName;
          return LocationLink.create(
            pathToUrl(fileName),
            convertToLocationRange(fragment, def.textSpan),
            convertToLocationRange(fragment, def.textSpan),
            convertToLocationRange(mainFragment, defs.textSpan)
          );
        }
      })
    );
    return result.filter(isNotNullOrUndefined);
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
