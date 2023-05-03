import type ts from 'typescript';
import {
	CancellationToken,
	CompletionContext,
	CompletionItemTag,
	CompletionList,
	CompletionTriggerKind,
	InsertTextFormat,
	MarkupContent,
	Position,
	Range,
	TextDocumentIdentifier,
	TextEdit,
} from 'vscode-languageserver';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol';
import type { ConfigManager } from '../../../core/config';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import {
	getLineAtPosition,
	isInsideExpression,
	isInsideFrontmatter,
	isPossibleComponent,
} from '../../../core/documents/utils';
import { getRegExpMatches, isNotNullOrUndefined } from '../../../utils';
import type { AppCompletionItem, AppCompletionList, CompletionsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { getMarkdownDocumentation } from '../previewer';
import type { AstroSnapshot, DocumentSnapshot, ScriptTagDocumentSnapshot } from '../snapshots/DocumentSnapshot';
import {
	convertRange,
	convertToLocationRange,
	ensureFrontmatterInsert,
	getCommitCharactersForScriptElement,
	getScriptTagSnapshot,
	removeAstroComponentSuffix,
	scriptElementKindToCompletionItemKind,
} from '../utils';
import { isPartOfImportStatement } from './utils';

/**
 * The language service throws an error if the character is not a valid trigger character.
 * Also, the completions are worse.
 * Therefore, only use the characters the typescript compiler treats as valid.
 */
type validTriggerCharacter = '.' | '"' | "'" | '`' | '/' | '@' | '<' | '#';

type LastCompletion = {
	key: string;
	position: Position;
	completionList: AppCompletionList<CompletionItemData> | null;
};

// `import {...} from '..'` or `import ... from '..'`
// Note: Does not take into account if import is within a comment.
const scriptImportRegex = /\bimport\s+{([^}]*?)}\s+?from\s+['"`].+?['"`]|\bimport\s+(\w+?)\s+from\s+['"`].+?['"`]/g;

export interface CompletionItemData extends TextDocumentIdentifier {
	filePath: string;
	offset: number;
	scriptTagIndex: number | undefined;
	originalItem: ts.CompletionEntry;
}

// When Svelte components are imported, we have to reference the svelte2tsx's types to properly type the component
// An unfortunate downside of this is that it polutes completions, so let's filter those internal types manually
const svelte2tsxTypes = new Set([
	'Svelte2TsxComponent',
	'Svelte2TsxComponentConstructorParameters',
	'SvelteComponentConstructor',
	'SvelteActionReturnType',
	'SvelteTransitionConfig',
	'SvelteTransitionReturnType',
	'SvelteAnimationReturnType',
	'SvelteWithOptionalProps',
	'SvelteAllProps',
	'SveltePropsAnyFallback',
	'SvelteSlotsAnyFallback',
	'SvelteRestProps',
	'SvelteSlots',
	'SvelteStore',
]);

export class CompletionsProviderImpl implements CompletionsProvider<CompletionItemData> {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	private readonly validTriggerCharacters = ['.', '"', "'", '`', '/', '@', '<', '#'] as const;

	private isValidTriggerCharacter(character: string | undefined): character is validTriggerCharacter {
		return this.validTriggerCharacters.includes(character as validTriggerCharacter);
	}

