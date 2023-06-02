import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { ServerCapabilities } from 'vscode-languageserver-protocol';
import { LanguageServer, getLanguageServer } from '../server.js';

describe('Initialize', async () => {
	let languageServer: LanguageServer;

	before(async function () {
		// First init can sometimes be slow in CI, even though the rest of the tests will be fast.
		this.timeout(50000);
		languageServer = await getLanguageServer();
	});

	it('Can start server', async () => {
		expect(languageServer.initResult).not.be.null;
	});

	it('Has proper capabilities', async () => {
		const capabilities: ServerCapabilities = {
			textDocumentSync: 2,
			workspace: {
				fileOperations: {
					willRename: {
						filters: [
							{
								pattern: {
									glob: '**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx,json,astro,vue,svelte}',
								},
							},
						],
					},
				},
			},
			selectionRangeProvider: true,
			foldingRangeProvider: true,
			linkedEditingRangeProvider: true,
			colorProvider: true,
			documentSymbolProvider: true,
			documentFormattingProvider: true,
			documentRangeFormattingProvider: true,
			referencesProvider: true,
			implementationProvider: true,
			definitionProvider: true,
			typeDefinitionProvider: true,
			callHierarchyProvider: true,
			hoverProvider: true,
			diagnosticProvider: {
				interFileDependencies: true,
				workspaceDiagnostics: false,
			},
			renameProvider: { prepareProvider: true },
			signatureHelpProvider: { triggerCharacters: ['(', ',', '<'], retriggerCharacters: [')'] },
			completionProvider: {
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
				resolveProvider: true,
			},
			documentHighlightProvider: true,
			documentLinkProvider: { resolveProvider: true },
			codeLensProvider: { resolveProvider: true },
			semanticTokensProvider: {
				range: true,
				full: false,
				legend: {
					tokenTypes: [
						'namespace',
						'class',
						'enum',
						'interface',
						'struct',
						'typeParameter',
						'type',
						'parameter',
						'variable',
						'property',
						'enumMember',
						'decorator',
						'event',
						'function',
						'method',
						'macro',
						'label',
						'comment',
						'string',
						'keyword',
						'number',
						'regexp',
						'operator',
					],
					tokenModifiers: [
						'declaration',
						'definition',
						'readonly',
						'static',
						'deprecated',
						'abstract',
						'async',
						'modification',
						'documentation',
						'defaultLibrary',
					],
				},
			},
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
			inlayHintProvider: { resolveProvider: true },
			workspaceSymbolProvider: true,
		};

		expect(languageServer.initResult.capabilities).to.deep.equal(capabilities);
	});
});
