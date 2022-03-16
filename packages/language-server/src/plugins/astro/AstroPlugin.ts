import ts from 'typescript';
import {
	CompletionContext,
	DefinitionLink,
	FoldingRange,
	FoldingRangeKind,
	LocationLink,
	Position,
	Range,
} from 'vscode-languageserver';
import { ConfigManager } from '../../core/config';
import { AstroDocument, DocumentManager, isInsideFrontmatter } from '../../core/documents';
import { pathToUrl, urlToPath } from '../../utils';
import { AppCompletionList, Plugin } from '../interfaces';
import { LanguageServiceManager } from '../typescript/LanguageServiceManager';
import { ensureRealFilePath, toVirtualAstroFilePath } from '../typescript/utils';
import { CompletionsProviderImpl } from './features/CompletionsProvider';
import { Node } from 'vscode-html-languageservice';

export class AstroPlugin implements Plugin {
	__name = 'astro';

	private configManager: ConfigManager;
	private readonly languageServiceManager: LanguageServiceManager;

	private readonly completionProvider: CompletionsProviderImpl;

	constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
		this.configManager = configManager;
		this.languageServiceManager = new LanguageServiceManager(docManager, workspaceUris, configManager);

		this.completionProvider = new CompletionsProviderImpl(docManager, this.languageServiceManager);
	}

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): Promise<AppCompletionList | null> {
		const completions = this.completionProvider.getCompletions(document, position, completionContext);
		return completions;
	}

	async getFoldingRanges(document: AstroDocument): Promise<FoldingRange[]> {
		const foldingRanges: FoldingRange[] = [];
		const { frontmatter } = document.astroMeta;

		// Currently editing frontmatter, don't fold
		if (frontmatter.state !== 'closed') return foldingRanges;

		const start = document.positionAt(frontmatter.startOffset as number);
		const end = document.positionAt((frontmatter.endOffset as number) - 3);
		return [
			{
				startLine: start.line,
				startCharacter: start.character,
				endLine: end.line,
				endCharacter: end.character,
				kind: FoldingRangeKind.Imports,
			},
		];
	}

	async getDefinitions(document: AstroDocument, position: Position): Promise<DefinitionLink[]> {
		if (this.isInsideFrontmatter(document, position)) {
			return [];
		}

		const offset = document.offsetAt(position);
		const html = document.html;

		const node = html.findNodeAt(offset);
		if (!this.isComponentTag(node)) {
			return [];
		}

		const [componentName] = node.tag!.split(':');

		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const defs = this.getDefinitionsForComponentName(document, lang, componentName);

		if (!defs || !defs.length) {
			return [];
		}

		const startRange: Range = Range.create(Position.create(0, 0), Position.create(0, 0));
		const links = defs.map((def) => {
			const defFilePath = ensureRealFilePath(def.fileName);
			return LocationLink.create(pathToUrl(defFilePath), startRange, startRange);
		});

		return links;
	}

	private isInsideFrontmatter(document: AstroDocument, position: Position) {
		return isInsideFrontmatter(document.getText(), document.offsetAt(position));
	}

	private isComponentTag(node: Node): boolean {
		if (!node.tag) {
			return false;
		}
		const firstChar = node.tag[0];
		return /[A-Z]/.test(firstChar);
	}

	private getDefinitionsForComponentName(
		document: AstroDocument,
		lang: ts.LanguageService,
		componentName: string
	): readonly ts.DefinitionInfo[] | undefined {
		const filePath = urlToPath(document.uri);
		const tsFilePath = toVirtualAstroFilePath(filePath!);

		const program = lang.getProgram();
		const sourceFile = program?.getSourceFile(tsFilePath);
		if (!sourceFile) {
			return undefined;
		}

		const specifier = this.getImportSpecifierForIdentifier(sourceFile, componentName);
		if (!specifier) {
			return [];
		}

		const defs = lang.getDefinitionAtPosition(tsFilePath, specifier.getStart());
		if (!defs) {
			return undefined;
		}

		return defs;
	}

	private getImportSpecifierForIdentifier(sourceFile: ts.SourceFile, identifier: string): ts.Expression | undefined {
		let importSpecifier: ts.Expression | undefined = undefined;
		ts.forEachChild(sourceFile, (tsNode) => {
			if (ts.isImportDeclaration(tsNode)) {
				if (tsNode.importClause) {
					const { name, namedBindings } = tsNode.importClause;
					if (name && name.getText() === identifier) {
						importSpecifier = tsNode.moduleSpecifier;
						return true;
					} else if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
						const elements = (namedBindings as ts.NamedImports).elements;
						for (let elem of elements) {
							if (elem.name.getText() === identifier) {
								importSpecifier = tsNode.moduleSpecifier;
								return true;
							}
						}
					}
				}
			}
		});
		return importSpecifier;
	}
}
