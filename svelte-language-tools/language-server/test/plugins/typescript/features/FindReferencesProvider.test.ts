import * as assert from 'assert';
import * as path from 'path';
import ts from 'typescript';
import { Location, Position, Range } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { FindReferencesProviderImpl } from '../../../../src/plugins/typescript/features/FindReferencesProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { __resetCache } from '../../../../src/plugins/typescript/service';
import { pathToUrl } from '../../../../src/utils';

const testDir = path.join(__dirname, '..');

function test(useNewTransformation: boolean) {
    return () => {
        function getFullPath(filename: string) {
            return path.join(testDir, 'testfiles', filename);
        }
        function getUri(filename: string) {
            const filePath = path.join(testDir, 'testfiles', filename);
            return pathToUrl(filePath);
        }

        function setup(filename: string) {
            const docManager = new DocumentManager(
                (textDocument) => new Document(textDocument.uri, textDocument.text)
            );
            const lsConfigManager = new LSConfigManager();
            lsConfigManager.update({ svelte: { useNewTransformation } });
            const lsAndTsDocResolver = new LSAndTSDocResolver(
                docManager,
                [testDir],
                lsConfigManager
            );
            const provider = new FindReferencesProviderImpl(lsAndTsDocResolver);
            const document = openDoc(filename);
            return { provider, document };

            function openDoc(filename: string) {
                const filePath = getFullPath(filename);
                const doc = docManager.openDocument(<any>{
                    uri: pathToUrl(filePath),
                    text: ts.sys.readFile(filePath) || ''
                });
                return doc;
            }
        }

        async function test(position: Position, includeDeclaration: boolean) {
            const { provider, document } = setup('find-references.svelte');

            const results = await provider.findReferences(document, position, {
                includeDeclaration
            });

            let expectedResults = [
                Location.create(
                    getUri('find-references.svelte'),
                    Range.create(Position.create(2, 8), Position.create(2, 14))
                ),
                Location.create(
                    getUri('find-references.svelte'),
                    Range.create(Position.create(3, 8), Position.create(3, 14))
                )
            ];
            if (includeDeclaration) {
                expectedResults = [
                    Location.create(
                        getUri('find-references.svelte'),
                        Range.create(Position.create(1, 10), Position.create(1, 16))
                    )
                ].concat(expectedResults);
            }

            assert.deepStrictEqual(results, expectedResults);
        }

        it('finds references', async () => {
            await test(Position.create(1, 11), true);
        });

        it('finds references, exluding definition', async () => {
            await test(Position.create(1, 11), false);
        });

        it('finds references (not searching from declaration)', async () => {
            await test(Position.create(2, 8), true);
        });

        it('finds references for $store', async () => {
            const { provider, document } = setup('find-references-$store.svelte');

            const results = await provider.findReferences(document, Position.create(2, 10), {
                includeDeclaration: true
            });
            assert.deepStrictEqual(results, [
                {
                    range: {
                        end: {
                            character: 16,
                            line: 1
                        },
                        start: {
                            character: 10,
                            line: 1
                        }
                    },
                    uri: getUri('find-references-$store.svelte')
                },
                {
                    range: {
                        end: {
                            character: 15,
                            line: 2
                        },
                        start: {
                            character: 9,
                            line: 2
                        }
                    },
                    uri: getUri('find-references-$store.svelte')
                },
                {
                    range: {
                        end: {
                            character: 15,
                            line: 3
                        },
                        start: {
                            character: 9,
                            line: 3
                        }
                    },
                    uri: getUri('find-references-$store.svelte')
                },
                {
                    range: {
                        end: {
                            character: 8,
                            line: 7
                        },
                        start: {
                            character: 2,
                            line: 7
                        }
                    },
                    uri: getUri('find-references-$store.svelte')
                }
            ]);
        });

        it('ignores references inside generated code', async () => {
            const { provider, document } = setup('find-references-ignore-generated.svelte');

            const results = await provider.findReferences(document, Position.create(1, 8), {
                includeDeclaration: true
            });
            assert.deepStrictEqual(results, [
                {
                    range: {
                        end: {
                            character: 9,
                            line: 1
                        },
                        start: {
                            character: 8,
                            line: 1
                        }
                    },
                    uri: getUri('find-references-ignore-generated.svelte')
                },
                {
                    range: {
                        end: {
                            character: 6,
                            line: 5
                        },
                        start: {
                            character: 5,
                            line: 5
                        }
                    },
                    uri: getUri('find-references-ignore-generated.svelte')
                },
                {
                    range: {
                        end: {
                            character: 21,
                            line: 7
                        },
                        start: {
                            character: 20,
                            line: 7
                        }
                    },
                    uri: getUri('find-references-ignore-generated.svelte')
                }
            ]);
        });

        it('ignores references inside generated TSX code', async () => {
            const file = 'find-references-ignore-generated-tsx.svelte';
            const uri = getUri(file);
            const { provider, document } = setup(file);

            const pos = Position.create(3, 15);
            const results = await provider.findReferences(document, pos, {
                includeDeclaration: true
            });

            assert.deepStrictEqual(results, [
                {
                    uri,
                    range: {
                        start: {
                            line: 1,
                            character: 13
                        },
                        end: {
                            line: 1,
                            character: 16
                        }
                    }
                },
                {
                    uri,
                    range: {
                        start: {
                            line: 3,
                            character: 14
                        },
                        end: {
                            line: 3,
                            character: 17
                        }
                    }
                },
                {
                    uri,
                    range: {
                        start: {
                            line: 7,
                            character: 4
                        },
                        end: {
                            line: 7,
                            character: 7
                        }
                    }
                }
            ]);
        });

        // Hacky, but it works. Needed due to testing both new and old transformation
        after(() => {
            __resetCache();
        });
    };
}

describe('FindReferencesProvider (old transformation)', test(false));
describe('FindReferencesProvider (new transformation)', test(true));
