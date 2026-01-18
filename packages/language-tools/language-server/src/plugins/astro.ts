import { dirname } from 'node:path';
import type { DiagnosticMessage } from '@astrojs/compiler/types';
import type {
	CodeLens,
	CompletionItem,
	Diagnostic,
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
import { globSync } from 'tinyglobby';
import type { Provide } from 'volar-service-typescript';
import type { TextDocument } from 'vscode-html-languageservice';
import { URI } from 'vscode-uri';
import { AstroVirtualCode } from '../core/index.js';
import { isJSDocument } from './utils.js';

export const create = (ts: typeof import('typescript')): LanguageServicePlugin => {
	return {
		capabilities: {
			completionProvider: {
				triggerCharacters: ['-'],
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false,
			},
			codeLensProvider: {},
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

					function compilerMessageToDiagnostic(message: DiagnosticMessage): Diagnostic {
						const start = Position.create(message.location.line - 1, message.location.column - 1);
						const end = document.positionAt(document.offsetAt(start) + message.location.length);
						return {
							message: message.text + (message.hint ? '\n\n' + message.hint : ''),
							range: Range.create(start, end),
							code: message.code,
							severity: message.severity,
							source: 'astro',
						};
					}
				},
				provideCodeLenses(document, token) {
					if (token.isCancellationRequested) return;
					if (!isJSDocument(document.languageId)) return;

					if (!context.project.typescript) return;

					const { uriConverter } = context.project.typescript;
					const languageService = context.inject<Provide, 'typescript/languageService'>(
						'typescript/languageService',
					);
					if (!languageService) return;

					const tsProgram = languageService.getProgram();
					if (!tsProgram) return;

					const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
					if (!decoded) return;

					const globcodeLens: CodeLens[] = [];
					const sourceFile = tsProgram.getSourceFile(decoded[0].fsPath)!;

					function walk() {
						return ts.forEachChild(sourceFile, function cb(node): void {
							if (ts.isCallExpression(node) && node.expression.getText() === 'Astro.glob') {
								const globArgument = node.arguments.at(0);

								if (globArgument && decoded) {
									globcodeLens.push(
										getGlobResultAsCodeLens(
											globArgument.getText().slice(1, -1),
											dirname(uriConverter.asFileName(decoded[0])),
											document.positionAt(node.arguments.pos),
										),
									);
								}
							}
							return ts.forEachChild(node, cb);
						});
					}

					walk();

					return globcodeLens;
				},
			};
		},
	};
};

function getGlobResultAsCodeLens(globText: string, dir: string, position: Position) {
	const globResult = globSync(globText, {
		cwd: dir,
		onlyFiles: true,
		expandDirectories: false,
	});

	return {
		range: Range.create(position, position),
		command: { title: `Matches ${globResult.length} files`, command: '' },
	};
}

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
