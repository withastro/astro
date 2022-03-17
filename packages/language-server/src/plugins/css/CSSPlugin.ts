import {
	Color,
	ColorInformation,
	ColorPresentation,
	CompletionContext,
	CompletionList,
	CompletionTriggerKind,
	Position,
	Range,
} from 'vscode-languageserver';
import { ConfigManager } from '../../core/config/ConfigManager';
import { LSCSSConfig } from '../../core/config/interfaces';
import {
	AstroDocument,
	isInsideFrontmatter,
	isInTag,
	mapColorPresentationToOriginal,
	mapCompletionItemToOriginal,
	mapObjWithRangeToOriginal,
	mapRangeToGenerated,
	TagInformation,
} from '../../core/documents';
import { doComplete as getEmmetCompletions } from '@vscode/emmet-helper';
import type { Plugin } from '../interfaces';
import { CSSDocument, CSSDocumentBase } from './CSSDocument';
import { getLanguageService } from './language-service';
import { AttributeContext, getAttributeContextAtPosition } from '../../core/documents/parseHtml';
import { StyleAttributeDocument } from './StyleAttributeDocument';
import { getIdClassCompletion } from './features/getIdClassCompletions';
import { flatten } from 'lodash';

export class CSSPlugin implements Plugin {
	__name = 'css';

	private configManager: ConfigManager;
	private cssDocuments = new WeakMap<TagInformation, CSSDocument>();
	private triggerCharacters = new Set(['.', ':', '-', '/']);

	constructor(configManager: ConfigManager) {
		this.configManager = configManager;
	}

	getCompletions(
		document: AstroDocument,
		position: Position,
		completionContext?: CompletionContext
	): CompletionList | null {
		if (!this.featureEnabled('completions')) {
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

		// If we don't have a style tag at this position, we might be in a style property instead, let's check
		if (!styleTag) {
			const attributeContext = getAttributeContextAtPosition(document, position);
			if (!attributeContext) {
				return null;
			}

			if (this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())) {
				const [start, end] = attributeContext.valueRange;
				return this.getCompletionsInternal(document, position, new StyleAttributeDocument(document, start, end));
			}
			// If we're not in a style attribute, instead give completions for ids and classes used in the current document
			else if ((attributeContext.name == 'id' || attributeContext.name == 'class') && attributeContext.inValue) {
				const stylesheets = this.getStylesheetsForDocument(document);
				return getIdClassCompletion(stylesheets, attributeContext);
			}

			return null;
		}

		const cssDocument = this.getCSSDocumentForStyleTag(styleTag, document);
		return this.getCompletionsInternal(document, position, cssDocument);
	}

	private getCompletionsInternal(document: AstroDocument, position: Position, cssDocument: CSSDocumentBase) {
		if (isSASS(cssDocument)) {
			// The CSS language service does not support SASS (not to be confused with SCSS)
			// however we can at least still at least provide Emmet completions in SASS blocks
			return getEmmetCompletions(document, position, 'sass', this.configManager.getEmmetConfig()) || null;
		}

		const cssLang = extractLanguage(cssDocument);
		const langService = getLanguageService(cssLang);

		const emmetResults: CompletionList = {
			isIncomplete: true,
			items: [],
		};

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

	getDocumentColors(document: AstroDocument): ColorInformation[] {
		if (!this.featureEnabled('documentColors')) {
			return [];
		}

		const allColorInfo = this.getCSSDocumentsForDocument(document).map((cssDoc) => {
			const cssLang = extractLanguage(cssDoc);
			const langService = getLanguageService(cssLang);

			if (shouldExcludeColor(cssLang)) {
				return [];
			}

			return langService
				.findDocumentColors(cssDoc, cssDoc.stylesheet)
				.map((colorInfo) => mapObjWithRangeToOriginal(cssDoc, colorInfo));
		});

		return flatten(allColorInfo);
	}

	getColorPresentations(document: AstroDocument, range: Range, color: Color): ColorPresentation[] {
		if (!this.featureEnabled('colorPresentations')) {
			return [];
		}

		const allColorPres = this.getCSSDocumentsForDocument(document).map((cssDoc) => {
			const cssLang = extractLanguage(cssDoc);
			const langService = getLanguageService(cssLang);

			if ((!cssDoc.isInGenerated(range.start) && !cssDoc.isInGenerated(range.end)) || shouldExcludeColor(cssLang)) {
				return [];
			}

			return langService
				.getColorPresentations(cssDoc, cssDoc.stylesheet, color, mapRangeToGenerated(cssDoc, range))
				.map((colorPres) => mapColorPresentationToOriginal(cssDoc, colorPres));
		});

		return flatten(allColorPres);
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

	private getCSSDocumentsForDocument(document: AstroDocument) {
		return document.styleTags.map((tag) => this.getCSSDocumentForStyleTag(tag, document));
	}

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

	private featureEnabled(feature: keyof LSCSSConfig) {
		return this.configManager.enabled('css.enabled') && this.configManager.enabled(`css.${feature}.enabled`);
	}
}

/**
 * Exclude certain language when getting colors
 * The CSS language service only supports CSS, LESS and SCSS,
 * which mean that we cannot support colors in other languages
 */
function shouldExcludeColor(document: CSSDocument | string) {
	const language = typeof document === 'string' ? document : extractLanguage(document);
	switch (language) {
		case 'sass':
		case 'stylus':
		case 'styl':
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
