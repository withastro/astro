'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.enhancedProvideCodeActions = enhancedProvideCodeActions;
exports.enhancedResolveCodeAction = enhancedResolveCodeAction;
const language_server_1 = require('@volar/language-server');
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../../core/index.js');
const utils_js_1 = require('./utils.js');
function enhancedProvideCodeActions(codeActions, context) {
	return codeActions.map((codeAction) => mapCodeAction(codeAction, context));
}
function enhancedResolveCodeAction(codeAction, context) {
	/**
	 * TypeScript code actions don't come through here, as they're considered to be already fully resolved
	 * A lot of the code actions we'll encounter here are more tricky ones, such as fixAll or refactor
	 * For now, it seems like we don't need to do anything special here, but we'll keep this function around
	 */
	return mapCodeAction(codeAction, context);
}
function mapCodeAction(codeAction, context) {
	if (!codeAction.edit || !codeAction.edit.documentChanges) return codeAction;
	codeAction.edit.documentChanges = codeAction.edit.documentChanges.map((change) => {
		if (language_server_1.TextDocumentEdit.is(change)) {
			const decoded = context.decodeEmbeddedDocumentUri(
				vscode_uri_1.URI.parse(change.textDocument.uri),
			);
			const sourceScript = decoded && context.language.scripts.get(decoded[0]);
			const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
			const root = sourceScript?.generated?.root;
			if (!virtualCode || !(root instanceof index_js_1.AstroVirtualCode)) return change;
			change.edits = change.edits.map((edit) =>
				(0, utils_js_1.mapEdit)(edit, root, virtualCode.languageId),
			);
		}
		return change;
	});
	return codeAction;
}
//# sourceMappingURL=codeActions.js.map
