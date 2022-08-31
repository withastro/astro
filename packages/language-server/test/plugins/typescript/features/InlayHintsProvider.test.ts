import { expect } from 'chai';
import { Hover, InlayHintKind, Position, Range } from 'vscode-languageserver-types';
import { InlayHintsProviderImpl } from '../../../../src/plugins/typescript/features/InlayHintsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';
import ts from 'typescript/lib/tsserverlibrary';

describe('TypeScript Plugin#InlayHintsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'inlayHints');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new InlayHintsProviderImpl(languageServiceManager, env.configManager);

		return {
			...env,
			provider,
		};
	}

	it('provide inlay hints when enabled', async () => {
		const { provider, document, configManager } = setup('basic.astro');

		configManager.updateGlobalConfig(
			{
				typescript: {
					inlayHints: {
						parameterNames: {
							enabled: 'all',
						},
						parameterTypes: {
							enabled: 'all',
						},
					},
				},
			},
			true
		);

		const inlayHints = await provider.getInlayHints(document, Range.create(0, 0, 7, 0));

		expect(inlayHints).to.deep.equal([
			{
				kind: InlayHintKind.Type,
				label: ': any',
				paddingLeft: true,
				paddingRight: undefined,
				position: Position.create(1, 22),
			},
			{
				kind: InlayHintKind.Parameter,
				label: 'params:',
				paddingLeft: undefined,
				paddingRight: true,
				position: Position.create(5, 7),
			},
		]);
	});

	it('provide inlay hints inside script tags', async () => {
		const { provider, document, configManager } = setup('scriptTag.astro');

		configManager.updateGlobalConfig(
			{
				typescript: {
					inlayHints: {
						parameterNames: {
							enabled: 'all',
						},
						parameterTypes: {
							enabled: 'all',
						},
					},
				},
			},
			true
		);

		const inlayHints = await provider.getInlayHints(document, Range.create(0, 0, 7, 0));

		expect(inlayHints).to.deep.equal([
			{
				kind: InlayHintKind.Type,
				label: ': any',
				paddingLeft: true,
				paddingRight: undefined,
				position: Position.create(1, 22),
			},
			{
				kind: InlayHintKind.Parameter,
				label: 'params:',
				paddingLeft: undefined,
				paddingRight: true,
				position: Position.create(5, 7),
			},
		]);
	});
});
