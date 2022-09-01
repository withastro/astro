import {
	Color,
	ColorInformation,
	ColorPresentation,
	CompletionContext,
	CompletionList,
	CompletionTriggerKind,
	FoldingRange,
	Hover,
	Position,
	Range,
	SymbolInformation,
} from 'vscode-languageserver';
import { ConfigManager } from '../../core/config/ConfigManager';
import { LSConfig, LSCSSConfig } from '../../core/config/interfaces';
import {
	AstroDocument,
	isInsideFrontmatter,
	isInTag,
	mapColorPresentationToOriginal,
	mapCompletionItemToOriginal,
	mapFoldingRangeToParent,
	mapHoverToParent,
	mapObjWithRangeToOriginal,
	mapRangeToGenerated,
	mapSymbolInformationToOriginal,
	TagInformation,
} from '../../core/documents';
import { doComplete as getEmmetCompletions } from '@vscode/emmet-helper';
import type { Plugin } from '../interfaces';
import { CSSDocument, CSSDocumentBase } from './CSSDocument';
import { getLanguage, getLanguageService } from './language-service';
import { AttributeContext, getAttributeContextAtPosition } from '../../core/documents/parseHtml';
import { StyleAttributeDocument } from './StyleAttributeDocument';
import { getIdClassCompletion } from './features/getIdClassCompletions';

export class CSSPlugin implements Plugin {
	__name = 'css';

	private configManager: ConfigManager;
	private cssDocuments = new WeakMap<TagInformation, CSSDocument>();
	private triggerCharacters = new Set(['.', ':', '-', '/']);

	constructor(configManager: ConfigManager) {
		this.configManager = configManager;
	}

	async doHover(document: AstroDocument, position: Position): Promise<Hover | null> {
		if (!(await this.featureEnabled(document, 'hover'))) {
			return null;
		}

		if (isInsideFrontmatter(document.getText(), document.offsetAt(position))) {
			return null;
		}

		const styleTag = this.getStyleTagForPosition(document, position);

		// We technically can return results even for open tags, however, a lot of the info returned is not valid
		// Since most editors will automatically close the tag before the user start working in them, this shouldn't be a problem
		if (styleTag && !styleTag.closed) {
			return null;
		}

		// If we don't have a style tag at this position, we might be in a style property instead, let's check
		if (!styleTag) {
			const attributeContext = getAttributeContextAtPosition(document, position);

			if (!attributeContext) {
				return null;
			}

			if (this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())) {
				const [start, end] = attributeContext.valueRange;
				return this.doHoverInternal(new StyleAttributeDocument(document, start, end), position);
			}

			return null;
		}

		const cssDocument = this.getCSSDocumentForStyleTag(styleTag, document);
		const cssLang = extractLanguage(cssDocument);

		if (!isSupportedByLangService(cssLang)) {
			return null;
		}

