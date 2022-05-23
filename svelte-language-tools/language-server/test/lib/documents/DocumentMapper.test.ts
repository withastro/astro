import * as assert from 'assert';
import { FragmentMapper, positionAt } from '../../../src/lib/documents';

describe('DocumentMapper', () => {
    describe('FragmentMapper', () => {
        function setup(content: string, start: number, end: number) {
            return new FragmentMapper(
                content,
                <any>{
                    start,
                    end,
                    endPos: positionAt(end, content),
                    content: content.substring(start, end)
                },
                'file:///hello.svelte'
            );
        }

        it('isInGenerated works', () => {
            const fragment = setup('Hello, \nworld!', 8, 13);

            assert.strictEqual(fragment.isInGenerated({ line: 0, character: 0 }), false);
            assert.strictEqual(fragment.isInGenerated({ line: 1, character: 0 }), true);
            assert.strictEqual(fragment.isInGenerated({ line: 1, character: 5 }), true);
            assert.strictEqual(fragment.isInGenerated({ line: 1, character: 6 }), false);
        });

        it('calculates the position in parent', () => {
            const fragment = setup('Hello, \nworld!', 8, 13);

            assert.deepStrictEqual(fragment.getOriginalPosition({ line: 0, character: 2 }), {
                line: 1,
                character: 2
            });
        });

        it('calculates the position in fragment', () => {
            const fragment = setup('Hello, \nworld!', 8, 13);

            assert.deepStrictEqual(fragment.getGeneratedPosition({ line: 1, character: 2 }), {
                line: 0,
                character: 2
            });
        });
    });
});
