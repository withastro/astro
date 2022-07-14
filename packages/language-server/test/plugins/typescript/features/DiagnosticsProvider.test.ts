import { expect } from 'chai';
import { DiagnosticSeverity, Range } from 'vscode-languageserver-types';
import { createEnvironment } from '../../../utils';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import {
	DiagnosticsProviderImpl,
	DiagnosticCodes,
} from '../../../../src/plugins/typescript/features/DiagnosticsProvider';

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
					"Type '{ astroIsAmazing: true; }' is not assignable to type 'HTMLAttributes'.\n  Property 'astroIsAmazing' does not exist on type 'HTMLAttributes'.",
				range: Range.create(0, 5, 0, 19),
				severity: DiagnosticSeverity.Error,
				source: 'ts',
				tags: [],
			},
		]);
	});

	it('support arbitrary attributes when enabled', async () => {
		const { provider, document, configManager } = setup('arbitraryAttrs.astro');

		configManager.updateGlobalConfig(<any>{
			typescript: {
				allowArbitraryAttributes: true,
			},
		});

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.be.empty;
	});

	it('provide deprecated and unused hints', async () => {
		const { provider, document } = setup('hints.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.deep.equal([
			{
				code: 6385,
				message: "'deprecated' is deprecated.",
				range: Range.create(3, 0, 3, 10),
				severity: DiagnosticSeverity.Hint,
				source: 'ts',
				tags: [2],
			},
			{
				code: 6133,
				message: "'hello' is declared but its value is never read.",
				range: Range.create(4, 6, 4, 11),
				severity: DiagnosticSeverity.Hint,
				source: 'ts',
				tags: [1],
			},
		]);
	});

	it('support return in frontmatter', async () => {
		const { provider, document } = setup('ssrReturn.astro');

		const diagnostics = await provider.getDiagnostics(document);
		const codes = diagnostics.map((diag) => Number(diag.code));

		expect(codes).to.not.contain(1108);
	});

	it('provide diagnostics inside script tags', async () => {
		const { provider, document } = setup('scriptTag.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.not.be.empty;
	});

	it('properly support TypeScript script tags', async () => {
		const { provider, document } = setup('scriptTagTypeScript.astro');

		const diagnostics = await provider.getDiagnostics(document);
		expect(diagnostics).to.deep.equal([
			{
				code: 8010,
				message: 'Type annotations can only be used in TypeScript files.',
				range: Range.create(6, 14, 6, 20),
				severity: DiagnosticSeverity.Error,
				source: 'ts',
				tags: [],
			},
		]);
	});

	it('provide diagnostics for invalid framework components', async () => {
		const { provider, document } = setup('frameworkComponentError.astro');

		const diagnostics = await provider.getDiagnostics(document);

		expect(diagnostics).to.deep.equal([
			{
				code: 2604,
				message:
					"Component 'SvelteError' is not a valid component.\n\nIf this is a Svelte or Vue component, it might have a syntax error that makes it impossible to parse.",
				range: Range.create(5, 1, 5, 12),
				severity: DiagnosticSeverity.Error,
				source: 'ts',
				tags: [],
			},
			{
				code: 2604,
				message:
					"Component 'VueError' is not a valid component.\n\nIf this is a Svelte or Vue component, it might have a syntax error that makes it impossible to parse.",
				range: Range.create(6, 1, 6, 9),
				severity: DiagnosticSeverity.Error,
				source: 'ts',
				tags: [],
			},
		]);
	});

	it('ignore specific diagnostics', async () => {
		const { provider, document } = setup('scriptTag.astro');

		const diagnostics = await provider.getDiagnostics(document);
		const codes = diagnostics.map((diag) => Number(diag.code));
		const ignoredCodes = Object.values(DiagnosticCodes)
			.filter((value) => !isNaN(Number(value)))
			// TODO: Since we don't support shorthand properties at the moment, this one gets wrongly activated in the fixture
			.filter((code) => code !== 2322);

		const foundIgnored = codes.reduce((ignored, current) => {
			return ignored || ignoredCodes.indexOf(current) !== -1;
		}, false);

		expect(foundIgnored).to.be.false;

		const rangesStart = diagnostics.map((diag) => diag.range.start.line);
		expect(rangesStart).to.satisfy((ranges: number[]) => ranges.every((start) => start <= document.lineCount));
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
