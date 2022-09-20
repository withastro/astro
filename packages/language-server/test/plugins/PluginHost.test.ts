import { expect } from 'chai';
import { join } from 'path';
import sinon from 'sinon';
import { Color, CompletionTriggerKind } from 'vscode-languageserver';
import { CompletionItem, Location, LocationLink, Position, Range, TextDocumentItem } from 'vscode-languageserver-types';
import { ConfigManager } from '../../src/core/config';
import { AstroDocument, DocumentManager } from '../../src/core/documents';
import { AstroPlugin, HTMLPlugin, PluginHost, PluginHostConfig, TypeScriptPlugin } from '../../src/plugins';
import { LanguageServiceManager } from '../../src/plugins/typescript/LanguageServiceManager';
import { openDocument } from '../utils';
import ts from 'typescript/lib/tsserverlibrary';

describe('PluginHost', () => {
	const textDocument: TextDocumentItem = {
		uri: 'file:///astro.astro',
		version: 0,
		languageId: 'astro',
		text: 'Hello, world!',
	};

	function setup<T>(
		pluginProviderStubs: T,
		config: PluginHostConfig = {
			definitionLinkSupport: true,
			filterIncompleteCompletions: false,
		}
	) {
		const docManager = new DocumentManager((document) => new AstroDocument(document.uri, document.text));

		const pluginHost = new PluginHost(docManager);
		const plugin = {
			...pluginProviderStubs,
			__name: 'test',
		};

		pluginHost.initialize(config);
		pluginHost.registerPlugin(plugin);

		return { docManager, pluginHost, plugin };
	}

	it('executes getCompletions on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getCompletions: sinon.stub().returns({ items: [] }),
		});
		const document = docManager.openDocument(textDocument);
		const pos = Position.create(0, 0);

		await pluginHost.getCompletions(textDocument, pos, {
			triggerKind: CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '.',
		});

		sinon.assert.calledOnce(plugin.getCompletions);
		sinon.assert.calledWithExactly(
			plugin.getCompletions,
			document,
			pos,
			{
				triggerKind: CompletionTriggerKind.TriggerCharacter,
				triggerCharacter: '.',
			},
			undefined
		);
	});

	describe('getCompletions plugins filtering', () => {
		function setupPluginHost(filePath: string) {
			const path = join(__dirname, 'fixtures', 'pluginHostCompletions');
			const configManager = new ConfigManager();
			const docManager = new DocumentManager((document) => new AstroDocument(document.uri, document.text));
			const pluginHost = new PluginHost(docManager);

			const languageServiceManager = new LanguageServiceManager(docManager, [path], configManager, ts);

			pluginHost.registerPlugin(new HTMLPlugin(configManager));
			pluginHost.registerPlugin(new AstroPlugin(configManager, languageServiceManager));
			pluginHost.registerPlugin(new TypeScriptPlugin(configManager, languageServiceManager));

			const document = openDocument(filePath, path, docManager);

			return {
				document,
				docManager,
				pluginHost,
			};
		}

		it('filters out TS completions inside Astro component starting tag', async () => {
			const { pluginHost, document } = setupPluginHost('astroAndTS.astro');
			const pos = Position.create(5, 16);

			const completions = await pluginHost.getCompletions(document, pos);
			const labels = completions.items.map((item) => item.label);

			expect(labels).to.deep.equal(['set:html', 'set:text', 'is:raw', 'slot']);
		});

		it('filters out TS completions inside framework component starting tag', async () => {
			const { pluginHost, document } = setupPluginHost('astroAndTS.astro');
			const pos = Position.create(6, 14);

			const completions = await pluginHost.getCompletions(document, pos);
			const labels = completions.items.map((item) => item.label);

			expect(labels).to.deep.equal([
				'set:html',
				'set:text',
				'is:raw',
				'slot',
				'client:load',
				'client:idle',
				'client:visible',
				'client:media',
				'client:only',
			]);
		});
	});

	describe('getCompletions (incomplete)', () => {
		function setupGetIncompleteCompletions(filterServerSide: boolean) {
			const { docManager, pluginHost } = setup(
				{
					getCompletions: sinon.stub().returns({
						isIncomplete: true,
						items: <CompletionItem[]>[{ label: 'Hello' }, { label: 'foo' }],
					}),
				},
				{ definitionLinkSupport: true, filterIncompleteCompletions: filterServerSide }
			);
			docManager.openDocument(textDocument);
			return pluginHost;
		}

		it('filters client side', async () => {
			const pluginHost = setupGetIncompleteCompletions(false);
			const completions = await pluginHost.getCompletions(textDocument, Position.create(0, 2));

			expect(completions.items).to.deep.equal(<CompletionItem[]>[{ label: 'Hello' }, { label: 'foo' }]);
		});

		it('filters server side', async () => {
			const pluginHost = setupGetIncompleteCompletions(true);
			const completions = await pluginHost.getCompletions(textDocument, Position.create(0, 2));

			expect(completions.items).to.deep.equal(<CompletionItem[]>[{ label: 'Hello' }]);
		});
	});

	it('executes resolveCompletion on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			resolveCompletion: sinon.stub().returns({}),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.resolveCompletion(textDocument, { label: 'Hello' });

		sinon.assert.calledOnce(plugin.resolveCompletion);
		sinon.assert.calledWithExactly(plugin.resolveCompletion, document, { label: 'Hello' });
	});

	it('executes getDiagnostics on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getDiagnostics: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.getDiagnostics(textDocument);

		sinon.assert.calledOnce(plugin.getDiagnostics);
		sinon.assert.calledWithExactly(plugin.getDiagnostics, document);
	});

	it('executes doHover on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			doHover: sinon.stub().returns(null),
		});
		const document = docManager.openDocument(textDocument);
		const pos = Position.create(0, 0);

		await pluginHost.doHover(textDocument, pos);

		sinon.assert.calledOnce(plugin.doHover);
		sinon.assert.calledWithExactly(plugin.doHover, document, pos);
	});

	it('executes formatDocument on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			formatDocument: sinon.stub().returns(''),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.formatDocument(textDocument, { tabSize: 2, insertSpaces: true });

		sinon.assert.calledOnce(plugin.formatDocument);
		sinon.assert.calledWithExactly(plugin.formatDocument, document, { tabSize: 2, insertSpaces: true });
	});

	it('executes getCodeActions on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getCodeActions: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const range = Range.create(Position.create(0, 0), Position.create(0, 0));

		await pluginHost.getCodeActions(textDocument, range, { diagnostics: [] });

		sinon.assert.calledOnce(plugin.getCodeActions);
		sinon.assert.calledWithExactly(plugin.getCodeActions, document, range, { diagnostics: [] }, undefined);
	});

	it('executes getFoldingRanges on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getFoldingRanges: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.getFoldingRanges(textDocument);

		sinon.assert.calledOnce(plugin.getFoldingRanges);
		sinon.assert.calledWithExactly(plugin.getFoldingRanges, document);
	});

	it('executes getDocumentSymbols on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getDocumentSymbols: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.getDocumentSymbols(textDocument);

		sinon.assert.calledOnce(plugin.getDocumentSymbols);
		sinon.assert.calledWithExactly(plugin.getDocumentSymbols, document, undefined);
	});

	it('executes getSemanticTokens on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getSemanticTokens: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.getSemanticTokens(textDocument);

		sinon.assert.calledOnce(plugin.getSemanticTokens);
		sinon.assert.calledWithExactly(plugin.getSemanticTokens, document, undefined, undefined);
	});

	it('executes getLinkedEditingRanges on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getLinkedEditingRanges: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const position = Position.create(0, 0);

		await pluginHost.getLinkedEditingRanges(textDocument, position);

		sinon.assert.calledOnce(plugin.getLinkedEditingRanges);
		sinon.assert.calledWithExactly(plugin.getLinkedEditingRanges, document, position);
	});

	describe('getDefinitions', () => {
		function setupGetDefinitions(linkSupport: boolean) {
			const { pluginHost, docManager } = setup(
				{
					getDefinitions: sinon.stub().returns([
						<LocationLink>{
							targetRange: Range.create(Position.create(0, 0), Position.create(0, 2)),
							targetSelectionRange: Range.create(Position.create(0, 0), Position.create(0, 1)),
							targetUri: 'uri',
						},
					]),
				},
				{ definitionLinkSupport: linkSupport, filterIncompleteCompletions: false }
			);
			docManager.openDocument(textDocument);
			return pluginHost;
		}

		it('uses LocationLink', async () => {
			const pluginHost = setupGetDefinitions(true);
			const definitions = await pluginHost.getDefinitions(textDocument, Position.create(0, 0));

			expect(definitions).to.deep.equal([
				<LocationLink>{
					targetRange: Range.create(Position.create(0, 0), Position.create(0, 2)),
					targetSelectionRange: Range.create(Position.create(0, 0), Position.create(0, 1)),
					targetUri: 'uri',
				},
			]);
		});

		it('uses Location', async () => {
			const pluginHost = setupGetDefinitions(false);
			const definitions = await pluginHost.getDefinitions(textDocument, Position.create(0, 0));

			expect(definitions).to.deep.equal([
				<Location>{
					range: Range.create(Position.create(0, 0), Position.create(0, 1)),
					uri: 'uri',
				},
			]);
		});
	});

	it('executes getTypeDefinitions on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getTypeDefinitions: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const position = Position.create(0, 0);

		await pluginHost.getTypeDefinitions(textDocument, position);

		sinon.assert.calledOnce(plugin.getTypeDefinitions);
		sinon.assert.calledWithExactly(plugin.getTypeDefinitions, document, position);
	});

	it('executes getReferences on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			findReferences: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const position = Position.create(0, 0);

		await pluginHost.getReferences(textDocument, position, { includeDeclaration: true });

		sinon.assert.calledOnce(plugin.findReferences);
		sinon.assert.calledWithExactly(plugin.findReferences, document, position, { includeDeclaration: true });
	});

	it('executes getDocumentColors on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getDocumentColors: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);

		await pluginHost.getDocumentColors(textDocument);

		sinon.assert.calledOnce(plugin.getDocumentColors);
		sinon.assert.calledWithExactly(plugin.getDocumentColors, document);
	});

	it('executes getColorPresentations on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getColorPresentations: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const range = Range.create(Position.create(0, 0), Position.create(0, 1));
		const color = Color.create(0, 0, 0, 0);

		await pluginHost.getColorPresentations(textDocument, range, color);

		sinon.assert.calledOnce(plugin.getColorPresentations);
		sinon.assert.calledWithExactly(plugin.getColorPresentations, document, range, color);
	});

	it('executes getInlayHints on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getInlayHints: sinon.stub().returns([]),
		});
		const document = docManager.openDocument(textDocument);
		const range = Range.create(Position.create(0, 0), Position.create(0, 1));

		await pluginHost.getInlayHints(textDocument, range);

		sinon.assert.calledOnce(plugin.getInlayHints);
		sinon.assert.calledWithExactly(plugin.getInlayHints, document, range);
	});

	it('executes getSignatureHelp on plugins', async () => {
		const { docManager, pluginHost, plugin } = setup({
			getSignatureHelp: sinon.stub().returns({}),
		});
		const document = docManager.openDocument(textDocument);
		const position = Position.create(0, 0);

		await pluginHost.getSignatureHelp(textDocument, position, undefined);

		sinon.assert.calledOnce(plugin.getSignatureHelp);
		sinon.assert.calledWithExactly(plugin.getSignatureHelp, document, position, undefined, undefined);
	});

	it('executes onWatchFileChanges on plugins', async () => {
		const { pluginHost, plugin } = setup({
			onWatchFileChanges: sinon.stub(),
		});

		pluginHost.onWatchFileChanges([]);

		sinon.assert.calledOnce(plugin.onWatchFileChanges);
		sinon.assert.calledWithExactly(plugin.onWatchFileChanges, []);
	});

	it('executes updateNonAstroFile on plugins', async () => {
		const { pluginHost, plugin } = setup({
			updateNonAstroFile: sinon.stub(),
		});

		pluginHost.updateNonAstroFile('astro.astro', []);

		sinon.assert.calledOnce(plugin.updateNonAstroFile);
		sinon.assert.calledWithExactly(plugin.updateNonAstroFile, 'astro.astro', []);
	});
});
