import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import { FoldingRangesProviderImpl } from '../../../../src/plugins/typescript/features/FoldingRangesProvider';
import { expect } from 'chai';

describe('TypeScript Plugin#FoldingRangesProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'foldingRanges');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new FoldingRangesProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide folding ranges in frontmatter', async () => {
		const { provider, document } = setup('frontmatter.astro');

		const foldingRanges = await provider.getFoldingRanges(document);

		expect(foldingRanges).to.deep.equal([
			{
				endCharacter: 0,
				endLine: 7,
				startCharacter: 34,
				startLine: 1,
			},
		]);
	});

	it('does not provide folding ranges for ignored tags', async () => {
		const { provider, document } = setup('excludedtags.astro');

		const foldingRanges = await provider.getFoldingRanges(document);

		// TypeScript return folding ranges for JSX tags, hence why it still returns something
		// Those get ignored during normal usage since we prefer leaving that to our HTML plugin
		expect(foldingRanges).to.deep.equal([
			{
				endCharacter: 6,
				endLine: 8,
				startCharacter: 0,
				startLine: 4,
			},
		]);
	});
});
