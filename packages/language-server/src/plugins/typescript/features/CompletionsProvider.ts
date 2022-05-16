import {
	CompletionContext,
	Position,
	TextDocumentIdentifier,
	MarkupContent,
	CompletionTriggerKind,
	TextEdit,
	Range,
	CancellationToken,
	CompletionItemTag,
	InsertTextFormat,
} from 'vscode-languageserver';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import {
	getLineAtPosition,
	isComponentTag,
	isInsideExpression,
	isInsideFrontmatter,
} from '../../../core/documents/utils';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import ts, { ScriptElementKind, ScriptElementKindModifier } from 'typescript';
import { CompletionList } from 'vscode-languageserver';
import { AppCompletionItem, AppCompletionList, CompletionsProvider } from '../../interfaces';
import {
	scriptElementKindToCompletionItemKind,
	getCommitCharactersForScriptElement,
	toVirtualAstroFilePath,
	removeAstroComponentSuffix,
	convertRange,
	ensureFrontmatterInsert,
	getScriptTagSnapshot,
} from '../utils';
import {
	AstroSnapshot,
	AstroSnapshotFragment,
	ScriptTagDocumentSnapshot,
	SnapshotFragment,
} from '../snapshots/DocumentSnapshot';
import { getRegExpMatches, isNotNullOrUndefined } from '../../../utils';
import { flatten } from 'lodash';
import { getMarkdownDocumentation } from '../previewer';
import { isPartOfImportStatement } from './utils';
import { ConfigManager } from '../../../core/config';

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

export class CompletionsProviderImpl implements CompletionsProvider<CompletionItemData> {
	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {}

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
		const offset = document.offsetAt(position);
		const node = html.findNodeAt(offset);

		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		let filePath = toVirtualAstroFilePath(tsDoc.filePath);

		let completions: ts.CompletionInfo | undefined;

