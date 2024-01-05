import { TextDocumentEdit } from '@volar/language-server';
import type { CodeAction, ServiceContext } from '@volar/language-service';
import { AstroFile } from '../../core/index.js';
import { editShouldBeInFrontmatter, ensureProperEditForFrontmatter } from '../utils.js';

export function enhancedProvideCodeActions(codeActions: CodeAction[], context: ServiceContext) {
	return codeActions.map((codeAction) => mapCodeAction(codeAction, context));
}

export function enhancedResolveCodeAction(codeAction: CodeAction, context: ServiceContext) {
	/**
	 * TypeScript code actions don't come through here, as they're considered to be already fully resolved
	 * A lot of the code actions we'll encounter here are more tricky ones, such as fixAll or refactor
	 * For now, it seems like we don't need to do anything special here, but we'll keep this function around
	 */
	return mapCodeAction(codeAction, context);
}

function mapCodeAction(codeAction: CodeAction, context: ServiceContext<any>) {
	if (!codeAction.edit || !codeAction.edit.documentChanges) return codeAction;

	codeAction.edit.documentChanges = codeAction.edit.documentChanges.map((change) => {
		if (TextDocumentEdit.is(change)) {
			const [virtualFile, source] = context.documents.getVirtualFileByUri(change.textDocument.uri);
			const file = source?.root;
			if (!virtualFile || !(file instanceof AstroFile) || !context.host) return change;

			change.edits = change.edits.map((edit) => {
				const shouldModifyEdit = editShouldBeInFrontmatter(edit.range, file.astroMeta);

				if (shouldModifyEdit.itShould) {
					edit = ensureProperEditForFrontmatter(edit, file.astroMeta, '\n');
				}

				return edit;
			});
		}

		return change;
	});

	return codeAction;
}
