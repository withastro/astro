import { flatten } from 'lodash';
import ts, { CodeFixAction, FileTextChanges } from 'typescript';
import { CancellationToken } from 'vscode-languageserver';
import {
	CodeAction,
	CodeActionContext,
	CodeActionKind,
	Diagnostic,
	OptionalVersionedTextDocumentIdentifier,
	Range,
	TextDocumentEdit,
	TextEdit,
} from 'vscode-languageserver-types';
import { ConfigManager } from '../../../core/config';
import { AstroDocument, getLineAtPosition, mapRangeToOriginal } from '../../../core/documents';
import { modifyLines } from '../../../utils';
import { CodeActionsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot, AstroSnapshotFragment, ScriptTagDocumentSnapshot } from '../snapshots/DocumentSnapshot';
import {
	checkEndOfFileCodeInsert,
	convertRange,
	getScriptTagSnapshot,
	removeAstroComponentSuffix,
	toVirtualAstroFilePath,
} from '../utils';
import { codeActionChangeToTextEdit } from './CompletionsProvider';
import { findContainingNode } from './utils';

// These are VS Code specific CodeActionKind so they're not in the language server protocol
export const sortImportKind = `${CodeActionKind.Source}.sortImports`;

export class CodeActionsProviderImpl implements CodeActionsProvider {
	constructor(private languageServiceManager: LanguageServiceManager, private configManager: ConfigManager) {}

