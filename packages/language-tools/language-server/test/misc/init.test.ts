import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import type { InitializeResult, ServerCapabilities } from '@volar/language-server';
import { getLanguageServer } from '../server.ts';

describe('Initialize', async () => {
	let initializeResult: InitializeResult;

	before(async () => {
		initializeResult = (await getLanguageServer()).initializeResult;
	});

	it('Can start server', async () => {
		assert.notStrictEqual(initializeResult, null);
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

		assert.deepStrictEqual(initializeResult.capabilities, capabilities);
	});
});
