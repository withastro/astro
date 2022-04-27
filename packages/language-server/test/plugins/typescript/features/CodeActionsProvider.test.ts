import { expect } from 'chai';
import { CodeActionKind, Position, Range } from 'vscode-languageserver-types';
import {
	CodeActionsProviderImpl,
	sortImportKind,
} from '../../../../src/plugins/typescript/features/CodeActionsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

describe('TypeScript Plugin#CodeActionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'codeActions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager);
		const provider = new CodeActionsProviderImpl(languageServiceManager);

		return {
			...env,
			provider,
		};
	}

	it('provide simple quick fixes', async () => {
		const { provider, document } = setup('basic.astro');

		const codeActions = await provider.getCodeActions(document, Range.create(2, 23, 2, 33), {
			diagnostics: [
				{
					code: 2551,
					message: '',
					range: Range.create(2, 23, 2, 33),
					source: 'ts',
				},
			],
			only: [CodeActionKind.QuickFix],
		});

		delete codeActions[0].diagnostics;

		expect(codeActions).to.deep.equal([
			{
				edit: {
					documentChanges: [
						{
							edits: [
								{
									newText: 'toString',
									range: Range.create(2, 22, 2, 30),
								},
							],
							textDocument: {
								uri: document.getURL(),
								version: null,
							},
						},
					],
				},
				kind: CodeActionKind.QuickFix,
				title: "Change spelling to 'toString'",
			},
		]);
	});

	it('organize imports', async () => {
		const { provider, document } = setup('sortOrganizeImports.astro');

		const codeActions = await provider.getCodeActions(
			document,
			Range.create(Position.create(6, 0), Position.create(6, 0)),
			{
				diagnostics: [],
				only: [CodeActionKind.SourceOrganizeImports],
			}
		);

		expect(codeActions).to.deep.equal([
			{
				edit: {
					documentChanges: [
						{
							edits: [
								{
									newText: '',
									range: Range.create(2, 0, 3, 0),
								},
							],
							textDocument: {
								uri: document.getURL(),
								version: null,
							},
						},
					],
				},
				kind: CodeActionKind.SourceOrganizeImports,
				title: 'Organize Imports',
			},
		]);
	});

	it('sort imports', async () => {
		const { provider, document } = setup('sortOrganizeImports.astro');

		const codeActions = await provider.getCodeActions(
			document,
			Range.create(Position.create(6, 0), Position.create(6, 0)),
			{
				diagnostics: [],
				only: [sortImportKind],
			}
		);

		expect(codeActions).to.deep.equal([
			{
				edit: {
					documentChanges: [
						{
							edits: [
								{
									newText:
										"import Basic from './basic.astro';\n\timport QuickFixImportComponent from './quickFixImportComponent.astro';\n",
									range: Range.create(1, 1, 2, 0),
								},
								{
									newText: '',
									range: Range.create(2, 0, 3, 0),
								},
							],
							textDocument: {
								uri: document.getURL(),
								version: null,
							},
						},
					],
				},
				kind: sortImportKind,
				title: 'Sort Imports',
			},
		]);
	});

	it('provide component import quick fix', async () => {
		const { provider, document } = setup('quickFixImportComponent.astro');

		const range = Range.create(Position.create(0, 1), Position.create(0, 1));
		const codeActions = await provider.getCodeActions(document, range, {
			diagnostics: [
				{
					code: 2304,
					message: "Cannot find name 'MySuperAstroComponent'",
					range,
					source: 'ts',
				},
			],
			only: [CodeActionKind.QuickFix],
		});

		codeActions.forEach((action) => delete action.diagnostics);

		expect(codeActions).to.deep.equal([
			{
				edit: {
					documentChanges: [
						{
							edits: [
								{
									newText:
										'---\nimport MySuperAstroComponent from "./components/MySuperAstroComponent.astro";\n\n---\n\n',
									range: Range.create(0, 0, 0, 0),
								},
							],
							textDocument: {
								uri: document.getURL(),
								version: null,
							},
						},
					],
				},
				kind: 'quickfix',
				title: 'Add import from "./components/MySuperAstroComponent.astro"',
			},
		]);
	});
});
