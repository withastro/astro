import {
	CodeAction,
	CodeActionContext,
	Color,
	Location,
	ColorInformation,
	ColorPresentation,
	CompletionContext,
	CompletionItem,
	CompletionList,
	DefinitionLink,
	Diagnostic,
	FileChangeType,
	FoldingRange,
	FormattingOptions,
	Hover,
	InlayHint,
	LinkedEditingRanges,
	Position,
	Range,
	ReferenceContext,
	SelectionRange,
	SemanticTokens,
	SignatureHelp,
	SignatureHelpContext,
	SymbolInformation,
	TextDocumentContentChangeEvent,
	TextDocumentIdentifier,
	TextEdit,
	WorkspaceEdit,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export type Resolvable<T> = T | Promise<T>;

export interface AppCompletionItem<T extends TextDocumentIdentifier = any> extends CompletionItem {
	data?: T;
}

export interface AppCompletionList<T extends TextDocumentIdentifier = any> extends CompletionList {
	items: Array<AppCompletionItem<T>>;
}

export interface DiagnosticsProvider {
	getDiagnostics(document: TextDocument): Resolvable<Diagnostic[]>;
}

export interface HoverProvider {
	doHover(document: TextDocument, position: Position): Resolvable<Hover | null>;
}

export interface FoldingRangesProvider {
	getFoldingRanges(document: TextDocument): Resolvable<FoldingRange[] | null>;
}

export interface CompletionsProvider<T extends TextDocumentIdentifier = any> {
	getCompletions(
		document: TextDocument,
		position: Position,
		completionContext?: CompletionContext
	): Resolvable<AppCompletionList<T> | null>;

	resolveCompletion?(document: TextDocument, completionItem: AppCompletionItem<T>): Resolvable<AppCompletionItem<T>>;
}

export interface FormattingProvider {
	formatDocument(document: TextDocument, options: FormattingOptions): Resolvable<TextEdit[]>;
}

export interface TagCompleteProvider {
	doTagComplete(document: TextDocument, position: Position): Resolvable<string | null>;
}

export interface DocumentColorsProvider {
	getDocumentColors(document: TextDocument): Resolvable<ColorInformation[]>;
}

export interface ColorPresentationsProvider {
	getColorPresentations(document: TextDocument, range: Range, color: Color): Resolvable<ColorPresentation[]>;
}

export interface DocumentSymbolsProvider {
	getDocumentSymbols(document: TextDocument): Resolvable<SymbolInformation[]>;
}

export interface DefinitionsProvider {
	getDefinitions(document: TextDocument, position: Position): Resolvable<DefinitionLink[]>;
}

export interface BackwardsCompatibleDefinitionsProvider {
	getDefinitions(document: TextDocument, position: Position): Resolvable<DefinitionLink[] | Location[]>;
}

export interface CodeActionsProvider {
	getCodeActions(document: TextDocument, range: Range, context: CodeActionContext): Resolvable<CodeAction[]>;
	executeCommand?(document: TextDocument, command: string, args?: any[]): Resolvable<WorkspaceEdit | string | null>;
}

export interface FileRename {
	oldUri: string;
	newUri: string;
}

export interface UpdateImportsProvider {
	updateImports(fileRename: FileRename): Resolvable<WorkspaceEdit | null>;
}

export interface InlayHintsProvider {
	getInlayHints(document: TextDocument, range: Range): Resolvable<InlayHint[]>;
}

export interface RenameProvider {
	rename(document: TextDocument, position: Position, newName: string): Resolvable<WorkspaceEdit | null>;
	prepareRename(document: TextDocument, position: Position): Resolvable<Range | null>;
}

export interface FindReferencesProvider {
	findReferences(document: TextDocument, position: Position, context: ReferenceContext): Promise<Location[] | null>;
}

export interface SignatureHelpProvider {
	getSignatureHelp(
		document: TextDocument,
		position: Position,
		context: SignatureHelpContext | undefined
	): Resolvable<SignatureHelp | null>;
}

export interface SelectionRangeProvider {
	getSelectionRange(document: TextDocument, position: Position): Resolvable<SelectionRange | null>;
}

export interface SemanticTokensProvider {
	getSemanticTokens(textDocument: TextDocument, range?: Range): Resolvable<SemanticTokens | null>;
}

export interface LinkedEditingRangesProvider {
	getLinkedEditingRanges(document: TextDocument, position: Position): Resolvable<LinkedEditingRanges | null>;
}

export interface TypeDefinitionProvider {
	getTypeDefinitions(document: TextDocument, position: Position): Resolvable<Location[] | null>;
}

export interface OnWatchFileChangesParam {
	fileName: string;
	changeType: FileChangeType;
}

export interface OnWatchFileChangesProvider {
	onWatchFileChanges(onWatchFileChangesParams: OnWatchFileChangesParam[]): void;
}

export interface UpdateNonAstroFile {
	updateNonAstroFile(fileName: string, changes: TextDocumentContentChangeEvent[]): void;
}

type ProviderBase = DiagnosticsProvider &
	HoverProvider &
	CompletionsProvider &
	DefinitionsProvider &
	TypeDefinitionProvider &
	FormattingProvider &
	FoldingRangesProvider &
	TagCompleteProvider &
	DocumentColorsProvider &
	ColorPresentationsProvider &
	DocumentSymbolsProvider &
	UpdateImportsProvider &
	CodeActionsProvider &
	FindReferencesProvider &
	RenameProvider &
	SignatureHelpProvider &
	SemanticTokensProvider &
	SelectionRangeProvider &
	OnWatchFileChangesProvider &
	LinkedEditingRangesProvider &
	InlayHintsProvider &
	UpdateNonAstroFile;

export type LSProvider = ProviderBase;

export type Plugin = Partial<ProviderBase> & { __name: string };
