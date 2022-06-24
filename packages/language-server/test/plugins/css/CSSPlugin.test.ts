import { expect } from 'chai';
import { CSSPlugin } from '../../../src/plugins';
import { Hover, Position, Range, SymbolKind } from 'vscode-languageserver-types';
import { CompletionContext } from 'vscode-languageserver-protocol';
import { createFakeEnvironment } from '../../utils';

describe('CSS Plugin', () => {
	function setup(content: string) {
		const env = createFakeEnvironment(content);
		const plugin = new CSSPlugin(env.configManager);

		return {
			...env,
			plugin,
		};
	}

	describe('provide completions', () => {
		it('in style tags', async () => {
			const { plugin, document } = setup('<style></style>');

			const completions = await plugin.getCompletions(document, Position.create(0, 7), {
				triggerCharacter: '.',
			} as CompletionContext);

			expect(completions?.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions, 'Expected completions to not be empty').to.not.be.null;
		});

		it('in multiple style tags', async () => {
			const { plugin, document } = setup('<style></style><style></style>');

			const completions1 = await plugin.getCompletions(document, Position.create(0, 7), {
				triggerCharacter: '.',
			} as CompletionContext);
			const completions2 = await plugin.getCompletions(document, Position.create(0, 22), {
				triggerCharacter: '.',
			} as CompletionContext);

			expect(completions1?.items, 'Expected completions1 to be an array').to.be.an('array');
			expect(completions1, 'Expected completions1 to not be empty').to.not.be.null;
			expect(completions2?.items, 'Expected completions2 to be an array').to.be.an('array');
			expect(completions2, 'Expected completions2 to not be empty').to.not.be.null;
		});

		it('in style attributes', async () => {
			const { plugin, document } = setup('<div style=""></div>');

			const completions = await plugin.getCompletions(document, Position.create(0, 12));

			expect(completions?.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions, 'Expected completions to not be empty').to.not.be.null;
		});

		it('for :global modifier', async () => {
			const { plugin, document } = setup('<style>:g</style>');

			const completions = await plugin.getCompletions(document, Position.create(0, 9), {
				triggerCharacter: ':',
			} as CompletionContext);
			const globalCompletion = completions?.items.find((item) => item.label === ':global()');

			expect(globalCompletion, 'Expected completions to contain :global modifier').to.not.be.null;
		});

		it('Emmet completions', async () => {
			const { plugin, document } = setup('<style>h1 {p2}</style>');

			const completions = await plugin.getCompletions(document, Position.create(0, 13));
			const emmetCompletion = completions?.items.find((item) => item.detail === 'Emmet Abbreviation');

			expect(emmetCompletion).to.deep.equal({
				label: 'padding: 2px;',
				textEdit: {
					newText: 'padding: 2px;',
					range: Range.create(0, 11, 0, 13),
				},
				documentation: 'padding: 2px;',
				insertTextFormat: 2,
				detail: 'Emmet Abbreviation',
				filterText: 'p2',
			});
		});

		it('should not provide completions for unclosed style tags', async () => {
			const { plugin, document } = setup('<style>');

			const completions = await plugin.getCompletions(document, Position.create(0, 7), {
				triggerCharacter: '.',
			} as CompletionContext);

			expect(completions).to.be.null;
		});

		it('should not provide completions if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<style></style>');

			// Disable completions
			configManager.updateGlobalConfig(<any>{
				css: {
					completions: {
						enabled: false,
					},
				},
			});

			const completions = await plugin.getCompletions(document, Position.create(0, 7), {
				triggerCharacter: '.',
			} as CompletionContext);

			const isEnabled = await configManager.isEnabled(document, 'css', 'completions');

			expect(isEnabled).to.be.false;
			expect(completions, 'Expected completions to be null').to.be.null;
		});
	});

	describe('provide hover info', () => {
		it('in style tags', async () => {
			const { plugin, document } = setup('<style>h1 {color:blue;}</style>');

			expect(await plugin.doHover(document, Position.create(0, 8))).to.deep.equal(<Hover>{
				contents: [
					{ language: 'html', value: '<h1>' },
					'[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity): (0, 0, 1)',
				],
				range: Range.create(0, 7, 0, 9),
			});

			expect(await plugin.doHover(document, Position.create(0, 12))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						"Sets the color of an element's text\n\nSyntax: &lt;color&gt;\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/CSS/color)",
				},
				range: Range.create(0, 11, 0, 21),
			});
		});

		it('in style attributes', async () => {
			const { plugin, document } = setup('<div style="color: red"></div>');

			expect(await plugin.doHover(document, Position.create(0, 13))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						"Sets the color of an element's text\n\nSyntax: &lt;color&gt;\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/CSS/color)",
				},
				range: Range.create(0, 12, 0, 22),
			});
		});

		it('should not provide hover info for unclosed style tags', async () => {
			const { plugin, document } = setup('<style>h1 {color:blue;}');

			const hoverInfo = await plugin.doHover(document, Position.create(0, 8));

			expect(hoverInfo).to.be.null;
		});

		it('should not provide hover info if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<style>h1 {}</style>');

			// Disable hover info
			configManager.updateGlobalConfig(<any>{
				css: {
					hover: {
						enabled: false,
					},
				},
			});

			const hoverInfo = await plugin.doHover(document, Position.create(0, 8));

			const isEnabled = await configManager.isEnabled(document, 'css', 'hover');

			expect(isEnabled).to.be.false;
			expect(hoverInfo, 'Expected hoverInfo to be null').to.be.null;
		});
	});

	describe('provides folding ranges', () => {
		it('for css/scss/less', () => {
			const { plugin, document } = setup(`
				<style>
					h1 {
						color: red
					}
				</style>
				<style lang="scss">
					$primary-color: #333;

					body {
						color: $primary-color
					}
				</style>
				<style lang="less">
					@primary-color: #333;

					body {
						color: @primary-color
					}
				</style>
			`);

			const foldingRanges = plugin.getFoldingRanges(document);

			expect(foldingRanges).to.deep.equal([
				{
					startLine: 2,
					endLine: 3,
				},
				{
					endLine: 10,
					startLine: 9,
				},
				{
					endLine: 17,
					startLine: 16,
				},
			]);
		});

		it('not for unsupported language', () => {
			const { plugin, document } = setup(`
				<style lang="sass">
					$primary-color: #333

					body
						color: $primary-color
				</style>
			`);

			const foldingRanges = plugin.getFoldingRanges(document);

			expect(foldingRanges).to.be.empty;
		});
	});

	describe('provides document symbols', () => {
		it('for normal CSS', async () => {
			const { plugin, document } = setup('<style>h1 {color: red;}</style>');

			const symbols = await plugin.getDocumentSymbols(document);

			expect(symbols).to.deep.equal([
				{
					name: 'h1',
					kind: SymbolKind.Class,
					location: {
						range: Range.create(0, 7, 0, 23),
						uri: 'file:///hello.astro',
					},
				},
			]);
		});

		it('for multiple style tags', async () => {
			const { plugin, document } = setup('<style>h1 {color: red;}</style><style>h2 {color: blue;}</style>');

			const symbols = await plugin.getDocumentSymbols(document);

			expect(symbols).to.deep.equal([
				{
					name: 'h1',
					kind: SymbolKind.Class,
					location: { uri: 'file:///hello.astro', range: Range.create(0, 7, 0, 23) },
				},
				{
					name: 'h2',
					kind: SymbolKind.Class,
					location: { uri: 'file:///hello.astro', range: Range.create(0, 38, 0, 55) },
				},
			]);
		});

		it('should not provide document symbols if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<style>h1 {color: red;}</style>');

			// Disable documentSymbols
			configManager.updateGlobalConfig(<any>{
				css: {
					documentSymbols: {
						enabled: false,
					},
				},
			});

			const symbols = await plugin.getDocumentSymbols(document);

			const isEnabled = await configManager.isEnabled(document, 'css', 'documentSymbols');

			expect(isEnabled).to.be.false;
			expect(symbols, 'Expected symbols to be empty').to.be.empty;
		});
	});

	describe('provide document colors', () => {
		it('for normal css', async () => {
			const { plugin, document } = setup('<style>h1 {color:blue;}</>');

			const colors = await plugin.getColorPresentations(document, Range.create(0, 17, 0, 21), {
				alpha: 1,
				blue: 255,
				green: 0,
				red: 0,
			});

			expect(colors).to.deep.equal([
				{
					label: 'rgb(0, 0, 65025)',
					textEdit: {
						range: Range.create(0, 17, 0, 21),
						newText: 'rgb(0, 0, 65025)',
					},
				},
				{
					label: '#00000fe01',
					textEdit: {
						range: Range.create(0, 17, 0, 21),
						newText: '#00000fe01',
					},
				},
				{
					label: 'hsl(240, -101%, 12750%)',
					textEdit: {
						range: Range.create(0, 17, 0, 21),
						newText: 'hsl(240, -101%, 12750%)',
					},
				},
				{
					label: 'hwb(240 0% -25400%)',
					textEdit: {
						newText: 'hwb(240 0% -25400%)',
						range: Range.create(0, 17, 0, 21),
					},
				},
			]);
		});

		it('should not provide document colors if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<style>h1 {color: blue;}</style>');

			// Disable document colors
			configManager.updateGlobalConfig(<any>{
				css: {
					documentColors: {
						enabled: false,
					},
				},
			});

			const documentColors = await plugin.getDocumentColors(document);

			const isEnabled = await configManager.isEnabled(document, 'css', 'documentColors');

			expect(isEnabled).to.be.false;
			expect(documentColors, 'Expected documentColors to be null').to.be.empty;
		});
	});
});
