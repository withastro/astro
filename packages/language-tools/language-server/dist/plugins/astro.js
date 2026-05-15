'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.create = void 0;
const language_server_1 = require('@volar/language-server');
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../core/index.js');
const create = () => {
	return {
		capabilities: {
			completionProvider: {
				triggerCharacters: ['-'],
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false,
			},
		},
		create(context) {
			return {
				provideCompletionItems(document, position, completionContext, token) {
					if (token.isCancellationRequested) return null;
					let items = [];
					const decoded = context.decodeEmbeddedDocumentUri(vscode_uri_1.URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
					if (!(virtualCode instanceof index_js_1.AstroVirtualCode)) return;
					if (completionContext.triggerCharacter === '-') {
						const frontmatterCompletion = getFrontmatterCompletion(virtualCode, document, position);
						if (frontmatterCompletion) items.push(frontmatterCompletion);
					}
					return {
						isIncomplete: false,
						items: items,
					};
				},
				provideDiagnostics(document, token) {
					if (token.isCancellationRequested) return [];
					const decoded = context.decodeEmbeddedDocumentUri(vscode_uri_1.URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
					if (!(virtualCode instanceof index_js_1.AstroVirtualCode)) return;
					return virtualCode.compilerDiagnostics.map(compilerMessageToDiagnostic);
					function compilerMessageToDiagnostic(message) {
						const start = language_server_1.Position.create(
							message.location.line - 1,
							message.location.column - 1,
						);
						const end = document.positionAt(document.offsetAt(start) + message.location.length);
						return {
							message: message.text + (message.hint ? '\n\n' + message.hint : ''),
							range: language_server_1.Range.create(start, end),
							code: message.code,
							severity: message.severity,
							source: 'astro',
						};
					}
				},
			};
		},
	};
};
exports.create = create;
function getFrontmatterCompletion(file, document, position) {
	const base = {
		kind: language_server_1.CompletionItemKind.Snippet,
		label: '---',
		sortText: '\0',
		preselect: true,
		detail: 'Create component script block',
		insertTextFormat: language_server_1.InsertTextFormat.Snippet,
		commitCharacters: [],
	};
	const documentLines = document.getText().split(/\r?\n/);
	const { line, character } = document.positionAt(document.offsetAt(position));
	const prefix = documentLines[line].slice(0, character);
	if (file.astroMeta.frontmatter.status === 'doesnt-exist') {
		return {
			...base,
			insertText: '---\n$0\n---',
			textEdit: /^\s*-+/.test(prefix)
				? language_server_1.TextEdit.replace(
						{ start: { ...position, character: 0 }, end: position },
						'---\n$0\n---',
					)
				: undefined,
		};
	}
	if (file.astroMeta.frontmatter.status === 'open') {
		let insertText = '---';
		// If the current line is a full component script starter/ender, the user expects a full frontmatter
		// completion and not just a completion for "---"  on the same line (which result in, well, nothing)
		if (prefix === '---') {
			insertText = '---\n$0\n---';
		}
		return {
			...base,
			insertText,
			detail:
				insertText === '---' ? 'Close component script block' : 'Create component script block',
			textEdit: /^\s*-+/.test(prefix)
				? language_server_1.TextEdit.replace(
						{ start: { ...position, character: 0 }, end: position },
						insertText,
					)
				: undefined,
		};
	}
	return null;
}
//# sourceMappingURL=astro.js.map
