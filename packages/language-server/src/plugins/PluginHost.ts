import {
	CancellationToken,
	CodeAction,
	CodeActionContext,
	Color,
	ColorInformation,
	ColorPresentation,
	CompletionContext,
	CompletionItem,
	CompletionList,
	DefinitionLink,
	Diagnostic,
	FoldingRange,
	FormattingOptions,
	Hover,
	InlayHint,
	LinkedEditingRanges,
	Location,
	Position,
	Range,
	SemanticTokens,
	SignatureHelp,
	SignatureHelpContext,
	SymbolInformation,
	TextDocumentContentChangeEvent,
	TextDocumentIdentifier,
	TextEdit,
	WorkspaceEdit,
} from 'vscode-languageserver';
import { isInComponentStartTag } from '../core/documents';
import type { DocumentManager } from '../core/documents/DocumentManager';
import { isNotNullOrUndefined, regexLastIndexOf } from '../utils';
import type { AppCompletionItem, LSProvider, Plugin } from './interfaces';

enum ExecuteMode {
	None,
	FirstNonNull,
	Collect,
}

export interface PluginHostConfig {
	filterIncompleteCompletions: boolean;
	definitionLinkSupport: boolean;
}

export class PluginHost {
	private plugins: Plugin[] = [];
	private pluginHostConfig: PluginHostConfig = {
		filterIncompleteCompletions: true,
		definitionLinkSupport: false,
	};

	constructor(private docManager: DocumentManager) {}

	initialize(pluginHostConfig: PluginHostConfig) {
		this.pluginHostConfig = pluginHostConfig;
	}

	registerPlugin(plugin: Plugin) {
		this.plugins.push(plugin);
	}

	async getCompletions(
		textDocument: TextDocumentIdentifier,
		position: Position,
		completionContext?: CompletionContext,
		cancellationToken?: CancellationToken
	): Promise<CompletionList> {
		const document = this.getDocument(textDocument.uri);

		const completions = await Promise.all(
			this.plugins.map(async (plugin) => {
				const result = await this.tryExecutePlugin(
					plugin,
					'getCompletions',
					[document, position, completionContext, cancellationToken],
					null
				);
				if (result) {
					return { result: result as CompletionList, plugin: plugin.__name };
				}
			})
		).then((fullCompletions) => fullCompletions.filter(isNotNullOrUndefined));

		const html = completions.find((completion) => completion.plugin === 'html');
		const ts = completions.find((completion) => completion.plugin === 'typescript');
		const astro = completions.find((completion) => completion.plugin === 'astro');

		if (html && ts) {
			const inComponentStartTag = isInComponentStartTag(document.html, document.offsetAt(position));

			// If the HTML plugin returned completions, it's highly likely that TS ones are duplicate
			if (html.result.items.length > 0) {
				ts.result.items = [];
			}

			// Inside components, if the Astro plugin has completions we don't want the TS ones are they're duplicates
			if (astro && astro.result.items.length > 0 && inComponentStartTag) {
				ts.result.items = [];
			}
		}

		let flattenedCompletions = completions.flatMap((completion) => completion.result.items);
		const isIncomplete = completions.reduce(
			(incomplete, completion) => incomplete || completion.result.isIncomplete,
			false as boolean
		);

		// If the result is incomplete, we need to filter the results ourselves
		// to throw out non-matching results. VSCode does filter client-side,
		// but other IDEs might not.
		if (isIncomplete && this.pluginHostConfig.filterIncompleteCompletions) {
			const offset = document.offsetAt(position);
			// Assumption for performance reasons:
			// Noone types import names longer than 20 characters and still expects perfect autocompletion.
			const text = document.getText().substring(Math.max(0, offset - 20), offset);
			const start = regexLastIndexOf(text, /[\W\s]/g) + 1;
			const filterValue = text.substring(start).toLowerCase();
			flattenedCompletions = flattenedCompletions.filter((comp) => comp.label.toLowerCase().includes(filterValue));
		}

		return CompletionList.create(flattenedCompletions, isIncomplete);
	}

	async resolveCompletion(
		textDocument: TextDocumentIdentifier,
		completionItem: AppCompletionItem
	): Promise<CompletionItem> {
		const document = this.getDocument(textDocument.uri);

		const result = await this.execute<CompletionItem>(
			'resolveCompletion',
			[document, completionItem],
			ExecuteMode.FirstNonNull
		);

		return result ?? completionItem;
	}

	async getDiagnostics(textDocument: TextDocumentIdentifier): Promise<Diagnostic[]> {
		const document = this.getDocument(textDocument.uri);

		const diagnostics = await this.execute<Diagnostic>('getDiagnostics', [document], ExecuteMode.Collect);
		return diagnostics;
	}

	async doHover(textDocument: TextDocumentIdentifier, position: Position): Promise<Hover | null> {
		const document = this.getDocument(textDocument.uri);

		return this.execute<Hover>('doHover', [document, position], ExecuteMode.FirstNonNull);
	}

