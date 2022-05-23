import * as assert from 'assert';
import { SveltePlugin } from '../../../src/plugins';
import { DocumentManager, Document } from '../../../src/lib/documents';
import {
    Diagnostic,
    Range,
    DiagnosticSeverity,
    CancellationTokenSource
} from 'vscode-languageserver';
import { LSConfigManager } from '../../../src/ls-config';
import * as importPackage from '../../../src/importPackage';
import sinon from 'sinon';

describe('Svelte Plugin', () => {
    function setup(content: string, prettierConfig?: any, trusted = true) {
        const document = new Document('file:///hello.svelte', content);
        const docManager = new DocumentManager(() => document);
        const pluginManager = new LSConfigManager();
        pluginManager.updateIsTrusted(trusted);
        pluginManager.updatePrettierConfig(prettierConfig);
        const plugin = new SveltePlugin(pluginManager);
        docManager.openDocument(<any>'some doc');
        return { plugin, document };
    }

    it('provides diagnostic warnings', async () => {
        const { plugin, document } = setup('<h1>Hello, world!</h1>\n<img src="hello.png">');

        const diagnostics = await plugin.getDiagnostics(document);
        const diagnostic = Diagnostic.create(
            Range.create(1, 0, 1, 21),
            'A11y: <img> element should have an alt attribute',
            DiagnosticSeverity.Warning,
            'a11y-missing-attribute',
            'svelte'
        );

        assert.deepStrictEqual(diagnostics, [diagnostic]);
    });

    it('provides diagnostic errors', async () => {
        const { plugin, document } = setup('<div bind:whatever></div>');

        const diagnostics = await plugin.getDiagnostics(document);
        const diagnostic = Diagnostic.create(
            Range.create(0, 10, 0, 18),
            'whatever is not declared',
            DiagnosticSeverity.Error,
            'binding-undeclared',
            'svelte'
        );

        assert.deepStrictEqual(diagnostics, [diagnostic]);
    });

    it('provides no diagnostic errors when untrusted', async () => {
        const { plugin, document } = setup('<div bind:whatever></div>', {}, false);

        const diagnostics = await plugin.getDiagnostics(document);

        assert.deepStrictEqual(diagnostics, []);
    });

    describe('#formatDocument', () => {
        function stubPrettier(config: any) {
            const formatStub = sinon.stub().returns('formatted');

            sinon.stub(importPackage, 'importPrettier').returns(<any>{
                resolveConfig: () => Promise.resolve(config),
                getFileInfo: () => ({ ignored: false }),
                format: formatStub,
                getSupportInfo: () => ({ languages: [{ name: 'svelte' }] })
            });

            return formatStub;
        }

        async function testFormat(config: any, fallbackPrettierConfig: any) {
            const { plugin, document } = setup('unformatted', fallbackPrettierConfig);
            const formatStub = stubPrettier(config);

            const formatted = await plugin.formatDocument(document, {
                insertSpaces: true,
                tabSize: 4
            });
            assert.deepStrictEqual(formatted, [
                {
                    newText: 'formatted',
                    range: {
                        end: {
                            character: 11,
                            line: 0
                        },
                        start: {
                            character: 0,
                            line: 0
                        }
                    }
                }
            ]);

            return formatStub;
        }

        afterEach(() => {
            sinon.restore();
        });

        it('should use config for formatting', async () => {
            const formatStub = await testFormat({ fromConfig: true }, { fallbackConfig: true });
            sinon.assert.calledOnceWithExactly(formatStub, 'unformatted', {
                fromConfig: true,
                plugins: [],
                parser: 'svelte'
            });
        });

        const defaultSettings = {
            svelteSortOrder: 'options-scripts-markup-styles',
            svelteStrictMode: false,
            svelteAllowShorthand: true,
            svelteBracketNewLine: true,
            svelteIndentScriptAndStyle: true,
            printWidth: 80,
            singleQuote: false
        };

        it('should use prettier fallback config for formatting', async () => {
            const formatStub = await testFormat(undefined, { fallbackConfig: true });
            sinon.assert.calledOnceWithExactly(formatStub, 'unformatted', {
                fallbackConfig: true,
                plugins: [],
                parser: 'svelte',
                ...defaultSettings
            });
        });

        it('should use FormattingOptions for formatting', async () => {
            const formatStub = await testFormat(undefined, undefined);
            sinon.assert.calledOnceWithExactly(formatStub, 'unformatted', {
                tabWidth: 4,
                useTabs: false,
                plugins: [],
                parser: 'svelte',
                ...defaultSettings
            });
        });

        it('should use FormattingOptions for formatting when configs are empty objects', async () => {
            const formatStub = await testFormat({}, {});
            sinon.assert.calledOnceWithExactly(formatStub, 'unformatted', {
                tabWidth: 4,
                useTabs: false,
                plugins: [],
                parser: 'svelte',
                ...defaultSettings
            });
        });
    });

    it('can cancel completion before promise resolved', async () => {
        const { plugin, document } = setup('{#');
        const cancellationTokenSource = new CancellationTokenSource();

        const completionsPromise = plugin.getCompletions(
            document,
            { line: 0, character: 2 },
            undefined,
            cancellationTokenSource.token
        );

        cancellationTokenSource.cancel();

        assert.deepStrictEqual(await completionsPromise, null);
    });

    it('can cancel code action before promise resolved', async () => {
        const { plugin, document } = setup('<a></a>');
        const cancellationTokenSource = new CancellationTokenSource();
        const range = {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 7 }
        };

        const codeActionPromise = plugin.getCodeActions(
            document,
            range,
            {
                diagnostics: [
                    {
                        message: 'A11y: <a> element should have child content',
                        code: 'a11y-missing-content',
                        range,
                        severity: DiagnosticSeverity.Warning,
                        source: 'svelte'
                    }
                ]
            },
            cancellationTokenSource.token
        );

        cancellationTokenSource.cancel();

        assert.deepStrictEqual(await codeActionPromise, []);
    });
});
