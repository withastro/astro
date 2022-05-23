import path from 'path';
import assert from 'assert';
import ts from 'typescript';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { LSAndTSDocResolver } from '../../../../src/plugins';
import { ImplementationProviderImpl } from '../../../../src/plugins/typescript/features/ImplementationProvider';
import { pathToUrl } from '../../../../src/utils';
import { Location } from 'vscode-languageserver-protocol';

const testDir = path.join(__dirname, '..');

describe('ImplementationProvider', () => {
    function getFullPath(filename: string) {
        return path.join(testDir, 'testfiles', 'implementation', filename);
    }

    function getUri(filename: string) {
        return pathToUrl(getFullPath(filename));
    }

    function setup(filename: string) {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );
        const lsAndTsDocResolver = new LSAndTSDocResolver(
            docManager,
            [testDir],
            new LSConfigManager()
        );
        const provider = new ImplementationProviderImpl(lsAndTsDocResolver);
        const filePath = getFullPath(filename);
        const document = docManager.openDocument(<any>{
            uri: pathToUrl(filePath),
            text: ts.sys.readFile(filePath) || ''
        });
        return { provider, document };
    }

    it('find implementations', async () => {
        const { document, provider } = setup('implementation.svelte');

        const implementations = await provider.getImplementation(document, {
            line: 3,
            character: 25
        });

        assert.deepStrictEqual(implementations, <Location[]>[
            {
                range: {
                    start: {
                        line: 5,
                        character: 24
                    },
                    end: {
                        line: 7,
                        character: 5
                    }
                },
                uri: getUri('implementation.svelte')
            },
            {
                range: {
                    start: {
                        line: 5,
                        character: 11
                    },
                    end: {
                        line: 7,
                        character: 5
                    }
                },
                uri: getUri('some-type.ts')
            }
        ]);
    });
});
