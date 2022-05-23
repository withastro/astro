import * as assert from 'assert';
import sinon from 'sinon';
import { Position } from 'vscode-languageserver';
import { Document } from '../../../src/lib/documents';
import * as importPackage from '../../../src/importPackage';
import {
    SvelteDocument,
    ITranspiledSvelteDocument
} from '../../../src/plugins/svelte/SvelteDocument';
import { configLoader, SvelteConfig } from '../../../src/lib/documents/configLoader';
import { Preprocessor } from 'svelte/types/compiler/preprocess/types';

describe('Svelte Document', () => {
    function getSourceCode(transpiled: boolean): string {
        return `
        <p>jo</p>
        <script>${transpiled ? '\n' : ''}const a = true</script>
        <h1>Hello, world!</h1>
        <style>.bla {}</style>
        `;
    }

    function setup(config: SvelteConfig = {}) {
        sinon.stub(configLoader, 'getConfig').returns(config);
        const parent = new Document('file:///hello.svelte', getSourceCode(false));
        sinon.restore();
        const svelteDoc = new SvelteDocument(parent);
        return { parent, svelteDoc };
    }

    it('gets the parents text', () => {
        const { parent, svelteDoc } = setup();
        assert.strictEqual(svelteDoc.getText(), parent.getText());
    });

    describe('#transpiled (fallback)', () => {
        async function setupTranspiledWithStringSourceMap() {
            const stringSourceMapScript = () => ({
                code: '',
                map: JSON.stringify({
                    version: 3,
                    file: '',
                    names: [],
                    sources: [],
                    sourceRoot: '',
                    mappings: ''
                })
            });

            return setupTranspiled(stringSourceMapScript);
        }

        async function setupTranspiledWithObjectSourceMap() {
            const rawObjectSourceMapScript = () => ({
                code: '',
                map: {
                    version: 3,
                    file: '',
                    names: [],
                    sources: [],
                    sourceRoot: '',
                    mappings: ''
                }
            });

            return setupTranspiled(rawObjectSourceMapScript);
        }

        async function setupTranspiledWithClassSourceMap() {
            const rawObjectSourceMapScript = () => ({
                code: '',
                map: {
                    toString: () =>
                        JSON.stringify({
                            version: 3,
                            file: '',
                            names: [],
                            sources: [],
                            sourceRoot: '',
                            mappings: ''
                        })
                }
            });

            return setupTranspiled(rawObjectSourceMapScript);
        }

        async function setupTranspiled(sourceMapPreProcessor: Preprocessor) {
            const { parent, svelteDoc } = setup({
                preprocess: {
                    script: sourceMapPreProcessor
                }
            });

            // stub svelte preprocess and getOriginalPosition
            // to fake a source mapping process with the fallback version
            sinon
                .stub(importPackage, 'getPackageInfo')
                .returns({ path: '', version: { full: '', major: 3, minor: 31, patch: 0 } });
            sinon.stub(importPackage, 'importSvelte').returns({
                preprocess: (text, preprocessor) => {
                    preprocessor = Array.isArray(preprocessor) ? preprocessor : [preprocessor];
                    preprocessor.forEach((p) => p.script?.(<any>{}));
                    return Promise.resolve({
                        code: getSourceCode(true),
                        dependencies: [],
                        toString: () => getSourceCode(true),
                        map: <any>null
                    });
                },
                walk: <any>null,
                VERSION: <any>'',
                compile: <any>null,
                parse: <any>null
            });
            const transpiled = await svelteDoc.getTranspiled();
            const scriptSourceMapper = (<any>transpiled).scriptMapper.sourceMapper;
            // hacky reset of method because mocking the SourceMap constructor is an impossible task
            scriptSourceMapper.getOriginalPosition = ({ line, character }: Position) => ({
                line: line - 1,
                character
            });
            scriptSourceMapper.getGeneratedPosition = ({ line, character }: Position) => ({
                line: line + 1,
                character
            });
            sinon.restore();

            return { parent, svelteDoc, transpiled };
        }

        function assertCanMapBackAndForth(
            transpiled: ITranspiledSvelteDocument,
            generatedPosition: Position,
            originalPosition: Position
        ) {
            assert.deepStrictEqual(
                transpiled.getOriginalPosition(generatedPosition),
                originalPosition,
                'error mapping to original position'
            );

            assert.deepStrictEqual(
                transpiled.getGeneratedPosition(originalPosition),
                generatedPosition,
                'error mapping to generated position'
            );
        }

        it('should map correctly within string valued sourcemapped script', async () => {
            const { transpiled } = await setupTranspiledWithStringSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(3, 2), Position.create(2, 18));
        });

        it('should map correctly within object valued sourcemapped script', async () => {
            const { transpiled } = await setupTranspiledWithObjectSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(3, 2), Position.create(2, 18));
        });

        it('should map correctly within class valued sourcemapped script', async () => {
            const { transpiled } = await setupTranspiledWithClassSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(3, 2), Position.create(2, 18));
        });

        it('should map correctly in template before script', async () => {
            const { transpiled } = await setupTranspiledWithStringSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(1, 1), Position.create(1, 1));
        });

        it('should map correctly in template after script', async () => {
            const { transpiled } = await setupTranspiledWithStringSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(4, 1), Position.create(3, 1));
        });

        it('should map correctly in style', async () => {
            const { transpiled } = await setupTranspiledWithStringSourceMap();

            assertCanMapBackAndForth(transpiled, Position.create(5, 18), Position.create(4, 18));
        });
    });
});
