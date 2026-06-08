import { TextDocumentEdit } from '@volar/language-server';
import type {
	CompletionItem,
	CompletionList,
	LanguageServicePluginInstance,
} from '@volar/language-server';
import { getSourceRange } from '@volar/language-service/lib/utils/featureWorkers.js';
import type {
	CancellationToken,
	CodeAction,
	CodeActionContext,
	LanguageServiceContext,
} from '@volar/language-service';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { AstroVirtualCode } from '../../core/index.js';
import { enhancedProvideCompletionItems, enhancedResolveCompletionItem } from './completions.js';
import { DiagnosticCodes } from './diagnostics.js';
import { isAstroComponentImportSource, mapEdit, stripAstroComponentSuffix } from './utils.js';

type CodeActionDiagnostic = CodeActionContext['diagnostics'][number];
type TypeScriptPluginWithCompletions = LanguageServicePluginInstance & {
	provideCompletionItems: NonNullable<LanguageServicePluginInstance['provideCompletionItems']>;
	resolveCompletionItem: NonNullable<LanguageServicePluginInstance['resolveCompletionItem']>;
};
type AstroComponentCompletion = {
	completion: CompletionItem;
	source: string;
};

export function enhancedProvideCodeActions(
	codeActions: CodeAction[],
	context: LanguageServiceContext,
) {
	return codeActions.map((codeAction) => mapCodeAction(codeAction, context));
}

export function enhancedResolveCodeAction(codeAction: CodeAction, context: LanguageServiceContext) {
	/**
	 * TypeScript code actions don't come through here, as they're considered to be already fully resolved
	 * A lot of the code actions we'll encounter here are more tricky ones, such as fixAll or refactor
	 * For now, it seems like we don't need to do anything special here, but we'll keep this function around
	 */
	return mapCodeAction(codeAction, context);
}

function mapCodeAction(codeAction: CodeAction, context: LanguageServiceContext) {
	if (!codeAction.edit || !codeAction.edit.documentChanges) return codeAction;

	codeAction.edit.documentChanges = codeAction.edit.documentChanges.map((change) => {
		if (TextDocumentEdit.is(change)) {
			const decoded = context.decodeEmbeddedDocumentUri(URI.parse(change.textDocument.uri));
			const sourceScript = decoded && context.language.scripts.get(decoded[0]);
			const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
			const root = sourceScript?.generated?.root;
			if (!virtualCode || !(root instanceof AstroVirtualCode)) return change;

			change.edits = change.edits.map((edit) => mapEdit(edit, root, virtualCode.languageId));
		}

		return change;
	});

	return codeAction;
}

export async function provideAstroComponentImportCodeActions(
	ts: typeof import('typescript'),
	typeScriptPlugin: LanguageServicePluginInstance,
	document: TextDocument,
	codeActionContext: CodeActionContext,
	context: LanguageServiceContext,
	token: CancellationToken,
): Promise<CodeAction[]> {
	if (
		!shouldProvideQuickfix(codeActionContext) ||
		!hasCompletionQuickfixSupport(typeScriptPlugin)
	) {
		return [];
	}

	const documentText = document.getText();
	const codeActions: CodeAction[] = [];

	for (const diagnostic of codeActionContext.diagnostics) {
		const diagnosticCodeActions = await getAstroComponentImportCodeActionsForDiagnostic(
			ts,
			typeScriptPlugin,
			document,
			documentText,
			diagnostic,
			context,
			token,
		);
		codeActions.push(...diagnosticCodeActions);
	}

	return codeActions;
}