	async getCodeActions(
		document: AstroDocument,
		range: Range,
		context: CodeActionContext,
		cancellationToken?: CancellationToken
	): Promise<CodeAction[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		const tsPreferences = await this.configManager.getTSPreferences(document);
		const formatOptions = await this.configManager.getTSFormatConfig(document);

		let result: CodeAction[] = [];

		if (cancellationToken?.isCancellationRequested) {
			return [];
		}

		if (context.only?.[0] === CodeActionKind.SourceOrganizeImports) {
			return await this.organizeSortImports(document, false, cancellationToken);
		}

		// The difference between Sort Imports and Organize Imports is that Sort Imports won't do anything destructive.
		// For example, it won't remove unused imports whereas Organize Imports will
		if (context.only?.[0] === sortImportKind) {
			return await this.organizeSortImports(document, true, cancellationToken);
		}

		if (context.only?.[0] === CodeActionKind.Source) {
			return [
				...(await this.organizeSortImports(document, true, cancellationToken)),
				...(await this.organizeSortImports(document, false, cancellationToken)),
			];
		}

		if (context.diagnostics.length && (!context.only || context.only.includes(CodeActionKind.QuickFix))) {
			const errorCodes = context.diagnostics
				.map((diag) => Number(diag.code))
				// We currently cannot support quick fix for unreachable code properly due to the way our TSX output is structured
				.filter((code) => code !== 7027);

			const html = document.html;
			const node = html.findNodeAt(document.offsetAt(range.start));

			let codeFixes: readonly ts.CodeFixAction[] | undefined;
			let isInsideScript = false;

			if (node.tag === 'script') {
				const { snapshot: scriptTagSnapshot, filePath: scriptFilePath } = getScriptTagSnapshot(
					tsDoc as AstroSnapshot,
					document,
					node
				);

				const start = scriptTagSnapshot.offsetAt(scriptTagSnapshot.getGeneratedPosition(range.start));
				const end = scriptTagSnapshot.offsetAt(scriptTagSnapshot.getGeneratedPosition(range.end));

				codeFixes = lang.getCodeFixesAtPosition(scriptFilePath, start, end, errorCodes, formatOptions, tsPreferences);

				codeFixes = codeFixes.map((fix) => ({
					...fix,
					changes: mapScriptTagFixToOriginal(fix.changes, scriptTagSnapshot),
				}));

				isInsideScript = true;
			} else {
				const start = fragment.offsetAt(fragment.getGeneratedPosition(range.start));
				const end = fragment.offsetAt(fragment.getGeneratedPosition(range.end));

				codeFixes = errorCodes.includes(2304)
					? this.getComponentQuickFix(start, end, lang, filePath, formatOptions, tsPreferences)
					: undefined;
				codeFixes =
					codeFixes ?? lang.getCodeFixesAtPosition(filePath, start, end, errorCodes, formatOptions, tsPreferences);
			}

			const codeActions = codeFixes.map((fix) =>
				codeFixToCodeAction(
					fix,
					context.diagnostics,
					context.only ? CodeActionKind.QuickFix : CodeActionKind.Empty,
					isInsideScript
				)
			);

			result.push(...codeActions);
		}

		return result;

		function codeFixToCodeAction(
			codeFix: CodeFixAction,
			diagnostics: Diagnostic[],
			kind: CodeActionKind,
			isInsideScript: boolean
		): CodeAction {
			const documentChanges = codeFix.changes.map((change) => {
				return TextDocumentEdit.create(
					OptionalVersionedTextDocumentIdentifier.create(document.getURL(), null),
					change.textChanges.map((edit) => {
						let originalRange = mapRangeToOriginal(fragment, convertRange(fragment, edit.span));

						// Inside scripts, we don't need to restrain the insertion of code inside a specific zone as it will be
						// restricted to the area of the script tag by default
						if (!isInsideScript) {
							if (codeFix.fixName === 'import') {
								return codeActionChangeToTextEdit(document, fragment as AstroSnapshotFragment, false, edit);
							}

							if (codeFix.fixName === 'fixMissingFunctionDeclaration') {
								originalRange = checkEndOfFileCodeInsert(originalRange, document);
							}
						} else {
							// Make sure new imports are not added on the file line of the script tag
							if (codeFix.fixName === 'import') {
								const existingLine = getLineAtPosition(document.positionAt(edit.span.start), document.getText());
								const isNewImport = !existingLine.trim().startsWith('import');

								if (!(edit.newText.startsWith('\n') || edit.newText.startsWith('\r\n')) && isNewImport) {
									edit.newText = ts.sys.newLine + edit.newText;
								}
							}
						}

						return TextEdit.replace(originalRange, edit.newText);
					})
				);
			});

			const codeAction = CodeAction.create(
				codeFix.description,
				{
					documentChanges,
				},
				kind
			);

			codeAction.diagnostics = diagnostics;

			return codeAction;
		}

		function mapScriptTagFixToOriginal(changes: FileTextChanges[], scriptTagSnapshot: ScriptTagDocumentSnapshot) {
			return changes.map((change) => {
				change.textChanges.map((edit) => {
					edit.span.start = fragment.offsetAt(
						scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(edit.span.start))
					);

					return edit;
				});

				return change;
			});
		}
	}

	private getComponentQuickFix(
		start: number,
		end: number,
		lang: ts.LanguageService,
		filePath: string,
		formatOptions: ts.FormatCodeSettings,
		tsPreferences: ts.UserPreferences
	): readonly ts.CodeFixAction[] | undefined {
		const sourceFile = lang.getProgram()?.getSourceFile(filePath);

		if (!sourceFile) {
			return;
		}

		const node = findContainingNode(
			sourceFile,
			{
				start,
				length: end - start,
			},
			(n): n is ts.JsxOpeningLikeElement | ts.JsxClosingElement =>
				ts.isJsxClosingElement(n) || ts.isJsxOpeningLikeElement(n)
		);

		if (!node) {
			return;
		}

		const tagName = node.tagName;

		// Unlike quick fixes, completions will be able to find the component, so let's use those to get it
		const completion = lang.getCompletionsAtPosition(filePath, tagName.getEnd(), tsPreferences, formatOptions);

		if (!completion) {
			return;
		}

		const name = tagName.getText();
		const suffixedName = name + '__AstroComponent_';

		const toFix = (c: ts.CompletionEntry) =>
			lang.getCompletionEntryDetails(filePath, end, c.name, {}, c.source, {}, c.data)?.codeActions?.map((a) => ({
				...a,
				description: removeAstroComponentSuffix(a.description),
				fixName: 'import',
			})) ?? [];

		return flatten(completion.entries.filter((c) => c.name === name || c.name === suffixedName).map(toFix));
	}

	private async organizeSortImports(
		document: AstroDocument,
		skipDestructiveCodeActions = false,
		cancellationToken: CancellationToken | undefined
	): Promise<CodeAction[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		if (cancellationToken?.isCancellationRequested) {
			return [];
		}

		let changes: ts.FileTextChanges[] = [];

		if (document.astroMeta.frontmatter.state === 'closed') {
			changes.push(...lang.organizeImports({ fileName: filePath, type: 'file', skipDestructiveCodeActions }, {}, {}));
		}

		document.scriptTags.forEach((scriptTag) => {
			const { filePath: scriptFilePath, snapshot: scriptTagSnapshot } = getScriptTagSnapshot(
				tsDoc as AstroSnapshot,
				document,
				scriptTag.container
			);

			const edits = lang.organizeImports(
				{ fileName: scriptFilePath, type: 'file', skipDestructiveCodeActions },
				{},
				{}
			);

			edits.forEach((edit) => {
				edit.fileName = tsDoc.filePath;
				edit.textChanges = edit.textChanges
					.map((change) => {
						change.span.start = fragment.offsetAt(
							scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(change.span.start))
						);

						return change;
					})
					// Since our last line is a (virtual) export, organize imports will try to rewrite it, so let's only take
					// changes that actually happens inside the script tag
					.filter((change) => {
						return scriptTagSnapshot.isInGenerated(document.positionAt(change.span.start));
					});

				return edit;
			});

			changes.push(...edits);
		});

		const documentChanges = changes.map((change) => {
			return TextDocumentEdit.create(
				OptionalVersionedTextDocumentIdentifier.create(document.url, null),
				change.textChanges.map((edit) => {
					const range = mapRangeToOriginal(fragment, convertRange(fragment, edit.span));

					return TextEdit.replace(range, this.fixIndentationOfImports(edit.newText, range, document));
				})
			);
		});

		return [
			CodeAction.create(
				skipDestructiveCodeActions ? 'Sort Imports' : 'Organize Imports',
				{
					documentChanges,
				},
				skipDestructiveCodeActions ? sortImportKind : CodeActionKind.SourceOrganizeImports
			),
		];
	}

	// "Organize Imports" will have edits that delete all imports by return empty edits
	// and one edit which contains all the organized imports. Fix indentation
	// of that one by prepending all lines with the indentation of the first line.
	private fixIndentationOfImports(edit: string, range: Range, document: AstroDocument): string {
		if (!edit || range.start.character === 0) {
			return edit;
		}

		const existingLine = getLineAtPosition(range.start, document.getText());
		const leadingChars = existingLine.substring(0, range.start.character);

		if (leadingChars.trim() !== '') {
			return edit;
		}

		return modifyLines(edit, (line, idx) => (idx === 0 || !line ? line : leadingChars + line));
	}
}
