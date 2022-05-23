import { doComplete as doEmmetComplete } from 'vscode-emmet-helper';
import {
    getLanguageService,
    HTMLDocument,
    CompletionItem as HtmlCompletionItem,
    Node
} from 'vscode-html-languageservice';
import {
    CompletionList,
    Hover,
    Position,
    SymbolInformation,
    CompletionItem,
    CompletionItemKind,
    TextEdit,
    Range,
    WorkspaceEdit,
    LinkedEditingRanges
} from 'vscode-languageserver';
import {
    DocumentManager,
    Document,
    isInTag,
    getNodeIfIsInComponentStartTag
} from '../../lib/documents';
import { LSConfigManager, LSHTMLConfig } from '../../ls-config';
import { svelteHtmlDataProvider } from './dataProvider';
import {
    HoverProvider,
    CompletionsProvider,
    RenameProvider,
    LinkedEditingRangesProvider
} from '../interfaces';
import { isInsideMoustacheTag, toRange } from '../../lib/documents/utils';
import { possiblyComponent } from '../../utils';

export class HTMLPlugin
    implements HoverProvider, CompletionsProvider, RenameProvider, LinkedEditingRangesProvider
{
    __name = 'html';
    private configManager: LSConfigManager;
    private lang = getLanguageService({
        customDataProviders: [svelteHtmlDataProvider],
        useDefaultDataProvider: false
    });
    private documents = new WeakMap<Document, HTMLDocument>();
    private styleScriptTemplate = new Set(['template', 'style', 'script']);

    constructor(docManager: DocumentManager, configManager: LSConfigManager) {
        this.configManager = configManager;
        docManager.on('documentChange', (document) => {
            this.documents.set(document, document.html);
        });
    }

    doHover(document: Document, position: Position): Hover | null {
        if (!this.featureEnabled('hover')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        const node = html.findNodeAt(document.offsetAt(position));
        if (!node || possiblyComponent(node)) {
            return null;
        }

        return this.lang.doHover(document, position, html);
    }

    getCompletions(document: Document, position: Position): CompletionList | null {
        if (!this.featureEnabled('completions')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        if (
            this.isInsideMoustacheTag(html, document, position) ||
            isInTag(position, document.scriptInfo) ||
            isInTag(position, document.moduleScriptInfo)
        ) {
            return null;
        }

        let emmetResults: CompletionList = {
            isIncomplete: false,
            items: []
        };
        if (
            this.configManager.getConfig().html.completions.emmet &&
            this.configManager.getEmmetConfig().showExpandedAbbreviation !== 'never'
        ) {
            this.lang.setCompletionParticipants([
                {
                    onHtmlContent: () =>
                        (emmetResults =
                            doEmmetComplete(
                                document,
                                position,
                                'html',
                                this.configManager.getEmmetConfig()
                            ) || emmetResults)
                }
            ]);
        }

        const results = this.isInComponentTag(html, document, position)
            ? // Only allow emmet inside component element tags.
              // Other attributes/events would be false positives.
              CompletionList.create([])
            : this.lang.doComplete(document, position, html);
        const items = this.toCompletionItems(results.items);

        items.forEach((item) => {
            if (item.label.startsWith('on:') && item.textEdit) {
                item.textEdit = {
                    ...item.textEdit,
                    newText: item.textEdit.newText.replace('="$1"', '$2="$1"')
                };
            }
        });

        return CompletionList.create(
            [
                ...this.toCompletionItems(items),
                ...this.getLangCompletions(items),
                ...emmetResults.items
            ],
            // Emmet completions change on every keystroke, so they are never complete
            emmetResults.items.length > 0
        );
    }

    /**
     * The HTML language service uses newer types which clash
     * without the stable ones. Transform to the stable types.
     */
    private toCompletionItems(items: HtmlCompletionItem[]): CompletionItem[] {
        return items.map((item) => {
            if (!item.textEdit || TextEdit.is(item.textEdit)) {
                return <CompletionItem>item;
            }
            return {
                ...item,
                textEdit: TextEdit.replace(item.textEdit.replace, item.textEdit.newText)
            };
        });
    }

    private isInComponentTag(html: HTMLDocument, document: Document, position: Position) {
        return !!getNodeIfIsInComponentStartTag(html, document.offsetAt(position));
    }

    private getLangCompletions(completions: CompletionItem[]): CompletionItem[] {
        const styleScriptTemplateCompletions = completions.filter(
            (completion) =>
                completion.kind === CompletionItemKind.Property &&
                this.styleScriptTemplate.has(completion.label)
        );
        const langCompletions: CompletionItem[] = [];
        addLangCompletion('script', ['ts']);
        addLangCompletion('style', ['less', 'scss']);
        addLangCompletion('template', ['pug']);
        return langCompletions;

        function addLangCompletion(tag: string, languages: string[]) {
            const existingCompletion = styleScriptTemplateCompletions.find(
                (completion) => completion.label === tag
            );
            if (!existingCompletion) {
                return;
            }

            languages.forEach((lang) =>
                langCompletions.push({
                    ...existingCompletion,
                    label: `${tag} (lang="${lang}")`,
                    insertText:
                        existingCompletion.insertText &&
                        `${existingCompletion.insertText} lang="${lang}"`,
                    textEdit:
                        existingCompletion.textEdit && TextEdit.is(existingCompletion.textEdit)
                            ? {
                                  range: existingCompletion.textEdit.range,
                                  newText: `${existingCompletion.textEdit.newText} lang="${lang}"`
                              }
                            : undefined
                })
            );
        }
    }

    doTagComplete(document: Document, position: Position): string | null {
        if (!this.featureEnabled('tagComplete')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        if (this.isInsideMoustacheTag(html, document, position)) {
            return null;
        }

        return this.lang.doTagComplete(document, position, html);
    }

    private isInsideMoustacheTag(html: HTMLDocument, document: Document, position: Position) {
        const offset = document.offsetAt(position);
        const node = html.findNodeAt(offset);
        return isInsideMoustacheTag(document.getText(), node.start, offset);
    }

    getDocumentSymbols(document: Document): SymbolInformation[] {
        if (!this.featureEnabled('documentSymbols')) {
            return [];
        }

        const html = this.documents.get(document);
        if (!html) {
            return [];
        }

        return this.lang.findDocumentSymbols(document, html);
    }

    rename(document: Document, position: Position, newName: string): WorkspaceEdit | null {
        if (!this.featureEnabled('renameTags')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        const node = html.findNodeAt(document.offsetAt(position));
        if (!node || possiblyComponent(node)) {
            return null;
        }

        return this.lang.doRename(document, position, newName, html);
    }

    prepareRename(document: Document, position: Position): Range | null {
        if (!this.featureEnabled('renameTags')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        const offset = document.offsetAt(position);
        const node = html.findNodeAt(offset);
        if (!node || possiblyComponent(node) || !node.tag || !this.isRenameAtTag(node, offset)) {
            return null;
        }
        const tagNameStart = node.start + '<'.length;

        return toRange(document.getText(), tagNameStart, tagNameStart + node.tag.length);
    }

    getLinkedEditingRanges(document: Document, position: Position): LinkedEditingRanges | null {
        if (!this.featureEnabled('linkedEditing')) {
            return null;
        }

        const html = this.documents.get(document);
        if (!html) {
            return null;
        }

        const ranges = this.lang.findLinkedEditingRanges(document, position, html);

        if (!ranges) {
            return null;
        }

        return { ranges };
    }

    /**
     * Returns true if rename happens at the tag name, not anywhere inbetween.
     */
    private isRenameAtTag(node: Node, offset: number): boolean {
        if (!node.tag) {
            return false;
        }

        const startTagNameEnd = node.start + `<${node.tag}`.length;
        const isAtStartTag = offset > node.start && offset <= startTagNameEnd;
        const isAtEndTag =
            node.endTagStart !== undefined && offset >= node.endTagStart && offset < node.end;
        return isAtStartTag || isAtEndTag;
    }

    private featureEnabled(feature: keyof LSHTMLConfig) {
        return (
            this.configManager.enabled('html.enable') &&
            this.configManager.enabled(`html.${feature}.enable`)
        );
    }
}
