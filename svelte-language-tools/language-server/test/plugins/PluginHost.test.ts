import sinon from 'sinon';
import {
    CompletionItem,
    Location,
    LocationLink,
    Position,
    Range,
    TextDocumentItem
} from 'vscode-languageserver-types';
import { DocumentManager, Document } from '../../src/lib/documents';
import { LSPProviderConfig, PluginHost } from '../../src/plugins';
import { CompletionTriggerKind } from 'vscode-languageserver';
import assert from 'assert';

describe('PluginHost', () => {
    const textDocument: TextDocumentItem = {
        uri: 'file:///hello.svelte',
        version: 0,
        languageId: 'svelte',
        text: 'Hello, world!'
    };

    function setup<T>(
        pluginProviderStubs: T,
        config: LSPProviderConfig = {
            definitionLinkSupport: true,
            filterIncompleteCompletions: false
        }
    ) {
        const docManager = new DocumentManager(
            (textDocument) => new Document(textDocument.uri, textDocument.text)
        );

        const pluginHost = new PluginHost(docManager);
        const plugin = {
            ...pluginProviderStubs,
            __name: 'test'
        };

        pluginHost.initialize(config);
        pluginHost.register(plugin);

        return { docManager, pluginHost, plugin };
    }

    it('executes getDiagnostics on plugins', async () => {
        const { docManager, pluginHost, plugin } = setup({
            getDiagnostics: sinon.stub().returns([])
        });
        const document = docManager.openDocument(textDocument);

        await pluginHost.getDiagnostics(textDocument);

        sinon.assert.calledOnce(plugin.getDiagnostics);
        sinon.assert.calledWithExactly(plugin.getDiagnostics, document);
    });

    it('executes doHover on plugins', async () => {
        const { docManager, pluginHost, plugin } = setup({
            doHover: sinon.stub().returns(null)
        });
        const document = docManager.openDocument(textDocument);
        const pos = Position.create(0, 0);

        await pluginHost.doHover(textDocument, pos);

        sinon.assert.calledOnce(plugin.doHover);
        sinon.assert.calledWithExactly(plugin.doHover, document, pos);
    });

    it('executes getCompletions on plugins', async () => {
        const { docManager, pluginHost, plugin } = setup({
            getCompletions: sinon.stub().returns({ items: [] })
        });
        const document = docManager.openDocument(textDocument);
        const pos = Position.create(0, 0);

        await pluginHost.getCompletions(textDocument, pos, {
            triggerKind: CompletionTriggerKind.TriggerCharacter,
            triggerCharacter: '.'
        });

        sinon.assert.calledOnce(plugin.getCompletions);
        sinon.assert.calledWithExactly(
            plugin.getCompletions,
            document,
            pos,
            {
                triggerKind: CompletionTriggerKind.TriggerCharacter,
                triggerCharacter: '.'
            },
            undefined
        );
    });

    describe('getCompletions (incomplete)', () => {
        function setupGetIncompleteCompletions(filterServerSide: boolean) {
            const { docManager, pluginHost } = setup(
                {
                    getCompletions: sinon.stub().returns({
                        isIncomplete: true,
                        items: <CompletionItem[]>[{ label: 'Hello' }, { label: 'foo' }]
                    })
                },
                { definitionLinkSupport: true, filterIncompleteCompletions: filterServerSide }
            );
            docManager.openDocument(textDocument);
            return pluginHost;
        }

        it('filters client side', async () => {
            const pluginHost = setupGetIncompleteCompletions(false);
            const completions = await pluginHost.getCompletions(
                textDocument,
                Position.create(0, 2)
            );

            assert.deepStrictEqual(completions.items, <CompletionItem[]>[
                { label: 'Hello' },
                { label: 'foo' }
            ]);
        });

        it('filters server side', async () => {
            const pluginHost = setupGetIncompleteCompletions(true);
            const completions = await pluginHost.getCompletions(
                textDocument,
                Position.create(0, 2)
            );

            assert.deepStrictEqual(completions.items, <CompletionItem[]>[{ label: 'Hello' }]);
        });
    });

    describe('getDefinitions', () => {
        function setupGetDefinitions(linkSupport: boolean) {
            const { pluginHost, docManager } = setup(
                {
                    getDefinitions: sinon.stub().returns([
                        <LocationLink>{
                            targetRange: Range.create(Position.create(0, 0), Position.create(0, 2)),
                            targetSelectionRange: Range.create(
                                Position.create(0, 0),
                                Position.create(0, 1)
                            ),
                            targetUri: 'uri'
                        }
                    ])
                },
                { definitionLinkSupport: linkSupport, filterIncompleteCompletions: false }
            );
            docManager.openDocument(textDocument);
            return pluginHost;
        }

        it('uses LocationLink', async () => {
            const pluginHost = setupGetDefinitions(true);
            const definitions = await pluginHost.getDefinitions(
                textDocument,
                Position.create(0, 0)
            );

            assert.deepStrictEqual(definitions, [
                <LocationLink>{
                    targetRange: Range.create(Position.create(0, 0), Position.create(0, 2)),
                    targetSelectionRange: Range.create(
                        Position.create(0, 0),
                        Position.create(0, 1)
                    ),
                    targetUri: 'uri'
                }
            ]);
        });

        it('uses Location', async () => {
            const pluginHost = setupGetDefinitions(false);
            const definitions = await pluginHost.getDefinitions(
                textDocument,
                Position.create(0, 0)
            );

            assert.deepStrictEqual(definitions, [
                <Location>{
                    range: Range.create(Position.create(0, 0), Position.create(0, 1)),
                    uri: 'uri'
                }
            ]);
        });
    });
});
