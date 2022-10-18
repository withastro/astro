import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { CompletionTriggerKind } from 'vscode-languageserver-protocol';
import { Position } from 'vscode-languageserver-types';
import { CompletionsProviderImpl } from '../../../../src/plugins/typescript/features/CompletionsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

const newLine = ts.sys.newLine;

describe('TypeScript Plugin#CompletionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'completions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new CompletionsProviderImpl(languageServiceManager, env.configManager);

		return {
			...env,
			provider,
		};
	}

	it('provide completions', async () => {
		const { provider, document } = setup('basic.astro');

		const completions = await provider.getCompletions(document, Position.create(1, 8));

		expect(completions?.items).to.not.be.empty;
	});

	it('provide completions inside JSX expressions', async () => {
		const { provider, document } = setup('jsxExpressions.astro');

		const completions = await provider.getCompletions(document, Position.create(4, 7), {
			triggerKind: CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '.',
		});

		expect(completions?.items).to.not.be.empty;
	});

	it('does not provide completions at root', async () => {
		const { provider, document } = setup('root.astro');

		const completions = await provider.getCompletions(document, Position.create(0, 0));

		expect(completions).to.be.null;
	});

	it('provides completion for components under a namespace', async () => {
		const { provider, document } = setup('importNamespacedComponents.astro');

		const completions = await provider.getCompletions(document, Position.create(4, 12), {
			triggerKind: CompletionTriggerKind.TriggerCharacter,
			triggerCharacter: '.',
		});

		expect(completions?.items).to.not.be.empty;
	});

	it('provide auto import completion with insert action for component - no front matter', async () => {
		const { provider, document } = setup('autoImportNoFrontmatter.astro');

		const completions = await provider.getCompletions(document, Position.create(1, 9));
		const item = completions?.items.find((completion) => completion.label === 'Component');
		const { additionalTextEdits, detail } = await provider.resolveCompletion(document, item!);

		expect(detail).to.equal('./imports/component.astro');
		expect(additionalTextEdits?.[0].newText).to.equal(
			`---${newLine}import Component from "./imports/component.astro"${newLine}---${newLine}${newLine}`
		);
	});

	it('provide auto import completion with insert action for component - has front matter', async () => {
		const { provider, document } = setup('autoImportFrontmatter.astro');

		const completions = await provider.getCompletions(document, Position.create(4, 9));
		const item = completions?.items.find((completion) => completion.label === 'Component');

		const { additionalTextEdits, detail } = await provider.resolveCompletion(document, item!);

		expect(detail).to.equal('./imports/component.astro');
		expect(additionalTextEdits?.[0].newText).to.equal(`import Component from "./imports/component.astro";${newLine}`);
	});

	it('resolve completion without auto import if component import already exists', async () => {
		const { provider, document } = setup('autoImportComponentAlreadyExists.astro');

		const completions = await provider.getCompletions(document, Position.create(4, 9));

		const item = completions?.items.find((completion) => completion.label === 'Component');

		const { additionalTextEdits } = await provider.resolveCompletion(document, item!);

		expect(additionalTextEdits).to.be.undefined;
	});

	it('provide import completions for supported files', async () => {
		const { provider, document } = setup('importSupportedFormats.astro');

		const completions = await provider.getCompletions(document, Position.create(1, 35));
		const foundFiles = completions?.items.map((completion) => completion.label);

		expect(foundFiles).to.deep.equal([
			'Astro.astro',
			'JSX',
			'Svelte.svelte',
			'Vue.vue',
			'html.html',
			'js',
			'json.json',
			'md.md',
			'mdx.mdx',
			'ts',
		]);
	});

	it('provide completion inside import statement', async () => {
		const { provider, document } = setup('importStatement.astro');

		const completions = await provider.getCompletions(document, Position.create(1, 11), {
			triggerKind: CompletionTriggerKind.Invoked,
		});

		const item = completions?.items.find((completion) => completion.label === 'MySuperFunction');

		// This completion is done differently depending on the platform so we'll just test that it exists
		expect(item).to.not.be.undefined;
	});

	describe('inside script tags', async () => {
		it('provide completions', async () => {
			const { provider, document } = setup('scriptTagBasic.astro');

			const completions = await provider.getCompletions(document, Position.create(1, 11));

			expect(completions?.items).to.not.be.empty;
		});

		it('provide auto imports completion mapped inside script tag', async () => {
			const { provider, document } = setup('scriptTagImport.astro');

			const completions = await provider.getCompletions(document, Position.create(5, 4));
			const item = completions?.items.find((completion) => completion.label === 'MySuperFunction');

			const { additionalTextEdits } = await provider.resolveCompletion(document, item!);

			expect(additionalTextEdits?.[0].range.start.line).to.equal(4);
			expect(item).to.not.be.undefined;
		});
	});
});
