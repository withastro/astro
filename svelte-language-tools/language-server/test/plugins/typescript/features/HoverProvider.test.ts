import * as assert from 'assert';
import * as path from 'path';
import ts from 'typescript';
import { Hover, Position } from 'vscode-languageserver';
import { Document, DocumentManager } from '../../../../src/lib/documents';
import { LSConfigManager } from '../../../../src/ls-config';
import { HoverProviderImpl } from '../../../../src/plugins/typescript/features/HoverProvider';
import { LSAndTSDocResolver } from '../../../../src/plugins/typescript/LSAndTSDocResolver';
import { __resetCache } from '../../../../src/plugins/typescript/service';
import { pathToUrl } from '../../../../src/utils';

const testDir = path.join(__dirname, '..');

function test(useNewTransformation: boolean) {
    return () => {
        function getFullPath(filename: string) {
            return path.join(testDir, 'testfiles', 'hover', filename);
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
            const provider = new HoverProviderImpl(lsAndTsDocResolver);
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

        it('provides basic hover info when no docstring exists', async () => {
            const { provider, document } = setup('hoverinfo.svelte');

            assert.deepStrictEqual(await provider.doHover(document, Position.create(6, 10)), <
                Hover
            >{
                contents: '```typescript\nconst withoutDocs: true\n```',
                range: {
                    start: {
                        character: 10,
                        line: 6
                    },
                    end: {
                        character: 21,
                        line: 6
                    }
                }
            });
        });

        it('provides formatted hover info when a docstring exists', async () => {
            const { provider, document } = setup('hoverinfo.svelte');

            assert.deepStrictEqual(await provider.doHover(document, Position.create(4, 10)), <
                Hover
            >{
                contents: '```typescript\nconst withDocs: true\n```\n---\nDocumentation string',
                range: {
                    start: {
                        character: 10,
                        line: 4
                    },
                    end: {
                        character: 18,
                        line: 4
                    }
                }
            });
        });

        it('provides formatted hover info for component events', async () => {
            const { provider, document } = setup('hoverinfo.svelte');

            assert.deepStrictEqual(await provider.doHover(document, Position.create(12, 26)), <
                Hover
            >{
                contents:
                    '```typescript\nabc: MouseEvent\n```\nTEST\n```ts\nconst abc: boolean = true;\n```'
            });
        });

        it('provides formatted hover info for jsDoc tags', async () => {
            const { provider, document } = setup('hoverinfo.svelte');

            assert.deepStrictEqual(await provider.doHover(document, Position.create(9, 10)), <
                Hover
            >{
                contents: '```typescript\nconst withJsDocTag: true\n```\n---\n\n\n*@author* — foo ',
                range: {
                    start: {
                        character: 10,
                        line: 9
                    },
                    end: {
                        character: 22,
                        line: 9
                    }
                }
            });
        });

        it('provides hover info for $store access', async () => {
            const { provider, document } = setup('hover-$store.svelte');

            assert.deepStrictEqual(await provider.doHover(document, Position.create(3, 5)), <Hover>{
                contents: '```typescript\nlet $b: string | {\n    a: boolean | string;\n}\n```',
                range: {
                    end: {
                        character: 6,
                        line: 3
                    },
                    start: {
                        character: 5,
                        line: 3
                    }
                }
            });
            assert.deepStrictEqual(await provider.doHover(document, Position.create(5, 9)), <Hover>{
                contents: '```typescript\nlet $b: string\n```',
                range: {
                    end: {
                        character: 10,
                        line: 5
                    },
                    start: {
                        character: 9,
                        line: 5
                    }
                }
            });
            assert.deepStrictEqual(await provider.doHover(document, Position.create(7, 4)), <Hover>{
                contents:
                    '```typescript\nconst b: Writable<string | {\n    a: boolean | string;\n}>\n```',
                range: {
                    end: {
                        character: 5,
                        line: 7
                    },
                    start: {
                        character: 4,
                        line: 7
                    }
                }
            });

            assert.deepStrictEqual(await provider.doHover(document, Position.create(10, 2)), <
                Hover
            >{
                contents: '```typescript\nlet $b: string | {\n    a: boolean | string;\n}\n```',
                range: {
                    end: {
                        character: 3,
                        line: 10
                    },
                    start: {
                        character: 2,
                        line: 10
                    }
                }
            });
            assert.deepStrictEqual(await provider.doHover(document, Position.create(12, 6)), <
                Hover
            >{
                contents: '```typescript\nlet $b: string\n```',
                range: {
                    end: {
                        character: 7,
                        line: 12
                    },
                    start: {
                        character: 6,
                        line: 12
                    }
                }
            });
            assert.deepStrictEqual(await provider.doHover(document, Position.create(14, 1)), <
                Hover
            >{
                contents:
                    '```typescript\nconst b: Writable<string | {\n    a: boolean | string;\n}>\n```',
                range: {
                    end: {
                        character: 2,
                        line: 14
                    },
                    start: {
                        character: 1,
                        line: 14
                    }
                }
            });
        });

        // Hacky, but it works. Needed due to testing both new and old transformation
        after(() => {
            __resetCache();
        });
    };
}

describe('HoverProvider (use old transformation)', test(false));
describe('HoverProvider (use new transformation)', test(true));
