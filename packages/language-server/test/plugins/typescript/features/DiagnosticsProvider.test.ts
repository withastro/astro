import { expect } from 'chai';
import { Range } from 'vscode-languageserver-types';
import { createEnvironment } from '../../../utils';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { DiagnosticsProviderImpl } from '../../../../src/plugins/typescript/features/DiagnosticsProvider';

describe('TypeScript Plugin#DiagnosticsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'diagnostics');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new DiagnosticsProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('gets Astro types', async () => {
		const { provider, document } = setup('astroTypes.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.be.empty;
	});

	it('gets Astro JSX definitions', async () => {
		const { provider, document } = setup('astroJSXDefinitions.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.deep.equal([
			{
				code: 2322,
				message:
					"Type '{ astroIsAmazing: true; }' is not assignable to type 'HTMLProps<HTMLDivElement>'.\n  Property 'astroIsAmazing' does not exist on type 'HTMLProps<HTMLDivElement>'.",
				range: Range.create(0, 5, 0, 19),
				severity: 1,
				source: 'ts',
				tags: [],
			},
		]);
	});

	it('provide deprecated and unused hints', async () => {
		const { provider, document } = setup('hints.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.deep.equal([
			{
				code: 6385,
				message: "'deprecated' is deprecated.",
				range: Range.create(3, 0, 3, 10),
				severity: 4,
				source: 'ts',
				tags: [2],
			},
			{
				code: 6133,
				message: "'hello' is declared but its value is never read.",
				range: Range.create(4, 6, 4, 11),
				severity: 4,
				source: 'ts',
				tags: [1],
			},
		]);
	});

	it('support return in frontmatter', async () => {
		const { provider, document } = setup('ssrReturn.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.be.empty;
	});

	describe('Astro2TSX', async () => {
		it('correctly convert HTML comments', async () => {
			const { provider, document } = setup('multipleComments.astro');

			const diagnostics = await provider.getDiagnostics(document);
			expect(diagnostics).to.be.empty;
		});

		it('transform markdown into a template literal', async () => {
			const { provider, document } = setup('noMarkdown.astro');

			const diagnostics = await provider.getDiagnostics(document);
			expect(diagnostics).to.be.empty;
		});
	});
});