	private lastCompletion?: LastCompletion;

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext,
		cancellationToken?: CancellationToken
	): Promise<AppCompletionList<CompletionItemData> | null> {
		const triggerCharacter = completionContext?.triggerCharacter;
		const triggerKind = completionContext?.triggerKind;

		const validTriggerCharacter = this.isValidTriggerCharacter(triggerCharacter) ? triggerCharacter : undefined;
		const isCustomTriggerCharacter = triggerKind === CompletionTriggerKind.TriggerCharacter;

		if ((isCustomTriggerCharacter && !validTriggerCharacter) || cancellationToken?.isCancellationRequested) {
			return null;
		}

		if (this.canReuseLastCompletion(this.lastCompletion, triggerKind, triggerCharacter, document, position)) {
			this.lastCompletion.position = position;
			return this.lastCompletion.completionList;
		} else {
			this.lastCompletion = undefined;
		}

		const html = document.html;
		const documentOffset = document.offsetAt(position);
		const node = html.findNodeAt(documentOffset);

		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const offset = tsDoc.offsetAt(tsDoc.getGeneratedPosition(position));
		let filePath = tsDoc.filePath;

		let completions: ts.CompletionInfo | undefined;

		const isCompletionInsideFrontmatter = isInsideFrontmatter(document.getText(), documentOffset);
		const isCompletionInsideExpression = isInsideExpression(document.getText(), node.start, documentOffset);

		const tsPreferences = await this.configManager.getTSPreferences(document);
		const formatOptions = await this.configManager.getTSFormatConfig(document);

		let scriptTagIndex: number | undefined = undefined;

		if (node.tag === 'script') {
			const {
				filePath: scriptFilePath,
				offset: scriptOffset,
				index: scriptIndex,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			filePath = scriptFilePath;
			scriptTagIndex = scriptIndex;

			completions = lang.getCompletionsAtPosition(
				scriptFilePath,
				scriptOffset,
				{
					...tsPreferences,
					triggerCharacter: validTriggerCharacter,
				},
				formatOptions
			);
		} else {
			// PERF: Getting TS completions is fairly slow and I am currently not sure how to speed it up
			// As such, we'll try to avoid getting them when unneeded, such as when we're doing HTML stuff

			// If the user just typed `<` with nothing else, let's disable ourselves until we're more sure if the user wants TS completions
			if (!isCompletionInsideFrontmatter && node.parent && node.tag === undefined && !isCompletionInsideExpression) {
				return null;
			}

			// If the current node is not a component, let's disable ourselves as the user
			// is most likely looking for HTML completions
			if (!isCompletionInsideFrontmatter && !isPossibleComponent(node) && !isCompletionInsideExpression) {
				return null;
			}

			completions = lang.getCompletionsAtPosition(
				filePath,
				offset,
				{
					...tsPreferences,
					triggerCharacter: validTriggerCharacter,
				},
				formatOptions
			);
		}

		if (completions === undefined || completions.entries.length === 0) {
			return null;
		}

		const existingImports = this.getExistingImports(document);
		const completionItems = completions.entries
			.filter((completion) => this.isValidCompletion(completion, this.ts))
			.map((entry: ts.CompletionEntry) =>
				this.toCompletionItem(
					tsDoc,
					entry,
					filePath,
					offset,
					isCompletionInsideFrontmatter,
					scriptTagIndex,
					existingImports
				)
			)
			.filter(isNotNullOrUndefined);

		const completionList = CompletionList.create(completionItems, true);
		this.lastCompletion = { key: document.getFilePath() || '', position, completionList };

		return completionList;
	}

	async resolveCompletion(
		document: AstroDocument,
		item: AppCompletionItem<CompletionItemData>,
		cancellationToken?: CancellationToken
	): Promise<AppCompletionItem<CompletionItemData>> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const tsPreferences = await this.configManager.getTSPreferences(document);

		const data: CompletionItemData | undefined = item.data;

		if (!data || !data.filePath || cancellationToken?.isCancellationRequested) {
			return item;
		}

		const detail = lang.getCompletionEntryDetails(
			data.filePath, // fileName
			data.offset, // position
			data.originalItem.name, // entryName
			{}, // formatOptions
			data.originalItem.source, // source
			tsPreferences, // preferences
			data.originalItem.data // data
		);

		if (detail) {
			const { detail: itemDetail, documentation: itemDocumentation } = this.getCompletionDocument(detail);

			// TODO: Add support for labelDetails
			// if (data.originalItem.source) {
			// 	item.labelDetails = { description: data.originalItem.source };
			// }

			item.detail = itemDetail;
			item.documentation = itemDocumentation;
		}

		const actions = detail?.codeActions;

		const isInsideScriptTag = data.scriptTagIndex !== undefined;
		let scriptTagSnapshot: ScriptTagDocumentSnapshot;
		if (isInsideScriptTag) {
			const { snapshot } = getScriptTagSnapshot(
				tsDoc as AstroSnapshot,
				document,
				document.scriptTags[data.scriptTagIndex!].container
			);

			scriptTagSnapshot = snapshot;
		}

		if (actions) {
			const edit: TextEdit[] = [];

			for (const action of actions) {
				for (const change of action.changes) {
					if (isInsideScriptTag) {
						change.textChanges.forEach((textChange) => {
							const originalPosition = scriptTagSnapshot.getOriginalPosition(
								scriptTagSnapshot.positionAt(textChange.span.start)
							);

							textChange.span.start = tsDoc.offsetAt(tsDoc.getGeneratedPosition(originalPosition));
						});
					}

					edit.push(
						...change.textChanges.map((textChange) =>
							codeActionChangeToTextEdit(document, tsDoc, isInsideScriptTag, textChange, this.ts)
						)
					);
				}
			}

			item.additionalTextEdits = (item.additionalTextEdits ?? []).concat(edit);
		}

		return item;
	}

	private toCompletionItem(
		snapshot: DocumentSnapshot,
		comp: ts.CompletionEntry,
		filePath: string,
		offset: number,
		insideFrontmatter: boolean,
		scriptTagIndex: number | undefined,
		existingImports: Set<string>
	): AppCompletionItem<CompletionItemData> | null {
		let item = CompletionItem.create(comp.name);

		const isAstroComponent = this.isAstroComponentImport(comp.name);
		const isImport = comp.insertText?.includes('import');

		// Avoid showing completions for using components as functions
		if (isAstroComponent && !isImport && insideFrontmatter) {
			return null;
		}

		if (isAstroComponent) {
			item.label = removeAstroComponentSuffix(comp.name);

			// Set component imports as file completion, that way we get cool icons
			item.kind = CompletionItemKind.File;
			item.detail = comp.data?.moduleSpecifier;
		} else {
			item.kind = scriptElementKindToCompletionItemKind(comp.kind, this.ts);
		}

		// TS may suggest another component even if there already exists an import with the same.
		// This happens because internally, components get suffixed with __AstroComponent_
		if (isAstroComponent && existingImports.has(item.label)) {
			return null;
		}

		if (comp.kindModifiers) {
			const kindModifiers = new Set(comp.kindModifiers.split(/,|\s+/g));

			if (kindModifiers.has(this.ts.ScriptElementKindModifier.optionalModifier)) {
				if (!item.insertText) {
					item.insertText = item.label;
				}

				if (!item.filterText) {
					item.filterText = item.label;
				}
				item.label += '?';
			}

			if (kindModifiers.has(this.ts.ScriptElementKindModifier.deprecatedModifier)) {
				item.tags = [CompletionItemTag.Deprecated];
			}
		}

		// TODO: Add support for labelDetails
		// if (comp.sourceDisplay) {
		// 	item.labelDetails = { description: ts.displayPartsToString(comp.sourceDisplay) };
		// }

		item.commitCharacters = getCommitCharactersForScriptElement(comp.kind, this.ts);
		item.sortText = comp.sortText;
		item.preselect = comp.isRecommended;

		if (comp.replacementSpan) {
			item.insertText = comp.insertText ? removeAstroComponentSuffix(comp.insertText) : undefined;
			item.insertTextFormat = comp.isSnippet ? InsertTextFormat.Snippet : InsertTextFormat.PlainText;
			item.textEdit = comp.replacementSpan
				? TextEdit.replace(convertToLocationRange(snapshot, comp.replacementSpan), item.insertText ?? item.label)
				: undefined;
		}

		return {
			...item,
			data: {
				uri: snapshot.getURL(),
				filePath,
				scriptTagIndex,
				offset,
				originalItem: comp,
			},
		};
	}

	private getCompletionDocument(compDetail: ts.CompletionEntryDetails) {
		const { sourceDisplay, documentation: tsDocumentation, displayParts } = compDetail;
		let detail: string = removeAstroComponentSuffix(this.ts.displayPartsToString(displayParts));

		if (sourceDisplay) {
			const importPath = this.ts.displayPartsToString(sourceDisplay);
			detail = importPath;
		}

		const documentation: MarkupContent = {
			kind: 'markdown',
			value: getMarkdownDocumentation(tsDocumentation, compDetail.tags, this.ts),
		};

		return {
			documentation,
			detail,
		};
	}

	private canReuseLastCompletion(
		lastCompletion: LastCompletion | undefined,
		triggerKind: number | undefined,
		triggerCharacter: string | undefined,
		document: AstroDocument,
		position: Position
	): lastCompletion is LastCompletion {
		return (
			!!lastCompletion &&
			lastCompletion.key === document.getFilePath() &&
			lastCompletion.position.line === position.line &&
			Math.abs(lastCompletion.position.character - position.character) < 2 &&
			(triggerKind === CompletionTriggerKind.TriggerForIncompleteCompletions ||
				// Special case: `.` is a trigger character, but inside import path completions
				// it shouldn't trigger another completion because we can reuse the old one
				(triggerCharacter === '.' && isPartOfImportStatement(document.getText(), position)))
		);
	}

	private getExistingImports(document: AstroDocument) {
		const rawImports = getRegExpMatches(scriptImportRegex, document.getText()).map((match) =>
			(match[1] ?? match[2]).split(',')
		);
		const tidiedImports = rawImports.flat().map((match) => match.trim());
		return new Set(tidiedImports);
	}

	private isAstroComponentImport(className: string) {
		return className.endsWith('__AstroComponent_');
	}

	private isValidCompletion(
		completion: ts.CompletionEntry,
		ts: typeof import('typescript/lib/tsserverlibrary')
	): boolean {
		// Remove completion for default exported function
		const isDefaultExport =
			completion.name === 'default' && completion.kindModifiers == ts.ScriptElementKindModifier.exportedModifier;

		// Remove completion for svelte2tsx internal types
		const isSvelte2tsxCompletion = completion.name.startsWith('__sveltets_') || svelte2tsxTypes.has(completion.name);

		if (isDefaultExport || isSvelte2tsxCompletion) {
			return false;
		}

		return true;
	}
}

