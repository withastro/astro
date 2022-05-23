import assert from 'assert';
import path from 'path';
import ts from 'typescript';
import { Location } from 'vscode-languageserver-protocol';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { LSAndTSDocResolver } from '../../../../src/plugins';
import { TypeDefinitionProviderImpl } from '../../../../src/plugins/typescript/features/TypeDefinitionProvider';
import { pathToUrl } from '../../../../src/utils';

const testDir = path.join(__dirname, '..');

describe('TypeDefinitionProvider', () => {
    function getFullPath(filename: string) {
        return path.join(testDir, 'testfiles', 'typedefinition', filename);
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
        const provider = new TypeDefinitionProviderImpl(lsAndTsDocResolver);
        const filePath = getFullPath(filename);
        const document = docManager.openDocument(<any>{
            uri: pathToUrl(filePath),
            text: ts.sys.readFile(filePath) || ''
        });
        return { provider, document };
    }

    it('find type definition in TS file', async () => {
        const { document, provider } = setup('typedefinition.svelte');

        const typeDefs = await provider.getTypeDefinition(document, {
            line: 5,
            character: 15
        });

        assert.deepStrictEqual(typeDefs, <Location[]>[
            {
                range: {
                    start: {
                        line: 0,
                        character: 13
                    },
                    end: {
                        line: 0,
                        character: 30
                    }
                },
                uri: getUri('some-class.ts')
            }
        ]);
    });

    it('find type definition in same Svelte file', async () => {
        const { document, provider } = setup('typedefinition.svelte');

        const typeDefs = await provider.getTypeDefinition(document, {
            line: 6,
            character: 20
        });

        assert.deepStrictEqual(typeDefs, <Location[]>[
            {
                range: {
                    start: {
                        line: 3,
                        character: 10
                    },
                    end: {
                        line: 3,
                        character: 19
                    }
                },
                uri: getUri('typedefinition.svelte')
            }
        ]);
    });
});
