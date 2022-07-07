import {
	CompletionItem,
	CompletionList,
	Position,
	TextEdit,
	CompletionItemKind,
	FoldingRange,
	Hover,
	Range,
	SymbolInformation,
	FormattingOptions,
	LinkedEditingRanges,
} from 'vscode-languageserver';
import { doComplete as getEmmetCompletions } from '@vscode/emmet-helper';
import { getLanguageService, HTMLFormatConfiguration } from 'vscode-html-languageservice';
import type { Plugin } from '../interfaces';
import { ConfigManager } from '../../core/config/ConfigManager';
import { AstroDocument } from '../../core/documents/AstroDocument';
import {
	isInComponentStartTag,
	isInsideExpression,
	isInsideFrontmatter,
	isPossibleComponent,
} from '../../core/documents/utils';
import { LSConfig, LSHTMLConfig } from '../../core/config/interfaces';
import { astroAttributes, astroDirectives, classListAttribute } from './features/astro-attributes';
import { removeDataAttrCompletion } from './utils';

export class HTMLPlugin implements Plugin {
	__name = 'html';

	private lang = getLanguageService({
		customDataProviders: [astroAttributes, classListAttribute],
	});
	private attributeOnlyLang = getLanguageService({
		customDataProviders: [astroAttributes],
		useDefaultDataProvider: false,
	});
	private componentLang = getLanguageService({
		customDataProviders: [astroAttributes, astroDirectives],
		useDefaultDataProvider: false,
	});
	private styleScriptTemplate = new Set(['style']);
	private configManager: ConfigManager;

	constructor(configManager: ConfigManager) {
		this.configManager = configManager;
	}

	async doHover(document: AstroDocument, position: Position): Promise<Hover | null> {
		if (!(await this.featureEnabled(document, 'hover'))) {
			return null;
		}

		const html = document.html;
		if (!html) {
			return null;
		}

		const node = html.findNodeAt(document.offsetAt(position));
		if (!node) {
			return null;
		}

		// If the node we're hovering on is a component, instead only provide astro-specific hover info
		if (isPossibleComponent(node)) {
			return this.componentLang.doHover(document, position, html);
		}

		return this.lang.doHover(document, position, html);
	}

	/**
	 * Get HTML completions
	 */
	async getCompletions(document: AstroDocument, position: Position): Promise<CompletionList | null> {
		if (!(await this.featureEnabled(document, 'completions'))) {
			return null;
		}

		const html = document.html;
		const offset = document.offsetAt(position);

		if (
			!html ||
			isInsideFrontmatter(document.getText(), offset) ||
			isInsideExpression(document.getText(), html.findNodeAt(offset).start, offset)
		) {
			return null;
		}

		// Get Emmet completions
		let emmetResults: CompletionList = {
			isIncomplete: true,
			items: [],
		};

		const emmetConfig = await this.configManager.getEmmetConfig(document);
		const extensionConfig = (await this.configManager.getConfig<LSConfig>('astro', document.uri)) ?? {};
		if (extensionConfig?.html?.completions?.emmet) {
			this.lang.setCompletionParticipants([
				{
					onHtmlContent: () =>
						(emmetResults = getEmmetCompletions(document, position, 'html', emmetConfig) || emmetResults),
				},
			]);
		}

		// If we're in a component starting tag, we do not want HTML language completions
		// as HTML attributes are not valid for components
		const results = isInComponentStartTag(html, document.offsetAt(position))
			? removeDataAttrCompletion(this.attributeOnlyLang.doComplete(document, position, html).items)
			: this.lang.doComplete(document, position, html).items;

		return CompletionList.create(
			[...results, ...this.getLangCompletions(results), ...emmetResults.items],
			// Emmet completions change on every keystroke, so they are never complete
			emmetResults.items.length > 0
		);
	}

	async formatDocument(document: AstroDocument, options: FormattingOptions): Promise<TextEdit[]> {
		const start = document.positionAt(
			document.astroMeta.frontmatter.state === 'closed' ? document.astroMeta.frontmatter.endOffset! + 3 : 0
		);

		if (document.astroMeta.frontmatter.state === 'closed') {
			start.line += 1;
			start.character = 0;
		}

		const end = document.positionAt(document.getTextLength());

		const htmlFormatConfig =
			(await this.configManager.getConfig<HTMLFormatConfiguration>('html.format', document.uri)) ?? {};

		// The HTML plugin can't format script tags properly, we'll handle those inside the TypeScript plugin
		if (htmlFormatConfig.contentUnformatted) {
			htmlFormatConfig.contentUnformatted = htmlFormatConfig.contentUnformatted + ',script';
		} else {
			htmlFormatConfig.contentUnformatted = 'script';
		}

		const edits = this.lang.format(document, Range.create(start, end), { ...htmlFormatConfig, ...options });

		return edits;
	}

	getFoldingRanges(document: AstroDocument): FoldingRange[] | null {
		const html = document.html;

		if (!html) {
			return null;
		}

		return this.lang.getFoldingRanges(document);
	}

	getLinkedEditingRanges(document: AstroDocument, position: Position): LinkedEditingRanges | null {
		const html = document.html;

		if (!html) {
			return null;
		}

		const ranges = this.lang.findLinkedEditingRanges(document, position, html);

		if (!ranges) {
			return null;
		}

		return { ranges };
	}

	async doTagComplete(document: AstroDocument, position: Position): Promise<string | null> {
		if (!(await this.featureEnabled(document, 'tagComplete'))) {
			return null;
		}

		const html = document.html;
		const offset = document.offsetAt(position);

		if (
			!html ||
			isInsideFrontmatter(document.getText(), offset) ||
			isInsideExpression(document.getText(), html.findNodeAt(offset).start, offset)
		) {
			return null;
		}

		return this.lang.doTagComplete(document, position, html);
	}

	async getDocumentSymbols(document: AstroDocument): Promise<SymbolInformation[]> {
		if (!(await this.featureEnabled(document, 'documentSymbols'))) {
			return [];
		}

		const html = document.html;
		if (!html) {
			return [];
		}

		return this.lang.findDocumentSymbols(document, html);
	}

	/**
	 * Get lang completions for style tags (ex: `<style lang="scss">`)
	 */
	private getLangCompletions(completions: CompletionItem[]): CompletionItem[] {
		const styleScriptTemplateCompletions = completions.filter(
			(completion) => completion.kind === CompletionItemKind.Property && this.styleScriptTemplate.has(completion.label)
		);
		const langCompletions: CompletionItem[] = [];
		addLangCompletion('style', ['scss', 'sass', 'less', 'styl', 'stylus']);
		return langCompletions;

		/** Add language completions */
		function addLangCompletion(tag: string, languages: string[]) {
			const existingCompletion = styleScriptTemplateCompletions.find((completion) => completion.label === tag);
			if (!existingCompletion) {
				return;
			}

			languages.forEach((lang) =>
				langCompletions.push({
					...existingCompletion,
					label: `${tag} (lang="${lang}")`,
					insertText: existingCompletion.insertText && `${existingCompletion.insertText} lang="${lang}"`,
					textEdit:
						existingCompletion.textEdit && TextEdit.is(existingCompletion.textEdit)
							? {
									range: existingCompletion.textEdit.range,
									newText: `${existingCompletion.textEdit.newText} lang="${lang}"`,
							  }
							: undefined,
				})
			);
		}
	}

	private async featureEnabled(document: AstroDocument, feature: keyof LSHTMLConfig) {
		return (
			(await this.configManager.isEnabled(document, 'html')) &&
			(await this.configManager.isEnabled(document, 'html', feature))
		);
	}
}
