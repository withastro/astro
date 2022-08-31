import { expect } from 'chai';
import ts from 'typescript/lib/tsserverlibrary';
import { CodeActionKind, Position, Range } from 'vscode-languageserver-types';
import {
	CodeActionsProviderImpl,
	sortImportKind,
} from '../../../../src/plugins/typescript/features/CodeActionsProvider';
import { LanguageServiceManager } from '../../../../src/plugins/typescript/LanguageServiceManager';
import { createEnvironment } from '../../../utils';

const newLine = ts.sys.newLine;

describe('TypeScript Plugin#CodeActionsProvider', () => {
	function setup(filePath: string) {
		const env = createEnvironment(filePath, 'typescript', 'codeActions');
		const languageServiceManager = new LanguageServiceManager(env.docManager, [env.fixturesDir], env.configManager, ts);
		const provider = new CodeActionsProviderImpl(languageServiceManager, env.configManager);

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
									newText: `import Basic from './basic.astro';${newLine}\timport QuickFixImportComponent from './quickFixImportComponent.astro';${newLine}`,
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
									newText: `---${newLine}import MySuperAstroComponent from "./components/MySuperAstroComponent.astro";${newLine}${newLine}---${newLine}${newLine}`,
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

	describe('inside script tags', async () => {
		it('provide simple quick fixes with ability to disable', async () => {
			const { provider, document } = setup('scriptTag.astro');

			const codeActions = await provider.getCodeActions(document, Range.create(2, 23, 2, 33), {
				diagnostics: [
					{
						code: 2551,
						message: '',
						range: Range.create(2, 23, 2, 33),
						source: '',
					},
				],
				only: [CodeActionKind.QuickFix],
			});

			codeActions.forEach((action) => {
				delete action.diagnostics;
			});

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
				{
					edit: {
						documentChanges: [
							{
								edits: [
									{
										newText: '// @ts-ignore\n\t',
										range: Range.create(2, 1, 2, 1),
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
					title: 'Ignore this error message',
				},
				{
					edit: {
						documentChanges: [
							{
								edits: [
									{
										newText: '// @ts-nocheck\n',
										range: Range.create(0, 18, 0, 18),
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
					title: 'Disable checking for this file',
				},
			]);
		});

		it('provide quick fixes with properly mapped actions', async () => {
			const { provider, document } = setup('scriptTagImports.astro');

			const codeActions = await provider.getCodeActions(document, Range.create(5, 23, 5, 33), {
				diagnostics: [
					{
						code: 2304,
						message: '',
						range: Range.create(3, 1, 3, 10),
						source: '',
					},
				],
				only: [CodeActionKind.QuickFix],
			});

			const item = codeActions.find((action) => action.title.startsWith('Add import'));
			delete item?.diagnostics;

			expect(item).to.deep.equal({
				title: 'Add import from "./components/imports"',
				edit: {
					documentChanges: [
						{
							textDocument: {
								uri: document.getURL(),
								version: null,
							},
							edits: [
								{
									range: Range.create(5, 0, 5, 0),
									newText: `${newLine}import { ImportMe } from "./components/imports"\n`,
								},
							],
						},
					],
				},
				kind: 'quickfix',
			});
		});

		it('organize imports', async () => {
			const { provider, document } = setup('scriptTagImports.astro');

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
										range: Range.create(4, 0, 5, 0),
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
	});
});
