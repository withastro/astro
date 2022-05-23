import * as assert from 'assert';
import * as fs from 'fs';
import { EOL } from 'os';
import * as path from 'path';
import {
    CodeAction,
    CodeActionContext,
    CreateFile,
    DiagnosticSeverity,
    Position,
    Range,
    TextDocumentEdit,
    TextEdit,
    OptionalVersionedTextDocumentIdentifier,
    WorkspaceEdit
} from 'vscode-languageserver';
import { Document } from '../../../../src/lib/documents';
import { getCodeActions } from '../../../../src/plugins/svelte/features/getCodeActions';
import {
    executeRefactoringCommand,
    ExtractComponentArgs,
    extractComponentCommand
} from '../../../../src/plugins/svelte/features/getCodeActions/getRefactorings';
import { SvelteDocument } from '../../../../src/plugins/svelte/SvelteDocument';
import { pathToUrl } from '../../../../src/utils';

describe('SveltePlugin#getCodeAction', () => {
    const testDir = path.join(__dirname, '..', 'testfiles');

    function getFullPath(filename: string) {
        return path.join(testDir, filename);
    }

    function getUri(filename: string) {
        return pathToUrl(getFullPath(filename));
    }

    async function expectCodeActionFor(filename: string, context: CodeActionContext) {
        const filePath = path.join(testDir, filename);
        const document = new Document(
            pathToUrl(filePath),
            filename ? fs.readFileSync(filePath)?.toString() : ''
        );
        const svelteDoc = new SvelteDocument(document);
        const codeAction = await getCodeActions(
            svelteDoc,
            Range.create(Position.create(0, 0), Position.create(0, 0)),
            context
        );
        return {
            toEqual: (expected: CodeAction[]) => assert.deepStrictEqual(codeAction, expected)
        };
    }

    describe('It should not provide svelte ignore code actions', () => {
        const startRange: Range = Range.create(
            { line: 0, character: 0 },
            { line: 0, character: 1 }
        );
        it('if no svelte diagnostic', async () => {
            (
                await expectCodeActionFor('', {
                    diagnostics: [
                        {
                            code: 'whatever',
                            source: 'eslint',
                            range: startRange,
                            message: ''
                        }
                    ]
                })
            ).toEqual([]);
        });

        it('if no diagnostic code', async () => {
            (
                await expectCodeActionFor('', {
                    diagnostics: [
                        {
                            source: 'svelte',
                            range: startRange,
                            message: ''
                        }
                    ]
                })
            ).toEqual([]);
        });

        it('if diagnostic is error', async () => {
            (
                await expectCodeActionFor('', {
                    diagnostics: [
                        {
                            source: 'svelte',
                            range: startRange,
                            message: '',
                            severity: DiagnosticSeverity.Error
                        }
                    ]
                })
            ).toEqual([]);
        });
    });

    describe('It should provide svelte ignore code actions ', () => {
        const svelteIgnoreCodeAction = 'svelte-ignore-code-action.svelte';

        it('should provide ignore comment', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-missing-attribute',
                            range: Range.create(
                                { line: 0, character: 0 },
                                { line: 0, character: 6 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        // eslint-disable-next-line max-len
                                        newText: `<!-- svelte-ignore a11y-missing-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 0
                                            },
                                            start: {
                                                character: 0,
                                                line: 0
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-missing-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });

        it('should provide ignore comment with indent', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-missing-attribute',
                            range: Range.create(
                                { line: 3, character: 4 },
                                { line: 3, character: 11 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        newText: `${' '.repeat(
                                            4
                                        )}<!-- svelte-ignore a11y-missing-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 3
                                            },
                                            start: {
                                                character: 0,
                                                line: 3
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-missing-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });

        it('should provide ignore comment with indent of parent tag', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-invalid-attribute',
                            range: Range.create(
                                { line: 6, character: 8 },
                                { line: 6, character: 15 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        newText: `${' '.repeat(
                                            4
                                        )}<!-- svelte-ignore a11y-invalid-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 5
                                            },
                                            start: {
                                                character: 0,
                                                line: 5
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-invalid-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });
    });

    describe('It should provide svelte ignore code actions (TypeScript)', () => {
        const svelteIgnoreCodeAction = 'svelte-ignore-code-action-ts.svelte';

        it('should provide ignore comment', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-missing-attribute',
                            range: Range.create(
                                { line: 7, character: 0 },
                                { line: 7, character: 6 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        // eslint-disable-next-line max-len
                                        newText: `<!-- svelte-ignore a11y-missing-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 7
                                            },
                                            start: {
                                                character: 0,
                                                line: 7
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-missing-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });

        it('should provide ignore comment with indent', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-missing-attribute',
                            range: Range.create(
                                { line: 10, character: 4 },
                                { line: 10, character: 11 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        newText: `${' '.repeat(
                                            4
                                        )}<!-- svelte-ignore a11y-missing-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 10
                                            },
                                            start: {
                                                character: 0,
                                                line: 10
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-missing-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });

        it('should provide ignore comment with indent of parent tag', async () => {
            (
                await expectCodeActionFor(svelteIgnoreCodeAction, {
                    diagnostics: [
                        {
                            severity: DiagnosticSeverity.Warning,
                            code: 'a11y-invalid-attribute',
                            range: Range.create(
                                { line: 13, character: 8 },
                                { line: 13, character: 15 }
                            ),
                            message: '',
                            source: 'svelte'
                        }
                    ]
                })
            ).toEqual([
                {
                    edit: {
                        documentChanges: [
                            {
                                edits: [
                                    {
                                        newText: `${' '.repeat(
                                            4
                                        )}<!-- svelte-ignore a11y-invalid-attribute -->${EOL}`,
                                        range: {
                                            end: {
                                                character: 0,
                                                line: 12
                                            },
                                            start: {
                                                character: 0,
                                                line: 12
                                            }
                                        }
                                    }
                                ],
                                textDocument: {
                                    uri: getUri(svelteIgnoreCodeAction),
                                    version: null
                                }
                            }
                        ]
                    },
                    title: '(svelte) Disable a11y-invalid-attribute for this line',
                    kind: 'quickfix'
                }
            ]);
        });
    });

    describe('#extractComponent', async () => {
        const scriptContent = `<script>
        const bla = true;
        </script>`;
        const styleContent = '<style>p{color: blue}</style>';
        const content = `
        ${scriptContent}
        <p>something else</p>
        <p>extract me</p>
        ${styleContent}`;

        const doc = new SvelteDocument(new Document('someUrl', content));

        async function extractComponent(filePath: string, range: Range) {
            return executeRefactoringCommand(doc, extractComponentCommand, [
                '',
                <ExtractComponentArgs>{
                    filePath,
                    range,
                    uri: ''
                }
            ]);
        }

        async function shouldExtractComponent(
            path: 'NewComp' | 'NewComp.svelte' | './NewComp' | './NewComp.svelte'
        ) {
            const range = Range.create(Position.create(5, 8), Position.create(5, 25));
            const result = await extractComponent(path, range);
            assert.deepStrictEqual(result, <WorkspaceEdit>{
                documentChanges: [
                    TextDocumentEdit.create(
                        OptionalVersionedTextDocumentIdentifier.create('someUrl', null),
                        [
                            TextEdit.replace(range, '<NewComp></NewComp>'),
                            TextEdit.insert(
                                doc.script?.startPos || Position.create(0, 0),
                                "\n  import NewComp from './NewComp.svelte';\n"
                            )
                        ]
                    ),
                    CreateFile.create('file:///NewComp.svelte', { overwrite: true }),
                    TextDocumentEdit.create(
                        OptionalVersionedTextDocumentIdentifier.create(
                            'file:///NewComp.svelte',
                            null
                        ),
                        [
                            TextEdit.insert(
                                Position.create(0, 0),
                                `${scriptContent}\n\n<p>extract me</p>\n\n${styleContent}\n\n`
                            )
                        ]
                    )
                ]
            });
        }

        it('should extract component (no .svelte at the end)', async () => {
            await shouldExtractComponent('./NewComp');
        });

        it('should extract component (no .svelte at the end, no relative path)', async () => {
            await shouldExtractComponent('NewComp');
        });

        it('should extract component (.svelte at the end, no relative path', async () => {
            await shouldExtractComponent('NewComp.svelte');
        });

        it('should extract component (.svelte at the end, relative path)', async () => {
            await shouldExtractComponent('./NewComp.svelte');
        });

        it('should return "Invalid selection range"', async () => {
            const range = Range.create(Position.create(6, 8), Position.create(6, 25));
            const result = await extractComponent('Bla', range);
            assert.deepStrictEqual(result, 'Invalid selection range');
        });

        it('should update relative imports', async () => {
            const content = `<script>
            import OtherComponent from './OtherComponent.svelte';
            import {test} from '../test';
            </script>
            toExtract
            <style>
            @import './style.css';
            </style>`;
            const existingFileUri = pathToUrl('C:/path/File.svelte');
            const doc = new SvelteDocument(new Document(existingFileUri, content));
            const range = Range.create(Position.create(4, 12), Position.create(4, 21));
            const result = await executeRefactoringCommand(doc, extractComponentCommand, [
                '',
                <ExtractComponentArgs>{
                    filePath: '../NewComp',
                    range,
                    uri: ''
                }
            ]);

            const newFileUri = pathToUrl('C:/NewComp.svelte');
            assert.deepStrictEqual(result, <WorkspaceEdit>{
                documentChanges: [
                    TextDocumentEdit.create(
                        OptionalVersionedTextDocumentIdentifier.create(existingFileUri, null),
                        [
                            TextEdit.replace(range, '<NewComp></NewComp>'),
                            TextEdit.insert(
                                doc.script?.startPos || Position.create(0, 0),
                                "\n  import NewComp from '../NewComp.svelte';\n"
                            )
                        ]
                    ),
                    CreateFile.create(newFileUri, { overwrite: true }),
                    TextDocumentEdit.create(
                        OptionalVersionedTextDocumentIdentifier.create(newFileUri, null),
                        [
                            TextEdit.insert(
                                Position.create(0, 0),
                                `<script>
            import OtherComponent from './path/OtherComponent.svelte';
            import {test} from './test';
            </script>\n\ntoExtract\n\n<style>
            @import './path/style.css';
            </style>\n\n`
                            )
                        ]
                    )
                ]
            });
        });
    });
});
