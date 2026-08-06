import { TextDocumentEdit } from '@volar/language-server';
import type { CodeAction, LanguageServiceContext } from '@volar/language-service';
import { URI } from 'vscode-uri';
import { AstroVirtualCode } from '../../core/index.js';
import { mapEdit } from './utils.js';

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
