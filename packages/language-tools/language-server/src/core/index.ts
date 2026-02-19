import * as path from 'node:path';
import type { DiagnosticMessage, DiagnosticSeverity } from '@astrojs/compiler/types';
import {
	type CodeMapping,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type VirtualCode,
} from '@volar/language-core';
import type { TypeScriptExtraServiceScript } from '@volar/typescript';
import type ts from 'typescript';
import type { HTMLDocument } from 'vscode-html-languageservice';
import type { URI } from 'vscode-uri';
import type { PackageInfo } from '../importPackage.js';
import { getLanguageServerTypesDir } from '../utils.js';
import { astro2tsx } from './astro2tsx.js';
import type { AstroMetadata } from './parseAstro.js';
import { getAstroMetadata } from './parseAstro.js';
import { extractStylesheets } from './parseCSS.js';
import { parseHTML } from './parseHTML.js';
import { extractScriptTags } from './parseJS.js';

const decoratedHosts = new WeakSet<ts.LanguageServiceHost>();

export function addAstroTypes(
	astroInstall: PackageInfo | undefined,
	ts: typeof import('typescript'),
	host: ts.LanguageServiceHost,
) {
	if (decoratedHosts.has(host)) {
		return;
	}
	decoratedHosts.add(host);

	const getScriptFileNames = host.getScriptFileNames.bind(host);
	const getCompilationSettings = host.getCompilationSettings.bind(host);

	host.getScriptFileNames = () => {
		const languageServerTypesDirectory = getLanguageServerTypesDir(ts);
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

export function getAstroLanguagePlugin(): LanguagePlugin<URI, AstroVirtualCode> {
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
				for (const code of forEachEmbeddedCode(astroCode)) {
					if (code.id === 'tsx') {
						return {
							code,
							extension: '.tsx',
							scriptKind: 4 satisfies ts.ScriptKind.TSX,
						};
					}
				}
				return undefined;
			},
			getExtraServiceScripts(fileName, astroCode) {
				const result: TypeScriptExtraServiceScript[] = [];
				for (const code of forEachEmbeddedCode(astroCode)) {
					if (code.id.endsWith('.mjs') || code.id.endsWith('.mts')) {
						const fileExtension = code.id.endsWith('.mjs') ? '.mjs' : '.mts';
						result.push({
							fileName: fileName + '.' + code.id,
							code,
							extension: fileExtension,
							scriptKind:
								fileExtension === '.mjs'
									? (1 satisfies ts.ScriptKind.JS)
									: (3 satisfies ts.ScriptKind.TS),
						});
					}
				}
				return result;
			},
		},
	};
}

export class AstroVirtualCode implements VirtualCode {
	id = 'root';
	languageId = 'astro';
	mappings!: CodeMapping[];
	embeddedCodes!: VirtualCode[];
	astroMeta!: AstroMetadata;
	compilerDiagnostics!: DiagnosticMessage[];
	htmlDocument!: HTMLDocument;
	codegenStacks = [];

	constructor(
		public fileName: string,
		public snapshot: ts.IScriptSnapshot,
	) {
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

		const tsx = astro2tsx(this.snapshot.getText(0, this.snapshot.getLength()), this.fileName);
		const astroMetadata = getAstroMetadata(
			this.fileName,
			this.snapshot.getText(0, this.snapshot.getLength()),
		);

		const { htmlDocument, virtualCode: htmlVirtualCode } = parseHTML(
			this.snapshot,
			astroMetadata.frontmatter.status === 'closed'
				? astroMetadata.frontmatter.position.end.offset
				: 0,
		);

		this.htmlDocument = htmlDocument;
		htmlVirtualCode.embeddedCodes = [
			...extractStylesheets(tsx.ranges.styles),
			...extractScriptTags(tsx.ranges.scripts),
		];

		this.astroMeta = { ...astroMetadata, tsxRanges: tsx.ranges };
		this.compilerDiagnostics = [...tsx.diagnostics, ...astroMetadata.diagnostics];
		this.embeddedCodes = [htmlVirtualCode, tsx.virtualCode];
	}

	get hasCompilationErrors(): boolean {
		return (
			// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
			this.compilerDiagnostics.filter((diag) => diag.severity === (1 satisfies DiagnosticSeverity))
				.length > 0
		);
	}
}