	async formatDocument(textDocument: TextDocumentIdentifier, options: FormattingOptions): Promise<TextEdit[]> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<TextEdit>('formatDocument', [document, options], ExecuteMode.Collect);
	}

	async getCodeActions(
		textDocument: TextDocumentIdentifier,
		range: Range,
		context: CodeActionContext,
		cancellationToken?: CancellationToken
	): Promise<CodeAction[]> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<CodeAction>(
			'getCodeActions',
			[document, range, context, cancellationToken],
			ExecuteMode.Collect
		);
	}

	async doTagComplete(textDocument: TextDocumentIdentifier, position: Position): Promise<string | null> {
		const document = this.getDocument(textDocument.uri);

		return this.execute<string | null>('doTagComplete', [document, position], ExecuteMode.FirstNonNull);
	}

	async getFoldingRanges(textDocument: TextDocumentIdentifier): Promise<FoldingRange[] | null> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<FoldingRange>('getFoldingRanges', [document], ExecuteMode.Collect);
	}

	async getDocumentSymbols(
		textDocument: TextDocumentIdentifier,
		cancellationToken?: CancellationToken
	): Promise<SymbolInformation[]> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<SymbolInformation>(
			'getDocumentSymbols',
			[document, cancellationToken],
			ExecuteMode.Collect
		);
	}

	async getSemanticTokens(textDocument: TextDocumentIdentifier, range?: Range, cancellationToken?: CancellationToken) {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<SemanticTokens>(
			'getSemanticTokens',
			[document, range, cancellationToken],
			ExecuteMode.FirstNonNull
		);
	}

	async getLinkedEditingRanges(
		textDocument: TextDocumentIdentifier,
		position: Position
	): Promise<LinkedEditingRanges | null> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<LinkedEditingRanges>(
			'getLinkedEditingRanges',
			[document, position],
			ExecuteMode.FirstNonNull
		);
	}

	async getDefinitions(
		textDocument: TextDocumentIdentifier,
		position: Position
	): Promise<DefinitionLink[] | Location[]> {
		const document = this.getDocument(textDocument.uri);

		const definitions = await this.execute<DefinitionLink>('getDefinitions', [document, position], ExecuteMode.Collect);

		if (this.pluginHostConfig.definitionLinkSupport) {
			return definitions;
		} else {
			return definitions.map((def) => <Location>{ range: def.targetSelectionRange, uri: def.targetUri });
		}
	}

	getTypeDefinition(textDocument: TextDocumentIdentifier, position: Position): Promise<Location[] | null> {
		const document = this.getDocument(textDocument.uri);

		return this.execute<Location[] | null>('getTypeDefinitions', [document, position], ExecuteMode.FirstNonNull);
	}

	async rename(
		textDocument: TextDocumentIdentifier,
		position: Position,
		newName: string
	): Promise<WorkspaceEdit | null> {
		const document = this.getDocument(textDocument.uri);

		return this.execute<any>('rename', [document, position, newName], ExecuteMode.FirstNonNull);
	}

	async getDocumentColors(textDocument: TextDocumentIdentifier): Promise<ColorInformation[]> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<ColorInformation>('getDocumentColors', [document], ExecuteMode.Collect);
	}

	async getColorPresentations(
		textDocument: TextDocumentIdentifier,
		range: Range,
		color: Color
	): Promise<ColorPresentation[]> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<ColorPresentation>(
			'getColorPresentations',
			[document, range, color],
			ExecuteMode.Collect
		);
	}

	async getInlayHints(
		textDocument: TextDocumentIdentifier,
		range: Range,
		cancellationToken?: CancellationToken
	): Promise<InlayHint[]> {
		const document = this.getDocument(textDocument.uri);

		return (await this.execute<InlayHint[]>('getInlayHints', [document, range], ExecuteMode.FirstNonNull)) ?? [];
	}

	async getSignatureHelp(
		textDocument: TextDocumentIdentifier,
		position: Position,
		context: SignatureHelpContext | undefined,
		cancellationToken?: CancellationToken
	): Promise<SignatureHelp | null> {
		const document = this.getDocument(textDocument.uri);

		return await this.execute<SignatureHelp>(
			'getSignatureHelp',
			[document, position, context, cancellationToken],
			ExecuteMode.FirstNonNull
		);
	}

	onWatchFileChanges(onWatchFileChangesParams: any[]): void {
		for (const support of this.plugins) {
			support.onWatchFileChanges?.(onWatchFileChangesParams);
		}
	}

	updateNonAstroFile(fileName: string, changes: TextDocumentContentChangeEvent[]): void {
		for (const support of this.plugins) {
			support.updateNonAstroFile?.(fileName, changes);
		}
	}

	private getDocument(uri: string) {
		const document = this.docManager.get(uri);
		if (!document) {
			throw new Error('Cannot call methods on an unopened document');
		}
		return document;
	}

	private execute<T>(name: keyof LSProvider, args: any[], mode: ExecuteMode.FirstNonNull): Promise<T | null>;
	private execute<T>(name: keyof LSProvider, args: any[], mode: ExecuteMode.Collect): Promise<T[]>;
	private execute(name: keyof LSProvider, args: any[], mode: ExecuteMode.None): Promise<void>;
	private async execute<T>(name: keyof LSProvider, args: any[], mode: ExecuteMode): Promise<(T | null) | T[] | void> {
		const plugins = this.plugins.filter((plugin) => typeof plugin[name] === 'function');

		switch (mode) {
			case ExecuteMode.FirstNonNull:
				for (const plugin of plugins) {
					const res = await this.tryExecutePlugin(plugin, name, args, null);
					if (res != null) {
						return res;
					}
				}
				return null;
			case ExecuteMode.Collect:
				return (
					await Promise.all(
						plugins.map((plugin) => {
							let ret = this.tryExecutePlugin(plugin, name, args, []);
							return ret;
						})
					)
				).flat();
			case ExecuteMode.None:
				await Promise.all(plugins.map((plugin) => this.tryExecutePlugin(plugin, name, args, null)));
				return;
		}
	}

	private async tryExecutePlugin(plugin: any, fnName: string, args: any[], failValue: any) {
		try {
			return await plugin[fnName](...args);
		} catch (e) {
			console.error(e);
			return failValue;
		}
	}
}
