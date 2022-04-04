import { expect } from 'chai';
import { createEnvironment } from '../../utils';
import { AstroPlugin } from '../../../src/plugins';

describe('Astro Plugin', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'astro');
		const plugin = new AstroPlugin(env.docManager, env.configManager, [env.fixturesDir]);

		return {
			...env,
			plugin,
		};
	}

	it('provides folding ranges for frontmatter', async () => {
		const { plugin, document } = setup('frontmatter.astro');

		const foldingRanges = plugin.getFoldingRanges(document);

		expect(foldingRanges).to.deep.equal([
			{
				startCharacter: 0,
				startLine: 0,
				endLine: 1,
				endCharacter: 25,
				kind: 'imports',
			},
		]);
	});
});
