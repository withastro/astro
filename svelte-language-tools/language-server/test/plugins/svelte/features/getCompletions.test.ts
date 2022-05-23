import * as assert from 'assert';
import { EOL } from 'os';
import { Position } from 'vscode-languageserver';
import { getCompletions } from '../../../../src/plugins/svelte/features/getCompletions';
import { SvelteDocument } from '../../../../src/plugins/svelte/SvelteDocument';
import { Document } from '../../../../src/lib/documents';
import { getModifierData } from '../../../../src/plugins/svelte/features/getModifierData';

describe('SveltePlugin#getCompletions', () => {
    function expectCompletionsFor(
        content: string,
        position: Position = Position.create(0, content.length)
    ) {
        const document = new Document('url', content);
        const svelteDoc = new SvelteDocument(document);
        const completions = getCompletions(document, svelteDoc, position);
        return {
            toEqual: (expectedLabels: string[] | null) =>
                assert.deepStrictEqual(
                    completions?.items.map((item) => item.label) ?? null,
                    expectedLabels
                )
        };
    }

    describe('should return null', () => {
        it('if position inside style', () => {
            expectCompletionsFor(
                '<style>h1{color:blue;}</style><p>test</p>',
                Position.create(0, 10)
            ).toEqual(null);
        });

        it('if position inside script', () => {
            expectCompletionsFor(
                '<script>const a = true</script><p>test</p>',
                Position.create(0, 10)
            ).toEqual(null);
        });

        it('if not preceeded by valid content #1', () => {
            expectCompletionsFor('{nope').toEqual(null);
        });

        it('if not preceeded by valid content #2', () => {
            expectCompletionsFor('not really').toEqual(null);
        });

        it('if not preceeded by valid content #3', () => {
            expectCompletionsFor('{#awa.').toEqual(null);
        });
    });

    it('should return completions for #', () => {
        expectCompletionsFor('{#').toEqual(['if', 'each', 'await :then', 'await then', 'key']);
    });

    it('should return completions for @', () => {
        expectCompletionsFor('{@').toEqual(['html', 'debug', 'const']);
    });

    describe('should return no completions for :', () => {
        it(' when no open tag before that', () => {
            expectCompletionsFor('{:').toEqual(null);
        });

        it(' when only completed tag before that', () => {
            expectCompletionsFor('{#if}{/if}{:').toEqual(null);
        });
    });

    describe('should return no completions for /', () => {
        it('when no open tag before that', () => {
            expectCompletionsFor('{/').toEqual(null);
        });

        it('when only completed tag before that', () => {
            expectCompletionsFor('{#if}{/if}{/').toEqual(null);
        });

        it('when the only completed tag before it has white space before close symbol', () => {
            expectCompletionsFor('{#if}{ /if}{/').toEqual(null);
        });
    });

    describe('should return completion for :', () => {
        it('for if', () => {
            expectCompletionsFor('{#if}{:').toEqual(['else', 'else if']);
        });

        it('for each', () => {
            expectCompletionsFor('{#each}{:').toEqual(['else']);
        });

        it('for await', () => {
            expectCompletionsFor('{#await}{:').toEqual(['then', 'catch']);
        });

        it('for last open tag', () => {
            expectCompletionsFor('{#if}{/if}{#if}{#await}{:').toEqual(['then', 'catch']);
        });
    });

    describe('should return completion for /', () => {
        it('for if', () => {
            expectCompletionsFor('{#if}{/').toEqual(['if']);
        });

        it('for each', () => {
            expectCompletionsFor('{#each}{/').toEqual(['each']);
        });

        it('for await', () => {
            expectCompletionsFor('{#await}{/').toEqual(['await']);
        });

        it('for key', () => {
            expectCompletionsFor('{#key}{/').toEqual(['key']);
        });

        it('for last open tag', () => {
            expectCompletionsFor('{#if}{/if}{#if}{#await}{/').toEqual(['await']);
        });
    });

    it('should return completion for component documentation comment', () => {
        const content = '<!--@';
        const document = new Document('url', content);
        const svelteDoc = new SvelteDocument(document);
        const completions = getCompletions(document, svelteDoc, Position.create(0, content.length));
        assert.deepStrictEqual(completions?.items?.[0].insertText, `component${EOL}$1${EOL}`);
    });

    function expectCompletionsForModifier(
        content: string,
        position = Position.create(0, content.lastIndexOf('|') + 1)
    ) {
        return expectCompletionsFor(content, position);
    }

    describe('should return completion for event modifier', () => {
        const modifierData = getModifierData();
        const allModifiers = modifierData.map((modifier) => modifier.modifier);

        it('can provides modifiers', () => {
            expectCompletionsForModifier('<div on:click| />').toEqual(allModifiers);
        });

        it('can chain modifier and does not provide duplicated modifier', () => {
            expectCompletionsForModifier('<div on:click|stopPropagation| />').toEqual(
                allModifiers.filter((modifier) => modifier !== 'stopPropagation')
            );
        });

        it("can chain modifier and does not provide modifier that can't used together", () => {
            expectCompletionsForModifier('<div on:click|preventDefault| />').toEqual(
                modifierData
                    .filter(
                        (modifier) =>
                            modifier.modifier != 'preventDefault' &&
                            !modifier.modifiersInvalidWith?.includes('preventDefault')
                    )
                    .map((modifier) => modifier.modifier)
            );
        });
    });
});
