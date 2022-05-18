import { CompletionContext, FoldingRange, FoldingRangeKind, Position } from 'vscode-languageserver';
import { ConfigManager } from '../../core/config';
import { AstroDocument, DocumentManager } from '../../core/documents';
import { AppCompletionList, Plugin } from '../interfaces';
import { LanguageServiceManager } from '../typescript/LanguageServiceManager';
import { CompletionsProviderImpl } from './features/CompletionsProvider';

export class AstroPlugin implements Plugin {
	__name = 'astro';

	private configManager: ConfigManager;
	private readonly languageServiceManager: LanguageServiceManager;

	private readonly completionProvider: CompletionsProviderImpl;

	constructor(docManager: DocumentManager, configManager: ConfigManager, workspaceUris: string[]) {
		this.configManager = configManager;
		this.languageServiceManager = new LanguageServiceManager(docManager, workspaceUris, configManager);

		this.completionProvider = new CompletionsProviderImpl(this.languageServiceManager);
	}

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): Promise<AppCompletionList | null> {
		const completions = this.completionProvider.getCompletions(document, position, completionContext);
		return completions;
	}

	getFoldingRanges(document: AstroDocument): FoldingRange[] {
		const foldingRanges: FoldingRange[] = [];
		const { frontmatter } = document.astroMeta;

		// Currently editing frontmatter, don't fold
		if (frontmatter.state !== 'closed') return foldingRanges;

		// The way folding ranges work is by folding anything between the starting position and the ending one, as such
		// the start in this case should be after the frontmatter start (after the starting ---) until the last character
		// of the last line of the frontmatter before its ending (before the closing ---)
		// ---
		//		^ -- start
		// console.log("Astro")
		// ---								^ -- end
		const start = document.positionAt(frontmatter.startOffset! + 3);
		const end = document.positionAt(frontmatter.endOffset! - 1);

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
}
