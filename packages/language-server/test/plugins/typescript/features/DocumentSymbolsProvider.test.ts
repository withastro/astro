import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { Range, SymbolInformation, SymbolKind } from 'vscode-languageserver-types';
import { DocumentSymbolsProviderImpl } from '../../../../src/plugins/typescript/features/DocumentSymbolsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#DocumentSymbolsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'documentSymbols');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new DocumentSymbolsProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide namespaces for frontmatter and template', async () => {
		const { provider, document } = setup('astroNamespaces.astro');

		const symbols = await provider.getDocumentSymbols(document);

		expect(symbols).to.deep.equal(<SymbolInformation[]>[
			{
				kind: SymbolKind.Namespace,
				location: {
					range: Range.create(0, 0, 2, 0),
					uri: document.getURL(),
				},
				name: 'Frontmatter',
			},
			{
				kind: SymbolKind.Namespace,
				location: {
					range: Range.create(2, 0, 3, 0),
					uri: document.getURL(),
				},
				name: 'Template',
			},
		]);
	});

	it('provide document symbols for JSX expressions', async () => {
		const { provider, document } = setup('jsxExpressions.astro');

		const symbols = await provider.getDocumentSymbols(document);

		expect(symbols).to.deep.equal(<SymbolInformation[]>[
			{
				kind: SymbolKind.Namespace,
				location: {
					range: Range.create(0, 0, 4, 0),
					uri: document.getURL(),
				},
				name: 'Template',
			},
			{
				containerName: 'Template',
				kind: SymbolKind.Property,
				location: {
					range: Range.create(0, 15, 0, 21),
					uri: document.getURL(),
				},
				name: '"HTML"',
			},
			{
				containerName: 'Template',
				kind: SymbolKind.Function,
				location: {
					range: Range.create(2, 15, 2, 47),
					uri: document.getURL(),
				},
				name: 'map() callback',
			},
			{
				containerName: 'map() callback',
				kind: SymbolKind.Property,
				location: {
					range: Range.create(2, 33, 2, 38),
					uri: document.getURL(),
				},
				name: 'value',
			},
		]);
	});

	it('provide document symbols for script tags', async () => {
		const { provider, document } = setup('scriptTags.astro');

		const symbols = await provider.getDocumentSymbols(document);

		expect(symbols).to.deep.equal(<SymbolInformation[]>[
			{
				kind: SymbolKind.Namespace,
				location: {
					range: Range.create(0, 0, 7, 0),
					uri: document.getURL(),
				},
				name: 'Template',
			},
			{
				containerName: 'Template',
				kind: SymbolKind.Constant,
				location: {
					range: Range.create(5, 8, 5, 39),
					uri: document.getURL(),
				},
				name: 'MySecondVariable',
			},
			{
				containerName: 'Template',
				kind: SymbolKind.Constant,
				location: {
					range: Range.create(1, 8, 1, 28),
					uri: document.getURL(),
				},
				name: 'myVariable',
			},
		]);
	});
});
