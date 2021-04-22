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
    async getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext
    ): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
        if (!isInsideFrontmatter(document.getText(), document.offsetAt(position))) {
            return null;
        }

        const completionItems: CompletionItem[] = [{
            label: 'HELLO?'
        }];

        return CompletionList.create(completionItems, true);

    }

    async resolveCompletion(
        document: Document,
        completionItem: AppCompletionItem<CompletionEntryWithIdentifer>
    ): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
        return completionItem;
    }
}
