import { flatten } from 'lodash';
import ts, { CodeFixAction } from 'typescript';
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
import { AstroDocument, getLineAtPosition, mapRangeToOriginal } from '../../../core/documents';
import { modifyLines } from '../../../utils';
import { CodeActionsProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshotFragment } from '../snapshots/DocumentSnapshot';
import { checkEndOfFileCodeInsert, convertRange, removeAstroComponentSuffix, toVirtualAstroFilePath } from '../utils';
import { codeActionChangeToTextEdit, completionOptions } from './CompletionsProvider';
import { findContainingNode } from './utils';

// These are VS Code specific CodeActionKind so they're not in the language server protocol
export const sortImportKind = `${CodeActionKind.Source}.sortImports`;

export class CodeActionsProviderImpl implements CodeActionsProvider {
	constructor(private languageServiceManager: LanguageServiceManager) {}

	async getCodeActions(
		document: AstroDocument,
		range: Range,
		context: CodeActionContext,
		cancellationToken?: CancellationToken
	): Promise<CodeAction[]> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		const start = fragment.offsetAt(fragment.getGeneratedPosition(range.start));
		const end = fragment.offsetAt(fragment.getGeneratedPosition(range.end));

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

			let codeFixes = errorCodes.includes(2304) ? this.getComponentQuickFix(start, end, lang, filePath) : undefined;
			codeFixes = codeFixes ?? lang.getCodeFixesAtPosition(filePath, start, end, errorCodes, {}, {});

			const codeActions = codeFixes.map((fix) =>
				codeFixToCodeAction(fix, context.diagnostics, context.only ? CodeActionKind.QuickFix : CodeActionKind.Empty)
			);

			result.push(...codeActions);
		}

		return result;

		function codeFixToCodeAction(codeFix: CodeFixAction, diagnostics: Diagnostic[], kind: CodeActionKind): CodeAction {
			const documentChanges = codeFix.changes.map((change) => {
				return TextDocumentEdit.create(
					OptionalVersionedTextDocumentIdentifier.create(document.getURL(), null),
					change.textChanges.map((edit) => {
						let originalRange = mapRangeToOriginal(fragment, convertRange(fragment, edit.span));

						if (codeFix.fixName === 'import') {
							return codeActionChangeToTextEdit(document, fragment as AstroSnapshotFragment, edit);
						}

						if (codeFix.fixName === 'fixMissingFunctionDeclaration') {
							originalRange = checkEndOfFileCodeInsert(originalRange, document);
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
	}

	private getComponentQuickFix(
		start: number,
		end: number,
		lang: ts.LanguageService,
		filePath: string
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
		const completion = lang.getCompletionsAtPosition(filePath, tagName.getEnd(), completionOptions);

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
		if (document.astroMeta.frontmatter.state !== 'closed') {
			return [];
		}

		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const fragment = await tsDoc.createFragment();

		if (cancellationToken?.isCancellationRequested) {
			return [];
		}

		const changes = lang.organizeImports({ fileName: filePath, type: 'file', skipDestructiveCodeActions }, {}, {});

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
