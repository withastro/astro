import { expect } from 'chai';
import { Hover, Position, Range } from 'vscode-languageserver-types';
import { createFakeEnvironment } from '../../utils';
import { HTMLPlugin } from '../../../src/plugins';

describe('HTML Plugin', () => {
	function setup(content: string) {
		const env = createFakeEnvironment(content);
		const plugin = new HTMLPlugin(env.configManager);

		return {
			...env,
			plugin,
		};
	}

	describe('provide completions', () => {
		it('for normal html', () => {
			const { plugin, document } = setup('<');

			const completions = plugin.getCompletions(document, Position.create(0, 1));
			expect(completions.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions, 'Expected completions to not be empty').to.not.be.undefined;
		});

		it('for style lang in style tags', () => {
			const { plugin, document } = setup('<sty');

			const completions = plugin.getCompletions(document, Position.create(0, 4));
			expect(completions.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions!.items.find((item) => item.label === 'style (lang="less")')).to.not.be.undefined;
		});

		it('should not provide completions inside of an expression', () => {
			const { plugin, document } = setup('<div class={');

			const completions = plugin.getCompletions(document, Position.create(0, 12));
			expect(completions).to.be.null;

			const tagCompletion = plugin.doTagComplete(document, Position.create(0, 12));
			expect(tagCompletion).to.be.null;
		});

		it('should not provide completions if feature is disabled', () => {
			const { plugin, document, configManager } = setup('<');

			// Disable completions
			configManager.updateConfig(<any>{
				html: {
					completions: {
						enabled: false,
					},
				},
			});

			const completions = plugin.getCompletions(document, Position.create(0, 7));

			expect(configManager.enabled(`html.completions.enabled`), 'Expected completions to be disabled in configManager')
				.to.be.false;
			expect(completions, 'Expected completions to be null').to.be.null;
		});
	});

	describe('provide hover info', () => {
		it('for HTML elements', () => {
			const { plugin, document } = setup('<p>Build fast websites, faster.</p>');

			expect(plugin.doHover(document, Position.create(0, 1))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						'The p element represents a paragraph.\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/HTML/Element/p)',
				},

				range: Range.create(0, 1, 0, 2),
			});
		});

		it('for HTML attributes', () => {
			const { plugin, document } = setup('<p class="motto">Build fast websites, faster.</p>');

			expect(plugin.doHover(document, Position.create(0, 4))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						'A space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the [class selectors](/en-US/docs/Web/CSS/Class_selectors) or functions like the method [`Document.getElementsByClassName()`](/en-US/docs/Web/API/Document/getElementsByClassName "returns an array-like object of all child elements which have all of the given class names.").\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/class)',
				},

				range: Range.create(0, 3, 0, 8),
			});
		});

		it('should not provide hover info if feature is disabled', () => {
			const { plugin, document, configManager } = setup('<p>Build fast websites, faster.</p>');

			// Disable hover info
			configManager.updateConfig(<any>{
				html: {
					hover: {
						enabled: false,
					},
				},
			});

			const hoverInfo = plugin.doHover(document, Position.create(0, 1));

			expect(configManager.enabled(`html.hover.enabled`), 'Expected hover to be disabled in configManager').to.be.false;
			expect(hoverInfo, 'Expected hoverInfo to be null').to.be.null;
		});
	});

	describe('provides folding ranges', () => {
		it('for html', () => {
			const { plugin, document } = setup(`
				<div>
					<p>Astro</p>
				</div>
			`);

			const foldingRanges = plugin.getFoldingRanges(document);

			expect(foldingRanges).to.deep.equal([
				{
					startLine: 1,
					endLine: 2,
				},
			]);
		});
	});

	describe('provides document symbols', () => {
		it('for html', () => {
			const { plugin, document } = setup('<div><p>Astro</p></div>');

			const symbols = plugin.getDocumentSymbols(document);

			expect(symbols).to.deep.equal([
				{
					name: 'div',
					location: { uri: 'file:///hello.astro', range: Range.create(0, 0, 0, 23) },
					containerName: '',
					kind: 8,
				},
				{
					name: 'p',
					location: { uri: 'file:///hello.astro', range: Range.create(0, 5, 0, 17) },
					containerName: 'div',
					kind: 8,
				},
			]);
		});

		it('should not provide document symbols if feature is disabled', () => {
			const { plugin, document, configManager } = setup('<div><p>Astro</p></div>');

			// Disable documentSymbols
			configManager.updateConfig(<any>{
				html: {
					documentSymbols: {
						enabled: false,
					},
				},
			});

			const symbols = plugin.getDocumentSymbols(document);

			expect(
				configManager.enabled(`html.documentSymbols.enabled`),
				'Expected documentSymbols to be disabled in configManager'
			).to.be.false;
			expect(symbols, 'Expected symbols to be empty').to.be.empty;
		});
	});
});
