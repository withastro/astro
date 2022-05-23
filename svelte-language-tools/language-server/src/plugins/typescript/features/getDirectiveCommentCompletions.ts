import { Document, isInTag } from '../../../lib/documents';
import {
    Position,
    CompletionItemKind,
    CompletionItem,
    TextEdit,
    Range,
    CompletionList,
    CompletionContext
} from 'vscode-languageserver';

/**
 * from https://github.com/microsoft/vscode/blob/157255fa4b0775c5ab8729565faf95927b610cac/extensions/typescript-language-features/src/languageFeatures/directiveCommentCompletions.ts#L19
 */
export const tsDirectives = [
    {
        value: '@ts-check',
        description: 'Enables semantic checking in a JavaScript file. Must be at the top of a file.'
    },
    {
        value: '@ts-nocheck',
        description:
            'Disables semantic checking in a JavaScript file. Must be at the top of a file.'
    },
    {
        value: '@ts-ignore',
        description: 'Suppresses @ts-check errors on the next line of a file.'
    },
    {
        value: '@ts-expect-error',
        description:
            'Suppresses @ts-check errors on the next line of a file, expecting at least one to exist.'
    }
];

/**
 * from https://github.com/microsoft/vscode/blob/157255fa4b0775c5ab8729565faf95927b610cac/extensions/typescript-language-features/src/languageFeatures/directiveCommentCompletions.ts#L64
 */
export function getDirectiveCommentCompletions(
    position: Position,
    document: Document,
    completionContext: CompletionContext | undefined
) {
    // don't trigger until // @
    if (completionContext?.triggerCharacter === '/') {
        return null;
    }

    const inScript = isInTag(position, document.scriptInfo);
    const inModule = isInTag(position, document.moduleScriptInfo);
    if (!inModule && !inScript) {
        return null;
    }

    const lineStart = document.offsetAt(Position.create(position.line, 0));
    const offset = document.offsetAt(position);
    const prefix = document.getText().slice(lineStart, offset);
    const match = prefix.match(/^\s*\/\/+\s?(@[a-zA-Z-]*)?$/);

    if (!match) {
        return null;
    }
    const startCharacter = Math.max(0, position.character - (match[1]?.length ?? 0));
    const start = Position.create(position.line, startCharacter);

    const items = tsDirectives.map<CompletionItem>(({ value, description }) => ({
        detail: description,
        label: value,
        kind: CompletionItemKind.Snippet,
        textEdit: TextEdit.replace(
            Range.create(start, Position.create(start.line, start.character + value.length)),
            value
        )
    }));

    return CompletionList.create(items, false);
}
