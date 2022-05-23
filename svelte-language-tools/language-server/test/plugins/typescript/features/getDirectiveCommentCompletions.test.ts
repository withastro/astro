import path from 'path';
import ts from 'typescript';
import assert from 'assert';
import { Document } from '../../../../src/lib/documents';
import { pathToUrl } from '../../../../src/utils';
import { Position, CompletionContext, CompletionTriggerKind } from 'vscode-languageserver';
import { getDirectiveCommentCompletions } from '../../../../src/plugins/typescript/features/getDirectiveCommentCompletions';

describe('can get typescript directive comment completions', () => {
    function setup(
        position: Position,
        context: CompletionContext = { triggerKind: CompletionTriggerKind.Invoked }
    ) {
        const testDir = path.join(__dirname, '..');
        const filePath = path.join(
            testDir,
            'testfiles',
            'completions',
            'ts-directive-comment.svelte'
        );
        const document = new Document(pathToUrl(filePath), ts.sys.readFile(filePath)!);
        const result = getDirectiveCommentCompletions(position, document, context);

        return result;
    }

    function testForScript(position: Position) {
        const result = setup(position);
        assert.deepStrictEqual(result, {
            isIncomplete: false,
            items: [
                {
                    detail: 'Enables semantic checking in a JavaScript file. Must be at the top of a file.',
                    kind: 15,
                    label: '@ts-check',
                    textEdit: {
                        newText: '@ts-check',
                        range: {
                            end: {
                                character: 11,
                                line: position.line
                            },
                            start: {
                                character: 2,
                                line: position.line
                            }
                        }
                    }
                },
                {
                    detail: 'Disables semantic checking in a JavaScript file. Must be at the top of a file.',
                    kind: 15,
                    label: '@ts-nocheck',
                    textEdit: {
                        newText: '@ts-nocheck',
                        range: {
                            end: {
                                character: 13,
                                line: position.line
                            },
                            start: {
                                character: 2,
                                line: position.line
                            }
                        }
                    }
                },
                {
                    detail: 'Suppresses @ts-check errors on the next line of a file.',
                    kind: 15,
                    label: '@ts-ignore',
                    textEdit: {
                        newText: '@ts-ignore',
                        range: {
                            end: {
                                character: 12,
                                line: position.line
                            },
                            start: {
                                character: 2,
                                line: position.line
                            }
                        }
                    }
                },
                {
                    detail: 'Suppresses @ts-check errors on the next line of a file, expecting at least one to exist.',
                    kind: 15,
                    label: '@ts-expect-error',
                    textEdit: {
                        newText: '@ts-expect-error',
                        range: {
                            end: {
                                character: 18,
                                line: position.line
                            },
                            start: {
                                character: 2,
                                line: position.line
                            }
                        }
                    }
                }
            ]
        });
    }

    it('provides in instance scripts', () => {
        testForScript(Position.create(1, 3));
    });

    it('provides in module scripts', () => {
        testForScript(Position.create(5, 3));
    });

    it("don't provide in markup", () => {
        const result = setup(Position.create(7, 3));
        assert.deepStrictEqual(result, null);
    });
});
