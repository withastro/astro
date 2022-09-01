import { expect } from 'chai';
import { DiagnosticsProviderImpl } from '../../../../../src/plugins/typescript/features/DiagnosticsProvider';
import { LanguageServiceManager } from '../../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../../utils';
import ts from 'typescript/lib/tsserverlibrary';

describe('TypeScript Plugin#Support Aliases', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'misc');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new DiagnosticsProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('can properly imports using tsconfig.json aliases', async () => {
		const { provider, document } = setup('alias.astro');

		const diagnostics = await provider.getDiagnostics(document);

		expect(diagnostics[0].message).to.include("Property 'wow' is missing in type '{}' but required in type 'Props'.");
	});
});
