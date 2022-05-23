import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity, Position } from 'vscode-languageserver';
import { Document } from '../../../../src/lib/documents';
import { getDiagnostics } from '../../../../src/plugins/svelte/features/getDiagnostics';
import {
    SvelteDocument,
    TranspileErrorSource
} from '../../../../src/plugins/svelte/SvelteDocument';
import { SvelteConfig } from '../../../../src/lib/documents/configLoader';
import { CompilerWarningsSettings, LSConfigManager } from '../../../../src/ls-config';
import { pathToUrl } from '../../../../src/utils';
import { SveltePlugin } from '../../../../src/plugins';

describe('SveltePlugin#getDiagnostics', () => {
    async function expectDiagnosticsFor({
        getTranspiled,
        getCompiled,
        config,
        settings = {},
        docText = '<script></script>\n<style></style>'
    }: {
        getTranspiled: any;
        getCompiled: any;
        config: Partial<SvelteConfig>;
        settings?: CompilerWarningsSettings;
        docText?: string;
    }) {
        const document = new Document('', docText);
        const svelteDoc: SvelteDocument = <any>{ getTranspiled, getCompiled, config };
        const result = await getDiagnostics(document, svelteDoc, settings);
        return {
            toEqual: (expected: Diagnostic[]) => assert.deepStrictEqual(result, expected)
        };
    }

    function setupFromFile(filename: string) {
        const testDir = path.join(__dirname, '..');
        const filePath = path.join(testDir, 'testfiles', filename);
        const document = new Document(pathToUrl(filePath), fs.readFileSync(filePath, 'utf-8'));
        const pluginManager = new LSConfigManager();
        const plugin = new SveltePlugin(pluginManager);
        return { plugin, document };
    }

    it('expect svelte.config.js error', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => {
                    throw new Error();
                },
                getCompiled: () => '',
                config: { loadConfigError: new Error('svelte.config.js') }
            })
        ).toEqual([
            {
                message: 'Error in svelte.config.js\n\nError: svelte.config.js',
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 5,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte'
            }
        ]);
    });

    it('expect script transpilation error', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => {
                    const e: any = new Error('Script');
                    e.__source = TranspileErrorSource.Script;
                    throw e;
                },
                getCompiled: () => '',
                config: {}
            })
        ).toEqual([
            {
                message: 'Script',
                range: {
                    start: {
                        character: 8,
                        line: 0
                    },
                    end: {
                        character: 8,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte(script)'
            }
        ]);
    });

    it('expect style transpilation error', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => {
                    const e: any = new Error('Style');
                    e.__source = TranspileErrorSource.Style;
                    throw e;
                },
                getCompiled: () => '',
                config: {}
            })
        ).toEqual([
            {
                message: 'Style',
                range: {
                    start: {
                        character: 7,
                        line: 1
                    },
                    end: {
                        character: 7,
                        line: 1
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte(style)'
            }
        ]);
    });

    it('expect style transpilation error with line/columns', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => {
                    const e: any = new Error('Style');
                    e.line = 1;
                    e.column = 0;
                    e.__source = TranspileErrorSource.Style;
                    throw e;
                },
                getCompiled: () => '',
                config: {}
            })
        ).toEqual([
            {
                message: 'Style',
                range: {
                    start: {
                        character: 0,
                        line: 1
                    },
                    end: {
                        character: 0,
                        line: 1
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte(style)'
            }
        ]);
    });

    it('expect compilation error', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: () => Position.create(0, 0)
                }),
                getCompiled: () => {
                    const e: any = new Error('Compilation');
                    e.message = 'ERROR';
                    e.code = 123;
                    throw e;
                },
                config: {}
            })
        ).toEqual([
            {
                code: 123,
                message: 'ERROR',
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 0,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte'
            }
        ]);
    });

    it('expect compilation error with expected', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: () => Position.create(0, 8)
                }),
                getCompiled: () => {
                    const e: any = new Error('Compilation');
                    e.message = 'expected x to not be here';
                    e.code = 123;
                    e.start = { line: 1, column: 8 };
                    throw e;
                },
                config: {}
            })
        ).toEqual([
            {
                code: 123,
                message:
                    'expected x to not be here' +
                    '\n\nIf you expect this syntax to work, here are some suggestions: ' +
                    '\nIf you use typescript with `svelte-preprocess`, did you add `lang="ts"` to your `script` tag? ' +
                    '\nDid you setup a `svelte.config.js`? ' +
                    '\nSee https://github.com/sveltejs/language-tools/tree/master/docs#using-with-preprocessors for more info.',
                range: {
                    start: {
                        character: 8,
                        line: 0
                    },
                    end: {
                        character: 8,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte'
            }
        ]);
    });

    it('expect valid position for compilation error', async () => {
        const message =
            'Stores must be declared at the top level of the component (this may change in a future version of Svelte)';
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: () => Position.create(-1, -1)
                }),
                getCompiled: () => {
                    const e: any = new Error();
                    e.message = message;
                    e.code = 123;
                    e.start = { line: 1, column: 8 };
                    throw e;
                },
                config: {}
            })
        ).toEqual([
            {
                code: 123,
                message,
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 0,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte'
            }
        ]);
    });

    it('expect warnings', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: (pos: Position) => {
                        pos.line - 1;
                        return pos;
                    }
                }),
                getCompiled: () =>
                    Promise.resolve({
                        stats: {
                            warnings: [
                                {
                                    start: { line: 1, column: 0 },
                                    end: { line: 1, column: 0 },
                                    message: 'warning',
                                    code: 123
                                }
                            ]
                        }
                    }),
                config: {}
            })
        ).toEqual([
            {
                code: 123,
                message: 'warning',
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 0,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Warning,
                source: 'svelte'
            }
        ]);
    });

    it('filter out false positive warning (export enum)', async () => {
        (
            await expectDiagnosticsFor({
                docText: '<script context="module">export enum A { B }</script>',
                getTranspiled: () => ({
                    getOriginalPosition: (pos: Position) => {
                        return pos;
                    }
                }),
                getCompiled: () =>
                    Promise.resolve({
                        stats: {
                            warnings: [
                                {
                                    start: { line: 1, column: 32 },
                                    end: { line: 1, column: 33 },
                                    message:
                                        "Component has unused export property 'A'. If it is for external reference only, please consider using `export const A`",
                                    code: 'unused-export-let'
                                }
                            ]
                        }
                    }),
                config: {}
            })
        ).toEqual([]);
    });

    it('filter out false positive warning (export namespace)', async () => {
        (
            await expectDiagnosticsFor({
                docText:
                    '<script context="module">export namespace foo { export function bar() {} }</script>',
                getTranspiled: () => ({
                    getOriginalPosition: (pos: Position) => {
                        return pos;
                    }
                }),
                getCompiled: () =>
                    Promise.resolve({
                        stats: {
                            warnings: [
                                {
                                    start: { line: 1, column: 43 },
                                    end: { line: 1, column: 46 },
                                    message:
                                        "Component has unused export property 'foo'. If it is for external reference only, please consider using `export const foo`",
                                    code: 'unused-export-let'
                                }
                            ]
                        }
                    }),
                config: {}
            })
        ).toEqual([]);
    });

    it('filter out warnings', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: (pos: Position) => {
                        pos.line - 1;
                        return pos;
                    }
                }),
                getCompiled: () =>
                    Promise.resolve({
                        stats: {
                            warnings: [
                                {
                                    start: { line: 1, column: 0 },
                                    end: { line: 1, column: 0 },
                                    message: 'warning',
                                    code: '123'
                                }
                            ]
                        }
                    }),
                config: {},
                settings: { 123: 'ignore' }
            })
        ).toEqual([]);
    });

    it('treat warnings as error', async () => {
        (
            await expectDiagnosticsFor({
                getTranspiled: () => ({
                    getOriginalPosition: (pos: Position) => {
                        pos.line - 1;
                        return pos;
                    }
                }),
                getCompiled: () =>
                    Promise.resolve({
                        stats: {
                            warnings: [
                                {
                                    start: { line: 1, column: 0 },
                                    end: { line: 1, column: 0 },
                                    message: 'warning',
                                    code: '123'
                                }
                            ]
                        }
                    }),
                config: {},
                settings: { 123: 'error' }
            })
        ).toEqual([
            {
                code: '123',
                message: 'warning',
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 0,
                        line: 0
                    }
                },
                severity: DiagnosticSeverity.Error,
                source: 'svelte'
            }
        ]);
    });

    it('should correctly determine diagnostic position', async () => {
        const { plugin, document } = setupFromFile('diagnostics.svelte');
        const diagnostics = await plugin.getDiagnostics(document);

        assert.deepStrictEqual(diagnostics, [
            {
                range: { start: { line: 1, character: 15 }, end: { line: 1, character: 27 } },
                message:
                    "Component has unused export property 'name'. If it is for external reference only, please consider using `export const name`",
                severity: 2,
                source: 'svelte',
                code: 'unused-export-let'
            }
        ]);
    });

    it('should correctly determine diagnostic position for context="module"', async () => {
        const { plugin, document } = setupFromFile('diagnostics-module.svelte');
        const diagnostics = await plugin.getDiagnostics(document);

        assert.deepStrictEqual(diagnostics, [
            {
                range: { start: { line: 1, character: 4 }, end: { line: 1, character: 26 } },
                message: '$: has no effect in a module script',
                severity: 2,
                source: 'svelte',
                code: 'module-script-reactive-declaration'
            }
        ]);
    });

    it('should correctly determine diagnostic position for script when theres also context="module"', async () => {
        const { plugin, document } = setupFromFile('diagnostics-module-and-instance.svelte');
        const diagnostics = await plugin.getDiagnostics(document);

        assert.deepStrictEqual(diagnostics, [
            {
                code: 'unused-export-let',
                message:
                    "Component has unused export property 'unused1'. If it is for external reference only, please consider using `export const unused1`",
                range: {
                    start: {
                        line: 5,
                        character: 13
                    },
                    end: {
                        line: 5,
                        character: 27
                    }
                },
                severity: 2,
                source: 'svelte'
            },
            {
                code: 'unused-export-let',
                message:
                    "Component has unused export property 'unused2'. If it is for external reference only, please consider using `export const unused2`",
                range: {
                    start: {
                        line: 6,
                        character: 13
                    },
                    end: {
                        line: 6,
                        character: 27
                    }
                },
                severity: 2,
                source: 'svelte'
            }
        ]);
    });
});
