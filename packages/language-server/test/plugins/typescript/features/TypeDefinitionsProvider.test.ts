import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import { Position, Range } from 'vscode-languageserver-types';
import { TypeDefinitionsProviderImpl } from '../../../../src/plugins/typescript/features/TypeDefinitionsProvider';
import { assert, expect } from 'chai';
import { pathToUrl, urlToPath } from '../../../../src/utils';
import {
	AstroSnapshot,
	TypeScriptDocumentSnapshot,
} from '../../../../src/plugins/typescript/snapshots/DocumentSnapshot';
import ts from 'typescript/lib/tsserverlibrary';

describe('TypeScript PluginTypeDefinitionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'typeDefinitions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new TypeDefinitionsProviderImpl(languageServiceManager);

		return {
			...env,
			languageServiceManager,
			provider,
		};
	}

	it('provide same file type definition', async () => {
		const { document, provider } = setup('sameFile.astro');

		const variableDeclaration = await provider.getTypeDefinitions(document, Position.create(2, 10));

		expect(variableDeclaration).to.deep.equal([
			{
				range: Range.create(1, 11, 1, 17),
				uri: document.getURL(),
			},
		]);
	});

	it('provide type definitions with links to other files', async () => {
		const { document, provider, languageServiceManager } = setup('otherFile.astro');

		const variableDeclaration = await provider.getTypeDefinitions(document, Position.create(2, 10));

		const otherFilePath = urlToPath(variableDeclaration[0].uri);

		if (!otherFilePath) {
			assert.fail(`Couldn't transform url to path for ${variableDeclaration[0].uri}`);
		}

		const otherFileSnapshot = (await languageServiceManager.getSnapshot(otherFilePath)) as TypeScriptDocumentSnapshot;

		expect(variableDeclaration).to.deep.equal([
			{
				range: Range.create(0, 17, 0, 25),
				uri: otherFileSnapshot.getURL(),
			},
		]);
	});

	it('provide type definitions inside script tags', async () => {
		const { document, provider } = setup('scriptTag.astro');

		const variableDeclaration = await provider.getTypeDefinitions(document, Position.create(2, 10));

		expect(variableDeclaration).to.deep.equal([
			{
				range: Range.create(1, 11, 1, 17),
				uri: document.getURL(),
			},
		]);
	});
});
