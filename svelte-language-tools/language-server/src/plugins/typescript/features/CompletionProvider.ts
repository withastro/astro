import ts from 'typescript';
import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionList,
    CompletionTriggerKind,
    MarkupContent,
    MarkupKind,
    Position,
    Range,
    TextDocumentIdentifier,
    TextEdit
} from 'vscode-languageserver';
import {
    Document,
    getNodeIfIsInHTMLStartTag,
    getNodeIfIsInStartTag,
    getWordRangeAt,
    isInTag,
    mapCompletionItemToOriginal,
    mapRangeToOriginal,
    toRange
} from '../../../lib/documents';
import { LSConfigManager } from '../../../ls-config';
import { flatten, getRegExpMatches, isNotNullOrUndefined, pathToUrl } from '../../../utils';
import { AppCompletionItem, AppCompletionList, CompletionsProvider } from '../../interfaces';
import { ComponentPartInfo } from '../ComponentInfoProvider';
import { SvelteDocumentSnapshot, SvelteSnapshotFragment } from '../DocumentSnapshot';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { getMarkdownDocumentation } from '../previewer';
import {
    changeSvelteComponentName,
    convertRange,
    getCommitCharactersForScriptElement,
    isInScript,
    scriptElementKindToCompletionItemKind
} from '../utils';
import { getJsDocTemplateCompletion } from './getJsDocTemplateCompletion';
import { getComponentAtPosition, isPartOfImportStatement } from './utils';

export interface CompletionEntryWithIdentifer extends ts.CompletionEntry, TextDocumentIdentifier {
    position: Position;
}

type validTriggerCharacter = '.' | '"' | "'" | '`' | '/' | '@' | '<' | '#';

type LastCompletion = {
    key: string;
    position: Position;
    completionList: AppCompletionList<CompletionEntryWithIdentifer> | null;
};

export class CompletionsProviderImpl implements CompletionsProvider<CompletionEntryWithIdentifer> {
    constructor(
        private readonly lsAndTsDocResolver: LSAndTSDocResolver,
        private readonly configManager: LSConfigManager
    ) {}

    /**
     * The language service throws an error if the character is not a valid trigger character.
     * Also, the completions are worse.
     * Therefore, only use the characters the typescript compiler treats as valid.
     */
    private readonly validTriggerCharacters = ['.', '"', "'", '`', '/', '@', '<', '#'] as const;
    /**
     * For performance reasons, try to reuse the last completion if possible.
     */
    private lastCompletion?: LastCompletion;

    private isValidTriggerCharacter(
        character: string | undefined
    ): character is validTriggerCharacter {
        return this.validTriggerCharacters.includes(character as validTriggerCharacter);
    }

