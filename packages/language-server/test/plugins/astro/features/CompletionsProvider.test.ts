import { expect } from 'chai';
import { createEnvironment } from '../../../utils';
import { CompletionsProviderImpl } from '../../../../src/plugins/astro/features/CompletionsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { InsertTextFormat, Position, Range } from 'vscode-languageserver-types';
import { CompletionContext, CompletionTriggerKind } from 'vscode-languageserver-protocol';

describe('Astro Plugin#CompletionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'astro', 'completions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new CompletionsProviderImpl(env.docManager, languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide completion for frontmatter', async () => {
		const { provider, document } = setup('frontmatter.astro');

		const completions = await provider.getCompletions(document, Position.create(0, 1), <CompletionContext>{
			triggerKind: CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '-',
		});

		expect(completions.items).to.deep.equal([
			{
				commitCharacters: ['-'],
				detail: 'Component script',
				insertText: '---\n$0\n---',
				insertTextFormat: 2,
				kind: 15,
				label: '---',
				preselect: true,
				sortText: '\u0000',
				textEdit: {
					newText: '---\n$0\n---',
					range: Range.create(0, 0, 0, 1),
				},
			},
		]);
	});

	it('provide prop completions in starting tag of Astro components', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(7, 20));

		expect(completions.items).to.deep.equal([
			{
				label: 'name',
				detail: 'string',
				insertText: 'name="$1"',
				insertTextFormat: InsertTextFormat.Snippet,
				commitCharacters: [],
				sortText: '_',
			},
		]);
	});

	it('provide prop completions in starting tag of Svelte components', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(8, 26));

		expect(completions.items).to.deep.contain({
			label: 'name',
			detail: 'any',
			insertText: 'name={$1}',
			insertTextFormat: InsertTextFormat.Snippet,
			commitCharacters: [],
			sortText: '_',
		});
	});

	it('provide prop completions in starting tag of JSX components', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(9, 14));

		expect(completions.items).to.deep.contain({
			label: 'name',
			detail: 'any',
			insertText: 'name={$1}',
			insertTextFormat: InsertTextFormat.Snippet,
			commitCharacters: [],
			sortText: '_',
		});
	});

	it('provide prop completions in starting tag of TSX components', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(10, 14));

		expect(completions.items).to.deep.contain({
			label: 'name',
			detail: 'string',
			insertText: 'name="$1"',
			insertTextFormat: InsertTextFormat.Snippet,
			commitCharacters: [],
			sortText: '_',
		});
	});

	it('provide client directives completions for non-astro components', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(8, 26));

		expect(completions.items).to.deep.contain({
			label: 'client:load',
			kind: 12,
			documentation: {
				kind: 'markdown',
				value:
					'Start importing the component JS at page load. Hydrate the component when import completes.\n\n[Astro documentation](https://docs.astro.build/en/core-concepts/component-hydration/#hydrate-interactive-components)',
			},
			textEdit: { range: Range.create(8, 26, 8, 26), newText: 'client:load' },
			insertTextFormat: 2,
			command: undefined,
		});
	});

	it('does not provide prop completions inside of a component', async () => {
		const { provider, document } = setup('component.astro');

		const completions = await provider.getCompletions(document, Position.create(7, 22));

		expect(completions.items).to.be.empty;
	});
});
