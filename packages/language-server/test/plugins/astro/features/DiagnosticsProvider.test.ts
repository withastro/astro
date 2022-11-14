import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { DiagnosticSeverity, Range } from 'vscode-languageserver-types';
import { DiagnosticsProviderImpl } from '../../../../src/plugins/astro/features/DiagnosticsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

describe('Astro Plugin#DiagnosticsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'astro', 'diagnostics');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new DiagnosticsProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide compiler warnings', async () => {
		const { provider, document } = setup('compilerError.astro');

		const diagnostics = await provider.getDiagnostics(document);

		expect(diagnostics).to.deep.equal([
			{
				code: 1002,
				message:
					'Unable to assign attributes when using <> Fragment shorthand syntax!\n\nTo fix this, please change < class="hello"> to use the longhand Fragment syntax: <Fragment class="hello">',
				range: Range.create(0, 0, 1, 16),
				severity: DiagnosticSeverity.Error,
				source: 'astro',
			},
		]);
	});
});
