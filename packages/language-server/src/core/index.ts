import type { DiagnosticMessage, ParseResult } from '@astrojs/compiler/types';
import type { LanguagePlugin, VirtualFile } from '@volar/language-core';
import * as path from 'node:path';
import type ts from 'typescript/lib/tsserverlibrary';
import type { HTMLDocument } from 'vscode-html-languageservice';
import type { AstroInstall } from '../utils.js';
import { astro2tsx } from './astro2tsx';
import { FrontmatterStatus, getAstroMetadata } from './parseAstro';
import { extractStylesheets } from './parseCSS';
import { parseHTML } from './parseHTML';
import { extractScriptTags } from './parseJS.js';

export function getLanguageModule(
	astroInstall: AstroInstall | undefined,
	ts: typeof import('typescript')
): LanguagePlugin<AstroFile> {
	return {
		createVirtualFile(fileName, languageId, snapshot) {
			if (languageId === 'astro') {
				return new AstroFile(fileName, snapshot, ts);
			}
		},
		updateVirtualFile(astroFile, snapshot) {
			astroFile.update(snapshot);
		},
		typescript: {
			extraFileExtensions: [{ extension: 'astro', isMixedContent: true, scriptKind: 7 }],
			resolveSourceFileName(tsFileName) {
				const baseName = path.basename(tsFileName);
				if (baseName.indexOf('.astro.')) {
					return tsFileName.substring(0, tsFileName.lastIndexOf('.astro.') + '.astro'.length);
				}
			},
			resolveModuleName(moduleName, impliedNodeFormat) {
				if (
					impliedNodeFormat === ts.ModuleKind.ESNext &&
					(moduleName.endsWith('.astro') ||
						moduleName.endsWith('.vue') ||
						moduleName.endsWith('.svelte'))
				) {
					return `${moduleName}.js`;
				}
			},
			resolveLanguageServiceHost(host) {
				return {
					...host,
					getScriptFileNames() {
						const fileNames = host.getScriptFileNames();
						return [
							...fileNames,
							...(astroInstall
								? ['./env.d.ts', './astro-jsx.d.ts'].map((filePath) =>
										ts.sys.resolvePath(path.resolve(astroInstall.path, filePath))
								  )
								: []),
						];
					},
					getCompilationSettings() {
						const baseCompilationSettings = host.getCompilationSettings();
						return {
							...baseCompilationSettings,
							module: ts.ModuleKind.ESNext ?? 99,
							target: ts.ScriptTarget.ESNext ?? 99,
							jsx: ts.JsxEmit.Preserve ?? 1,
							jsxImportSource: undefined,
							jsxFactory: 'astroHTML',
							resolveJsonModule: true,
							allowJs: true,
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

export class AstroFile implements VirtualFile {
	fileName: string;
	languageId = 'astro';
	mappings!: VirtualFile['mappings'];
	embeddedFiles!: VirtualFile['embeddedFiles'];
	astroMeta!: ParseResult & { frontmatter: FrontmatterStatus };
	compilerDiagnostics!: DiagnosticMessage[];
	htmlDocument!: HTMLDocument;
	scriptFiles!: string[];
	codegenStacks = [];

	constructor(
		public sourceFileName: string,
		public snapshot: ts.IScriptSnapshot,
		private readonly ts: typeof import('typescript')
	) {
		this.fileName = sourceFileName;
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

		this.astroMeta = getAstroMetadata(
			this.fileName,
			this.snapshot.getText(0, this.snapshot.getLength())
		);

		if (this.astroMeta.diagnostics.length > 0) {
			this.compilerDiagnostics.push(...this.astroMeta.diagnostics);
		}

		const { htmlDocument, virtualFile: htmlVirtualFile } = parseHTML(
			this.fileName,
			this.snapshot,
			this.astroMeta.frontmatter.status === 'closed'
				? this.astroMeta.frontmatter.position.end.offset
				: 0
		);
		this.htmlDocument = htmlDocument;

		const scriptTags = extractScriptTags(
			this.fileName,
			this.snapshot,
			htmlDocument,
			this.astroMeta.ast
		);

		this.scriptFiles = scriptTags.map((scriptTag) => scriptTag.fileName);

		htmlVirtualFile.embeddedFiles.push(
			...extractStylesheets(this.fileName, this.snapshot, htmlDocument, this.astroMeta.ast),
			...scriptTags
		);

		this.embeddedFiles = [];
		this.embeddedFiles.push(htmlVirtualFile);

		const tsx = astro2tsx(
			this.snapshot.getText(0, this.snapshot.getLength()),
			this.fileName,
			this.ts,
			htmlDocument
		);

		this.compilerDiagnostics.push(...tsx.diagnostics);
		this.embeddedFiles.push(tsx.virtualFile);
	}
}
