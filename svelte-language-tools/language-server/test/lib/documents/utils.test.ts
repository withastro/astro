import * as assert from 'assert';
import {
    getLineAtPosition,
    extractStyleTag,
    extractScriptTags,
    updateRelativeImport,
    getWordAt
} from '../../../src/lib/documents/utils';
import { Position } from 'vscode-languageserver';

describe('document/utils', () => {
    describe('extractTag', () => {
        it('supports boolean attributes', () => {
            const extracted = extractStyleTag('<style test></style>');
            assert.deepStrictEqual(extracted?.attributes, { test: 'test' });
        });

        it('supports unquoted attributes', () => {
            const extracted = extractStyleTag('<style type=text/css></style>');
            assert.deepStrictEqual(extracted?.attributes, {
                type: 'text/css'
            });
        });

        it('does not extract style tag inside comment', () => {
            const text = `
                <p>bla</p>
                <!--<style>h1{ color: blue; }</style>-->
                <style>p{ color: blue; }</style>
            `;
            assert.deepStrictEqual(extractStyleTag(text), {
                content: 'p{ color: blue; }',
                attributes: {},
                start: 108,
                end: 125,
                startPos: Position.create(3, 23),
                endPos: Position.create(3, 40),
                container: { start: 101, end: 133 }
            });
        });

        it('does not extract tags starting with style/script', () => {
            // https://github.com/sveltejs/language-tools/issues/43
            // this would previously match <styles>....</style> due to misconfigured attribute matching regex
            const text = `
            <styles>p{ color: blue; }</styles>
            <p>bla</p>
            ></style>
            `;
            assert.deepStrictEqual(extractStyleTag(text), null);
        });

        it('is canse sensitive to style/script', () => {
            const text = `
            <Style></Style>
            <Script></Script>
            `;
            assert.deepStrictEqual(extractStyleTag(text), null);
            assert.deepStrictEqual(extractScriptTags(text), null);
        });

        it('only extract attribute until tag ends', () => {
            const text = `
            <script type="typescript">
            () => abc
            </script>
            `;
            const extracted = extractScriptTags(text);
            const attributes = extracted?.script?.attributes;
            assert.deepStrictEqual(attributes, { type: 'typescript' });
        });

        it('can extract with self-closing component before it', () => {
            const extracted = extractStyleTag('<SelfClosing /><style></style>');
            assert.deepStrictEqual(extracted, {
                start: 22,
                end: 22,
                startPos: {
                    character: 22,
                    line: 0
                },
                endPos: {
                    character: 22,
                    line: 0
                },
                attributes: {},
                content: '',
                container: {
                    end: 30,
                    start: 15
                }
            });
        });

        it('can extract with unclosed component after it', () => {
            const extracted = extractStyleTag('<style></style><C {#if asd}<p>asd</p>{/if}');
            assert.deepStrictEqual(extracted, {
                start: 7,
                end: 7,
                startPos: {
                    character: 7,
                    line: 0
                },
                endPos: {
                    character: 7,
                    line: 0
                },
                attributes: {},
                content: '',
                container: {
                    start: 0,
                    end: 15
                }
            });
        });

        it('extracts style tag', () => {
            const text = `
                <p>bla</p>
                <style>p{ color: blue; }</style>
            `;
            assert.deepStrictEqual(extractStyleTag(text), {
                content: 'p{ color: blue; }',
                attributes: {},
                start: 51,
                end: 68,
                startPos: Position.create(2, 23),
                endPos: Position.create(2, 40),
                container: { start: 44, end: 76 }
            });
        });

        it('extracts style tag with attributes', () => {
            const text = `
                <style lang="scss">p{ color: blue; }</style>
            `;
            assert.deepStrictEqual(extractStyleTag(text), {
                content: 'p{ color: blue; }',
                attributes: { lang: 'scss' },
                start: 36,
                end: 53,
                startPos: Position.create(1, 35),
                endPos: Position.create(1, 52),
                container: { start: 17, end: 61 }
            });
        });

        it('extracts style tag with attributes and extra whitespace', () => {
            const text = `
                <style     lang="scss"    >  p{ color: blue; }  </style>
            `;
            assert.deepStrictEqual(extractStyleTag(text), {
                content: '  p{ color: blue; }  ',
                attributes: { lang: 'scss' },
                start: 44,
                end: 65,
                startPos: Position.create(1, 43),
                endPos: Position.create(1, 64),
                container: { start: 17, end: 73 }
            });
        });

        it('extracts top level script tag only', () => {
            const text = `
                {#if name}
                    <script>
                        console.log('if not top level')
                    </script>
                {/if}
                <ul>
                    {#each cats as cat}
                        <script>
                            console.log('each not top level')
                        </script>
                    {/each}
                </ul>
                {#await promise}
                    <script>
                        console.log('await not top level')
                    </script>
                {:then number}
                    <script>
                        console.log('then not top level')
                    </script>
                {:catch error}
                    <script>
                        console.log('catch not top level')
                    </script>
                {/await}
                <p>{@html <script> console.log('html not top level')</script>}</p>
                {@html mycontent}
                {@debug myvar}
                <!-- p{ color: blue; }</script> -->
                <!--<script lang="scss">
                p{ color: blue; }
                </script> -->
                <scrit>blah</scrit>
                <script>top level script</script>
            `;

            assert.deepStrictEqual(extractScriptTags(text)?.script, {
                content: 'top level script',
                attributes: {},
                start: 1243,
                end: 1259,
                startPos: Position.create(34, 24),
                endPos: Position.create(34, 40),
                container: { start: 1235, end: 1268 }
            });
        });

        it('ignores script tag in svelte:head', () => {
            // https://github.com/sveltejs/language-tools/issues/143#issuecomment-636422045
            const text = `
            <svelte:head>
                <link rel="stylesheet" href="/lib/jodit.es2018.min.css" />
                <script src="/lib/jodit.es2018.min.js"> 
                </script>
            </svelte:head>
            <p>jo</p>
            <script>top level script</script>
            <h1>Hello, world!</h1>
            <style>.bla {}</style>
            `;
            assert.deepStrictEqual(extractScriptTags(text)?.script, {
                content: 'top level script',
                attributes: {},
                start: 254,
                end: 270,
                startPos: Position.create(7, 20),
                endPos: Position.create(7, 36),
                container: { start: 246, end: 279 }
            });
        });

        it('extracts script and module script', () => {
            const text = `
            <script context="module">a</script>
            <script>b</script>
            `;
            assert.deepStrictEqual(extractScriptTags(text), {
                moduleScript: {
                    attributes: {
                        context: 'module'
                    },
                    container: {
                        end: 48,
                        start: 13
                    },
                    content: 'a',
                    start: 38,
                    end: 39,
                    startPos: {
                        character: 37,
                        line: 1
                    },
                    endPos: {
                        character: 38,
                        line: 1
                    }
                },
                script: {
                    attributes: {},
                    container: {
                        end: 79,
                        start: 61
                    },
                    content: 'b',
                    start: 69,
                    end: 70,
                    startPos: {
                        character: 20,
                        line: 2
                    },
                    endPos: {
                        character: 21,
                        line: 2
                    }
                }
            });
        });

        it('extract tag correctly with #if and < operator', () => {
            const text = `
            {#if value < 3}
              <div>
                bla
              </div>
            {:else if value < 4}
            {/if}
          <script>let value = 2</script>

          <div>
            {#if value < 3}
              <div>
                bla
              </div>
            {:else if value < 4}
            {/if}
          </div>`;
            assert.deepStrictEqual(extractScriptTags(text)?.script, {
                content: 'let value = 2',
                attributes: {},
                start: 159,
                end: 172,
                startPos: Position.create(7, 18),
                endPos: Position.create(7, 31),
                container: { start: 151, end: 181 }
            });
        });
    });

    describe('#getLineAtPosition', () => {
        it('should return line at position (only one line)', () => {
            assert.deepStrictEqual(getLineAtPosition(Position.create(0, 1), 'ABC'), 'ABC');
        });

        it('should return line at position (multiple lines)', () => {
            assert.deepStrictEqual(
                getLineAtPosition(Position.create(1, 1), 'ABC\nDEF\nGHI'),
                'DEF\n'
            );
        });
    });

    describe('#updateRelativeImport', () => {
        it('should update path of component with ending', () => {
            const newPath = updateRelativeImport(
                'C:/absolute/path/oldPath',
                'C:/absolute/newPath',
                './Component.svelte'
            );
            assert.deepStrictEqual(newPath, '../path/oldPath/Component.svelte');
        });

        it('should update path of file without ending', () => {
            const newPath = updateRelativeImport(
                'C:/absolute/path/oldPath',
                'C:/absolute/newPath',
                './someTsFile'
            );
            assert.deepStrictEqual(newPath, '../path/oldPath/someTsFile');
        });

        it('should update path of file going one up', () => {
            const newPath = updateRelativeImport(
                'C:/absolute/path/oldPath',
                'C:/absolute/path',
                './someTsFile'
            );
            assert.deepStrictEqual(newPath, './oldPath/someTsFile');
        });
    });

    describe('#getWordAt', () => {
        it('returns word between whitespaces', () => {
            assert.equal(getWordAt('qwd asd qwd', 5), 'asd');
        });

        it('returns word between whitespace and end of string', () => {
            assert.equal(getWordAt('qwd asd', 5), 'asd');
        });

        it('returns word between start of string and whitespace', () => {
            assert.equal(getWordAt('asd qwd', 2), 'asd');
        });

        it('returns word between start of string and end of string', () => {
            assert.equal(getWordAt('asd', 2), 'asd');
        });

        it('returns word with custom delimiters', () => {
            assert.equal(
                getWordAt('asd on:asd-qwd="asd" ', 10, { left: /\S+$/, right: /[\s=]/ }),
                'on:asd-qwd'
            );
        });

        function testEvent(str: string, pos: number, expected: string) {
            assert.equal(getWordAt(str, pos, { left: /\S+$/, right: /[^\w$:]/ }), expected);
        }

        it('returns event #1', () => {
            testEvent('<div on:>', 8, 'on:');
        });

        it('returns event #2', () => {
            testEvent('<div on: >', 8, 'on:');
        });

        it('returns empty string when only whitespace', () => {
            assert.equal(getWordAt('a  a', 2), '');
        });
    });
});
