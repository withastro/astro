import type { Document, DocumentManager } from '../../core/documents';
import type { ConfigManager } from '../../core/config';
import type { CompletionsProvider, AppCompletionItem, AppCompletionList } from '../interfaces';
import {
    CompletionContext,
    Position,
    CompletionList,
} from 'vscode-languageserver';

import { CompletionsProviderImpl, CompletionEntryWithIdentifer } from './features/CompletionsProvider';

export class TypeScriptPlugin implements CompletionsProvider {
    private readonly docManager: DocumentManager;
    private readonly configManager: ConfigManager;
    private readonly completionProvider: CompletionsProviderImpl;

    constructor(
        docManager: DocumentManager,
        configManager: ConfigManager,
    ) {
        this.docManager = docManager;
        this.configManager = configManager;
        
        this.completionProvider = new CompletionsProviderImpl();
    }

    async getCompletions(
        document: Document,
        position: Position,
        completionContext?: CompletionContext
    ): Promise<AppCompletionList<CompletionEntryWithIdentifer> | null> {
        const completions = await this.completionProvider.getCompletions(
            document,
            position,
            completionContext
        );

        return completions;
    }

    async resolveCompletion(
        document: Document,
        completionItem: AppCompletionItem<CompletionEntryWithIdentifer>
    ): Promise<AppCompletionItem<CompletionEntryWithIdentifer>> {
        return this.completionProvider.resolveCompletion(document, completionItem);
    }

}
