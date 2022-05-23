import ts, { NavigationTree } from 'typescript';
import {
    CancellationToken,
    CodeAction,
    CodeActionContext,
    CompletionContext,
    CompletionList,
    DefinitionLink,
    Diagnostic,
    FileChangeType,
    Hover,
    Location,
    LocationLink,
    Position,
    Range,
    ReferenceContext,
    SelectionRange,
    SemanticTokens,
    SignatureHelp,
    SignatureHelpContext,
    SymbolInformation,
    SymbolKind,
    TextDocumentContentChangeEvent,
    WorkspaceEdit
} from 'vscode-languageserver';
import { Document, getTextInRange, mapSymbolInformationToOriginal } from '../../lib/documents';
import { LSConfigManager, LSTypescriptConfig } from '../../ls-config';
import { isNotNullOrUndefined, isZeroLengthRange, pathToUrl } from '../../utils';
import {
    AppCompletionItem,
    AppCompletionList,
    CodeActionsProvider,
    CompletionsProvider,
    DefinitionsProvider,
    DiagnosticsProvider,
    DocumentSymbolsProvider,
    FileRename,
    FindReferencesProvider,
    HoverProvider,
    ImplementationProvider,
    OnWatchFileChanges,
    OnWatchFileChangesPara,
    RenameProvider,
    SelectionRangeProvider,
    SemanticTokensProvider,
    SignatureHelpProvider,
    TypeDefinitionProvider,
    UpdateImportsProvider,
    UpdateTsOrJsFile
} from '../interfaces';
import { CodeActionsProviderImpl } from './features/CodeActionsProvider';
import {
    CompletionEntryWithIdentifer,
    CompletionsProviderImpl
} from './features/CompletionProvider';
import { DiagnosticsProviderImpl } from './features/DiagnosticsProvider';
import { FindReferencesProviderImpl } from './features/FindReferencesProvider';
import { getDirectiveCommentCompletions } from './features/getDirectiveCommentCompletions';
import { HoverProviderImpl } from './features/HoverProvider';
import { ImplementationProviderImpl } from './features/ImplementationProvider';
import { RenameProviderImpl } from './features/RenameProvider';
import { SelectionRangeProviderImpl } from './features/SelectionRangeProvider';
import { SemanticTokensProviderImpl } from './features/SemanticTokensProvider';
import { SignatureHelpProviderImpl } from './features/SignatureHelpProvider';
import { TypeDefinitionProviderImpl } from './features/TypeDefinitionProvider';
import { UpdateImportsProviderImpl } from './features/UpdateImportsProvider';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './features/utils';
import { LSAndTSDocResolver } from './LSAndTSDocResolver';
import { ignoredBuildDirectories } from './SnapshotManager';
import { isAttributeName, isAttributeShorthand, isEventHandler } from './svelte-ast-utils';
import {
    convertToLocationRange,
    getScriptKindFromFileName,
    isInScript,
    symbolKindFromString
} from './utils';

