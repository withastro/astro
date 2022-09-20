import { assert, expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { Position, Range } from 'vscode-languageserver-types';
import { ImplementationsProviderImpl } from '../../../../src/plugins/typescript/features/ImplementationsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { TypeScriptDocumentSnapshot } from '../../../../src/plugins/typescript/snapshots/DocumentSnapshot';
import { urlToPath } from '../../../../src/utils';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#ImplementationsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'implementations');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new ImplementationsProviderImpl(languageServiceManager);

		return {
			...env,
			languageServiceManager,
			provider,
		};
	}

	it('provide same file implementations', async () => {
		const { document, provider } = setup('frontmatter.astro');

		const implementations = await provider.getImplementation(document, Position.create(1, 11));

		expect(implementations).to.deep.equal([
			{
				range: Range.create(5, 6, 5, 13),
				uri: document.getURL(),
			},
		]);
	});

	it('provide implementations inside script tags', async () => {
		const { document, provider } = setup('scriptTag.astro');

		const implementations = await provider.getImplementation(document, Position.create(1, 11));

		expect(implementations).to.deep.equal([
			{
				range: Range.create(5, 7, 5, 14),
				uri: document.getURL(),
			},
		]);
	});
});
