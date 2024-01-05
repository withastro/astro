import type { DiagnosticMessage } from '@astrojs/compiler/types';
import {
	FileCapabilities,
	FileKind,
	FileRangeCapabilities,
	type Language,
	type VirtualFile,
} from '@volar/language-core';
import * as path from 'node:path';
import type ts from 'typescript/lib/tsserverlibrary';
import type { HTMLDocument } from 'vscode-html-languageservice';
import type { AstroInstall } from '../utils.js';
import { astro2tsx } from './astro2tsx';
import { AstroMetadata, getAstroMetadata } from './parseAstro';
import { extractStylesheets } from './parseCSS';
import { parseHTML } from './parseHTML';
import { extractScriptTags } from './parseJS.js';

export function getLanguageModule(
	astroInstall: AstroInstall | undefined,
	ts: typeof import('typescript/lib/tsserverlibrary.js')
): Language<AstroFile> {
	return {
		createVirtualFile(fileName, snapshot) {
			if (fileName.endsWith('.astro')) {
				return new AstroFile(fileName, snapshot, ts);
			}
		},
		updateVirtualFile(astroFile, snapshot) {
			astroFile.update(snapshot);
		},
		resolveHost(host) {
			return {
				...host,
				resolveModuleName(moduleName, impliedNodeFormat) {
					if (
						impliedNodeFormat === ts.ModuleKind.ESNext &&
						(moduleName.endsWith('.astro') ||
							moduleName.endsWith('.vue') ||
							moduleName.endsWith('.svelte'))
					) {
						return `${moduleName}.js`;
					}
					return host.resolveModuleName?.(moduleName, impliedNodeFormat) ?? moduleName;
				},
				getScriptFileNames() {
					let languageServerDirectory: string;
					try {
						languageServerDirectory = path.dirname(require.resolve('@astrojs/language-server'));
					} catch (e) {
						languageServerDirectory = __dirname;
					}

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
							astroInstall.version.major >= 4 &&
							(astroInstall.version.minor > 0 || astroInstall.version.patch >= 8)
						) {
							addedFileNames.push(
								...['../jsx-runtime-augment.d.ts'].map((filePath) =>
									ts.sys.resolvePath(path.resolve(languageServerDirectory, filePath))
								)
							);
						}
					} else {
						// If we don't have an Astro installation, add the fallback types from the language server.
						// See the README in packages/language-server/types for more information.
						addedFileNames.push(
							...[
								'../types/env.d.ts',
								'../types/astro-jsx.d.ts',
								'../types/jsx-runtime-fallback.d.ts',
							].map((f) => ts.sys.resolvePath(path.resolve(languageServerDirectory, f)))
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
	};
}

export class AstroFile implements VirtualFile {
	kind = FileKind.TextFile;
	capabilities = FileCapabilities.full;

	fileName: string;
	mappings!: VirtualFile['mappings'];
	embeddedFiles!: VirtualFile['embeddedFiles'];
	astroMeta!: AstroMetadata;
	compilerDiagnostics!: DiagnosticMessage[];
	htmlDocument!: HTMLDocument;
	scriptFiles!: string[];
	codegenStacks = [];

	constructor(
		public sourceFileName: string,
		public snapshot: ts.IScriptSnapshot,
		private readonly ts: typeof import('typescript/lib/tsserverlibrary.js')
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
				sourceRange: [0, this.snapshot.getLength()],
				generatedRange: [0, this.snapshot.getLength()],
				data: FileRangeCapabilities.full,
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

		const { htmlDocument, virtualFile: htmlVirtualFile } = parseHTML(
			this.fileName,
			this.snapshot,
			astroMetadata.frontmatter.status === 'closed'
				? astroMetadata.frontmatter.position.end.offset
				: 0
		);
		this.htmlDocument = htmlDocument;

		const scriptTags = extractScriptTags(
			this.fileName,
			this.snapshot,
			htmlDocument,
			astroMetadata.ast
		);

		this.scriptFiles = scriptTags.map((scriptTag) => scriptTag.fileName);

		htmlVirtualFile.embeddedFiles.push(
			...extractStylesheets(this.fileName, this.snapshot, htmlDocument, astroMetadata.ast),
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

		this.astroMeta = { ...astroMetadata, tsxRanges: tsx.ranges };
		this.compilerDiagnostics.push(...tsx.diagnostics);
		this.embeddedFiles.push(tsx.virtualFile);
	}
}
