import type { AppCompletionList } from '../../interfaces';
import type { FunctionDeclaration } from 'typescript';
import type { AstroDocument, DocumentManager } from '../../../core/documents';
import {
	CompletionContext,
	Position,
	CompletionList,
	CompletionItem,
	CompletionItemKind,
	CompletionTriggerKind,
	InsertTextFormat,
	MarkupContent,
	MarkupKind,
	TextEdit,
} from 'vscode-languageserver';
import ts from 'typescript';
import { Node } from 'vscode-html-languageservice';
import { LanguageServiceManager as TypeScriptLanguageServiceManager } from '../../typescript/LanguageServiceManager';
import { isInsideFrontmatter } from '../../../core/documents/utils';
import { isPossibleClientComponent, urlToPath } from '../../../utils';
import { isAstroFilePath, toVirtualAstroFilePath, toVirtualFilePath } from '../../typescript/utils';

export class CompletionsProviderImpl {
	private readonly docManager: DocumentManager;
	private readonly languageServiceManager: TypeScriptLanguageServiceManager;

	constructor(docManager: DocumentManager, languageServiceManager: TypeScriptLanguageServiceManager) {
		this.docManager = docManager;
		this.languageServiceManager = languageServiceManager;
	}

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): Promise<AppCompletionList | null> {
		const doc = this.docManager.get(document.uri);
		if (!doc) return null;

		let items: CompletionItem[] = [];

		if (completionContext?.triggerCharacter === '-') {
			const frontmatter = this.getComponentScriptCompletion(doc, position, completionContext);
			if (frontmatter) items.push(frontmatter);
		}

		if (completionContext?.triggerCharacter === ':') {
			const clientHint = this.getClientHintCompletion(doc, position, completionContext);
			if (clientHint) items.push(...clientHint);
		}

		if (!this.isInsideFrontmatter(document, position)) {
			const props = await this.getPropCompletions(document, position, completionContext);
			if (props.length) {
				items.push(...props);
			}
		}

		return CompletionList.create(items, true);
	}

	private getClientHintCompletion(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): CompletionItem[] | null {
		const node = document.html.findNodeAt(document.offsetAt(position));
		if (!isPossibleClientComponent(node)) return null;

		return [
			{
				label: ':load',
				insertText: 'load',
				commitCharacters: ['l'],
			},
			{
				label: ':idle',
				insertText: 'idle',
				commitCharacters: ['i'],
			},
			{
				label: ':visible',
				insertText: 'visible',
				commitCharacters: ['v'],
			},
			{
				label: ':media',
				insertText: 'media',
				commitCharacters: ['m'],
			},
		];
	}

	private getComponentScriptCompletion(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): CompletionItem | null {
		const base = {
			kind: CompletionItemKind.Snippet,
			label: '---',
			sortText: '\0',
			preselect: true,
			detail: 'Component script',
			insertTextFormat: InsertTextFormat.Snippet,
			commitCharacters: ['-'],
		};
		const prefix = document.getLineUntilOffset(document.offsetAt(position));

		if (document.astroMeta.frontmatter.state === null) {
			return {
				...base,
				insertText: '---\n$0\n---',
				textEdit: prefix.match(/^\s*\-+/)
					? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, '---\n$0\n---')
					: undefined,
			};
		}
		if (document.astroMeta.frontmatter.state === 'open') {
			return {
				...base,
				insertText: '---',
				textEdit: prefix.match(/^\s*\-+/)
					? TextEdit.replace({ start: { ...position, character: 0 }, end: position }, '---')
					: undefined,
			};
		}
		return null;
	}

	private async getPropCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): Promise<CompletionItem[]> {
		const offset = document.offsetAt(position);
		const html = document.html;

		const node = html.findNodeAt(offset);
		if (!this.isComponentTag(node)) {
			return [];
		}
		const inAttribute = node.start + node.tag!.length < offset;
		if (!inAttribute) {
			return [];
		}

		if (completionContext?.triggerCharacter === '/' || completionContext?.triggerCharacter === '>') {
			return [];
		}

		// If inside of attribute value, skip.
		if (
			completionContext &&
			completionContext.triggerKind === CompletionTriggerKind.TriggerCharacter &&
			completionContext.triggerCharacter === '"'
		) {
			return [];
		}

		const componentName = node.tag!;
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		// Get the source file
		const filePath = urlToPath(document.uri);
		const tsFilePath = toVirtualAstroFilePath(filePath!);

		const program = lang.getProgram();
		const sourceFile = program?.getSourceFile(tsFilePath);
		const typeChecker = program?.getTypeChecker();
		if (!sourceFile || !typeChecker) {
			return [];
		}

		// Get the import statement
		const imp = this.getImportedSymbol(sourceFile, componentName);
		const importType = imp && typeChecker.getTypeAtLocation(imp);
		if (!importType) {
			return [];
		}

		// Get the import's type
		const componentType = this.getPropType(importType, typeChecker);
		if (!componentType) {
			return [];
		}

		const completionItems: CompletionItem[] = [];

		// Add completions for this types props
		for (let baseType of componentType.getBaseTypes() || []) {
			const members = baseType.getSymbol()?.members || [];
			members.forEach((mem) => {
				let completionItem = this.getCompletionItemForTypeMember(mem, typeChecker);
				completionItems.push(completionItem);
			});
		}

		// Add completions for this types base members
		const members = componentType.getSymbol()?.members || [];
		members.forEach((mem) => {
			let completionItem = this.getCompletionItemForTypeMember(mem, typeChecker);
			completionItems.push(completionItem);
		});

		return completionItems;
	}

	private getImportedSymbol(sourceFile: ts.SourceFile, identifier: string): ts.ImportSpecifier | ts.Identifier | null {
		for (let list of sourceFile.getChildren()) {
			for (let node of list.getChildren()) {
				if (ts.isImportDeclaration(node)) {
					let clauses = node.importClause;
					if (!clauses) return null;
					let namedImport = clauses.getChildAt(0);

					if (ts.isNamedImports(namedImport)) {
						for (let imp of namedImport.elements) {
							// Iterate the named imports
							if (imp.name.getText() === identifier) {
								return imp;
							}
						}
					} else if (ts.isIdentifier(namedImport)) {
						if (namedImport.getText() === identifier) {
							return namedImport;
						}
					}
				}
			}
		}

		return null;
	}

	private getPropType(type: ts.Type, typeChecker: ts.TypeChecker): ts.Type | null {
		const sym = type?.getSymbol();
		if (!sym) {
			return null;
		}

		for (const decl of sym?.getDeclarations() || []) {
			const fileName = toVirtualFilePath(decl.getSourceFile().fileName);
			if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
				if (!ts.isFunctionDeclaration(decl)) {
					console.error(`We only support function components for tsx/jsx at the moment.`);
					continue;
				}
				const fn = decl as FunctionDeclaration;
				if (!fn.parameters.length) continue;
				const param1 = fn.parameters[0];
				const type = typeChecker.getTypeAtLocation(param1);
				return type;
			}
		}

		return null;
	}

	private getCompletionItemForTypeMember(mem: ts.Symbol, typeChecker: ts.TypeChecker) {
		let item: CompletionItem = {
			label: mem.name,
			insertText: mem.name,
			commitCharacters: [],
		};

		mem.getDocumentationComment(typeChecker);
		let description = mem
			.getDocumentationComment(typeChecker)
			.map((val) => val.text)
			.join('\n');

		if (description) {
			let docs: MarkupContent = {
				kind: MarkupKind.Markdown,
				value: description,
			};
			item.documentation = docs;
		}
		return item;
	}

	private isComponentTag(node: Node): boolean {
		if (!node.tag) {
			return false;
		}
		const firstChar = node.tag[0];
		return /[A-Z]/.test(firstChar);
	}

	private isInsideFrontmatter(document: AstroDocument, position: Position) {
		return isInsideFrontmatter(document.getText(), document.offsetAt(position));
	}
}
