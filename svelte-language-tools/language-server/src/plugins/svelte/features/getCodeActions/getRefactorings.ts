import * as path from 'path';
import {
    CreateFile,
    OptionalVersionedTextDocumentIdentifier,
    Position,
    Range,
    TextDocumentEdit,
    TextEdit,
    WorkspaceEdit
} from 'vscode-languageserver';
import { isRangeInTag, TagInformation, updateRelativeImport } from '../../../../lib/documents';
import { pathToUrl } from '../../../../utils';
import { SvelteDocument } from '../../SvelteDocument';

export interface ExtractComponentArgs {
    uri: string;
    range: Range;
    filePath: string;
}

export const extractComponentCommand = 'extract_to_svelte_component';

export async function executeRefactoringCommand(
    svelteDoc: SvelteDocument,
    command: string,
    args?: any[]
): Promise<WorkspaceEdit | string | null> {
    if (command === extractComponentCommand && args) {
        return executeExtractComponentCommand(svelteDoc, args[1]);
    }

    return null;
}

async function executeExtractComponentCommand(
    svelteDoc: SvelteDocument,
    refactorArgs: ExtractComponentArgs
): Promise<WorkspaceEdit | string | null> {
    const { range } = refactorArgs;

    if (isInvalidSelectionRange()) {
        return 'Invalid selection range';
    }

    let filePath = refactorArgs.filePath || './NewComponent.svelte';
    if (!filePath.endsWith('.svelte')) {
        filePath += '.svelte';
    }
    if (!filePath.startsWith('.')) {
        filePath = './' + filePath;
    }
    const componentName = filePath.split('/').pop()?.split('.svelte')[0] || '';
    const newFileUri = pathToUrl(path.join(path.dirname(svelteDoc.getFilePath()), filePath));

    return <WorkspaceEdit>{
        documentChanges: [
            TextDocumentEdit.create(
                OptionalVersionedTextDocumentIdentifier.create(svelteDoc.uri, null),
                [
                    TextEdit.replace(range, `<${componentName}></${componentName}>`),
                    createComponentImportTextEdit()
                ]
            ),
            CreateFile.create(newFileUri, { overwrite: true }),
            createNewFileEdit()
        ]
    };

    function isInvalidSelectionRange() {
        const text = svelteDoc.getText();
        const offsetStart = svelteDoc.offsetAt(range.start);
        const offsetEnd = svelteDoc.offsetAt(range.end);
        const validStart = offsetStart === 0 || /[\s\W]/.test(text[offsetStart - 1]);
        const validEnd = offsetEnd === text.length - 1 || /[\s\W]/.test(text[offsetEnd]);
        return (
            !validStart ||
            !validEnd ||
            isRangeInTag(range, svelteDoc.style) ||
            isRangeInTag(range, svelteDoc.script) ||
            isRangeInTag(range, svelteDoc.moduleScript)
        );
    }

    function createNewFileEdit() {
        const text = svelteDoc.getText();
        const newText = [
            getTemplate(),
            getTag(svelteDoc.script, false),
            getTag(svelteDoc.moduleScript, false),
            getTag(svelteDoc.style, true)
        ]
            .filter((tag) => tag.start >= 0)
            .sort((a, b) => a.start - b.start)
            .map((tag) => tag.text)
            .join('');

        return TextDocumentEdit.create(
            OptionalVersionedTextDocumentIdentifier.create(newFileUri, null),
            [TextEdit.insert(Position.create(0, 0), newText)]
        );

        function getTemplate() {
            const startOffset = svelteDoc.offsetAt(range.start);
            return {
                text: text.substring(startOffset, svelteDoc.offsetAt(range.end)) + '\n\n',
                start: startOffset
            };
        }

        function getTag(tag: TagInformation | null, isStyleTag: boolean) {
            if (!tag) {
                return { text: '', start: -1 };
            }

            const tagText = updateRelativeImports(
                svelteDoc,
                text.substring(tag.container.start, tag.container.end),
                filePath,
                isStyleTag
            );
            return {
                text: `${tagText}\n\n`,
                start: tag.container.start
            };
        }
    }

    function createComponentImportTextEdit(): TextEdit {
        const startPos = (svelteDoc.script || svelteDoc.moduleScript)?.startPos;
        const importText = `\n  import ${componentName} from '${filePath}';\n`;
        return TextEdit.insert(
            startPos || Position.create(0, 0),
            startPos ? importText : `<script>\n${importText}</script>`
        );
    }
}

// `import {...} from '..'` or `import ... from '..'`
const scriptRelativeImportRegex =
    // eslint-disable-next-line max-len
    /import\s+{[^}]*}.*['"`](((\.\/)|(\.\.\/)).*?)['"`]|import\s+\w+\s+from\s+['"`](((\.\/)|(\.\.\/)).*?)['"`]/g;
// `@import '..'`
const styleRelativeImportRege = /@import\s+['"`](((\.\/)|(\.\.\/)).*?)['"`]/g;

function updateRelativeImports(
    svelteDoc: SvelteDocument,
    tagText: string,
    newComponentRelativePath: string,
    isStyleTag: boolean
) {
    const oldPath = path.dirname(svelteDoc.getFilePath());
    const newPath = path.dirname(path.join(oldPath, newComponentRelativePath));
    const regex = isStyleTag ? styleRelativeImportRege : scriptRelativeImportRegex;
    let match = regex.exec(tagText);
    while (match) {
        // match[1]: match before | and style regex. match[5]: match after | (script regex)
        const importPath = match[1] || match[5];
        const newImportPath = updateRelativeImport(oldPath, newPath, importPath);
        tagText = tagText.replace(importPath, newImportPath);
        match = regex.exec(tagText);
    }
    return tagText;
}
