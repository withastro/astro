import ts, { ImportDeclaration, SourceFile, SyntaxKind, Node } from 'typescript';
import {
	CancellationToken,
	CodeAction,
	CodeActionContext,
	CompletionContext,
	DefinitionLink,
	Diagnostic,
	FileChangeType,
	FoldingRange,
	Hover,
	LocationLink,
	Position,
	Range,
	SemanticTokens,
	SignatureHelp,
	SignatureHelpContext,
	SymbolInformation,
	TextDocumentContentChangeEvent,
	WorkspaceEdit,
} from 'vscode-languageserver';
import { join as pathJoin, dirname as pathDirname } from 'path';
import { ConfigManager, LSTypescriptConfig } from '../../core/config';
import { AstroDocument, DocumentManager } from '../../core/documents';
import { isNotNullOrUndefined, pathToUrl } from '../../utils';
import { AppCompletionItem, AppCompletionList, OnWatchFileChangesParam, Plugin } from '../interfaces';
import { CompletionItemData, CompletionsProviderImpl } from './features/CompletionsProvider';
import { DiagnosticsProviderImpl } from './features/DiagnosticsProvider';
import { HoverProviderImpl } from './features/HoverProvider';
import { SignatureHelpProviderImpl } from './features/SignatureHelpProvider';
import { SnapshotFragmentMap } from './features/utils';
import { LanguageServiceManager } from './LanguageServiceManager';
import {
	convertToLocationRange,
	ensureRealFilePath,
	getScriptKindFromFileName,
	isVirtualFilePath,
	toVirtualAstroFilePath,
} from './utils';
import { DocumentSymbolsProviderImpl } from './features/DocumentSymbolsProvider';
import { SemanticTokensProviderImpl } from './features/SemanticTokenProvider';
import { FoldingRangesProviderImpl } from './features/FoldingRangesProvider';
import { CodeActionsProviderImpl } from './features/CodeActionsProvider';

type BetterTS = typeof ts & {
	getTouchingPropertyName(sourceFile: SourceFile, pos: number): Node;
};

export class TypeScriptPlugin implements Plugin {
	__name = 'typescript';

	private configManager: ConfigManager;
	private readonly languageServiceManager: LanguageServiceManager;

	private readonly codeActionsProvider: CodeActionsProviderImpl;
	private readonly completionProvider: CompletionsProviderImpl;
	private readonly hoverProvider: HoverProviderImpl;
	private readonly signatureHelpProvider: SignatureHelpProviderImpl;
	private readonly diagnosticsProvider: DiagnosticsProviderImpl;
	private readonly documentSymbolsProvider: DocumentSymbolsProviderImpl;
	private readonly semanticTokensProvider: SemanticTokensProviderImpl;
	private readonly foldingRangesProvider: FoldingRangesProviderImpl;

	constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
		this.configManager = configManager;
		this.languageServiceManager = new LanguageServiceManager(docManager, workspaceUris, configManager);