    async getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext,
        cancellationToken?: CancellationToken
    ): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
        if (isInTag(position, document.styleInfo)) {
            return null;
        }

        const { lang, tsDoc, userPreferences } = await this.lsAndTsDocResolver.getLSAndTSDoc(
            document
        );

        const filePath = tsDoc.filePath;
        if (!filePath) {
            return null;
        }

        const triggerCharacter = completionContext?.triggerCharacter;
        const triggerKind = completionContext?.triggerKind;

        const validTriggerCharacter = this.isValidTriggerCharacter(triggerCharacter)
            ? triggerCharacter
            : undefined;
        const isCustomTriggerCharacter = triggerKind === CompletionTriggerKind.TriggerCharacter;
        const isJsDocTriggerCharacter = triggerCharacter === '*';
        const isEventOrSlotLetTriggerCharacter = triggerCharacter === ':';

        // ignore any custom trigger character specified in server capabilities
        //  and is not allow by ts
        if (
            isCustomTriggerCharacter &&
            !validTriggerCharacter &&
            !isJsDocTriggerCharacter &&
            !isEventOrSlotLetTriggerCharacter
        ) {
            return null;
        }

        if (
            this.canReuseLastCompletion(
                this.lastCompletion,
                triggerKind,
                triggerCharacter,
                document,
                position
            )
        ) {
            this.lastCompletion.position = position;
            return this.lastCompletion.completionList;
        } else {
            this.lastCompletion = undefined;
        }

        const fragment = tsDoc.getFragment();
        if (!fragment.isInGenerated(position)) {
            return null;
        }

        const originalOffset = document.offsetAt(position);
        const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));

        if (isJsDocTriggerCharacter) {
            return getJsDocTemplateCompletion(fragment, lang, filePath, offset);
        }

        const svelteNode = tsDoc.svelteNodeAt(originalOffset);
        if (
            // Cursor is somewhere in regular HTML text
            (svelteNode?.type === 'Text' &&
                ['Element', 'InlineComponent', 'Fragment', 'SlotTemplate'].includes(
                    svelteNode.parent?.type as any
                )) ||
            // Cursor is at <div>|</div> in which case there's no TextNode inbetween
            document.getText().substring(originalOffset - 1, originalOffset + 2) === '></'
        ) {
            return null;
        }

        if (cancellationToken?.isCancellationRequested) {
            return null;
        }

        const wordRange = getWordRangeAt(document.getText(), originalOffset, {
            left: /[^\s.]+$/,
            right: /[^\w$:]/
        });

        const eventAndSlotLetCompletions = this.getEventAndSlotLetCompletions(
            lang,
            document,
            tsDoc,
            position,
            wordRange
        );

        if (isEventOrSlotLetTriggerCharacter) {
            return CompletionList.create(eventAndSlotLetCompletions, !!tsDoc.parserError);
        }

        if (cancellationToken?.isCancellationRequested) {
            return null;
        }

        const completions =
            lang.getCompletionsAtPosition(filePath, offset, {
                ...userPreferences,
                triggerCharacter: validTriggerCharacter
            })?.entries || [];

        if (completions.length === 0 && eventAndSlotLetCompletions.length === 0) {
            return tsDoc.parserError ? CompletionList.create([], true) : null;
        }

        const existingImports = this.getExistingImports(document);
        const wordRangeStartPosition = document.positionAt(wordRange.start);
        const completionItems = completions
            .filter(isValidCompletion(document, position))
            .map((comp) =>
                this.toCompletionItem(
                    fragment,
                    comp,
                    pathToUrl(tsDoc.filePath),
                    position,
                    existingImports
                )
            )
            .filter(isNotNullOrUndefined)
            .map((comp) => mapCompletionItemToOriginal(fragment, comp))
            .map((comp) => this.fixTextEditRange(wordRangeStartPosition, comp))
            .concat(eventAndSlotLetCompletions);

        const completionList = CompletionList.create(completionItems, !!tsDoc.parserError);
        this.lastCompletion = { key: document.getFilePath() || '', position, completionList };

        return completionList;
    }

    private canReuseLastCompletion(
        lastCompletion: LastCompletion | undefined,
        triggerKind: number | undefined,
        triggerCharacter: string | undefined,
        document: Document,
        position: Position
    ): lastCompletion is LastCompletion {
        return (
            !!lastCompletion &&
            lastCompletion.key === document.getFilePath() &&
            lastCompletion.position.line === position.line &&
            ((Math.abs(lastCompletion.position.character - position.character) < 2 &&
                (triggerKind === CompletionTriggerKind.TriggerForIncompleteCompletions ||
                    // Special case: `.` is a trigger character, but inside import path completions
                    // it shouldn't trigger another completion because we can reuse the old one
                    (triggerCharacter === '.' &&
                        isPartOfImportStatement(document.getText(), position)))) ||
                // `let:` or `on:` -> up to 3 previous characters allowed
                (Math.abs(lastCompletion.position.character - position.character) < 4 &&
                    triggerCharacter === ':' &&
                    !!getNodeIfIsInStartTag(document.html, document.offsetAt(position))))
        );
    }

    private getExistingImports(document: Document) {
        const rawImports = getRegExpMatches(scriptImportRegex, document.getText()).map((match) =>
            (match[1] ?? match[2]).split(',')
        );
        const tidiedImports = flatten(rawImports).map((match) => match.trim());
        return new Set(tidiedImports);
    }

    private getEventAndSlotLetCompletions(
        lang: ts.LanguageService,
        doc: Document,
        tsDoc: SvelteDocumentSnapshot,
        originalPosition: Position,
        wordRange: { start: number; end: number }
    ): Array<AppCompletionItem<CompletionEntryWithIdentifer>> {
        const componentInfo = getComponentAtPosition(lang, doc, tsDoc, originalPosition);
        if (!componentInfo) {
            return [];
        }

        const { start, end } = wordRange;
        const events = componentInfo.getEvents().map((event) => mapToCompletionEntry(event, 'on:'));
        const slotLets = componentInfo
            .getSlotLets()
            .map((slot) => mapToCompletionEntry(slot, 'let:'));
        return [...events, ...slotLets];

        function mapToCompletionEntry(info: ComponentPartInfo[0], prefix: string) {
            const slotName = prefix + info.name;
            return {
                label: slotName,
                sortText: '-1',
                detail: info.name + ': ' + info.type,
                documentation: info.doc && { kind: MarkupKind.Markdown, value: info.doc },
                textEdit:
                    start !== end
                        ? TextEdit.replace(toRange(doc.getText(), start, end), slotName)
                        : undefined
            };
        }
    }

    private toCompletionItem(
        fragment: SvelteSnapshotFragment,
        comp: ts.CompletionEntry,
        uri: string,
        position: Position,
        existingImports: Set<string>
    ): AppCompletionItem<CompletionEntryWithIdentifer> | null {
        const completionLabelAndInsert = this.getCompletionLabelAndInsert(fragment, comp);
        if (!completionLabelAndInsert) {
            return null;
        }

        const { label, insertText, isSvelteComp, replacementSpan } = completionLabelAndInsert;
        // TS may suggest another Svelte component even if there already exists an import
        // with the same name, because under the hood every Svelte component is postfixed
        // with `__SvelteComponent`. In this case, filter out this completion by returning null.
        if (isSvelteComp && existingImports.has(label)) {
            return null;
        }
        const textEdit = replacementSpan
            ? TextEdit.replace(convertRange(fragment, replacementSpan), insertText ?? label)
            : undefined;

        return {
            label,
            insertText,
            kind: scriptElementKindToCompletionItemKind(comp.kind),
            commitCharacters: getCommitCharactersForScriptElement(comp.kind),
            // Make sure svelte component takes precedence
            sortText: isSvelteComp ? '-1' : comp.sortText,
            preselect: isSvelteComp ? true : comp.isRecommended,
            textEdit,
            // pass essential data for resolving completion
            data: {
                ...comp,
                uri,
                position
            }
        };
    }

    private getCompletionLabelAndInsert(
        fragment: SvelteSnapshotFragment,
        comp: ts.CompletionEntry
    ) {
        let { name, insertText, kindModifiers } = comp;
        const isScriptElement = comp.kind === ts.ScriptElementKind.scriptElement;
        const hasModifier = Boolean(comp.kindModifiers);
        const isSvelteComp = this.isSvelteComponentImport(name);
        if (isSvelteComp) {
            name = changeSvelteComponentName(name);

            if (this.isExistingSvelteComponentImport(fragment, name, comp.source)) {
                return null;
            }
        }

        if (isScriptElement && hasModifier) {
            const label =
                kindModifiers && !name.endsWith(kindModifiers) ? name + kindModifiers : name;
            return {
                insertText: name,
                label,
                isSvelteComp
            };
        }

        if (comp.replacementSpan) {
            return {
                label: name,
                isSvelteComp,
                insertText: insertText ? changeSvelteComponentName(insertText) : undefined,
                replacementSpan: comp.replacementSpan
            };
        }

        return {
            label: name,
            isSvelteComp
        };
    }

    private isExistingSvelteComponentImport(
        fragment: SvelteSnapshotFragment,
        name: string,
        source?: string
    ): boolean {
        const importStatement = new RegExp(`import ${name} from ["'\`][\\s\\S]+\\.svelte["'\`]`);
        return !!source && !!fragment.text.match(importStatement);
    }

    /**
     * If the textEdit is out of the word range of the triggered position
     * vscode would refuse to show the completions
     * split those edits into additionalTextEdit to fix it
     */
    private fixTextEditRange(wordRangePosition: Position, completionItem: CompletionItem) {
        const { textEdit } = completionItem;
        if (!textEdit || !TextEdit.is(textEdit)) {
            return completionItem;
        }

        const {
            newText,
            range: { start }
        } = textEdit;

        const wordRangeStartCharacter = wordRangePosition.character;
        if (
            wordRangePosition.line !== wordRangePosition.line ||
            start.character > wordRangePosition.character
        ) {
            return completionItem;
        }

        textEdit.newText = newText.substring(wordRangeStartCharacter - start.character);
        textEdit.range.start = {
            line: start.line,
            character: wordRangeStartCharacter
        };
        completionItem.additionalTextEdits = [
            TextEdit.replace(
                {
                    start,
                    end: {
                        line: start.line,
                        character: wordRangeStartCharacter
                    }
                },
                newText.substring(0, wordRangeStartCharacter - start.character)
            )
        ];

        return completionItem;
    }

    /**
     * TypeScript throws a debug assertion error if the importModuleSpecifierEnding config is
     * 'js' and there's an unknown file extension - which is the case for `.svelte`. Therefore
     * rewrite the importModuleSpecifierEnding for this case to silence the error.
     */
    fixUserPreferencesForSvelteComponentImport(
        userPreferences: ts.UserPreferences
    ): ts.UserPreferences {
        if (userPreferences.importModuleSpecifierEnding === 'js') {
            return {
                ...userPreferences,
                importModuleSpecifierEnding: 'index'
            };
        }

        return userPreferences;
    }

    async resolveCompletion(
        document: Document,
        completionItem: AppCompletionItem<CompletionEntryWithIdentifer>,
        cancellationToken?: CancellationToken
    ): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
        const { data: comp } = completionItem;
        const { tsDoc, lang, userPreferences } = await this.lsAndTsDocResolver.getLSAndTSDoc(
            document
        );

        const filePath = tsDoc.filePath;

        if (!comp || !filePath || cancellationToken?.isCancellationRequested) {
            return completionItem;
        }

        const fragment = tsDoc.getFragment();
        const errorPreventingUserPreferences = comp.source?.endsWith('.svelte')
            ? this.fixUserPreferencesForSvelteComponentImport(userPreferences)
            : userPreferences;

        const detail = lang.getCompletionEntryDetails(
            filePath,
            fragment.offsetAt(fragment.getGeneratedPosition(comp.position)),
            comp.name,
            {},
            comp.source,
            errorPreventingUserPreferences,
            comp.data
        );

        if (detail) {
            const { detail: itemDetail, documentation: itemDocumentation } =
                this.getCompletionDocument(detail);

            completionItem.detail = itemDetail;
            completionItem.documentation = itemDocumentation;
        }

        const actions = detail?.codeActions;
        const isImport = !!detail?.source;

        if (actions) {
            const edit: TextEdit[] = [];

            for (const action of actions) {
                for (const change of action.changes) {
                    edit.push(
                        ...this.codeActionChangesToTextEdit(
                            document,
                            fragment,
                            change,
                            isImport,
                            comp.position
                        )
                    );
                }
            }

            completionItem.additionalTextEdits = (completionItem.additionalTextEdits ?? []).concat(
                edit
            );
        }

        return completionItem;
    }

    private getCompletionDocument(compDetail: ts.CompletionEntryDetails) {
        const { sourceDisplay, documentation: tsDocumentation, displayParts, tags } = compDetail;
        let detail: string = changeSvelteComponentName(ts.displayPartsToString(displayParts));

        if (sourceDisplay) {
            const importPath = ts.displayPartsToString(sourceDisplay);
            detail = `Auto import from ${importPath}\n${detail}`;
        }

        const markdownDoc = getMarkdownDocumentation(tsDocumentation, tags);
        const documentation: MarkupContent | undefined = markdownDoc
            ? { value: markdownDoc, kind: MarkupKind.Markdown }
            : undefined;

        return {
            documentation,
            detail
        };
    }

    private codeActionChangesToTextEdit(
        doc: Document,
        fragment: SvelteSnapshotFragment,
        changes: ts.FileTextChanges,
        isImport: boolean,
        originalTriggerPosition: Position
    ): TextEdit[] {
        return changes.textChanges.map((change) =>
            this.codeActionChangeToTextEdit(
                doc,
                fragment,
                change,
                isImport,
                originalTriggerPosition
            )
        );
    }

    codeActionChangeToTextEdit(
        doc: Document,
        fragment: SvelteSnapshotFragment,
        change: ts.TextChange,
        isImport: boolean,
        originalTriggerPosition: Position
    ): TextEdit {
        change.newText = this.changeComponentImport(
            change.newText,
            isInScript(originalTriggerPosition, doc)
        );

        const scriptTagInfo = fragment.scriptInfo || fragment.moduleScriptInfo;
        if (!scriptTagInfo) {
            // no script tag defined yet, add it.
            const lang = this.configManager.getConfig().svelte.defaultScriptLanguage;
            const scriptLang = lang === 'none' ? '' : ` lang="${lang}"`;

            return TextEdit.replace(
                beginOfDocumentRange,
                `<script${scriptLang}>${ts.sys.newLine}${change.newText}</script>${ts.sys.newLine}`
            );
        }

        const { span } = change;

        const virtualRange = convertRange(fragment, span);
        let range: Range;
        const isNewImport = isImport && virtualRange.start.character === 0;

        // Since new import always can't be mapped, we'll have special treatment here
        //  but only hack this when there is multiple line in script
        if (isNewImport && virtualRange.start.line > 1) {
            range = this.mapRangeForNewImport(fragment, virtualRange);
        } else {
            range = mapRangeToOriginal(fragment, virtualRange);
        }

        // If range is somehow not mapped in parent,
        // the import is mapped wrong or is outside script tag,
        // use script starting point instead.
        // This happens among other things if the completion is the first import of the file.
        if (
            range.start.line === -1 ||
            (range.start.line === 0 && range.start.character <= 1 && span.length === 0) ||
            !isInScript(range.start, fragment)
        ) {
            range = convertRange(doc, {
                start: isInTag(originalTriggerPosition, doc.scriptInfo)
                    ? fragment.scriptInfo?.start || scriptTagInfo.start
                    : isInTag(originalTriggerPosition, doc.moduleScriptInfo)
                    ? fragment.moduleScriptInfo?.start || scriptTagInfo.start
                    : scriptTagInfo.start,
                length: span.length
            });
        }
        // prevent newText from being placed like this: <script>import {} from ''
        const editOffset = doc.offsetAt(range.start);
        if (
            (editOffset === fragment.scriptInfo?.start ||
                editOffset === fragment.moduleScriptInfo?.start) &&
            !change.newText.startsWith('\r\n') &&
            !change.newText.startsWith('\n')
        ) {
            change.newText = ts.sys.newLine + change.newText;
        }

        return TextEdit.replace(range, change.newText);
    }

    private mapRangeForNewImport(fragment: SvelteSnapshotFragment, virtualRange: Range) {
        const sourceMappableRange = this.offsetLinesAndMovetoStartOfLine(virtualRange, -1);
        const mappableRange = mapRangeToOriginal(fragment, sourceMappableRange);
        return this.offsetLinesAndMovetoStartOfLine(mappableRange, 1);
    }

    private offsetLinesAndMovetoStartOfLine({ start, end }: Range, offsetLines: number) {
        return Range.create(
            Position.create(start.line + offsetLines, 0),
            Position.create(end.line + offsetLines, 0)
        );
    }

    private isSvelteComponentImport(className: string) {
        return className.endsWith('__SvelteComponent_');
    }

    private changeComponentImport(importText: string, actionTriggeredInScript: boolean) {
        const changedName = changeSvelteComponentName(importText);
        if (importText !== changedName || !actionTriggeredInScript) {
            // For some reason, TS sometimes adds the `type` modifier. Remove it
            // in case of Svelte component imports or if import triggered from markup.
            return changedName.replace(' type ', ' ');
        }

        return importText;
    }
}

