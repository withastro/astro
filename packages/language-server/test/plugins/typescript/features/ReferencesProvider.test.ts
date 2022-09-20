import { assert, expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { Position, Range } from 'vscode-languageserver-types';
import { FindReferencesProviderImpl } from '../../../../src/plugins/typescript/features/ReferencesProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import {
	AstroSnapshot,
	TypeScriptDocumentSnapshot,
} from '../../../../src/plugins/typescript/snapshots/DocumentSnapshot';
import { pathToUrl, urlToPath } from '../../../../src/utils';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#ReferencesProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'references');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new FindReferencesProviderImpl(languageServiceManager);

		return {
			...env,
			languageServiceManager,
			provider,
		};
	}

	it('provide references', async () => {
		const { document, provider } = setup('frontmatter.astro');

		const references = await provider.findReferences(document, Position.create(3, 1), {
			includeDeclaration: true,
		});

		expect(references).to.deep.equal([
			{
				range: Range.create(1, 6, 1, 11),
				uri: document.getURL(),
			},
			{
				range: Range.create(3, 0, 3, 5),
				uri: document.getURL(),
			},
			{
				range: Range.create(5, 12, 5, 17),
				uri: document.getURL(),
			},
		]);
	});

	it('provide references inside script tags', async () => {
		const { document, provider, languageServiceManager } = setup('scriptTag.astro');

		const references = await provider.findReferences(document, Position.create(3, 1), {
			includeDeclaration: true,
		});

		expect(references).to.deep.equal([
			{
				range: Range.create(1, 7, 1, 12),
				uri: document.getURL(),
			},
			{
				range: Range.create(3, 1, 3, 6),
				uri: document.getURL(),
			},
			{
				range: Range.create(5, 13, 5, 18),
				uri: document.getURL(),
			},
		]);
	});
});
