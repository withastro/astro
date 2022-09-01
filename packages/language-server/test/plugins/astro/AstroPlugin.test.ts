import { expect } from 'chai';
import { createEnvironment } from '../../utils';
import { AstroPlugin } from '../../../src/plugins';
import { LanguageServiceManager } from '../../../src/plugins/typescript/LanguageServiceManager';
import { Range } from 'vscode-languageserver-types';
import ts from 'typescript/lib/tsserverlibrary';

describe('Astro Plugin', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'astro');
		const plugin = new AstroPlugin(
			env.configManager,
			new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts)
		);

		return {
			...env,
			plugin,
		};
	}

	it('provides folding ranges for frontmatter', async () => {
		const { plugin, document } = setup('folding/frontmatter.astro');

		const foldingRanges = plugin.getFoldingRanges(document);

		expect(foldingRanges).to.deep.equal([
			{
				startCharacter: 3,
				startLine: 0,
				endLine: 1,
				endCharacter: 27,
				kind: 'imports',
			},
		]);
	});

	it('provides folding ranges for white-space only frontmatter', async () => {
		const { plugin, document } = setup('folding/frontmatterWhitespace.astro');

		const foldingRanges = plugin.getFoldingRanges(document);

		expect(foldingRanges).to.deep.equal([
			{
				startCharacter: 3,
				startLine: 0,
				endLine: 7,
				endCharacter: 0,
				kind: 'imports',
			},
		]);
	});

	it('provides formatting edits', async () => {
		const { plugin, document } = setup('formatting/basic.astro');

		const textEdit = await plugin.formatDocument(document, { tabSize: 4, insertSpaces: true });

		expect(textEdit).to.deep.equal([
			{
				newText: "---\nconsole.log('');\n---\n\n<div></div>\n\n<div></div>\n",
				range: Range.create(0, 0, 8, 0),
			},
		]);
	});
});
