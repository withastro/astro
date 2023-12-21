import type { DiagnosticMessage } from '@astrojs/compiler/types';
import {
	CodeLens,
	CompletionItem,
	CompletionItemKind,
	Diagnostic,
	InsertTextFormat,
	Position,
	Range,
	Service,
	TextEdit,
} from '@volar/language-server';
import fg from 'fast-glob';
import { dirname } from 'node:path';
import type { Provide } from 'volar-service-typescript';
import type { TextDocument } from 'vscode-html-languageservice';
import { AstroFile } from '../core/index.js';
import { isJSDocument } from './utils.js';

export const create =
	(): Service =>
	(context, modules): ReturnType<Service> => {
		return {
			triggerCharacters: ['-'],
			provideCompletionItems(document, position, completionContext, token) {
				if (token.isCancellationRequested) return null;
				let items: CompletionItem[] = [];

				const [file] = context!.documents.getVirtualFileByUri(document.uri);
				if (!(file instanceof AstroFile)) return;

				if (completionContext.triggerCharacter === '-') {
					const frontmatterCompletion = getFrontmatterCompletion(file, document, position);
					if (frontmatterCompletion) items.push(frontmatterCompletion);
				}

				return {
					isIncomplete: false,
					items: items,
				};
			},
			provideSemanticDiagnostics(document, token) {
				if (token.isCancellationRequested) return [];

				const [file] = context!.documents.getVirtualFileByUri(document.uri);
				if (!(file instanceof AstroFile)) return;

				return file.compilerDiagnostics.map(compilerMessageToDiagnostic);

				function compilerMessageToDiagnostic(message: DiagnosticMessage): Diagnostic {
					return {
						message: message.text + (message.hint ? '\n\n' + message.hint : ''),
						range: Range.create(
							message.location.line - 1,
							message.location.column - 1,
							message.location.line,
							message.location.length
						),
						code: message.code,
						severity: message.severity,
						source: 'astro',
					};
				}
			},
			provideCodeLenses(document, token) {
				if (token.isCancellationRequested) return;
				if (!context || !modules?.typescript || !isJSDocument(document.languageId)) return;

				const languageService = context.inject<keyof Provide>('typescript/languageService');
				if (!languageService) return;

				const ts = modules?.typescript;
				const tsProgram = languageService.getProgram();
				if (!tsProgram) return;

				const globcodeLens: CodeLens[] = [];
				const sourceFile = tsProgram.getSourceFile(context.env.uriToFileName(document.uri))!;

				function walk() {
					return ts.forEachChild(sourceFile, function cb(node): void {
						if (ts.isCallExpression(node) && node.expression.getText() === 'Astro.glob') {
							const globArgument = node.arguments.at(0);

							if (globArgument) {
								globcodeLens.push(
									getGlobResultAsCodeLens(
										globArgument.getText().slice(1, -1),
										dirname(context!.env.uriToFileName(document.uri)),
										document.positionAt(node.arguments.pos)
									)
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
	};

function getGlobResultAsCodeLens(globText: string, dir: string, position: Position) {
	const globResult = fg.sync(globText, {
		cwd: dir,
		onlyFiles: true,
	});

	return {
		range: Range.create(position, position),
		command: { title: `Matches ${globResult.length} files`, command: '' },
	};
}

function getFrontmatterCompletion(file: AstroFile, document: TextDocument, position: Position) {
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
			textEdit: prefix.match(/^\s*\-+/)
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
			textEdit: prefix.match(/^\s*\-+/)
				? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, insertText)
				: undefined,
		};
	}

	return null;
}