export function codeActionChangeToTextEdit(
	document: AstroDocument,
	snapshot: DocumentSnapshot,
	isInsideScriptTag: boolean,
	change: ts.TextChange,
	ts: typeof import('typescript/lib/tsserverlibrary')
) {
	change.newText = removeAstroComponentSuffix(change.newText);

	const { span } = change;
	let range: Range;
	const virtualRange = convertRange(snapshot, span);

	range = mapRangeToOriginal(snapshot, virtualRange);

	if (!isInsideScriptTag) {
		// If we don't have a frontmatter already, create one with the import
		const frontmatterState = document.astroMeta.frontmatter.state;
		if (frontmatterState === null) {
			return TextEdit.replace(
				Range.create(Position.create(0, 0), Position.create(0, 0)),
				`---${ts.sys.newLine}${change.newText}---${ts.sys.newLine}${ts.sys.newLine}`
			);
		}

		if (!isInsideFrontmatter(document.getText(), document.offsetAt(range.start))) {
			range = ensureFrontmatterInsert(range, document);
		}

		// First import in a file will wrongly have a newline before it due to how the frontmatter is replaced by a comment
		if (range.start.line === 1 && (change.newText.startsWith('\n') || change.newText.startsWith('\r\n'))) {
			change.newText = change.newText.trimStart();
		}
	} else {
		const existingLine = getLineAtPosition(document.positionAt(span.start), document.getText());
		const isNewImport = !existingLine.trim().startsWith('import');

		// Avoid putting new imports on the same line as the script tag opening
		if (!(change.newText.startsWith('\n') || change.newText.startsWith('\r\n')) && isNewImport) {
			change.newText = ts.sys.newLine + change.newText;
		}
	}

	return TextEdit.replace(range, change.newText);
}
