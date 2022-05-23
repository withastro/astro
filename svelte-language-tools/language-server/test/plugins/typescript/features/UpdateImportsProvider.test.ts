import assert from 'assert';
import { join } from 'path';
import sinon from 'sinon';
import ts from 'typescript';
import {
    OptionalVersionedTextDocumentIdentifier,
    Position,
    Range,
    TextDocumentEdit,
    TextEdit
} from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { UpdateImportsProviderImpl } from '../../../../src/plugins/typescript/features/UpdateImportsProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { pathToUrl } from '../../../../src/utils';

const testDir = join(__dirname, '..');
const testFilesDir = join(testDir, 'testfiles');

describe('UpdateImportsProviderImpl', () => {
    async function setup(filename: string) {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );
        const lsAndTsDocResolver = new LSAndTSDocResolver(
            docManager,
            [pathToUrl(testDir)],
            new LSConfigManager()
        );
        const updateImportsProvider = new UpdateImportsProviderImpl(lsAndTsDocResolver);
        const filePath = join(testFilesDir, filename);
        const fileUri = pathToUrl(filePath);
        const document = docManager.openDocument(<any>{
            uri: fileUri,
            text: ts.sys.readFile(filePath) || ''
        });
        await lsAndTsDocResolver.getLSAndTSDoc(document); // this makes sure ts ls knows the file
        return { updateImportsProvider, fileUri };
    }

    afterEach(() => sinon.restore());

    it('updates imports', async () => {
        const { updateImportsProvider, fileUri } = await setup('updateimports.svelte');

        const workspaceEdit = await updateImportsProvider.updateImports({
            // imported files both old and new have to actually exist, so we just use some other test files
            oldUri: pathToUrl(join(testFilesDir, 'diagnostics', 'diagnostics.svelte')),
            newUri: pathToUrl(join(testFilesDir, 'documentation.svelte'))
        });

        assert.deepStrictEqual(workspaceEdit?.documentChanges, [
            TextDocumentEdit.create(OptionalVersionedTextDocumentIdentifier.create(fileUri, null), [
                TextEdit.replace(
                    Range.create(Position.create(1, 17), Position.create(1, 49)),
                    './documentation.svelte'
                )
            ])
        ]);
    });
});
