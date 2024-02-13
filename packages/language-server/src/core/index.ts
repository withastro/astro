import * as path from 'node:path';
import type { DiagnosticMessage } from '@astrojs/compiler/types';
import {
	type CodeMapping,
	type ExtraServiceScript,
	type LanguagePlugin,
	type VirtualCode,
	forEachEmbeddedCode,
} from '@volar/language-core';
import type ts from 'typescript';
import type { HTMLDocument } from 'vscode-html-languageservice';
import { URI } from 'vscode-uri';
import { type AstroInstall, getLanguageServerTypesDir } from '../utils.js';
import { astro2tsx } from './astro2tsx';
import { AstroMetadata, getAstroMetadata } from './parseAstro';
import { extractStylesheets } from './parseCSS';
import { parseHTML } from './parseHTML';
import { extractScriptTags } from './parseJS.js';

export function getLanguageModule(
	astroInstall: AstroInstall | undefined,
	ts: typeof import('typescript')
): LanguagePlugin<AstroVirtualCode> {
	return {
		createVirtualCode(fileId, languageId, snapshot) {
			if (languageId === 'astro') {
				const fileName = fileId.includes('://')
					? URI.parse(fileId).fsPath.replace(/\\/g, '/')
					: fileId;
				return new AstroVirtualCode(fileName, snapshot);
			}
		},
		updateVirtualCode(_fileId, astroCode, snapshot) {
			astroCode.update(snapshot);
			return astroCode;
		},
		typescript: {
			extraFileExtensions: [{ extension: 'astro', isMixedContent: true, scriptKind: 7 }],
			getScript(astroCode) {
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
			getExtraScripts(fileName, astroCode) {
				const result: ExtraServiceScript[] = [];
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
			resolveLanguageServiceHost(host) {
				return {
					...host,
					getScriptFileNames() {
						const languageServerTypesDirectory = getLanguageServerTypesDir(ts);
						const fileNames = host.getScriptFileNames();
						const addedFileNames = [];

						if (astroInstall) {
							addedFileNames.push(
								...['./env.d.ts', './astro-jsx.d.ts'].map((filePath) =>
									ts.sys.resolvePath(path.resolve(astroInstall.path, filePath))
								)
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
										ts.sys.resolvePath(path.resolve(languageServerTypesDirectory, filePath))
									)
								);
							}
						} else {
							// If we don't have an Astro installation, add the fallback types from the language server.
							// See the README in packages/language-server/types for more information.
							addedFileNames.push(
								...['./env.d.ts', './astro-jsx.d.ts', './jsx-runtime-fallback.d.ts'].map((f) =>
									ts.sys.resolvePath(path.resolve(languageServerTypesDirectory, f))
								)
							);
						}

						return [...fileNames, ...addedFileNames];
					},
					getCompilationSettings() {
						const baseCompilationSettings = host.getCompilationSettings();
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
					},
				};
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
	scriptCodeIds!: string[];
	codegenStacks = [];

	constructor(
		public fileName: string,
		public snapshot: ts.IScriptSnapshot
	) {
		this.onSnapshotUpdated();
	}

	get hasCompilationErrors(): boolean {
		return this.compilerDiagnostics.filter((diag) => diag.severity === 1).length > 0;
	}

	public update(newSnapshot: ts.IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	onSnapshotUpdated() {
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
		this.compilerDiagnostics = [];

		const astroMetadata = getAstroMetadata(
			this.fileName,
			this.snapshot.getText(0, this.snapshot.getLength())
		);

		if (astroMetadata.diagnostics.length > 0) {
			this.compilerDiagnostics.push(...astroMetadata.diagnostics);
		}

		const { htmlDocument, virtualCode: htmlVirtualCode } = parseHTML(
			this.snapshot,
			astroMetadata.frontmatter.status === 'closed'
				? astroMetadata.frontmatter.position.end.offset
				: 0
		);
		this.htmlDocument = htmlDocument;

		const scriptTags = extractScriptTags(this.snapshot, htmlDocument, astroMetadata.ast);

		this.scriptCodeIds = scriptTags.map((scriptTag) => scriptTag.id);

		htmlVirtualCode.embeddedCodes.push(
			...extractStylesheets(this.snapshot, htmlDocument, astroMetadata.ast),
			...scriptTags
		);

		this.embeddedCodes = [];
		this.embeddedCodes.push(htmlVirtualCode);

		const tsx = astro2tsx(
			this.snapshot.getText(0, this.snapshot.getLength()),
			this.fileName,
			htmlDocument
		);

		this.astroMeta = { ...astroMetadata, tsxRanges: tsx.ranges };
		this.compilerDiagnostics.push(...tsx.diagnostics);
		this.embeddedCodes.push(tsx.virtualCode);
	}
}
