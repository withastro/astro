import type { InitializeResult, ServerCapabilities } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { getLanguageServer } from '../server.js';

describe('Initialize', async () => {
	let initializeResult: InitializeResult;

	before(async function () {
		// First init can sometimes be slow in CI, even though the rest of the tests will be fast.
		this.timeout(50000);
		initializeResult = (await getLanguageServer()).initializeResult;
	});

	it('Can start server', async () => {
		expect(initializeResult).not.be.null;
	});

	it('Has proper capabilities', async () => {
		const capabilities: ServerCapabilities = {
			callHierarchyProvider: true,
			codeActionProvider: {
				codeActionKinds: [
					'',
					'quickfix',
					'refactor',
					'refactor.extract',
					'refactor.inline',
					'refactor.rewrite',
					'source',
					'source.fixAll',
					'source.organizeImports',
				],
				resolveProvider: true,
			},
			codeLensProvider: {},
			colorProvider: true,
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [
					'.',
					':',
					'<',
					'"',
					'=',
					'/',
					'-',
					'>',
					'+',
					'^',
					'*',
					'(',
					')',
					'#',
					'[',
					']',
					'$',
					'@',
					'{',
					'}',
					"'",
					'`',
					' ',
				],
			},
			definitionProvider: true,
			documentFormattingProvider: true,
			documentHighlightProvider: true,
			documentLinkProvider: {},
			documentOnTypeFormattingProvider: {
				firstTriggerCharacter: ';',
				moreTriggerCharacter: ['}', '\n'],
			},
			documentRangeFormattingProvider: true,
			documentSymbolProvider: true,
			experimental: {
				autoInsertionProvider: {
					configurationSections: [
						['html.autoCreateQuotes'],
						['html.autoClosingTags', 'javascript.autoClosingTags', 'typescript.autoClosingTags'],
						['html.autoClosingTags'],
					],
					triggerCharacters: ['=', '>', '/'],
				},
				fileReferencesProvider: true,
				fileRenameEditsProvider: true,
			},
			foldingRangeProvider: true,
			hoverProvider: true,
			implementationProvider: true,
			inlayHintProvider: {},
			linkedEditingRangeProvider: true,
			referencesProvider: true,
			renameProvider: {
				prepareProvider: true,
			},
			selectionRangeProvider: true,
			semanticTokensProvider: {
				full: true,
				legend: {
					tokenModifiers: ['declaration', 'readonly', 'static', 'async', 'defaultLibrary', 'local'],
					tokenTypes: [
						'namespace',
						'class',
						'enum',
						'interface',
						'typeParameter',
						'type',
						'parameter',
						'variable',
						'property',
						'enumMember',
						'function',
						'method',
					],
				},
				range: true,
			},
			signatureHelpProvider: {
				retriggerCharacters: [')'],
				triggerCharacters: ['(', ',', '<'],
			},
			textDocumentSync: 2,
			typeDefinitionProvider: true,
			workspace: {
				workspaceFolders: {
					changeNotifications: true,
					supported: true,
				},
			},
			workspaceSymbolProvider: {},
		};

		expect(initializeResult.capabilities).to.deep.equal(capabilities);
	});
});
