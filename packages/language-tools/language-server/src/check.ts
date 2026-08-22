import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
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
	private readonly workspacePath: string;
	private readonly typescriptPath: string | undefined;
	private readonly tsconfigPath: string | undefined;

	constructor(
		workspacePath: string,
		typescriptPath: string | undefined,
		tsconfigPath: string | undefined,
	) {
		this.workspacePath = workspacePath;
		this.typescriptPath = typescriptPath;
		this.tsconfigPath = tsconfigPath;
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
		this.assertCompatibleTypeScript();
		const tsconfigPath = this.getTsconfig();

		const languagePlugins = [
			getAstroLanguagePlugin(),
			getSvelteLanguagePlugin(),
			getVueLanguagePlugin(),
		];
		const services = [...createTypeScriptServices(this.ts), createAstroService()];

		if (tsconfigPath) {
			const includeProjectReference = true;
			const extraFileExtensions = languagePlugins.flatMap(
				(plugin) => plugin.typescript?.extraFileExtensions ?? [],
			);
			const extraFileNameResolvers: (() => string[])[] = [];
			this.linter = kit.createTypeScriptChecker(
				languagePlugins,
				services,
				tsconfigPath,
				includeProjectReference,
				({ project }) => {
					const { configFileName, languageServiceHost } = project.typescript!;
					const astroInstall = getAstroInstall([this.workspacePath]);

					addAstroTypes(
						typeof astroInstall === 'string' ? undefined : astroInstall,
						this.ts,
						languageServiceHost,
					);

					const getExtraFileNames = this.includeExtraFileExtensionsFromReferences(
						configFileName,
						languageServiceHost,
						extraFileExtensions,
					);
					if (getExtraFileNames) {
						extraFileNameResolvers.push(getExtraFileNames);
					}
				},
			);

			// `getRootFileNames()` (used by `lint()` to enumerate the whole project when no
			// explicit file list is given) reads project references' file lists from an
			// internal host that `includeExtraFileExtensionsFromReferences` above cannot reach,
			// so it needs its own, separate patch here.
			if (extraFileNameResolvers.length > 0) {
				const originalGetRootFileNames = this.linter.getRootFileNames.bind(this.linter);
				this.linter.getRootFileNames = () => {
					const fileNames = new Set(originalGetRootFileNames());
					for (const getExtraFileNames of extraFileNameResolvers) {
						for (const fileName of getExtraFileNames()) {
							fileNames.add(fileName);
						}
					}
					return [...fileNames];
				};
			}
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

	/**
	 * The checker is built on Volar and TypeScript's programmatic Language Service API
	 * (`ts.sys`, `ts.findConfigFile`, `LanguageServiceHost`, etc.). TypeScript's native
	 * compiler does not ship that API yet — `require('typescript')` only exposes `version`
	 * and `versionMajorMinor` — so continuing would crash later with an opaque
	 * `Cannot read properties of undefined` error. Fail early with an actionable message.
	 */
	private assertCompatibleTypeScript() {
		if (typeof this.ts.findConfigFile !== 'function' || this.ts.sys === undefined) {
			const version = this.ts.version ? ` (found ${this.ts.version})` : '';
			throw new Error(
				`The TypeScript module loaded${version} does not expose the programmatic API that \`astro check\` relies on. ` +
					`TypeScript's native compiler (7.0 and later) does not ship this API yet. ` +
					`Until it does, run \`astro check\` with a TypeScript version that still provides it (6.x). ` +
					`See https://github.com/withastro/roadmap/discussions/1321 to track support.`,
			);
		}
	}

	/**
	 * `@volar/kit`'s `createTypeScriptChecker` re-parses the root tsconfig with the language
	 * plugins' `extraFileExtensions` (so `.astro` files are included), but for project
	 * references it reuses TypeScript's own resolved `commandLine`, which never includes
	 * extra extensions. That silently drops `.astro`/`.vue`/`.svelte` files that are only
	 * reachable through a referenced tsconfig. `setup` is invoked once per project (the root
	 * and each reference), so we can detect and fix this per-project from here, without
	 * touching `@volar/kit` itself: re-parse this project's own tsconfig the same way the
	 * root one already is, and merge any newly-found files into the language service host's
	 * root file list.
	 *
	 * Returns a resolver that yields the extra file names found for this project, so callers
	 * that can't reach `languageServiceHost` directly (e.g. `getRootFileNames()`) can still
	 * pick them up.
	 */
	private includeExtraFileExtensionsFromReferences(
		configFileName: string | undefined,
		languageServiceHost: import('typescript').LanguageServiceHost,
		extraFileExtensions: import('typescript').FileExtensionInfo[],
	): (() => string[]) | undefined {
		if (!configFileName || extraFileExtensions.length === 0) {
			return undefined;
		}

		const originalGetScriptFileNames =
			languageServiceHost.getScriptFileNames.bind(languageServiceHost);

		// The underlying host already re-syncs `originalGetScriptFileNames()` cheaply from
		// its own project-version tracking, but re-parsing the tsconfig from disk on every
		// call would be wasteful. Only redo that work when the underlying file list actually
		// changes (e.g. a file is added or removed).
		let lastOriginalFileNames: string[] | undefined;
		let extraFileNames: string[] = [];

		const resolveExtraFileNames = () => {
			const originalFileNames = originalGetScriptFileNames();

			if (
				!lastOriginalFileNames ||
				originalFileNames.length !== lastOriginalFileNames.length ||
				originalFileNames.some((fileName, i) => fileName !== lastOriginalFileNames?.[i])
			) {
				lastOriginalFileNames = originalFileNames;

				const commandLine = this.ts.parseJsonSourceFileConfigFileContent(
					this.ts.readJsonConfigFile(configFileName, this.ts.sys.readFile),
					this.ts.sys,
					dirname(configFileName),
					undefined,
					configFileName,
					undefined,
					extraFileExtensions,
				);

				extraFileNames = commandLine.fileNames;
			}

			return { originalFileNames, extraFileNames };
		};

		languageServiceHost.getScriptFileNames = () => {
			const resolved = resolveExtraFileNames();
			return [...new Set([...resolved.originalFileNames, ...resolved.extraFileNames])];
		};

		return () => resolveExtraFileNames().extraFileNames;
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
