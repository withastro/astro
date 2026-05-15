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
exports.AstroVirtualCode = void 0;
exports.addAstroTypes = addAstroTypes;
exports.getAstroLanguagePlugin = getAstroLanguagePlugin;
const path = __importStar(require('node:path'));
const language_core_1 = require('@volar/language-core');
const utils_js_1 = require('../utils.js');
const astro2tsx_js_1 = require('./astro2tsx.js');
const parseAstro_js_1 = require('./parseAstro.js');
const parseCSS_js_1 = require('./parseCSS.js');
const parseHTML_js_1 = require('./parseHTML.js');
const parseJS_js_1 = require('./parseJS.js');
const decoratedHosts = new WeakSet();
function addAstroTypes(astroInstall, ts, host) {
	if (decoratedHosts.has(host)) {
		return;
	}
	decoratedHosts.add(host);
	const getScriptFileNames = host.getScriptFileNames.bind(host);
	const getCompilationSettings = host.getCompilationSettings.bind(host);
	host.getScriptFileNames = () => {
		const languageServerTypesDirectory = (0, utils_js_1.getLanguageServerTypesDir)(ts);
		const fileNames = getScriptFileNames();
		const addedFileNames = [];
		if (astroInstall) {
			addedFileNames.push(
				...['./env.d.ts', './astro-jsx.d.ts'].map((filePath) =>
					ts.sys.resolvePath(path.resolve(astroInstall.directory, filePath)),
				),
			);
			// If Astro version is < 4.0.8, add jsx-runtime-augment.d.ts to the files to fake `JSX` being available from "astro/jsx-runtime".
			// TODO: Remove this once a majority of users are on Astro 4.0.8+, erika - 2023-12-28
			if (
				astroInstall.version.major < 4 ||
				(astroInstall.version.major === 4 &&
					astroInstall.version.minor === 0 &&
					astroInstall.version.patch < 8)
			) {
				addedFileNames.push(
					...['./jsx-runtime-augment.d.ts'].map((filePath) =>
						ts.sys.resolvePath(path.resolve(languageServerTypesDirectory, filePath)),
					),
				);
			}
		} else {
			// If we don't have an Astro installation, add the fallback types from the language server.
			// See the README in packages/language-server/types for more information.
			addedFileNames.push(
				...['./env.d.ts', './astro-jsx.d.ts', './jsx-runtime-fallback.d.ts'].map((f) =>
					ts.sys.resolvePath(path.resolve(languageServerTypesDirectory, f)),
				),
			);
		}
		return [...fileNames, ...addedFileNames];
	};
	host.getCompilationSettings = () => {
		const baseCompilationSettings = getCompilationSettings();
		return {
			...baseCompilationSettings,
			module: ts.ModuleKind.ESNext ?? 99,
			target: ts.ScriptTarget.ESNext ?? 99,
			jsx: ts.JsxEmit.Preserve ?? 1,
			resolveJsonModule: true,
			allowJs: true, // Needed for inline scripts, which are virtual .js files
			isolatedModules: true,
			moduleResolution:
				baseCompilationSettings.moduleResolution === ts.ModuleResolutionKind.Classic ||
				!baseCompilationSettings.moduleResolution
					? ts.ModuleResolutionKind.Node10
					: baseCompilationSettings.moduleResolution,
		};
	};
}
function getAstroLanguagePlugin() {
	return {
		getLanguageId(uri) {
			if (uri.path.endsWith('.astro')) {
				return 'astro';
			}
		},
		createVirtualCode(uri, languageId, snapshot) {
			if (languageId === 'astro') {
				const fileName = uri.fsPath.replace(/\\/g, '/');
				return new AstroVirtualCode(fileName, snapshot);
			}
		},
		typescript: {
			extraFileExtensions: [{ extension: 'astro', isMixedContent: true, scriptKind: 7 }],
			getServiceScript(astroCode) {
				for (const code of (0, language_core_1.forEachEmbeddedCode)(astroCode)) {
					if (code.id === 'tsx') {
						return {
							code,
							extension: '.tsx',
							scriptKind: 4,
						};
					}
				}
				return undefined;
			},
			getExtraServiceScripts(fileName, astroCode) {
				const result = [];
				for (const code of (0, language_core_1.forEachEmbeddedCode)(astroCode)) {
					if (code.id.endsWith('.mjs') || code.id.endsWith('.mts')) {
						const fileExtension = code.id.endsWith('.mjs') ? '.mjs' : '.mts';
						result.push({
							fileName: fileName + '.' + code.id,
							code,
							extension: fileExtension,
							scriptKind: fileExtension === '.mjs' ? 1 : 3,
						});
					}
				}
				return result;
			},
		},
	};
}
class AstroVirtualCode {
	constructor(fileName, snapshot) {
		this.id = 'root';
		this.languageId = 'astro';
		this.codegenStacks = [];
		this.fileName = fileName;
		this.snapshot = snapshot;
		this.mappings = [
			{
				sourceOffsets: [0],
				generatedOffsets: [0],
				lengths: [this.snapshot.getLength()],
				data: {
					verification: true,
					completion: true,
					semantic: true,
					navigation: true,
					structure: true,
					format: true,
				},
			},
		];
		const tsx = (0, astro2tsx_js_1.astro2tsx)(
			this.snapshot.getText(0, this.snapshot.getLength()),
			this.fileName,
		);
		const astroMetadata = (0, parseAstro_js_1.getAstroMetadata)(
			this.fileName,
			this.snapshot.getText(0, this.snapshot.getLength()),
		);
		const { htmlDocument, virtualCode: htmlVirtualCode } = (0, parseHTML_js_1.parseHTML)(
			this.snapshot,
			astroMetadata.frontmatter.status === 'closed'
				? astroMetadata.frontmatter.position.end.offset
				: 0,
		);
		this.htmlDocument = htmlDocument;
		htmlVirtualCode.embeddedCodes = [
			...(0, parseCSS_js_1.extractStylesheets)(tsx.ranges.styles),
			...(0, parseJS_js_1.extractScriptTags)(tsx.ranges.scripts),
		];
		this.astroMeta = { ...astroMetadata, tsxRanges: tsx.ranges };
		this.compilerDiagnostics = [...tsx.diagnostics, ...astroMetadata.diagnostics];
		this.embeddedCodes = [htmlVirtualCode, tsx.virtualCode];
	}
	get hasCompilationErrors() {
		return (
			// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
			this.compilerDiagnostics.filter((diag) => diag.severity === 1).length > 0
		);
	}
}
exports.AstroVirtualCode = AstroVirtualCode;
//# sourceMappingURL=index.js.map