		return this.doHoverInternal(cssDocument, position);
	}

	private doHoverInternal(cssDocument: CSSDocumentBase, position: Position) {
		const hoverInfo = getLanguageService(extractLanguage(cssDocument)).doHover(
			cssDocument,
			cssDocument.getGeneratedPosition(position),
			cssDocument.stylesheet
		);
		return hoverInfo ? mapHoverToParent(cssDocument, hoverInfo) : hoverInfo;
	}

	async getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): Promise<CompletionList | null> {
		if (!(await this.featureEnabled(document, 'completions'))) {
			return null;
		}

		if (isInsideFrontmatter(document.getText(), document.offsetAt(position))) {
			return null;
		}

		const triggerCharacter = completionContext?.triggerCharacter;
		const triggerKind = completionContext?.triggerKind;
		const isCustomTriggerCharacter = triggerKind === CompletionTriggerKind.TriggerCharacter;

		if (isCustomTriggerCharacter && triggerCharacter && !this.triggerCharacters.has(triggerCharacter)) {
			return null;
		}

		const styleTag = this.getStyleTagForPosition(document, position);

		if (styleTag && !styleTag.closed) {
			return null;
		}

		if (!styleTag) {
			const attributeContext = getAttributeContextAtPosition(document, position);
			if (!attributeContext) {
				return null;
			}

			if (this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())) {
				const [start, end] = attributeContext.valueRange;
				return await this.getCompletionsInternal(document, position, new StyleAttributeDocument(document, start, end));
			}
			// If we're not in a style attribute, instead give completions for ids and classes used in the current document
			else if ((attributeContext.name == 'id' || attributeContext.name == 'class') && attributeContext.inValue) {
				const stylesheets = this.getStylesheetsForDocument(document);
				return getIdClassCompletion(stylesheets, attributeContext);
			}

			return null;
		}

		const cssDocument = this.getCSSDocumentForStyleTag(styleTag, document);
		return await this.getCompletionsInternal(document, position, cssDocument);
	}

	private async getCompletionsInternal(document: AstroDocument, position: Position, cssDocument: CSSDocumentBase) {
		const emmetConfig = await this.configManager.getEmmetConfig(document);

		if (isSASS(cssDocument)) {
			// The CSS language service does not support SASS (not to be confused with SCSS)
			// however we can at least still at least provide Emmet completions in SASS blocks
			return getEmmetCompletions(document, position, 'sass', emmetConfig) || null;
		}

		const cssLang = extractLanguage(cssDocument);
		const langService = getLanguageService(cssLang);

		let emmetResults: CompletionList = {
			isIncomplete: false,
			items: [],
		};

		const extensionConfig = await this.configManager.getConfig<LSConfig>('astro', document.uri);
		if (extensionConfig?.css?.completions?.emmet ?? true) {
			langService.setCompletionParticipants([
				{
					onCssProperty: (context) => {
						if (context?.propertyName) {
							emmetResults =
								getEmmetCompletions(
									cssDocument,
									cssDocument.getGeneratedPosition(position),
									getLanguage(cssLang),
									emmetConfig
								) || emmetResults;
						}
					},
					onCssPropertyValue: (context) => {
						if (context?.propertyValue) {
							emmetResults =
								getEmmetCompletions(
									cssDocument,
									cssDocument.getGeneratedPosition(position),
									getLanguage(cssLang),
									emmetConfig
								) || emmetResults;
						}
					},
				},
			]);
		}

		const results = langService.doComplete(
			cssDocument,
			cssDocument.getGeneratedPosition(position),
			cssDocument.stylesheet
		);

		return CompletionList.create(
			[...(results ? results.items : []), ...emmetResults.items].map((completionItem) =>
				mapCompletionItemToOriginal(cssDocument, completionItem)
			),
			// Emmet completions change on every keystroke, so they are never complete
			emmetResults.items.length > 0
		);
	}

	async getDocumentColors(document: AstroDocument): Promise<ColorInformation[]> {
		if (!(await this.featureEnabled(document, 'documentColors'))) {
			return [];
		}

		const allColorInfo = this.getCSSDocumentsForDocument(document).flatMap((cssDoc) => {
			const cssLang = extractLanguage(cssDoc);
			const langService = getLanguageService(cssLang);

			if (!isSupportedByLangService(cssLang)) {
				return [];
			}

			return langService
				.findDocumentColors(cssDoc, cssDoc.stylesheet)
				.map((colorInfo) => mapObjWithRangeToOriginal(cssDoc, colorInfo));
		});

		return allColorInfo;
	}

	async getColorPresentations(document: AstroDocument, range: Range, color: Color): Promise<ColorPresentation[]> {
		if (!(await this.featureEnabled(document, 'documentColors'))) {
			return [];
		}

		const allColorPres = this.getCSSDocumentsForDocument(document).flatMap((cssDoc) => {
			const cssLang = extractLanguage(cssDoc);
			const langService = getLanguageService(cssLang);

			if (
				(!cssDoc.isInGenerated(range.start) && !cssDoc.isInGenerated(range.end)) ||
				!isSupportedByLangService(cssLang)
			) {
				return [];
			}

			return langService
				.getColorPresentations(cssDoc, cssDoc.stylesheet, color, mapRangeToGenerated(cssDoc, range))
				.map((colorPres) => mapColorPresentationToOriginal(cssDoc, colorPres));
		});

		return allColorPres;
	}

	getFoldingRanges(document: AstroDocument): FoldingRange[] | null {
		const allFoldingRanges = this.getCSSDocumentsForDocument(document).flatMap((cssDoc) => {
			const cssLang = extractLanguage(cssDoc);
			const langService = getLanguageService(cssLang);

			return langService.getFoldingRanges(cssDoc).map((foldingRange) => mapFoldingRangeToParent(cssDoc, foldingRange));
		});

		return allFoldingRanges;
	}

	async getDocumentSymbols(document: AstroDocument): Promise<SymbolInformation[]> {
		if (!(await this.featureEnabled(document, 'documentSymbols'))) {
			return [];
		}

		const allDocumentSymbols = this.getCSSDocumentsForDocument(document).flatMap((cssDoc) => {
			return getLanguageService(extractLanguage(cssDoc))
				.findDocumentSymbols(cssDoc, cssDoc.stylesheet)
				.map((symbol) => mapSymbolInformationToOriginal(cssDoc, symbol));
		});

		return allDocumentSymbols;
	}

	private inStyleAttributeWithoutInterpolation(
		attrContext: AttributeContext,
		text: string
	): attrContext is Required<AttributeContext> {
		return (
			attrContext.name === 'style' &&
			!!attrContext.valueRange &&
			!text.substring(attrContext.valueRange[0], attrContext.valueRange[1]).includes('{')
		);
	}

	/**
	 * Get the associated CSS Document for a style tag
	 */
	private getCSSDocumentForStyleTag(tag: TagInformation, document: AstroDocument): CSSDocument {
		let cssDoc = this.cssDocuments.get(tag);
		if (!cssDoc || cssDoc.version < document.version) {
			cssDoc = new CSSDocument(document, tag);
			this.cssDocuments.set(tag, cssDoc);
		}

		return cssDoc;
	}

	/**
	 * Get all the CSSDocuments in a document
	 */
	private getCSSDocumentsForDocument(document: AstroDocument) {
		return document.styleTags.map((tag) => this.getCSSDocumentForStyleTag(tag, document));
	}

	/**
	 * Get all the stylesheets (Stylesheet type) in a document
	 */
	private getStylesheetsForDocument(document: AstroDocument) {
		return this.getCSSDocumentsForDocument(document).map((cssDoc) => cssDoc.stylesheet);
	}

	/**
	 * Get style tag at position for a document
	 */
	private getStyleTagForPosition(document: AstroDocument, position: Position): TagInformation | undefined {
		return document.styleTags.find((styleTag) => {
			return isInTag(position, styleTag);
		});
	}

	private async featureEnabled(document: AstroDocument, feature: keyof LSCSSConfig) {
		return (
			(await this.configManager.isEnabled(document, 'css')) &&
			(await this.configManager.isEnabled(document, 'css', feature))
		);
	}
}

/**
 * Check is a CSSDocument's language is supported by the CSS language service
 */
function isSupportedByLangService(language: string) {
	switch (language) {
		case 'css':
		case 'scss':
		case 'less':
			return true;
		default:
			return false;
	}
}

function isSASS(document: CSSDocumentBase) {
	switch (extractLanguage(document)) {
		case 'sass':
			return true;
		default:
			return false;
	}
}

function extractLanguage(document: CSSDocumentBase): string {
	const lang = document.languageId;
	return lang.replace(/^text\//, '');
}
