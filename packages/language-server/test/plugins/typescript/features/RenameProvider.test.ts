import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { Position, Range } from 'vscode-languageserver-types';
import { RenameProviderImpl } from '../../../../src/plugins/typescript/features/RenameProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#RenameProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'renaming');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new RenameProviderImpl(languageServiceManager, env.configManager);

		return {
			...env,
			provider,
		};
	}

	it('can prepare renaming symbols in the frontmatter', async () => {
		const { provider, document } = setup('simple.astro');

		const rename = await provider.prepareRename(document, Position.create(1, 8));

		expect(rename).to.deep.equal(Range.create(1, 7, 1, 22));
	});

	it('can rename symbols in the frontmatter', async () => {
		const { provider, document } = setup('simple.astro');

		const newText = 'myBadVariable';
		const filePath = document.getURL();
		const rename = await provider.rename(document, Position.create(1, 8), newText);

		expect(rename?.changes?.[filePath]).to.deep.equal([
			{
				newText: newText,
				range: Range.create(1, 7, 1, 22),
			},
			{
				newText: newText,
				range: Range.create(3, 1, 3, 16),
			},
			{
				newText: newText,
				range: Range.create(6, 1, 6, 16),
			},
		]);
	});

	it('can rename across files', async () => {
		const { provider, document, configManager } = setup('crossFile.astro');

		const newText = 'hasBeenRenamed';
		const otherFile = document.getURL().replace('crossFile.astro', 'script.ts');

		configManager.updateGlobalConfig(
			{
				typescript: {
					preferences: {
						useAliasesForRenames: false,
					},
				},
			},
			true
		);

		const rename = await provider.rename(document, Position.create(3, 1), newText);

		expect(rename?.changes?.[otherFile]).to.deep.equal([
			{
				newText: 'hasBeenRenamed',
				range: {
					end: {
						character: 29,
						line: 0,
					},
					start: {
						character: 16,
						line: 0,
					},
				},
			},
		]);
	});
});
