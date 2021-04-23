import { isInsideExpression, isInsideFrontmatter } from '../../../core/documents/utils';
import { Document } from '../../../core/documents';
import * as ts from 'typescript';
import {
    CompletionContext,
    CompletionList,
    CompletionItem,
    Position,
    TextDocumentIdentifier,
} from 'vscode-languageserver';
import { AppCompletionItem, AppCompletionList, CompletionsProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { scriptElementKindToCompletionItemKind, getCommitCharactersForScriptElement } from '../utils';


export interface CompletionEntryWithIdentifer extends ts.CompletionEntry, TextDocumentIdentifier {
    position: Position;
}

// const validTriggerCharacters = ['.', '"', "'", '`', '/', '@', '<', '#'] as const;
// type ValidTriggerCharacter = typeof validTriggerCharacters[number];

// const isValidTriggerCharacter = (
//     character: string | undefined
// ): character is ValidTriggerCharacter => {
//     return validTriggerCharacters.includes(character as ValidTriggerCharacter);
// }

export class CompletionsProviderImpl implements CompletionsProvider<CompletionEntryWithIdentifer> {
    
    constructor(private lang: LanguageServiceManager) {}

    async getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext
    ): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
        if (!isInsideFrontmatter(document.getText(), document.offsetAt(position))) {
            return null;
        }

        const filePath = document.getFilePath();
        if (!filePath) throw new Error();

        const { tsDoc, lang } = await this.lang.getTypeScriptDoc(document);
        const fragment = await tsDoc.getFragment();

        const { entries } = lang.getCompletionsAtPosition(fragment.filePath, document.offsetAt(position), {}) ?? { entries: [] };
        const completionItems = entries.map((entry: ts.CompletionEntry) => this.toCompletionItem(fragment, entry, document.uri, position, new Set())).filter(i => i) as CompletionItem[];

        return CompletionList.create(completionItems, true);

    }

    async resolveCompletion(
        document: Document,
        completionItem: AppCompletionItem<CompletionEntryWithIdentifer>
    ): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
        return completionItem;
    }

    private toCompletionItem(
        fragment: any,
        comp: ts.CompletionEntry,
        uri: string,
        position: Position,
        existingImports: Set<string>
    ): AppCompletionItem<CompletionEntryWithIdentifer> | null {
        const completionLabelAndInsert = this.getCompletionLabelAndInsert(fragment, comp);
        if (!completionLabelAndInsert) {
            return null;
        }

        const { label, insertText, isSvelteComp } = completionLabelAndInsert;
        // TS may suggest another Svelte component even if there already exists an import
        // with the same name, because under the hood every Svelte component is postfixed
        // with `__SvelteComponent`. In this case, filter out this completion by returning null.
        if (isSvelteComp && existingImports.has(label)) {
            return null;
        }

        return {
            label,
            insertText,
            kind: scriptElementKindToCompletionItemKind(comp.kind),
            commitCharacters: getCommitCharactersForScriptElement(comp.kind),
            // Make sure svelte component takes precedence
            sortText: isSvelteComp ? '-1' : comp.sortText,
            preselect: isSvelteComp ? true : comp.isRecommended,
            // pass essential data for resolving completion
            data: {
                ...comp,
                uri,
                position
            }
        };
    }

    private getCompletionLabelAndInsert(
        fragment: any,
        comp: ts.CompletionEntry
    ) {
        let { kind, kindModifiers, name, source } = comp;
        const isScriptElement = kind === ts.ScriptElementKind.scriptElement;
        const hasModifier = Boolean(comp.kindModifiers);
        if (isScriptElement && hasModifier) {
            return {
                insertText: name,
                label: name + kindModifiers,
                isSvelteComp: false
            };
        }

        return {
            label: name,
            isSvelteComp: false
        };
    }
}
