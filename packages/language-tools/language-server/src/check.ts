import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as kit from '@volar/kit';
import { Diagnostic, DiagnosticSeverity } from '@volar/language-server';
import { globSync } from 'tinyglobby';
import { URI } from 'vscode-uri';
import { addAstroTypes, getAstroLanguagePlugin } from './core/index.js';
import { getSvelteLanguagePlugin } from './core/svelte.js';
import { getVueLanguagePlugin } from './core/vue.js';
import { create as createAstroService } from './plugins/astro.js';
import { create as createTypeScriptServices } from './plugins/typescript/index.js';
import { getAstroInstall } from './utils.js';

// Export those for downstream consumers
export { Diagnostic, DiagnosticSeverity };

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
		text: string;
	}[];
}

export class AstroCheck {
	private ts!: typeof import('typescript');
	public linter!: ReturnType<(typeof kit)['createTypeScriptChecker']>;

	constructor(
		private readonly workspacePath: string,
		private readonly typescriptPath: string | undefined,
		private readonly tsconfigPath: string | undefined,
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
		let files = (fileNames !== undefined ? fileNames : this.linter.getRootFileNames()).filter(
			(file) => {
				// We don't have the same understanding of Svelte and Vue files as their own respective tools (vue-tsc, svelte-check)
				// So we don't want to check them here
				return !file.endsWith('.vue') && !file.endsWith('.svelte');
			},
		);

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
			const fileDiagnostics = await this.linter.check(file);

			// Filter diagnostics based on the logErrors level
			const fileDiagnosticsToPrint = fileDiagnostics.filter((diag) => {
				const severity = diag.severity ?? DiagnosticSeverity.Error;
				switch (logErrors?.level ?? 'hint') {
					case 'error':
						return severity <= DiagnosticSeverity.Error;
					case 'warning':
						return severity <= DiagnosticSeverity.Warning;
					case 'hint':
						return severity <= DiagnosticSeverity.Hint;
				}
			});

			if (fileDiagnostics.length > 0) {
				const errorText = this.linter.printErrors(file, fileDiagnosticsToPrint);

				if (logErrors !== undefined && errorText) {
					console.info(errorText);
				}

				const fileSnapshot = this.linter.language.scripts.get(URI.file(file))?.snapshot;
				const fileContent = fileSnapshot?.getText(0, fileSnapshot.getLength());

				result.fileResult.push({
					errors: fileDiagnostics,
					fileContent: fileContent ?? '',
					fileUrl: pathToFileURL(file),
					text: errorText,
				});

				result.errors += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Error,
				).length;
				result.warnings += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Warning,
				).length;
				result.hints += fileDiagnostics.filter(
					(diag) => diag.severity === DiagnosticSeverity.Hint,
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

		const languagePlugins = [
			getAstroLanguagePlugin(),
			getSvelteLanguagePlugin(),
			getVueLanguagePlugin(),
		];
		const services = [...createTypeScriptServices(this.ts), createAstroService(this.ts)];

		if (tsconfigPath) {
			const includeProjectReference = false; // #920
			this.linter = kit.createTypeScriptChecker(
				languagePlugins,
				services,
				tsconfigPath,
				includeProjectReference,
				({ project }) => {
					const { languageServiceHost } = project.typescript!;
					const astroInstall = getAstroInstall([this.workspacePath]);

					addAstroTypes(
						typeof astroInstall === 'string' ? undefined : astroInstall,
						this.ts,
						languageServiceHost,
					);
				},
			);
		} else {
			this.linter = kit.createTypeScriptInferredChecker(
				languagePlugins,
				services,
				() => {
					return globSync('**/*.astro', {
						cwd: this.workspacePath,
						ignore: ['node_modules'],
						absolute: true,
						// Required to avoid tinyglobby running eternally
						expandDirectories: false,
					});
				},
				undefined,
				({ project }) => {
					const { languageServiceHost } = project.typescript!;
					const astroInstall = getAstroInstall([this.workspacePath]);

					addAstroTypes(
						typeof astroInstall === 'string' ? undefined : astroInstall,
						this.ts,
						languageServiceHost,
					);
				},
			);
		}
	}

	private getTsconfig() {
		if (this.tsconfigPath) {
			const tsconfig = resolve(this.workspacePath, this.tsconfigPath.replace(/^~/, homedir()));
			if (!existsSync(tsconfig)) {
				throw new Error(`Specified tsconfig file \`${tsconfig}\` does not exist.`);
			}
			return tsconfig;
		}

		const searchPath = this.workspacePath;

		const tsconfig =
			this.ts.findConfigFile(searchPath, this.ts.sys.fileExists) ||
			this.ts.findConfigFile(searchPath, this.ts.sys.fileExists, 'jsconfig.json');

		return tsconfig;
	}
}
