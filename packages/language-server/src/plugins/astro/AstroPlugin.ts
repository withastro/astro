import {
	CompletionContext,
	FoldingRange,
	FoldingRangeKind,
	Position,
	TextEdit,
	Range,
	FormattingOptions,
} from 'vscode-languageserver';
import { ConfigManager } from '../../core/config';
import { AstroDocument } from '../../core/documents';
import { importPrettier, getPrettierPluginPath } from '../../importPackage';
import { mergeDeep } from '../../utils';
import { AppCompletionList, Plugin } from '../interfaces';
import { LanguageServiceManager } from '../typescript/LanguageServiceManager';
import { CompletionsProviderImpl } from './features/CompletionsProvider';

export class AstroPlugin implements Plugin {
	__name = 'astro';

	private configManager: ConfigManager;
	private readonly languageServiceManager: LanguageServiceManager;

	private readonly completionProvider: CompletionsProviderImpl;

	constructor(configManager: ConfigManager, languageServiceManager: LanguageServiceManager) {
		this.configManager = configManager;
		this.languageServiceManager = languageServiceManager;

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

	async formatDocument(document: AstroDocument, options: FormattingOptions): Promise<TextEdit[]> {
		const filePath = document.getFilePath();
		if (!filePath) {
			return [];
		}

		const prettier = importPrettier(filePath);
		const prettierConfig = await prettier.resolveConfig(filePath, { editorconfig: true, useCache: false });
		const editorFormatConfig =
			options !== undefined
				? {
						tabWidth: prettierConfig?.tabWidth ?? options.tabSize,
						useTabs: prettierConfig?.useTabs ?? !options.insertSpaces,
				  }
				: {};
		const resultConfig = mergeDeep(prettierConfig ?? {}, editorFormatConfig);

		const fileInfo = await prettier.getFileInfo(filePath, { ignorePath: '.prettierignore' });

		if (fileInfo.ignored) {
			return [];
		}

		const result = prettier.format(document.getText(), {
			...resultConfig,
			plugins: getAstroPrettierPlugin(),
			parser: 'astro',
		});

		return document.getText() === result
			? []
			: [TextEdit.replace(Range.create(document.positionAt(0), document.positionAt(document.getTextLength())), result)];

		function getAstroPrettierPlugin() {
			const hasPluginLoadedAlready = prettier.getSupportInfo().languages.some((l) => l.name === 'astro');
			return hasPluginLoadedAlready ? [] : [getPrettierPluginPath(filePath!)];
		}
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
