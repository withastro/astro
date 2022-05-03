import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import { DefinitionsProviderImpl } from '../../../../src/plugins/typescript/features/DefinitionsProvider';
import { Position, Range } from 'vscode-languageserver-types';
import { expect } from 'chai';
import { pathToUrl, urlToPath } from '../../../../src/utils';
import {
	AstroSnapshot,
	TypeScriptDocumentSnapshot,
} from '../../../../src/plugins/typescript/snapshots/DocumentSnapshot';

describe('TypeScript Plugin#DefinitionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'definitions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new DefinitionsProviderImpl(languageServiceManager);

		return {
			...env,
			languageServiceManager,
			provider,
		};
	}

	it('provide same file definition', async () => {
		const { document, provider } = setup('sameFile.astro');

		const functionDefinition = await provider.getDefinitions(document, Position.create(1, 11));
		const functionUsage = await provider.getDefinitions(document, Position.create(5, 3));
		const insideExpression = await provider.getDefinitions(document, Position.create(8, 2));

		expect(functionDefinition).to.deep.equal([
			{
				originSelectionRange: Range.create(1, 10, 1, 15),
				targetRange: Range.create(1, 10, 1, 15),
				targetSelectionRange: Range.create(1, 10, 1, 15),
				targetUri: document.getURL(),
			},
		]);

		expect(functionUsage).to.deep.equal([
			{
				originSelectionRange: Range.create(5, 1, 5, 6),
				targetRange: Range.create(1, 10, 1, 15),
				targetSelectionRange: Range.create(1, 10, 1, 15),
				targetUri: document.getURL(),
			},
		]);

		expect(insideExpression).to.deep.equal([
			{
				originSelectionRange: Range.create(8, 1, 8, 6),
				targetRange: Range.create(1, 10, 1, 15),
				targetSelectionRange: Range.create(1, 10, 1, 15),
				targetUri: document.getURL(),
			},
		]);
	});

	it('provide definitions with links to other files', async () => {
		const { document, provider, languageServiceManager } = setup('otherFile.astro');

		const functionImport = await provider.getDefinitions(document, Position.create(1, 11));
		const functionUsage = await provider.getDefinitions(document, Position.create(3, 3));
		const insideExpression = await provider.getDefinitions(document, Position.create(6, 2));

		const otherFilePath = urlToPath(functionImport[0].targetUri);
		const otherFileSnapshot = (await languageServiceManager.getSnapshot(otherFilePath)) as TypeScriptDocumentSnapshot;

		expect(functionImport).to.deep.equal([
			{
				originSelectionRange: Range.create(1, 10, 1, 15),
				targetRange: Range.create(0, 16, 0, 21),
				targetSelectionRange: Range.create(0, 16, 0, 21),
				targetUri: otherFileSnapshot.getURL(),
			},
		]);

		expect(functionUsage).to.deep.equal([
			{
				originSelectionRange: Range.create(3, 1, 3, 6),
				targetRange: Range.create(0, 16, 0, 21),
				targetSelectionRange: Range.create(0, 16, 0, 21),
				targetUri: otherFileSnapshot.getURL(),
			},
		]);

		expect(insideExpression).to.deep.equal([
			{
				originSelectionRange: Range.create(6, 1, 6, 6),
				targetRange: Range.create(0, 16, 0, 21),
				targetSelectionRange: Range.create(0, 16, 0, 21),
				targetUri: otherFileSnapshot.getURL(),
			},
		]);
	});

	it('provide definition for components', async () => {
		const { document, provider, languageServiceManager } = setup('components.astro');

		const componentImport = await provider.getDefinitions(document, Position.create(1, 9));
		const componentUsage = await provider.getDefinitions(document, Position.create(5, 3));

		const componentPath = urlToPath(componentImport[0].targetUri);
		const componentSnapshot = (await languageServiceManager.getSnapshot(componentPath)) as AstroSnapshot;

		expect(componentImport).to.deep.equal([
			{
				originSelectionRange: Range.create(1, 7, 1, 12),
				targetRange: Range.create(0, 0, 0, 0),
				targetSelectionRange: Range.create(0, 0, 0, 0),
				targetUri: pathToUrl(componentSnapshot.filePath),
			},
		]);

		expect(componentUsage).to.deep.equal([
			{
				originSelectionRange: Range.create(5, 1, 5, 6),
				targetRange: Range.create(0, 0, 0, 0),
				targetSelectionRange: Range.create(0, 0, 0, 0),
				targetUri: pathToUrl(componentSnapshot.filePath),
			},
		]);
	});
});
