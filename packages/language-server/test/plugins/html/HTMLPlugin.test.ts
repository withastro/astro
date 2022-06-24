import { expect } from 'chai';
import { Hover, Position, Range } from 'vscode-languageserver-types';
import { createFakeEnvironment, defaultFormattingOptions } from '../../utils';
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
		it('for normal html', async () => {
			const { plugin, document } = setup('<');

			const completions = await plugin.getCompletions(document, Position.create(0, 1));
			expect(completions?.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions, 'Expected completions to not be empty').to.not.be.undefined;
		});

		it('for style lang in style tags', async () => {
			const { plugin, document } = setup('<sty');

			const completions = await plugin.getCompletions(document, Position.create(0, 4));
			expect(completions?.items, 'Expected completions to be an array').to.be.an('array');
			expect(completions!.items.find((item) => item.label === 'style (lang="less")')).to.not.be.undefined;
		});

		it('should not provide completions inside of an expression', async () => {
			const { plugin, document } = setup('<div class={');

			const completions = await plugin.getCompletions(document, Position.create(0, 12));
			expect(completions).to.be.null;

			const tagCompletion = await plugin.doTagComplete(document, Position.create(0, 12));
			expect(tagCompletion).to.be.null;
		});

		it('should not provide completions if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<');

			// Disable completions
			configManager.updateGlobalConfig(<any>{
				html: {
					completions: {
						enabled: false,
					},
				},
			});

			const completions = await plugin.getCompletions(document, Position.create(0, 7));
			const isEnabled = await configManager.isEnabled(document, 'html', 'completions');

			expect(isEnabled).to.be.false;
			expect(completions, 'Expected completions to be null').to.be.null;
		});
	});

	describe('provide hover info', () => {
		it('for HTML elements', async () => {
			const { plugin, document } = setup('<p>Build fast websites, faster.</p>');

			expect(await plugin.doHover(document, Position.create(0, 1))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						'The p element represents a paragraph.\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/HTML/Element/p)',
				},

				range: Range.create(0, 1, 0, 2),
			});
		});

		it('for HTML attributes', async () => {
			const { plugin, document } = setup('<p class="motto">Build fast websites, faster.</p>');

			expect(await plugin.doHover(document, Position.create(0, 4))).to.deep.equal(<Hover>{
				contents: {
					kind: 'markdown',
					value:
						'A space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the [class selectors](https://developer.mozilla.org/docs/Web/CSS/Class_selectors) or functions like the method [`Document.getElementsByClassName()`](https://developer.mozilla.org/docs/Web/API/Document/getElementsByClassName "returns an array-like object of all child elements which have all of the given class names.").\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/class)',
				},

				range: Range.create(0, 3, 0, 8),
			});
		});

		it('should not provide hover info if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<p>Build fast websites, faster.</p>');

			// Disable hover info
			configManager.updateGlobalConfig(<any>{
				html: {
					hover: {
						enabled: false,
					},
				},
			});

			const hoverInfo = await plugin.doHover(document, Position.create(0, 1));
			const isEnabled = await configManager.isEnabled(document, 'html', 'hover');

			expect(isEnabled).to.be.false;
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

	describe('provides linked editing ranges', () => {
		it('for html', () => {
			const { plugin, document } = setup(`<div></div>
			`);

			const linkedEditingRanges = plugin.getLinkedEditingRanges(document, Position.create(0, 2));

			expect(linkedEditingRanges?.ranges).to.deep.equal([
				{
					start: Position.create(0, 1),
					end: Position.create(0, 4),
				},
				{
					start: Position.create(0, 7),
					end: Position.create(0, 10),
				},
			]);
		});
	});

	describe('provides formatting', () => {
		it('return formatting', async () => {
			const { plugin, document } = setup('<div><p>Astro</p></div>');

			const formatting = await plugin.formatDocument(document, defaultFormattingOptions);

			expect(formatting).to.deep.equal([
				{
					range: Range.create(0, 0, 0, 23),
					newText: '<div>\n  <p>Astro</p>\n</div>',
				},
			]);
		});

		it('does not format the inside of script tags', async () => {
			const { plugin, document } = setup('<div>\n<script>\nconsole.log()\n</script>\n</div>');

			const formatting = await plugin.formatDocument(document, defaultFormattingOptions);

			expect(formatting).to.deep.equal([
				{
					range: Range.create(0, 0, 4, 6),
					newText: '<div>\n  <script>\nconsole.log()\n</script>\n</div>',
				},
			]);
		});
	});

	describe('provides document symbols', () => {
		it('for html', async () => {
			const { plugin, document } = setup('<div><p>Astro</p></div>');

			const symbols = await plugin.getDocumentSymbols(document);

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

		it('should not provide document symbols if feature is disabled', async () => {
			const { plugin, document, configManager } = setup('<div><p>Astro</p></div>');

			// Disable documentSymbols
			configManager.updateGlobalConfig(<any>{
				html: {
					documentSymbols: {
						enabled: false,
					},
				},
			});

			const symbols = await plugin.getDocumentSymbols(document);
			const isEnabled = await configManager.isEnabled(document, 'html', 'documentSymbols');

			expect(isEnabled).to.be.false;
			expect(symbols, 'Expected symbols to be empty').to.be.empty;
		});
	});
});
