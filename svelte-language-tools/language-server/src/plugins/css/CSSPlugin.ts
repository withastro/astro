import { doComplete as doEmmetComplete } from 'vscode-emmet-helper';
import {
    Color,
    ColorInformation,
    ColorPresentation,
    CompletionContext,
    CompletionList,
    CompletionTriggerKind,
    Diagnostic,
    Hover,
    Position,
    Range,
    SymbolInformation,
    CompletionItem,
    CompletionItemKind,
    SelectionRange
} from 'vscode-languageserver';
import {
    Document,
    DocumentManager,
    mapColorPresentationToOriginal,
    mapCompletionItemToOriginal,
    mapRangeToGenerated,
    mapSymbolInformationToOriginal,
    mapObjWithRangeToOriginal,
    mapHoverToParent,
    mapSelectionRangeToParent,
    isInTag
} from '../../lib/documents';
import { LSConfigManager, LSCSSConfig } from '../../ls-config';
import {
    ColorPresentationsProvider,
    CompletionsProvider,
    DiagnosticsProvider,
    DocumentColorsProvider,
    DocumentSymbolsProvider,
    HoverProvider,
    SelectionRangeProvider
} from '../interfaces';
import { CSSDocument, CSSDocumentBase } from './CSSDocument';
import { getLanguage, getLanguageService } from './service';
import { GlobalVars } from './global-vars';
import { getIdClassCompletion } from './features/getIdClassCompletion';
import { AttributeContext, getAttributeContextAtPosition } from '../../lib/documents/parseHtml';
import { StyleAttributeDocument } from './StyleAttributeDocument';