const beginOfDocumentRange = Range.create(Position.create(0, 0), Position.create(0, 0));

// `import {...} from '..'` or `import ... from '..'`
// Note: Does not take into account if import is within a comment.
// eslint-disable-next-line max-len
const scriptImportRegex =
    /\bimport\s+{([^}]*?)}\s+?from\s+['"`].+?['"`]|\bimport\s+(\w+?)\s+from\s+['"`].+?['"`]/g;

// Type definitions from svelte-shims.d.ts that shouldn't appear in completion suggestions
// because they are meant to be used "behind the scenes"
const svelte2tsxTypes = new Set([
    'Svelte2TsxComponent',
    'Svelte2TsxComponentConstructorParameters',
    'SvelteComponentConstructor',
    'SvelteActionReturnType',
    'SvelteTransitionConfig',
    'SvelteTransitionReturnType',
    'SvelteAnimationReturnType',
    'SvelteWithOptionalProps',
    'SvelteAllProps',
    'SveltePropsAnyFallback',
    'SvelteSlotsAnyFallback',
    'SvelteRestProps',
    'SvelteSlots',
    'SvelteStore'
]);

function isValidCompletion(
    document: Document,
    position: Position
): (value: ts.CompletionEntry) => boolean {
    const isNoSvelte2tsxCompletion = (value: ts.CompletionEntry) =>
        value.kindModifiers !== 'declare' ||
        (!value.name.startsWith('__sveltets_') && !svelte2tsxTypes.has(value.name));

    const isCompletionInHTMLStartTag = !!getNodeIfIsInHTMLStartTag(
        document.html,
        document.offsetAt(position)
    );
    if (!isCompletionInHTMLStartTag) {
        return isNoSvelte2tsxCompletion;
    }
    // TODO with the new transformation this is ts.ScriptElementKind.memberVariableElement
    // which is also true for all properties of any other object -> how reliably filter this out?
    // ---> another /*ignore*/ pragma?
    // ---> OR: make these lower priority if we find out they are inside a html start tag
    return (value) =>
        // Remove jsx attributes on html tags because they are doubled by the HTML
        // attribute suggestions, and for events they are wrong (onX instead of on:X).
        // Therefore filter them out.
        value.kind !== ts.ScriptElementKind.jsxAttribute && isNoSvelte2tsxCompletion(value);
}
