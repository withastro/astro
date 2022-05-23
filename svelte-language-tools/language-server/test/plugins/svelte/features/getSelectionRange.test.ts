import * as assert from 'assert';
import { Position, SelectionRange } from 'vscode-languageserver';
import { Document } from '../../../../src/lib/documents';
import { getSelectionRange } from '../../../../src/plugins/svelte/features/getSelectionRanges';
import { SvelteDocument } from '../../../../src/plugins/svelte/SvelteDocument';

describe('SveltePlugin#getSelectionRange', () => {
    const CURSOR = '|';
    async function expectToEqual(contentWithCursor: string, expected: SelectionRange | null) {
        const svelteDoc = new SvelteDocument(
            new Document('url', contentWithCursor.replace(CURSOR, ''))
        );

        const selectionRange = await getSelectionRange(
            svelteDoc,
            Position.create(0, contentWithCursor.indexOf(CURSOR))
        );

        assert.deepStrictEqual(selectionRange, expected);
    }

    it('should return null for style and script', async () => {
        await expectToEqual('<style>|</style>', null);
        await expectToEqual('<script>|</script>', null);
    });

    it('get selection range for element and attribute', () => {
        return expectToEqual('<h1 title="foo|"></h1>', {
            parent: {
                parent: {
                    parent: undefined,
                    range: {
                        start: {
                            line: 0,
                            character: 0
                        },
                        end: {
                            line: 0,
                            character: 21
                        }
                    }
                },
                range: {
                    start: {
                        line: 0,
                        character: 4
                    },
                    end: {
                        line: 0,
                        character: 15
                    }
                }
            },
            range: {
                start: {
                    line: 0,
                    character: 11
                },
                end: {
                    line: 0,
                    character: 14
                }
            }
        });
    });

    it('get selection range for svelte blocks', () => {
        return expectToEqual('{#if a > 1}|foo{/if}', {
            parent: {
                parent: undefined,

                // if block
                range: {
                    start: {
                        line: 0,
                        character: 0
                    },
                    end: {
                        line: 0,
                        character: 19
                    }
                }
            },

            // text
            range: {
                start: {
                    line: 0,
                    character: 11
                },
                end: {
                    line: 0,
                    character: 14
                }
            }
        });
    });
});