export class CSSPlugin
    implements
        HoverProvider,
        CompletionsProvider,
        DiagnosticsProvider,
        DocumentColorsProvider,
        ColorPresentationsProvider,
        DocumentSymbolsProvider,
        SelectionRangeProvider
{
    __name = 'css';
    private configManager: LSConfigManager;
    private cssDocuments = new WeakMap<Document, CSSDocument>();
    private triggerCharacters = ['.', ':', '-', '/'];
    private globalVars = new GlobalVars();

    constructor(docManager: DocumentManager, configManager: LSConfigManager) {
        this.configManager = configManager;
        this.updateConfigs();

        this.globalVars.watchFiles(this.configManager.get('css.globals'));
        this.configManager.onChange((config) => {
            this.globalVars.watchFiles(config.get('css.globals'));
            this.updateConfigs();
        });

        docManager.on('documentChange', (document) =>
            this.cssDocuments.set(document, new CSSDocument(document))
        );
        docManager.on('documentClose', (document) => this.cssDocuments.delete(document));
    }

    getSelectionRange(document: Document, position: Position): SelectionRange | null {
        if (!this.featureEnabled('selectionRange') || !isInTag(position, document.styleInfo)) {
            return null;
        }

        const cssDocument = this.getCSSDoc(document);
        const [range] = getLanguageService(extractLanguage(cssDocument)).getSelectionRanges(
            cssDocument,
            [cssDocument.getGeneratedPosition(position)],
            cssDocument.stylesheet
        );

        if (!range) {
            return null;
        }

        return mapSelectionRangeToParent(cssDocument, range);
    }

    getDiagnostics(document: Document): Diagnostic[] {
        if (!this.featureEnabled('diagnostics')) {
            return [];
        }

        const cssDocument = this.getCSSDoc(document);
        const kind = extractLanguage(cssDocument);

        if (shouldExcludeValidation(kind)) {
            return [];
        }

        return getLanguageService(kind)
            .doValidation(cssDocument, cssDocument.stylesheet)
            .map((diagnostic) => ({ ...diagnostic, source: getLanguage(kind) }))
            .map((diagnostic) => mapObjWithRangeToOriginal(cssDocument, diagnostic));
    }

    doHover(document: Document, position: Position): Hover | null {
        if (!this.featureEnabled('hover')) {
            return null;
        }

        const cssDocument = this.getCSSDoc(document);
        if (shouldExcludeHover(cssDocument)) {
            return null;
        }
        if (cssDocument.isInGenerated(position)) {
            return this.doHoverInternal(cssDocument, position);
        }
        const attributeContext = getAttributeContextAtPosition(document, position);
        if (
            attributeContext &&
            this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())
        ) {
            const [start, end] = attributeContext.valueRange;
            return this.doHoverInternal(new StyleAttributeDocument(document, start, end), position);
        }

        return null;
    }
    private doHoverInternal(cssDocument: CSSDocumentBase, position: Position) {
        const hoverInfo = getLanguageService(extractLanguage(cssDocument)).doHover(
            cssDocument,
            cssDocument.getGeneratedPosition(position),
            cssDocument.stylesheet
        );
        return hoverInfo ? mapHoverToParent(cssDocument, hoverInfo) : hoverInfo;
    }

    getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext
    ): CompletionList | null {
        const triggerCharacter = completionContext?.triggerCharacter;
        const triggerKind = completionContext?.triggerKind;
        const isCustomTriggerCharacter = triggerKind === CompletionTriggerKind.TriggerCharacter;

        if (
            isCustomTriggerCharacter &&
            triggerCharacter &&
            !this.triggerCharacters.includes(triggerCharacter)
        ) {
            return null;
        }

        if (!this.featureEnabled('completions')) {
            return null;
        }

        const cssDocument = this.getCSSDoc(document);

        if (cssDocument.isInGenerated(position)) {
            return this.getCompletionsInternal(document, position, cssDocument);
        }

        const attributeContext = getAttributeContextAtPosition(document, position);
        if (!attributeContext) {
            return null;
        }

        if (this.inStyleAttributeWithoutInterpolation(attributeContext, document.getText())) {
            const [start, end] = attributeContext.valueRange;
            return this.getCompletionsInternal(
                document,
                position,
                new StyleAttributeDocument(document, start, end)
            );
        } else {
            return getIdClassCompletion(cssDocument, attributeContext);
        }
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

    private getCompletionsInternal(
        document: Document,
        position: Position,
        cssDocument: CSSDocumentBase
    ) {
        if (isSASS(cssDocument)) {
            // the css language service does not support sass, still we can use
            // the emmet helper directly to at least get emmet completions
            return (
                doEmmetComplete(document, position, 'sass', this.configManager.getEmmetConfig()) ||
                null
            );
        }

        const type = extractLanguage(cssDocument);
        if (shouldExcludeCompletion(type)) {
            return null;
        }

        const lang = getLanguageService(type);
        let emmetResults: CompletionList = {
            isIncomplete: false,
            items: []
        };
        if (
            this.configManager.getConfig().css.completions.emmet &&
            this.configManager.getEmmetConfig().showExpandedAbbreviation !== 'never'
        ) {
            lang.setCompletionParticipants([
                {
                    onCssProperty: (context) => {
                        if (context?.propertyName) {
                            emmetResults =
                                doEmmetComplete(
                                    cssDocument,
                                    cssDocument.getGeneratedPosition(position),
                                    getLanguage(type),
                                    this.configManager.getEmmetConfig()
                                ) || emmetResults;
                        }
                    },
                    onCssPropertyValue: (context) => {
                        if (context?.propertyValue) {
                            emmetResults =
                                doEmmetComplete(
                                    cssDocument,
                                    cssDocument.getGeneratedPosition(position),
                                    getLanguage(type),
                                    this.configManager.getEmmetConfig()
                                ) || emmetResults;
                        }
                    }
                }
            ]);
        }

        const results = lang.doComplete(
            cssDocument,
            cssDocument.getGeneratedPosition(position),
            cssDocument.stylesheet
        );
        return CompletionList.create(
            this.appendGlobalVars(
                [...(results ? results.items : []), ...emmetResults.items].map((completionItem) =>
                    mapCompletionItemToOriginal(cssDocument, completionItem)
                )
            ),
            // Emmet completions change on every keystroke, so they are never complete
            emmetResults.items.length > 0
        );
    }

    private appendGlobalVars(items: CompletionItem[]): CompletionItem[] {
        // Finding one value with that item kind means we are in a value completion scenario
        const value = items.find((item) => item.kind === CompletionItemKind.Value);
        if (!value) {
            return items;
        }

        const additionalItems: CompletionItem[] = this.globalVars
            .getGlobalVars()
            .map((globalVar) => ({
                label: `var(${globalVar.name})`,
                sortText: '-',
                detail: `${globalVar.filename}\n\n${globalVar.name}: ${globalVar.value}`,
                kind: CompletionItemKind.Value
            }));
        return [...items, ...additionalItems];
    }

    getDocumentColors(document: Document): ColorInformation[] {
        if (!this.featureEnabled('documentColors')) {
            return [];
        }

        const cssDocument = this.getCSSDoc(document);

        if (shouldExcludeColor(cssDocument)) {
            return [];
        }

        return getLanguageService(extractLanguage(cssDocument))
            .findDocumentColors(cssDocument, cssDocument.stylesheet)
            .map((colorInfo) => mapObjWithRangeToOriginal(cssDocument, colorInfo));
    }

    getColorPresentations(document: Document, range: Range, color: Color): ColorPresentation[] {
        if (!this.featureEnabled('colorPresentations')) {
            return [];
        }

        const cssDocument = this.getCSSDoc(document);
        if (
            (!cssDocument.isInGenerated(range.start) && !cssDocument.isInGenerated(range.end)) ||
            shouldExcludeColor(cssDocument)
        ) {
            return [];
        }

        return getLanguageService(extractLanguage(cssDocument))
            .getColorPresentations(
                cssDocument,
                cssDocument.stylesheet,
                color,
                mapRangeToGenerated(cssDocument, range)
            )
            .map((colorPres) => mapColorPresentationToOriginal(cssDocument, colorPres));
    }

    getDocumentSymbols(document: Document): SymbolInformation[] {
        if (!this.featureEnabled('documentColors')) {
            return [];
        }

        const cssDocument = this.getCSSDoc(document);

        if (shouldExcludeDocumentSymbols(cssDocument)) {
            return [];
        }

        return getLanguageService(extractLanguage(cssDocument))
            .findDocumentSymbols(cssDocument, cssDocument.stylesheet)
            .map((symbol) => {
                if (!symbol.containerName) {
                    return {
                        ...symbol,
                        // TODO: this could contain other things, e.g. style.myclass
                        containerName: 'style'
                    };
                }

                return symbol;
            })
            .map((symbol) => mapSymbolInformationToOriginal(cssDocument, symbol));
    }

    private getCSSDoc(document: Document) {
        let cssDoc = this.cssDocuments.get(document);
        if (!cssDoc || cssDoc.version < document.version) {
            cssDoc = new CSSDocument(document);
            this.cssDocuments.set(document, cssDoc);
        }
        return cssDoc;
    }

    private updateConfigs() {
        getLanguageService('css')?.configure(this.configManager.getCssConfig());
        getLanguageService('scss')?.configure(this.configManager.getScssConfig());
        getLanguageService('less')?.configure(this.configManager.getLessConfig());
    }

    private featureEnabled(feature: keyof LSCSSConfig) {
        return (
            this.configManager.enabled('css.enable') &&
            this.configManager.enabled(`css.${feature}.enable`)
        );
    }
}

function shouldExcludeValidation(kind?: string) {
    switch (kind) {
        case 'postcss':
        case 'sass':
        case 'stylus':
        case 'styl':
            return true;
        default:
            return false;
    }
}

function shouldExcludeCompletion(kind?: string) {
    switch (kind) {
        case 'stylus':
        case 'styl':
            return true;
        default:
            return false;
    }
}

function shouldExcludeDocumentSymbols(document: CSSDocument) {
    switch (extractLanguage(document)) {
        case 'sass':
        case 'stylus':
        case 'styl':
            return true;
        default:
            return false;
    }
}

function shouldExcludeHover(document: CSSDocument) {
    switch (extractLanguage(document)) {
        case 'sass':
        case 'stylus':
        case 'styl':
            return true;
        default:
            return false;
    }
}

function shouldExcludeColor(document: CSSDocument) {
    switch (extractLanguage(document)) {
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
