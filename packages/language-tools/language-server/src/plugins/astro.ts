import type {
	CompletionItem,
	Diagnostic,
	DiagnosticSeverity,
	LanguageServicePlugin,
	LanguageServicePluginInstance,
} from '@volar/language-server';
import {
	CompletionItemKind,
	InsertTextFormat,
	Position,
	Range,
	TextEdit,
} from '@volar/language-server';
import type { TextDocument } from 'vscode-html-languageservice';
import { URI } from 'vscode-uri';
import type { AstroDiagnostic } from '@astrojs/astro2tsx';
import { AstroVirtualCode } from '../core/index.js';

export const create = (): LanguageServicePlugin => {
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
		create(context): LanguageServicePluginInstance {
			return {
				provideCompletionItems(document, position, completionContext, token) {
					if (token.isCancellationRequested) return null;
					let items: CompletionItem[] = [];

					const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
					if (!(virtualCode instanceof AstroVirtualCode)) return;

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

					const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const virtualCode = decoded && sourceScript?.generated?.embeddedCodes.get(decoded[1]);
					if (!(virtualCode instanceof AstroVirtualCode)) return;

					return virtualCode.compilerDiagnostics.map(compilerMessageToDiagnostic);

					function compilerMessageToDiagnostic(diagnostic: AstroDiagnostic): Diagnostic {
						return {
							message: diagnostic.message,
							range: Range.create(
								document.positionAt(diagnostic.position.start),
								document.positionAt(diagnostic.position.end),
							),
							severity: diagnostic.severity as DiagnosticSeverity,
							source: 'astro',
						};
					}
				},
			};
		},
	};
};

function getFrontmatterCompletion(
	file: AstroVirtualCode,
	document: TextDocument,
	position: Position,
) {
	const base: CompletionItem = {
		kind: CompletionItemKind.Snippet,
		label: '---',
		sortText: '\0',
		preselect: true,
		detail: 'Create component script block',
		insertTextFormat: InsertTextFormat.Snippet,
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
				? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, '---\n$0\n---')
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
				? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, insertText)
				: undefined,
		};
	}

	return null;
}
