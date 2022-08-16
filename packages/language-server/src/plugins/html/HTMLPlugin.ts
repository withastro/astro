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
	isInTagName,
	isPossibleComponent,
} from '../../core/documents/utils';
import { LSConfig, LSHTMLConfig } from '../../core/config/interfaces';
import { astroAttributes, astroDirectives, astroElements, classListAttribute } from './features/astro-attributes';
import { removeDataAttrCompletion } from './utils';

export class HTMLPlugin implements Plugin {
	__name = 'html';

	private lang = getLanguageService({
		customDataProviders: [astroAttributes, astroElements, classListAttribute],
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
		if (extensionConfig?.html?.completions?.emmet ?? true) {
			this.lang.setCompletionParticipants([
				{
					onHtmlContent: () =>
						(emmetResults = getEmmetCompletions(document, position, 'html', emmetConfig) || emmetResults),
				},
			]);
		}

		// If we're in a component starting tag, we do not want HTML language completions
		// as HTML attributes are not valid for components
		const inComponentTag = isInComponentStartTag(html, offset);
		const inTagName = isInTagName(html, offset);

		const results =
			inComponentTag && !inTagName
				? removeDataAttrCompletion(this.attributeOnlyLang.doComplete(document, position, html).items)
				: // We filter items with no documentation to prevent duplicates with our own defined script and style tags
				  this.lang.doComplete(document, position, html).items.filter((item) => item.documentation !== undefined);

		const langCompletions = inComponentTag ? [] : this.getLangCompletions(results);

		return CompletionList.create(
			[...results, ...langCompletions, ...emmetResults.items],
			// Emmet completions change on every keystroke, so they are never complete
			emmetResults.items.length > 0
		);
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
