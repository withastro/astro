import * as kit from '@volar/kit';
import { Diagnostic, DiagnosticSeverity } from '@volar/language-server';
import fg from 'fast-glob';
import { pathToFileURL } from 'node:url';
import { getLanguageModule } from './core/index.js';
import { getSvelteLanguageModule } from './core/svelte.js';
import { getVueLanguageModule } from './core/vue.js';
import createAstroService from './plugins/astro.js';
import createTypeScriptService from './plugins/typescript/index.js';
import { getAstroInstall } from './utils.js';

// Export those for downstream consumers
export { DiagnosticSeverity, Diagnostic };

export interface CheckResult {
	status: 'completed' | 'cancelled' | undefined;
	fileChecked: number;
	errors: number;
	warnings: number;
	hints: number;
	fileResult: {
		errors: kit.Diagnostic[];
		fileUrl: URL;
		fileContent: string;
	}[];
}

export class AstroCheck {
	private ts!: typeof import('typescript/lib/tsserverlibrary.js');
	public project!: ReturnType<typeof kit.createProject>;
	private linter!: ReturnType<typeof kit.createLinter>;

	constructor(
		private readonly workspacePath: string,
		private readonly typescriptPath: string | undefined,
		private readonly tsconfigPath: string | undefined
	) {
		this.initialize();
	}

	/**
	 * Lint a list of files or the entire project and optionally log the errors found
	 * @param fileNames List of files to lint, if undefined, all files included in the project will be linted
	 * @param logErrors Whether to log errors by itself. This is disabled by default.
	 * @return {CheckResult} The result of the lint, including a list of errors, the file's content and its file path.
	 */
	public async lint({
		fileNames = undefined,
		cancel = () => false,
		logErrors = undefined,
	}: {
		fileNames?: string[] | undefined;
		cancel?: () => boolean;
		logErrors?:
			| {
					level: 'error' | 'warning' | 'hint';
			  }
			| undefined;
	}): Promise<CheckResult> {
		const files =
			fileNames !== undefined ? fileNames : this.project.languageHost.getScriptFileNames();

		const result: CheckResult = {
			status: undefined,
			fileChecked: 0,
			errors: 0,
			warnings: 0,
			hints: 0,
			fileResult: [],
		};
		for (const file of files) {
			if (cancel()) {
				result.status = 'cancelled';
				return result;
			}
			const fileDiagnostics = (await this.linter.check(file)).filter((diag) => {
				const severity = diag.severity ?? DiagnosticSeverity.Error;
				switch (logErrors?.level ?? 'error') {
					case 'error':
						return true;
					case 'warning':
						return severity <= DiagnosticSeverity.Warning;
					case 'hint':
						return severity <= DiagnosticSeverity.Hint;
				}
			});

			if (logErrors) {
				this.linter.logErrors(file, fileDiagnostics);
			}

			if (fileDiagnostics.length > 0) {
				const fileSnapshot = this.project.languageHost.getScriptSnapshot(file);
				const fileContent = fileSnapshot?.getText(0, fileSnapshot.getLength());

				result.fileResult.push({
					errors: fileDiagnostics,
					fileContent: fileContent ?? '',
					fileUrl: pathToFileURL(file),
				});
				result.errors += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Error
				).length;
				result.warnings += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Warning
				).length;
				result.hints += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Hint
				).length;
			}

			result.fileChecked += 1;
		}

		result.status = 'completed';
		return result;
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
		const searchPath = this.tsconfigPath ?? this.workspacePath;

		const tsconfig =
			this.ts.findConfigFile(searchPath, this.ts.sys.fileExists) ||
			this.ts.findConfigFile(searchPath, this.ts.sys.fileExists, 'jsconfig.json');

		return tsconfig;
	}
}
