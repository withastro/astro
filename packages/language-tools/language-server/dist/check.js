'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.AstroCheck = exports.DiagnosticSeverity = exports.Diagnostic = void 0;
const node_fs_1 = require('node:fs');
const node_os_1 = require('node:os');
const node_path_1 = require('node:path');
const node_url_1 = require('node:url');
const kit = __importStar(require('@volar/kit'));
const language_server_1 = require('@volar/language-server');
Object.defineProperty(exports, 'Diagnostic', {
	enumerable: true,
	get: function () {
		return language_server_1.Diagnostic;
	},
});
Object.defineProperty(exports, 'DiagnosticSeverity', {
	enumerable: true,
	get: function () {
		return language_server_1.DiagnosticSeverity;
	},
});
const tinyglobby_1 = require('tinyglobby');
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('./core/index.js');
const svelte_js_1 = require('./core/svelte.js');
const vue_js_1 = require('./core/vue.js');
const astro_js_1 = require('./plugins/astro.js');
const index_js_2 = require('./plugins/typescript/index.js');
const utils_js_1 = require('./utils.js');
class AstroCheck {
	constructor(workspacePath, typescriptPath, tsconfigPath) {
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
	async lint({ fileNames = undefined, cancel = () => false, logErrors = undefined }) {
		let files = (fileNames !== undefined ? fileNames : this.linter.getRootFileNames()).filter(
			(file) => {
				// We don't have the same understanding of Svelte and Vue files as their own respective tools (vue-tsc, svelte-check)
				// So we don't want to check them here
				return !file.endsWith('.vue') && !file.endsWith('.svelte');
			},
		);
		const result = {
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
				const severity = diag.severity ?? language_server_1.DiagnosticSeverity.Error;
				switch (logErrors?.level ?? 'hint') {
					case 'error':
						return severity <= language_server_1.DiagnosticSeverity.Error;
					case 'warning':
						return severity <= language_server_1.DiagnosticSeverity.Warning;
					case 'hint':
						return severity <= language_server_1.DiagnosticSeverity.Hint;
				}
			});
			if (fileDiagnostics.length > 0) {
				const errorText = this.linter.printErrors(file, fileDiagnosticsToPrint);
				if (logErrors !== undefined && errorText) {
					console.info(errorText);
				}
				const fileSnapshot = this.linter.language.scripts.get(
					vscode_uri_1.URI.file(file),
				)?.snapshot;
				const fileContent = fileSnapshot?.getText(0, fileSnapshot.getLength());
				result.fileResult.push({
					errors: fileDiagnostics,
					fileContent: fileContent ?? '',
					fileUrl: (0, node_url_1.pathToFileURL)(file),
					text: errorText,
				});
				result.errors += fileDiagnostics.filter(
					(diag) => diag.severity === language_server_1.DiagnosticSeverity.Error,
				).length;
				result.warnings += fileDiagnostics.filter(
					(diag) => diag.severity === language_server_1.DiagnosticSeverity.Warning,
				).length;
				result.hints += fileDiagnostics.filter(
					(diag) => diag.severity === language_server_1.DiagnosticSeverity.Hint,
				).length;
			}
			result.fileChecked += 1;
		}
		result.status = 'completed';
		return result;
	}
	initialize() {
		this.ts = this.typescriptPath ? require(this.typescriptPath) : require('typescript');
		const tsconfigPath = this.getTsconfig();
		const languagePlugins = [
			(0, index_js_1.getAstroLanguagePlugin)(),
			(0, svelte_js_1.getSvelteLanguagePlugin)(),
			(0, vue_js_1.getVueLanguagePlugin)(),
		];
		const services = [...(0, index_js_2.create)(this.ts), (0, astro_js_1.create)()];
		if (tsconfigPath) {
			const includeProjectReference = false; // #920
			this.linter = kit.createTypeScriptChecker(
				languagePlugins,
				services,
				tsconfigPath,
				includeProjectReference,
				({ project }) => {
					const { languageServiceHost } = project.typescript;
					const astroInstall = (0, utils_js_1.getAstroInstall)([this.workspacePath]);
					(0, index_js_1.addAstroTypes)(
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
					return (0, tinyglobby_1.globSync)('**/*.astro', {
						cwd: this.workspacePath,
						ignore: ['node_modules'],
						absolute: true,
						// Required to avoid tinyglobby running eternally
						expandDirectories: false,
					});
				},
				undefined,
				({ project }) => {
					const { languageServiceHost } = project.typescript;
					const astroInstall = (0, utils_js_1.getAstroInstall)([this.workspacePath]);
					(0, index_js_1.addAstroTypes)(
						typeof astroInstall === 'string' ? undefined : astroInstall,
						this.ts,
						languageServiceHost,
					);
				},
			);
		}
	}
	getTsconfig() {
		if (this.tsconfigPath) {
			const tsconfig = (0, node_path_1.resolve)(
				this.workspacePath,
				this.tsconfigPath.replace(/^~/, (0, node_os_1.homedir)()),
			);
			if (!(0, node_fs_1.existsSync)(tsconfig)) {
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
exports.AstroCheck = AstroCheck;
//# sourceMappingURL=check.js.map
