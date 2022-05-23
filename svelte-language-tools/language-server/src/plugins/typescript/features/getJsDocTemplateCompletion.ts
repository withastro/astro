import ts from 'typescript';
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    InsertTextFormat,
    Range,
    TextEdit
} from 'vscode-languageserver';
import { mapRangeToOriginal } from '../../../lib/documents';
import { SvelteSnapshotFragment } from '../DocumentSnapshot';

const DEFAULT_SNIPPET = `/**${ts.sys.newLine} * $0${ts.sys.newLine} */`;

export function getJsDocTemplateCompletion(
    fragment: SvelteSnapshotFragment,
    lang: ts.LanguageService,
    filePath: string,
    offset: number
): CompletionList | null {
    const template = lang.getDocCommentTemplateAtPosition(filePath, offset);

    if (!template) {
        return null;
    }
    const { text } = fragment;
    const lineStart = text.lastIndexOf('\n', offset);
    const lineEnd = text.indexOf('\n', offset);
    const isLastLine = lineEnd === -1;

    const line = text.substring(lineStart, isLastLine ? undefined : lineEnd);
    const character = offset - lineStart;

    const start = line.lastIndexOf('/**', character) + lineStart;
    const suffix = line.slice(character).match(/^\s*\**\//);
    const textEditRange = mapRangeToOriginal(
        fragment,
        Range.create(
            fragment.positionAt(start),
            fragment.positionAt(offset + (suffix?.[0]?.length ?? 0))
        )
    );
    const { newText } = template;
    const snippet =
        // When typescript returns an empty single line template
        // return the default multi-lines snippet,
        // making it consistent with VSCode typescript
        newText === '/** */' ? DEFAULT_SNIPPET : templateToSnippet(newText);

    const item: CompletionItem = {
        label: '/** */',
        detail: 'JSDoc comment',
        sortText: '\0',
        kind: CompletionItemKind.Snippet,
        textEdit: TextEdit.replace(textEditRange, snippet),
        insertTextFormat: InsertTextFormat.Snippet
    };

    return CompletionList.create([item]);
}

/**
 * adopted from https://github.com/microsoft/vscode/blob/a4b011697892ab656e1071b42c8af4b192078f28/extensions/typescript-language-features/src/languageFeatures/jsDocCompletions.ts#L94
 * Currently typescript won't return `@param` type template for files
 * that has extension other than `.js` and `.jsx`
 * So we don't need to insert snippet-tab-stop for it
 */
function templateToSnippet(text: string) {
    return (
        text
            // $ is for snippet tab stop
            .replace(/\$/g, '\\$')
            .split('\n')
            // remove indent but not line break and let client handle it
            .map((part) => part.replace(/^\s*(?=(\/|[ ]\*))/g, ''))
            .join('\n')
            .replace(/^(\/\*\*\s*\*[ ]*)$/m, (x) => x + '$0')
    );
}