		const isCompletionInsideFrontmatter = isInsideFrontmatter(document.getText(), offset);
		const isCompletionInsideExpression = isInsideExpression(document.getText(), node.start, offset);

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
					// File extensions are required inside script tags, however TypeScript can't return completions with the `ts`
					// extension, so what we'll do instead is force `minimal` (aka, no extension) and manually add the extensions
					importModuleSpecifierEnding: 'minimal',
					triggerCharacter: validTriggerCharacter,
				},
				formatOptions
			);

			if (completions) {
				// Manually adds file extensions to js and ts files
				completions.entries = completions?.entries.map((comp) => {
					if (
						comp.kind === ScriptElementKind.scriptElement &&
						(comp.kindModifiers === '.js' || comp.kindModifiers === '.ts')
					) {
						return {
							...comp,
							name: comp.name + comp.kindModifiers,
						};
					} else {
						return comp;
					}
				});
			}
		} else {
			// PERF: Getting TS completions is fairly slow and I am currently not sure how to speed it up
			// As such, we'll try to avoid getting them when unneeded, such as when we're doing HTML stuff

			// When at the root of the document TypeScript offer all kinds of completions, because it doesn't know yet that
			// it's JSX and not JS. As such, people who are using Emmet to write their template suffer from a very degraded experience
			// from what they're used to in HTML files (which is instant completions). So let's disable ourselves when we're at the root
			if (!isCompletionInsideFrontmatter && !node.parent && !isCompletionInsideExpression) {
				return null;
			}

			// If the user just typed `<` with nothing else, let's disable ourselves until we're more sure if the user wants TS completions
			if (!isCompletionInsideFrontmatter && node.parent && node.tag === undefined && !isCompletionInsideExpression) {
				return null;
			}

			// If the current node is not a component (aka, it doesn't start with a caps), let's disable ourselves as the user
			// is most likely looking for HTML completions
			if (!isCompletionInsideFrontmatter && !isComponentTag(node) && !isCompletionInsideExpression) {
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

		const wordRange = completions.optionalReplacementSpan
			? Range.create(
					document.positionAt(completions.optionalReplacementSpan.start),
					document.positionAt(completions.optionalReplacementSpan.start + completions.optionalReplacementSpan.length)
			  )
			: undefined;
		const wordRangeStartPosition = wordRange?.start;

		const fragment = await tsDoc.createFragment();
		const existingImports = this.getExistingImports(document);
		const completionItems = completions.entries
			.filter(this.isValidCompletion)
			.map((entry: ts.CompletionEntry) =>
				this.toCompletionItem(
					fragment,
					entry,
					filePath,
					offset,
					isCompletionInsideFrontmatter,
					scriptTagIndex,
					existingImports
				)
			)
			.filter(isNotNullOrUndefined)
			.map((comp) => this.fixTextEditRange(wordRangeStartPosition, comp));

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

		const data: CompletionItemData | undefined = item.data as any;

		if (!data || !data.filePath || cancellationToken?.isCancellationRequested) {
			return item;
		}

		const fragment = await tsDoc.createFragment();
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

			if (data.originalItem.source) {
				item.labelDetails = { description: data.originalItem.source };
			}

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
							textChange.span.start = fragment.offsetAt(
								scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(textChange.span.start))
							);
						});
					}

					edit.push(
						...change.textChanges.map((textChange) =>
							codeActionChangeToTextEdit(document, fragment as AstroSnapshotFragment, isInsideScriptTag, textChange)
						)
					);
				}
			}

			item.additionalTextEdits = (item.additionalTextEdits ?? []).concat(edit);
		}

		return item;
	}

	private toCompletionItem(
		fragment: SnapshotFragment,
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
			item.kind = scriptElementKindToCompletionItemKind(comp.kind);
		}

		// TS may suggest another component even if there already exists an import with the same.
		// This happens because internally, components get suffixed with __AstroComponent_
		if (isAstroComponent && existingImports.has(item.label)) {
			return null;
		}

		if (comp.kindModifiers) {
			const kindModifiers = new Set(comp.kindModifiers.split(/,|\s+/g));

			if (kindModifiers.has(ScriptElementKindModifier.optionalModifier)) {
				if (!item.insertText) {
					item.insertText = item.label;
				}

				if (!item.filterText) {
					item.filterText = item.label;
				}
				item.label += '?';
			}

			if (kindModifiers.has(ScriptElementKindModifier.deprecatedModifier)) {
				item.tags = [CompletionItemTag.Deprecated];
			}
		}

		if (comp.sourceDisplay) {
			item.labelDetails = { description: ts.displayPartsToString(comp.sourceDisplay) };
		}

		item.commitCharacters = getCommitCharactersForScriptElement(comp.kind);
		item.sortText = comp.sortText;
		item.preselect = comp.isRecommended;

		if (comp.replacementSpan) {
			item.insertText = comp.insertText ? removeAstroComponentSuffix(comp.insertText) : undefined;
			item.insertTextFormat = comp.isSnippet ? InsertTextFormat.Snippet : InsertTextFormat.PlainText;
			item.textEdit = comp.replacementSpan
				? TextEdit.replace(convertRange(fragment, comp.replacementSpan), item.insertText ?? item.label)
				: undefined;
		}

		return {
			...item,
			data: {
				uri: fragment.getURL(),
				filePath,
				scriptTagIndex,
				offset,
				originalItem: comp,
			},
		};
	}

	private isValidCompletion(completion: ts.CompletionEntry): boolean {
		// Remove completion for default exported function
		if (completion.name === 'default' && completion.kindModifiers == ScriptElementKindModifier.exportedModifier) {
			return false;
		}

		return true;
	}

	private getCompletionDocument(compDetail: ts.CompletionEntryDetails) {
		const { sourceDisplay, documentation: tsDocumentation, displayParts } = compDetail;
		let detail: string = removeAstroComponentSuffix(ts.displayPartsToString(displayParts));

		if (sourceDisplay) {
			const importPath = ts.displayPartsToString(sourceDisplay);
			detail = importPath;
		}

		const documentation: MarkupContent = {
			kind: 'markdown',
			value: getMarkdownDocumentation(tsDocumentation, compDetail.tags),
		};

		return {
			documentation,
			detail,
		};
	}

	/**
	 * If the textEdit is out of the word range of the triggered position
	 * vscode would refuse to show the completions
	 * split those edits into additionalTextEdit to fix it
	 */
	private fixTextEditRange(wordRangePosition: Position | undefined, completionItem: CompletionItem) {
		const { textEdit } = completionItem;
		if (!textEdit || !TextEdit.is(textEdit) || !wordRangePosition) {
			return completionItem;
		}

		const {
			newText,
			range: { start },
		} = textEdit;

		const wordRangeStartCharacter = wordRangePosition.character;
		if (wordRangePosition.line !== wordRangePosition.line || start.character > wordRangePosition.character) {
			return completionItem;
		}

		textEdit.newText = newText.substring(wordRangeStartCharacter - start.character);
		textEdit.range.start = {
			line: start.line,
			character: wordRangeStartCharacter,
		};

		completionItem.additionalTextEdits = [
			TextEdit.replace(
				{
					start,
					end: {
						line: start.line,
						character: wordRangeStartCharacter,
					},
				},
				newText.substring(0, wordRangeStartCharacter - start.character)
			),
		];

		return completionItem;
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
		const tidiedImports = flatten(rawImports).map((match) => match.trim());
		return new Set(tidiedImports);
	}

	private isAstroComponentImport(className: string) {
		return className.endsWith('__AstroComponent_');
	}
}

export function codeActionChangeToTextEdit(
	document: AstroDocument,
	fragment: AstroSnapshotFragment,
	isInsideScriptTag: boolean,
	change: ts.TextChange
) {
	change.newText = removeAstroComponentSuffix(change.newText);

	const { span } = change;
	let range: Range;
	const virtualRange = convertRange(fragment, span);

	range = mapRangeToOriginal(fragment, virtualRange);

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
