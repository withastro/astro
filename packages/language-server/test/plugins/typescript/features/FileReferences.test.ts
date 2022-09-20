import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { Range } from 'vscode-languageserver-types';
import { FileReferencesProviderImpl } from '../../../../src/plugins/typescript/features/FileReferencesProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import * as path from 'path';
import { pathToUrl, urlToPath } from '../../../../src/utils';

describe('TypeScript Plugin#FileReferencesProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'fileReferences');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new FileReferencesProviderImpl(languageServiceManager);

		return {
			...env,
			languageServiceManager,
			provider,
		};
	}

	it('provide file references', async () => {
		const { document, provider, fixturesDir } = setup('ReferredFile.astro');

		const fileReferences = await provider.fileReferences(document);
		const fileThatRefers = path.join(urlToPath(fixturesDir)!, 'fileReferences', 'FileThatRefers.astro');

		expect(fileReferences).to.deep.equal([
			{
				range: Range.create(1, 27, 1, 47),
				uri: pathToUrl(fileThatRefers),
			},
		]);
	});
});