export class TypeScriptPlugin
    implements
        DiagnosticsProvider,
        HoverProvider,
        DocumentSymbolsProvider,
        DefinitionsProvider,
        CodeActionsProvider,
        UpdateImportsProvider,
        RenameProvider,
        FindReferencesProvider,
        SelectionRangeProvider,
        SignatureHelpProvider,
        SemanticTokensProvider,
        ImplementationProvider,
        TypeDefinitionProvider,
        OnWatchFileChanges,
        CompletionsProvider<CompletionEntryWithIdentifer>,
        UpdateTsOrJsFile
{
    __name = 'ts';
    private readonly configManager: LSConfigManager;
    private readonly lsAndTsDocResolver: LSAndTSDocResolver;
    private readonly completionProvider: CompletionsProviderImpl;
    private readonly codeActionsProvider: CodeActionsProviderImpl;
    private readonly updateImportsProvider: UpdateImportsProviderImpl;
    private readonly diagnosticsProvider: DiagnosticsProviderImpl;
    private readonly renameProvider: RenameProviderImpl;
    private readonly hoverProvider: HoverProviderImpl;
    private readonly findReferencesProvider: FindReferencesProviderImpl;
    private readonly selectionRangeProvider: SelectionRangeProviderImpl;
    private readonly signatureHelpProvider: SignatureHelpProviderImpl;
    private readonly semanticTokensProvider: SemanticTokensProviderImpl;
    private readonly implementationProvider: ImplementationProviderImpl;
    private readonly typeDefinitionProvider: TypeDefinitionProviderImpl;

    constructor(configManager: LSConfigManager, lsAndTsDocResolver: LSAndTSDocResolver) {
        this.configManager = configManager;
        this.lsAndTsDocResolver = lsAndTsDocResolver;
        this.completionProvider = new CompletionsProviderImpl(
            this.lsAndTsDocResolver,
            this.configManager
        );
        this.codeActionsProvider = new CodeActionsProviderImpl(
            this.lsAndTsDocResolver,
            this.completionProvider,
            configManager
        );
        this.updateImportsProvider = new UpdateImportsProviderImpl(this.lsAndTsDocResolver);
        this.diagnosticsProvider = new DiagnosticsProviderImpl(
            this.lsAndTsDocResolver,
            configManager
        );
        this.renameProvider = new RenameProviderImpl(this.lsAndTsDocResolver, configManager);
        this.hoverProvider = new HoverProviderImpl(this.lsAndTsDocResolver);
        this.findReferencesProvider = new FindReferencesProviderImpl(this.lsAndTsDocResolver);
        this.selectionRangeProvider = new SelectionRangeProviderImpl(this.lsAndTsDocResolver);
        this.signatureHelpProvider = new SignatureHelpProviderImpl(this.lsAndTsDocResolver);
        this.semanticTokensProvider = new SemanticTokensProviderImpl(this.lsAndTsDocResolver);
        this.implementationProvider = new ImplementationProviderImpl(this.lsAndTsDocResolver);
        this.typeDefinitionProvider = new TypeDefinitionProviderImpl(this.lsAndTsDocResolver);
    }

    async getDiagnostics(
        document: Document,
        cancellationToken?: CancellationToken
    ): Promise<Diagnostic[]> {
        if (!this.featureEnabled('diagnostics')) {
            return [];
        }

        return this.diagnosticsProvider.getDiagnostics(document, cancellationToken);
    }

    async doHover(document: Document, position: Position): Promise<Hover | null> {
        if (!this.featureEnabled('hover')) {
            return null;
        }

        return this.hoverProvider.doHover(document, position);
    }

    async getDocumentSymbols(
        document: Document,
        cancellationToken?: CancellationToken
    ): Promise<SymbolInformation[]> {
        if (!this.featureEnabled('documentSymbols')) {
            return [];
        }

        const { lang, tsDoc } = await this.getLSAndTSDoc(document);
        const fragment = tsDoc.getFragment();

        if (cancellationToken?.isCancellationRequested) {
            return [];
        }

        const navTree = lang.getNavigationTree(tsDoc.filePath);

        const symbols: SymbolInformation[] = [];
        collectSymbols(navTree, undefined, (symbol) => symbols.push(symbol));

        const topContainerName = symbols[0].name;
        const result: SymbolInformation[] = [];

        for (let symbol of symbols.slice(1)) {
            if (symbol.containerName === topContainerName) {
                symbol.containerName = 'script';
            }

            symbol = mapSymbolInformationToOriginal(fragment, symbol);

            if (
                symbol.location.range.start.line < 0 ||
                symbol.location.range.end.line < 0 ||
                isZeroLengthRange(symbol.location.range) ||
                symbol.name.startsWith('__sveltets_')
            ) {
                continue;
            }

            if (
                (symbol.kind === SymbolKind.Property || symbol.kind === SymbolKind.Method) &&
                !isInScript(symbol.location.range.start, document)
            ) {
                if (
                    symbol.name === 'props' &&
                    document.getText().charAt(document.offsetAt(symbol.location.range.start)) !==
                        'p'
                ) {
                    // This is the "props" of a generated component constructor
                    continue;
                }
                const node = tsDoc.svelteNodeAt(symbol.location.range.start);
                if (
                    (node && (isAttributeName(node) || isAttributeShorthand(node))) ||
                    isEventHandler(node)
                ) {
                    // This is a html or component property, they are not treated as a new symbol
                    // in JSX and so we do the same for the new transformation.
                    continue;
                }
            }

            if (symbol.name === '<function>') {
                let name = getTextInRange(symbol.location.range, document.getText()).trimLeft();
                if (name.length > 50) {
                    name = name.substring(0, 50) + '...';
                }
                symbol.name = name;
            }

            if (symbol.name.startsWith('$$_')) {
                if (!symbol.name.includes('$on')) {
                    continue;
                }
                // on:foo={() => ''}   ->   $on("foo") callback
                symbol.name = symbol.name.substring(symbol.name.indexOf('$on'));
            }

            result.push(symbol);
        }

        return result;

        function collectSymbols(
            tree: NavigationTree,
            container: string | undefined,
            cb: (symbol: SymbolInformation) => void
        ) {
            const start = tree.spans[0];
            const end = tree.spans[tree.spans.length - 1];
            if (start && end) {
                cb(
                    SymbolInformation.create(
                        tree.text,
                        symbolKindFromString(tree.kind),
                        Range.create(
                            fragment.positionAt(start.start),
                            fragment.positionAt(end.start + end.length)
                        ),
                        fragment.getURL(),
                        container
                    )
                );
            }
            if (tree.childItems) {
                for (const child of tree.childItems) {
                    collectSymbols(child, tree.text, cb);
                }
            }
        }
    }

    async getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext,
        cancellationToken?: CancellationToken
    ): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
        if (!this.featureEnabled('completions')) {
            return null;
        }

        const tsDirectiveCommentCompletions = getDirectiveCommentCompletions(
            position,
            document,
            completionContext
        );

        const completions = await this.completionProvider.getCompletions(
            document,
            position,
            completionContext,
            cancellationToken
        );

        if (completions && tsDirectiveCommentCompletions) {
            return CompletionList.create(
                completions.items.concat(tsDirectiveCommentCompletions.items),
                completions.isIncomplete
            );
        }

        return completions ?? tsDirectiveCommentCompletions;
    }

    async resolveCompletion(
        document: Document,
        completionItem: AppCompletionItem<CompletionEntryWithIdentifer>,
        cancellationToken?: CancellationToken
    ): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
        return this.completionProvider.resolveCompletion(
            document,
            completionItem,
            cancellationToken
        );
    }

    async getDefinitions(document: Document, position: Position): Promise<DefinitionLink[]> {
        if (!this.featureEnabled('definitions')) {
            return [];
        }

        const { lang, tsDoc } = await this.getLSAndTSDoc(document);
        const mainFragment = tsDoc.getFragment();

        const defs = lang.getDefinitionAndBoundSpan(
            tsDoc.filePath,
            mainFragment.offsetAt(mainFragment.getGeneratedPosition(position))
        );

        if (!defs || !defs.definitions) {
            return [];
        }

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

        const result = await Promise.all(
            defs.definitions.map(async (def) => {
                const { fragment, snapshot } = await docs.retrieve(def.fileName);

                if (
                    !def.fileName.endsWith('svelte-shims.d.ts') &&
                    isNoTextSpanInGeneratedCode(snapshot.getFullText(), def.textSpan)
                ) {
                    return LocationLink.create(
                        pathToUrl(def.fileName),
                        convertToLocationRange(fragment, def.textSpan),
                        convertToLocationRange(fragment, def.textSpan),
                        convertToLocationRange(mainFragment, defs.textSpan)
                    );
                }
            })
        );
        return result.filter(isNotNullOrUndefined);
    }

    async prepareRename(document: Document, position: Position): Promise<Range | null> {
        if (!this.featureEnabled('rename')) {
            return null;
        }

        return this.renameProvider.prepareRename(document, position);
    }

    async rename(
        document: Document,
        position: Position,
        newName: string
    ): Promise<WorkspaceEdit | null> {
        if (!this.featureEnabled('rename')) {
            return null;
        }

        return this.renameProvider.rename(document, position, newName);
    }

    async getCodeActions(
        document: Document,
        range: Range,
        context: CodeActionContext,
        cancellationToken?: CancellationToken
    ): Promise<CodeAction[]> {
        if (!this.featureEnabled('codeActions')) {
            return [];
        }

        return this.codeActionsProvider.getCodeActions(document, range, context, cancellationToken);
    }

    async executeCommand(
        document: Document,
        command: string,
        args?: any[]
    ): Promise<WorkspaceEdit | null> {
        if (!this.featureEnabled('codeActions')) {
            return null;
        }

        return this.codeActionsProvider.executeCommand(document, command, args);
    }

    async updateImports(fileRename: FileRename): Promise<WorkspaceEdit | null> {
        if (
            !(
                this.configManager.enabled('svelte.enable') &&
                this.configManager.enabled('svelte.rename.enable')
            )
        ) {
            return null;
        }

        return this.updateImportsProvider.updateImports(fileRename);
    }

    async findReferences(
        document: Document,
        position: Position,
        context: ReferenceContext
    ): Promise<Location[] | null> {
        if (!this.featureEnabled('findReferences')) {
            return null;
        }

        return this.findReferencesProvider.findReferences(document, position, context);
    }

    async onWatchFileChanges(onWatchFileChangesParas: OnWatchFileChangesPara[]): Promise<void> {
        let doneUpdateProjectFiles = false;

        for (const { fileName, changeType } of onWatchFileChangesParas) {
            const pathParts = fileName.split(/\/|\\/);
            const dirPathParts = pathParts.slice(0, pathParts.length - 1);
            if (ignoredBuildDirectories.some((dir) => dirPathParts.includes(dir))) {
                continue;
            }

            const scriptKind = getScriptKindFromFileName(fileName);
            if (scriptKind === ts.ScriptKind.Unknown) {
                // We don't deal with svelte files here
                continue;
            }

            if (changeType === FileChangeType.Created && !doneUpdateProjectFiles) {
                doneUpdateProjectFiles = true;
                await this.lsAndTsDocResolver.updateProjectFiles();
            } else if (changeType === FileChangeType.Deleted) {
                await this.lsAndTsDocResolver.deleteSnapshot(fileName);
            } else {
                await this.lsAndTsDocResolver.updateExistingTsOrJsFile(fileName);
            }
        }
    }

    async updateTsOrJsFile(
        fileName: string,
        changes: TextDocumentContentChangeEvent[]
    ): Promise<void> {
        await this.lsAndTsDocResolver.updateExistingTsOrJsFile(fileName, changes);
    }

    async getSelectionRange(
        document: Document,
        position: Position
    ): Promise<SelectionRange | null> {
        if (!this.featureEnabled('selectionRange')) {
            return null;
        }

        return this.selectionRangeProvider.getSelectionRange(document, position);
    }

    async getSignatureHelp(
        document: Document,
        position: Position,
        context: SignatureHelpContext | undefined,
        cancellationToken?: CancellationToken
    ): Promise<SignatureHelp | null> {
        if (!this.featureEnabled('signatureHelp')) {
            return null;
        }

        return this.signatureHelpProvider.getSignatureHelp(
            document,
            position,
            context,
            cancellationToken
        );
    }

    async getSemanticTokens(
        textDocument: Document,
        range?: Range,
        cancellationToken?: CancellationToken
    ): Promise<SemanticTokens | null> {
        if (!this.featureEnabled('semanticTokens')) {
            return {
                data: []
            };
        }

        return this.semanticTokensProvider.getSemanticTokens(
            textDocument,
            range,
            cancellationToken
        );
    }

    async getImplementation(document: Document, position: Position): Promise<Location[] | null> {
        if (!this.featureEnabled('implementation')) {
            return null;
        }

        return this.implementationProvider.getImplementation(document, position);
    }

    async getTypeDefinition(document: Document, position: Position): Promise<Location[] | null> {
        if (!this.featureEnabled('typeDefinition')) {
            return null;
        }

        return this.typeDefinitionProvider.getTypeDefinition(document, position);
    }

    private async getLSAndTSDoc(document: Document) {
        return this.lsAndTsDocResolver.getLSAndTSDoc(document);
    }

    /**
     * @internal Public for tests only
     */
    public getSnapshotManager(fileName: string) {
        return this.lsAndTsDocResolver.getSnapshotManager(fileName);
    }

    private featureEnabled(feature: keyof LSTypescriptConfig) {
        return (
            this.configManager.enabled('typescript.enable') &&
            this.configManager.enabled(`typescript.${feature}.enable`)
        );
    }
}
