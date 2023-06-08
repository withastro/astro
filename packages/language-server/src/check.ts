import * as kit from '@volar/kit';
import fg from 'fast-glob';
import { pathToFileURL } from 'node:url';
import { getLanguageModule } from './core/index.js';
import { getSvelteLanguageModule } from './core/svelte.js';
import { getAstroInstall } from './core/utils.js';
import { getVueLanguageModule } from './core/vue.js';
import createAstroService from './plugins/astro.js';
import createTypeScriptService from './plugins/typescript/index.js';

// Export those for downstream consumers
export { DiagnosticSeverity, type Diagnostic } from '@volar/language-server';

export interface CheckResult {
	errors: kit.Diagnostic[];
	fileUrl: URL;
	fileContent: string;
}

export class AstroCheck {
	private ts!: typeof import('typescript/lib/tsserverlibrary.js');
	private project!: ReturnType<typeof kit.createProject>;
	private linter!: ReturnType<typeof kit.createLinter>;

	constructor(
		private readonly workspacePath: string,
		private readonly typescriptPath: string | undefined
	) {
		this.initialize();
	}

	/**
	 * Lint a list of files or the entire project and optionally log the errors found
	 * @param fileNames List of files to lint, if undefined, all files included in the project will be linted
	 * @param logErrors Whether to log errors by itself. This is disabled by default.
	 * @return {CheckResult} The result of the lint, including a list of errors, the file's content and its file path.
	 */
	public async lint(
		fileNames: string[] | undefined = undefined,
		logErrors = false
	): Promise<CheckResult[]> {
		const files =
			fileNames !== undefined
				? fileNames
				: this.project.languageHost.getScriptFileNames().filter((file) => file.endsWith('.astro'));

		const errors: CheckResult[] = [];
		for (const file of files) {
			const fileErrors = await this.linter.check(file);
			if (logErrors) {
				this.linter.logErrors(file, fileErrors);
			}

			if (fileErrors.length > 0) {
				const fileSnapshot = this.project.languageHost.getScriptSnapshot(file);
				const fileContent = fileSnapshot?.getText(0, fileSnapshot.getLength());

				errors.push({
					errors: fileErrors,
					fileContent: fileContent ?? '',
					fileUrl: pathToFileURL(file),
				});
			}
		}

		return errors;
	}

	private initialize() {
		this.ts = this.typescriptPath ? require(this.typescriptPath) : require('typescript');
		const tsconfigPath = this.getTsconfig();

		const config: kit.Config = {
			languages: {
				astro: getLanguageModule(getAstroInstall([this.workspacePath]), this.ts),
				svelte: getSvelteLanguageModule(),
				vue: getVueLanguageModule(),
			},
			services: {
				typescript: createTypeScriptService(),
				astro: createAstroService(),
			},
		};

		if (tsconfigPath) {
			this.project = kit.createProject(tsconfigPath, [
				{ extension: 'astro', isMixedContent: true, scriptKind: 7 },
				{ extension: 'vue', isMixedContent: true, scriptKind: 7 },
				{ extension: 'svelte', isMixedContent: true, scriptKind: 7 },
			]);
		} else {
			this.project = kit.createInferredProject(this.workspacePath, () => {
				return fg.sync('**/*.astro', {
					cwd: this.workspacePath,
					ignore: ['node_modules'],
					absolute: true,
				});
			});
		}

		this.linter = kit.createLinter(config, this.project.languageHost);
	}

	private getTsconfig() {
		const tsconfig =
			this.ts.findConfigFile(this.workspacePath, this.ts.sys.fileExists) ||
			this.ts.findConfigFile(this.workspacePath, this.ts.sys.fileExists, 'jsconfig.json');

		return tsconfig;
	}
}
