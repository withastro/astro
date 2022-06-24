import { expect } from 'chai';
import { SemanticTokensBuilder } from 'vscode-languageserver';
import { SemanticTokensProviderImpl } from '../../../../src/plugins/typescript/features/SemanticTokenProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { TokenModifier, TokenType } from '../../../../src/plugins/typescript/utils';
import { createEnvironment } from '../../../utils';

interface TokenData {
	line: number;
	character: number;
	length: number;
	type: number;
	modifiers: number[];
}

describe('TypeScript Plugin#SemanticTokenProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'semanticTokens');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new SemanticTokensProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	function buildTokens(tokens: TokenData[]) {
		const builder = new SemanticTokensBuilder();
		for (const token of tokens) {
			builder.push(
				token.line,
				token.character,
				token.length,
				token.type,
				token.modifiers.reduce((pre, next) => pre | (1 << next), 0)
			);
		}

		return builder.build();
	}

	it('provides semantic tokens', async () => {
		const { provider, document } = setup('frontmatter.astro');

		const semanticTokens = await provider.getSemanticTokens(document);
		const expectedTokens = buildTokens([
			{
				line: 1,
				character: 7,
				length: 'constant'.length,
				type: TokenType.variable,
				modifiers: [TokenModifier.declaration, TokenModifier.readonly],
			},
			{
				line: 2,
				character: 5,
				length: 'variable'.length,
				type: TokenType.variable,
				modifiers: [TokenModifier.declaration],
			},
			{
				line: 4,
				character: 1,
				length: 'console'.length,
				type: TokenType.variable,
				modifiers: [TokenModifier.defaultLibrary],
			},
			{
				line: 4,
				character: 9,
				length: 'log'.length,
				type: TokenType.method,
				modifiers: [TokenModifier.defaultLibrary],
			},
			{
				line: 6,
				character: 11,
				length: 'Props'.length,
				type: TokenType.interface,
				modifiers: [TokenModifier.declaration],
			},
			{
				line: 7,
				character: 2,
				length: 'hello'.length,
				type: TokenType.property,
				modifiers: [TokenModifier.declaration],
			},
			{
				line: 10,
				character: 9,
				length: 'hello'.length,
				type: TokenType.variable,
				modifiers: [TokenModifier.declaration, TokenModifier.readonly],
			},
			{
				line: 10,
				character: 19,
				length: 'Astro'.length,
				type: TokenType.type,
				modifiers: [TokenModifier.readonly],
			},
			{
				line: 10,
				character: 25,
				length: 'props'.length,
				type: TokenType.property,
				modifiers: [],
			},
			{
				line: 10,
				character: 34,
				length: 'Props'.length,
				type: TokenType.interface,
				modifiers: [],
			},
		]);

		expect(semanticTokens?.data).to.deep.equal(expectedTokens.data);
	});
});