		this.codeActionsProvider = new CodeActionsProviderImpl(this.languageServiceManager);
		this.completionProvider = new CompletionsProviderImpl(this.languageServiceManager);
		this.hoverProvider = new HoverProviderImpl(this.languageServiceManager);
		this.signatureHelpProvider = new SignatureHelpProviderImpl(this.languageServiceManager);
		this.diagnosticsProvider = new DiagnosticsProviderImpl(this.languageServiceManager);
		this.documentSymbolsProvider = new DocumentSymbolsProviderImpl(this.languageServiceManager);
		this.semanticTokensProvider = new SemanticTokensProviderImpl(this.languageServiceManager);
		this.foldingRangesProvider = new FoldingRangesProviderImpl(this.languageServiceManager);
	}

	async doHover(document: AstroDocument, position: Position): Promise<Hover | null> {
		if (!this.featureEnabled('hover')) {
			return null;
		}

		return this.hoverProvider.doHover(document, position);
	}

	async rename(document: AstroDocument, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const fragment = await tsDoc.createFragment();

		const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));

		let renames = lang.findRenameLocations(toVirtualAstroFilePath(tsDoc.filePath), offset, false, false, true);
		if (!renames) {
			return null;
		}

		let edit = {
			changes: {},
		} as WorkspaceEdit;

		renames.forEach((rename) => {
			const filePath = ensureRealFilePath(rename.fileName);
			if (!(filePath in edit.changes!)) {
				edit.changes![filePath] = [];
			}

			edit.changes![filePath].push({
				newText: newName,
				range: convertToLocationRange(fragment, rename.textSpan),
			});
		});

		return edit;
	}

	async getFoldingRanges(document: AstroDocument): Promise<FoldingRange[] | null> {
		return this.foldingRangesProvider.getFoldingRanges(document);
	}

	async getSemanticTokens(
		textDocument: AstroDocument,
		range?: Range,
		cancellationToken?: CancellationToken
	): Promise<SemanticTokens | null> {
		if (!this.featureEnabled('semanticTokens')) {
			return null;
		}

		return this.semanticTokensProvider.getSemanticTokens(textDocument, range, cancellationToken);
	}

	async getDocumentSymbols(document: AstroDocument): Promise<SymbolInformation[]> {
		if (!this.featureEnabled('documentSymbols')) {
			return [];
		}

		const symbols = await this.documentSymbolsProvider.getDocumentSymbols(document);

		return symbols;
	}

	async getCodeActions(
		document: AstroDocument,
		range: Range,
		context: CodeActionContext,
		cancellationToken?: CancellationToken
	): Promise<CodeAction[]> {
		if (!this.featureEnabled('codeActions')) {
			return [];
		}

		return this.codeActionsProvider.getCodeActions(document, range, context, cancellationToken);
	}

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext,
		cancellationToken?: CancellationToken
	): Promise<AppCompletionList<CompletionItemData> | null> {
		if (!this.featureEnabled('completions')) {
			return null;
		}

		const completions = await this.completionProvider.getCompletions(
			document,
			position,
			completionContext,
			cancellationToken
		);

		return completions;
	}

	async resolveCompletion(
		document: AstroDocument,
		completionItem: AppCompletionItem<CompletionItemData>,
		cancellationToken?: CancellationToken
	): Promise<AppCompletionItem<CompletionItemData>> {
		return this.completionProvider.resolveCompletion(document, completionItem, cancellationToken);
	}

	async getDefinitions(document: AstroDocument, position: Position): Promise<DefinitionLink[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const mainFragment = await tsDoc.createFragment();

		const filePath = tsDoc.filePath;
		const tsFilePath = toVirtualAstroFilePath(filePath);

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

				const fileName = ensureRealFilePath(def.fileName);

				// Since we converted our files to TSX and we don't have sourcemaps, we don't know where the function is, unfortunate
				const textSpan = isVirtualFilePath(tsFilePath) ? { start: 0, length: 0 } : def.textSpan;

				return LocationLink.create(
					pathToUrl(fileName),
					convertToLocationRange(fragment, textSpan),
					convertToLocationRange(fragment, textSpan),
					convertToLocationRange(mainFragment, defs!.textSpan)
				);
			})
		);
		return result.filter(isNotNullOrUndefined);
	}

	async getDiagnostics(document: AstroDocument, cancellationToken?: CancellationToken): Promise<Diagnostic[]> {
		if (!this.featureEnabled('diagnostics')) {
			return [];
		}

		return this.diagnosticsProvider.getDiagnostics(document, cancellationToken);
	}

	async onWatchFileChanges(onWatchFileChangesParas: OnWatchFileChangesParam[]): Promise<void> {
		let doneUpdateProjectFiles = false;

		for (const { fileName, changeType } of onWatchFileChangesParas) {
			const scriptKind = getScriptKindFromFileName(fileName);

			if (scriptKind === ts.ScriptKind.Unknown) {
				continue;
			}

			if (changeType === FileChangeType.Created && !doneUpdateProjectFiles) {
				doneUpdateProjectFiles = true;
				await this.languageServiceManager.updateProjectFiles();
			} else if (changeType === FileChangeType.Deleted) {
				await this.languageServiceManager.deleteSnapshot(fileName);
			} else {
				await this.languageServiceManager.updateExistingNonAstroFile(fileName);
			}
		}
	}

	async updateNonAstroFile(fileName: string, changes: TextDocumentContentChangeEvent[]): Promise<void> {
		await this.languageServiceManager.updateExistingNonAstroFile(fileName, changes);
	}

	async getSignatureHelp(
		document: AstroDocument,
		position: Position,
		context: SignatureHelpContext | undefined,
		cancellationToken?: CancellationToken
	): Promise<SignatureHelp | null> {
		return this.signatureHelpProvider.getSignatureHelp(document, position, context, cancellationToken);
	}

	private goToDefinitionFoundOnlyAlias(tsFileName: string, defs: readonly ts.DefinitionInfo[]) {
		return !!(defs.length === 1 && defs[0].kind === 'alias' && defs[0].fileName === tsFileName);
	}

	private getGoToDefinitionRefsForImportSpecifier(
		tsFilePath: string,
		offset: number,
		lang: ts.LanguageService
	): ts.DefinitionInfoAndBoundSpan | undefined {
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

	private featureEnabled(feature: keyof LSTypescriptConfig) {
		return (
			this.configManager.enabled('typescript.enabled') && this.configManager.enabled(`typescript.${feature}.enabled`)
		);
	}
}
