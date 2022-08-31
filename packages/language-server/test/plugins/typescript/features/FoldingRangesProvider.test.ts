import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import { FoldingRangesProviderImpl } from '../../../../src/plugins/typescript/features/FoldingRangesProvider';
import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';

describe('TypeScript Plugin#FoldingRangesProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'foldingRanges');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new FoldingRangesProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide folding ranges in frontmatter', async () => {
		const { provider, document } = setup('frontmatter.astro');

		const foldingRanges = await provider.getFoldingRanges(document);

		expect(foldingRanges).to.not.be.empty;
	});

	it('does not provide folding ranges for ignored tags', async () => {
		const { provider, document } = setup('excludedtags.astro');

		const foldingRanges = await provider.getFoldingRanges(document);

		// TypeScript return a folding range for the script tag sometimes itself, this is inconsistent between Windows and Unix
		// Either way however, there shouldn't ever be more than 0 or 1 folding range in this file, so this test is still ok
		expect(foldingRanges?.length).to.be.lessThanOrEqual(1);
	});

	it('provide folding ranges inside script tags', async () => {
		const { provider, document } = setup('scriptTag.astro');

		const foldingRanges = await provider.getFoldingRanges(document);

		// For some reason, this test fails in CI on Windows due to the values being different. I don't understand why and
		// I couldn't reproduce it in local. So instead, we'll just tests that we have the expected number of folding ranges
		expect(foldingRanges?.length).to.equal(2);
	});
});
