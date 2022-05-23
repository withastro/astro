import path from 'path';
import ts from 'typescript';
import assert from 'assert';
import { Position, SelectionRange } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { SelectionRangeProviderImpl } from '../../../../src/plugins/typescript/features/SelectionRangeProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { pathToUrl } from '../../../../src/utils';
import { LSConfigManager } from '../../../../src/ls-config';

const testDir = path.join(__dirname, '..');

describe('SelectionRangeProvider', () => {
    function setup() {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );
        const filePath = path.join(
            testDir,
            'testfiles',
            'selection-range',
            'selection-range.svelte'
        );
        const lsAndTsDocResolver = new LSAndTSDocResolver(
            docManager,
            [pathToUrl(testDir)],
            new LSConfigManager()
        );
        const provider = new SelectionRangeProviderImpl(lsAndTsDocResolver);
        const document = docManager.openDocument(<any>{
            uri: pathToUrl(filePath),
            text: ts.sys.readFile(filePath)
        });
        return { provider, document };
    }

    it('provides selection range', async () => {
        const { provider, document } = setup();

        const selectionRange = await provider.getSelectionRange(document, Position.create(1, 9));

        assert.deepStrictEqual(selectionRange, <SelectionRange>{
            parent: {
                parent: undefined,
                // let a;
                range: {
                    end: {
                        character: 10,
                        line: 1
                    },
                    start: {
                        character: 4,
                        line: 1
                    }
                }
            },
            // a
            range: {
                end: {
                    character: 9,
                    line: 1
                },
                start: {
                    character: 8,
                    line: 1
                }
            }
        });
    });

    it('return null when in style', async () => {
        const { provider, document } = setup();

        const selectionRange = await provider.getSelectionRange(document, Position.create(5, 0));

        assert.equal(selectionRange, null);
    });
});
