import * as assert from 'assert';
import { Position } from 'vscode-languageserver';
import { getHoverInfo } from '../../../../src/plugins/svelte/features/getHoverInfo';
import { SvelteDocument } from '../../../../src/plugins/svelte/SvelteDocument';
import { documentation, SvelteTag } from '../../../../src/plugins/svelte/features/SvelteTags';
import { Document } from '../../../../src/lib/documents';
import { getModifierData } from '../../../../src/plugins/svelte/features/getModifierData';

describe('SveltePlugin#getHoverInfo', () => {
    function expectHoverInfoFor(content: string, position: Position) {
        const document = new Document('url', content);
        const svelteDoc = new SvelteDocument(document);
        const hover = getHoverInfo(document, svelteDoc, position);
        return {
            toEqual: (tag: SvelteTag | null) =>
                assert.deepStrictEqual(hover, tag ? { contents: documentation[tag] } : null)
        };
    }

    describe('should return null', () => {
        it('if position inside style', () => {
            expectHoverInfoFor(
                '<style>h1{color:blue;}</style><p>test</p>',
                Position.create(0, 10)
            ).toEqual(null);
        });

        it('if position inside script', () => {
            expectHoverInfoFor(
                '<script>const a = true</script><p>test</p>',
                Position.create(0, 10)
            ).toEqual(null);
        });

        it('if not valid content #1', () => {
            expectHoverInfoFor('{nope', Position.create(0, 2)).toEqual(null);
        });

        it('if not valid content #2', () => {
            expectHoverInfoFor('not really', Position.create(0, 2)).toEqual(null);
        });

        it('if not valid content #3', () => {
            expectHoverInfoFor('{#await.', Position.create(0, 3)).toEqual(null);
        });
    });

    describe('should return no hover for :else', () => {
        it(' when no open tag before that', () => {
            expectHoverInfoFor('{:else}', Position.create(0, 3)).toEqual(null);
        });

        it(' when only completed tag before that', () => {
            expectHoverInfoFor('{#if}{/if}{:else}', Position.create(0, 15)).toEqual(null);
        });
    });

    it('should return hover for :else if opening tag before that', () => {
        expectHoverInfoFor('{#if}{:else}', Position.create(0, 8)).toEqual('if');
    }),
        describe('should return hover for /', () => {
            (['if', 'each', 'await'] as const).forEach((tag) => {
                it(`(/${tag})`, () => {
                    expectHoverInfoFor(`{/${tag}}`, Position.create(0, 3)).toEqual(tag);
                    expectHoverInfoFor(`{/${tag} `, Position.create(0, 3)).toEqual(tag);
                });
            });
        });

    describe('should return hover for #', () => {
        (['if', 'each', 'await', 'key'] as const).forEach((tag) => {
            it(`(#${tag})`, () => {
                expectHoverInfoFor(`{#${tag}}`, Position.create(0, 3)).toEqual(tag);
                expectHoverInfoFor(`{#${tag} `, Position.create(0, 3)).toEqual(tag);
            });
        });
    });

    describe('should return hover for @', () => {
        (['debug', 'html'] as const).forEach((tag) => {
            it(`(@${tag})`, () => {
                expectHoverInfoFor(`{@${tag}}`, Position.create(0, 3)).toEqual(tag);
                expectHoverInfoFor(`{@${tag} `, Position.create(0, 3)).toEqual(tag);
            });
        });
    });

    describe('should return hover for definite :', () => {
        (
            [
                ['if', 'else if'],
                ['await', 'then'],
                ['await', 'catch']
            ] as const
        ).forEach((tag) => {
            it(`(:${tag[1]})`, () => {
                expectHoverInfoFor(`{:${tag[1]}}`, Position.create(0, 3)).toEqual(tag[0]);
                expectHoverInfoFor(`{:${tag[1]} `, Position.create(0, 3)).toEqual(tag[0]);
            });
        });
    });

    function expectHoverInfoForEventModifier(content: string, position: Position) {
        const document = new Document('url', content);
        const svelteDoc = new SvelteDocument(document);
        const hover = getHoverInfo(document, svelteDoc, position);
        return {
            toEqual: (expectedModifier: string) => {
                const contents = getModifierData().find(
                    (modifier) => modifier.modifier === expectedModifier
                )?.documentation;
                assert.deepStrictEqual(hover, { contents });
            }
        };
    }

    it('should return hover event modifier', () => {
        expectHoverInfoForEventModifier(
            '<div on:click|preventDefault />',
            Position.create(0, 15)
        ).toEqual('preventDefault');
    });
});
