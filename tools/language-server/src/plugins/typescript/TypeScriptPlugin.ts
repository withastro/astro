import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionItem, AppCompletionList } from '../interfaces';
import type { CancellationToken, Hover, SignatureHelp, SignatureHelpContext } from 'vscode-languageserver';
import { join as pathJoin, dirname as pathDirname } from 'path';
import { Document, DocumentManager, isInsideFrontmatter } from '../../core/documents';
import { SourceFile, ImportDeclaration, Node, SyntaxKind } from 'typescript';
import { CompletionContext, DefinitionLink, FileChangeType, Position, LocationLink } from 'vscode-languageserver';
import * as ts from 'typescript';
import { LanguageServiceManager } from './LanguageServiceManager';
import { SnapshotManager } from './SnapshotManager';
import { convertToLocationRange, isVirtualAstroFilePath, isVirtualFilePath, getScriptKindFromFileName } from './utils';
import { isNotNullOrUndefined, pathToUrl } from '../../utils';
import { CompletionsProviderImpl, CompletionEntryWithIdentifer } from './features/CompletionsProvider';
import { HoverProviderImpl } from './features/HoverProvider';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './features/utils';
import { SignatureHelpProviderImpl } from './features/SignatureHelpProvider';

type BetterTS = typeof ts & {
  getTouchingPropertyName(sourceFile: SourceFile, pos: number): Node;
};

export class TypeScriptPlugin implements CompletionsProvider {
  private readonly docManager: DocumentManager;
  private readonly configManager: ConfigManager;
  private readonly languageServiceManager: LanguageServiceManager;
  public pluginName = 'TypeScript';

  private readonly completionProvider: CompletionsProviderImpl;
  private readonly hoverProvider: HoverProviderImpl;
  private readonly signatureHelpProvider: SignatureHelpProviderImpl;

  constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
    this.docManager = docManager;
    this.configManager = configManager;
    this.languageServiceManager = new LanguageServiceManager(docManager, configManager, workspaceUris);

    this.completionProvider = new CompletionsProviderImpl(this.languageServiceManager);
    this.hoverProvider = new HoverProviderImpl(this.languageServiceManager);
    this.signatureHelpProvider = new SignatureHelpProviderImpl(this.languageServiceManager);
  }

  async doHover(document: Document, position: Position): Promise<Hover | null> {
    return this.hoverProvider.doHover(document, position);
  }

  async getCompletions(document: Document, position: Position, completionContext?: CompletionContext): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
    const completions = await this.completionProvider.getCompletions(document, position, completionContext);

    return completions;
  }

  async resolveCompletion(document: Document, completionItem: AppCompletionItem<CompletionEntryWithIdentifer>): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
    return this.completionProvider.resolveCompletion(document, completionItem);
  }

  async getDefinitions(document: Document, position: Position): Promise<DefinitionLink[]> {
    if (!this.isInsideFrontmatter(document, position)) {
      return [];
    }

    const { lang, tsDoc } = await this.languageServiceManager.getTypeScriptDoc(document);
    const mainFragment = await tsDoc.getFragment();

    const filePath = tsDoc.filePath;
    const tsFilePath = filePath.endsWith('.ts') ? filePath : filePath + '.ts';

    const fragmentPosition = mainFragment.getGeneratedPosition(position);
    const fragmentOffset = mainFragment.offsetAt(fragmentPosition);

    let defs = lang.getDefinitionAndBoundSpan(tsFilePath, fragmentOffset);

    if (!defs || !defs.definitions) {
      return [];
    }

    // Resolve all imports if we can
    if (this.goToDefinitionFoundOnlyAlias(tsFilePath, defs.definitions!)) {
      let importDef = this.getGoToDefinitionRefsForImportSpecifier(tsFilePath, fragmentOffset, lang);
      if (importDef) {
        defs = importDef;
      }
    }

    const docs = new SnapshotFragmentMap(this.languageServiceManager);
    docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

    const result = await Promise.all(
      defs.definitions!.map(async (def) => {
        const { fragment, snapshot } = await docs.retrieve(def.fileName);

        if (isNoTextSpanInGeneratedCode(snapshot.getFullText(), def.textSpan)) {
          const fileName = isVirtualFilePath(def.fileName) ? def.fileName.substr(0, def.fileName.length - 3) : def.fileName;
          const textSpan = isVirtualAstroFilePath(tsFilePath) ? { start: 0, length: 0 } : def.textSpan;
          return LocationLink.create(
            pathToUrl(fileName),
            convertToLocationRange(fragment, textSpan),
            convertToLocationRange(fragment, textSpan),
            convertToLocationRange(mainFragment, defs!.textSpan)
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

  async getSignatureHelp(document: Document, position: Position, context: SignatureHelpContext | undefined, cancellationToken?: CancellationToken): Promise<SignatureHelp | null> {
    return this.signatureHelpProvider.getSignatureHelp(document, position, context, cancellationToken);
  }

  /**
   *
   * @internal
   */
  public async getSnapshotManager(fileName: string) {
    return this.languageServiceManager.getSnapshotManager(fileName);
  }

  private isInsideFrontmatter(document: Document, position: Position) {
    return isInsideFrontmatter(document.getText(), document.offsetAt(position));
  }

  private goToDefinitionFoundOnlyAlias(tsFileName: string, defs: readonly ts.DefinitionInfo[]) {
    return !!(defs.length === 1 && defs[0].kind === 'alias' && defs[0].fileName === tsFileName);
  }

  private getGoToDefinitionRefsForImportSpecifier(tsFilePath: string, offset: number, lang: ts.LanguageService): ts.DefinitionInfoAndBoundSpan | undefined {
    const program = lang.getProgram();
    const sourceFile = program?.getSourceFile(tsFilePath);
    if (sourceFile) {
      let node = (ts as BetterTS).getTouchingPropertyName(sourceFile, offset);
      if (node && node.kind === SyntaxKind.Identifier) {
        if (node.parent.kind === SyntaxKind.ImportClause) {
          let decl = node.parent.parent as ImportDeclaration;
          let spec = ts.isStringLiteral(decl.moduleSpecifier) && decl.moduleSpecifier.text;
          if (spec) {
            let fileName = pathJoin(pathDirname(tsFilePath), spec);
            let start = node.pos + 1;
            let def: ts.DefinitionInfoAndBoundSpan = {
              definitions: [
                {
                  kind: 'alias',
                  fileName,
                  name: '',
                  containerKind: '',
                  containerName: '',
                  textSpan: {
                    start: 0,
                    length: 0,
                  },
                } as ts.DefinitionInfo,
              ],
              textSpan: {
                start,
                length: node.end - start,
              },
            };
            return def;
          }
        }
      }
    }
  }
}