async function getAstroComponentImportCodeActionsForDiagnostic(
	ts: typeof import('typescript'),
	typeScriptPlugin: TypeScriptPluginWithCompletions,
	document: TextDocument,
	documentText: string,
	diagnostic: CodeActionDiagnostic,
	context: LanguageServiceContext,
	token: CancellationToken,
): Promise<CodeAction[]> {
	if (!isAstroComponentImportDiagnostic(diagnostic)) {
		return [];
	}

	const missingName = getMissingIdentifier(document.getText(diagnostic.range), diagnostic.message);
	if (!missingName) {
		return [];
	}

	const completions = await typeScriptPlugin.provideCompletionItems(
		document,
		diagnostic.range.end,
		{ triggerKind: 1 },
		token,
	);
	if (!completions) {
		return [];
	}

	const matchingCompletions = getMatchingAstroComponentCompletions(
		ts,
		completions,
		documentText,
		missingName,
	);
	if (!matchingCompletions.length) {
		return [];
	}

	const sourceDiagnostic = getSourceDiagnostic(diagnostic, document, context);
	const codeActions: CodeAction[] = [];

	for (const { completion, source } of matchingCompletions) {
		const codeAction = await getAstroComponentImportCodeAction(
			typeScriptPlugin,
			completion,
			source,
			sourceDiagnostic,
			document,
			context,
			token,
		);
		if (codeAction) {
			codeActions.push(codeAction);
		}
	}

	return codeActions;
}

function getMatchingAstroComponentCompletions(
	ts: typeof import('typescript'),
	completions: CompletionList,
	documentText: string,
	missingName: string,
) {
	const matchingCompletions: AstroComponentCompletion[] = [];

	for (const completion of enhancedProvideCompletionItems(ts, completions, documentText).items) {
		const source = completion.data?.originalItem?.source;
		if (!isAstroComponentImportSource(source)) {
			continue;
		}

		const originalName = completion.data?.originalItem?.name ?? completion.label;
		if (stripAstroComponentSuffix(String(originalName)) === missingName) {
			matchingCompletions.push({ completion, source });
		}
	}

	return matchingCompletions;
}

async function getAstroComponentImportCodeAction(
	typeScriptPlugin: TypeScriptPluginWithCompletions,
	completion: CompletionItem,
	source: string,
	sourceDiagnostic: CodeActionDiagnostic,
	document: TextDocument,
	context: LanguageServiceContext,
	token: CancellationToken,
): Promise<CodeAction | undefined> {
	const resolvedCompletion = await typeScriptPlugin.resolveCompletionItem(completion, token);
	const resolvedAstroCompletion = enhancedResolveCompletionItem(
		resolvedCompletion ?? completion,
		context,
	);
	if (!resolvedAstroCompletion.additionalTextEdits?.length) {
		return;
	}

	return {
		title: `Add import from "${source}"`,
		kind: 'quickfix',
		diagnostics: [sourceDiagnostic],
		edit: {
			changes: {
				[document.uri]: resolvedAstroCompletion.additionalTextEdits,
			},
		},
	};
}

function getSourceDiagnostic(
	diagnostic: CodeActionDiagnostic,
	document: TextDocument,
	context: LanguageServiceContext,
) {
	const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
	const sourceScript = decoded && context.language.scripts.get(decoded[0]);
	const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
	if (!sourceScript || !virtualCode) {
		return diagnostic;
	}

	const sourceDocument = context.documents.get(
		sourceScript.id,
		sourceScript.languageId,
		sourceScript.snapshot,
	);
	const sourceRange = getSourceRange(
		[sourceDocument, document, context.language.maps.get(virtualCode, sourceScript)],
		diagnostic.range,
	);

	return sourceRange ? { ...diagnostic, range: sourceRange } : diagnostic;
}

function shouldProvideQuickfix(codeActionContext: CodeActionContext) {
	return (
		!codeActionContext.only?.length ||
		codeActionContext.only.some((kind) => kind === 'quickfix' || kind.startsWith('quickfix.'))
	);
}

function hasCompletionQuickfixSupport(
	typeScriptPlugin: LanguageServicePluginInstance,
): typeScriptPlugin is TypeScriptPluginWithCompletions {
	return Boolean(typeScriptPlugin.provideCompletionItems && typeScriptPlugin.resolveCompletionItem);
}

function isAstroComponentImportDiagnostic(diagnostic: CodeActionDiagnostic) {
	return diagnostic.source === 'ts' && diagnostic.code === DiagnosticCodes.CANNOT_FIND_NAME;
}

function getMissingIdentifier(rangeText: string, message: string) {
	const rangeIdentifier = /[A-Za-z_$][\w$]*/.exec(rangeText)?.[0];
	if (rangeIdentifier) {
		return rangeIdentifier;
	}

	return /Cannot find name '([^']+)'/.exec(message)?.[1];
}
