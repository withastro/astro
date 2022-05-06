import { AstroDocument } from '../../core/documents';
import { dirname, resolve } from 'path';
import ts from 'typescript';
import { TextDocumentContentChangeEvent } from 'vscode-languageserver';
import { AstroVersion, getUserAstroVersion, normalizePath, urlToPath } from '../../utils';
import { createAstroModuleLoader } from './module-loader';
import { GlobalSnapshotManager, SnapshotManager } from './snapshots/SnapshotManager';
import { ensureRealFilePath, findTsConfigPath } from './utils';
import { DocumentSnapshot, ScriptTagDocumentSnapshot } from './snapshots/DocumentSnapshot';
import * as DocumentSnapshotUtils from './snapshots/utils';

export interface LanguageServiceContainer {
	readonly tsconfigPath: string;
	readonly compilerOptions: ts.CompilerOptions;
	/**
	 * @internal Public for tests only
	 */
	readonly snapshotManager: SnapshotManager;
	getService(): ts.LanguageService;
	updateSnapshot(documentOrFilePath: AstroDocument | string): DocumentSnapshot;
	deleteSnapshot(filePath: string): void;
	updateProjectFiles(): void;
	updateNonAstroFile(fileName: string, changes?: TextDocumentContentChangeEvent[]): void;
	/**
	 * Checks if a file is present in the project.
	 * Unlike `fileBelongsToProject`, this doesn't run a file search on disk.
	 */
	hasFile(filePath: string): boolean;
	/**
	 * Careful, don't call often, or it will hurt performance.
	 */
	fileBelongsToProject(filePath: string): boolean;
}

const services = new Map<string, Promise<LanguageServiceContainer>>();

export interface LanguageServiceDocumentContext {
	createDocument: (fileName: string, content: string) => AstroDocument;
	globalSnapshotManager: GlobalSnapshotManager;
}

export async function getLanguageService(
	path: string,
	workspaceUris: string[],
	docContext: LanguageServiceDocumentContext
): Promise<LanguageServiceContainer> {
	const tsconfigPath = findTsConfigPath(path, workspaceUris);
	return getLanguageServiceForTsconfig(tsconfigPath, docContext, workspaceUris);
}

export async function forAllLanguageServices(cb: (service: LanguageServiceContainer) => any): Promise<void> {
	for (const service of services.values()) {
		cb(await service);
	}
}

/**
 * @param tsconfigPath has to be absolute
 * @param docContext
 */
export async function getLanguageServiceForTsconfig(
	tsconfigPath: string,
	docContext: LanguageServiceDocumentContext,
	workspaceUris: string[]
): Promise<LanguageServiceContainer> {
	let service: LanguageServiceContainer;
	if (services.has(tsconfigPath)) {
		service = await services.get(tsconfigPath)!;
	} else {
		const newService = createLanguageService(tsconfigPath, docContext, workspaceUris);
		services.set(tsconfigPath, newService);
		service = await newService;
	}

	return service;
}

async function createLanguageService(
	tsconfigPath: string,
	docContext: LanguageServiceDocumentContext,
	workspaceUris: string[]
) {
	const tsconfigRoot = tsconfigPath ? dirname(tsconfigPath) : process.cwd();

	const workspacePaths = workspaceUris.map((uri) => urlToPath(uri) as string);
	const workspacePath = workspacePaths.find((uri: string) => tsconfigRoot.startsWith(uri)) || workspacePaths[0];
	const astroVersion = getUserAstroVersion(workspacePath);

	// `raw` here represent the tsconfig merged with any extended config
	const { compilerOptions, fileNames: files, raw: fullConfig } = getParsedTSConfig();

	let projectVersion = 0;

	const snapshotManager = new SnapshotManager(
		docContext.globalSnapshotManager,
		files,
		fullConfig,
		tsconfigRoot || process.cwd()
	);

	const astroModuleLoader = createAstroModuleLoader(getScriptSnapshot, compilerOptions);

	const scriptFileNames: string[] = [];

	// Before Astro 1.0, JSX definitions were inside of the language-server instead of inside Astro
	// TODO: Remove this and astro-jsx.d.ts in types when we consider having support for Astro < 1.0 unnecessary
	if (astroVersion.major === 0 || astroVersion.full === '1.0.0-beta.0') {
		let languageServerDirectory: string;
		try {
			languageServerDirectory = dirname(require.resolve('@astrojs/language-server'));
		} catch (e) {
			languageServerDirectory = __dirname;
		}
		const astroTSXFile = ts.sys.resolvePath(resolve(languageServerDirectory, '../types/astro-jsx.d.ts'));
		scriptFileNames.push(astroTSXFile);

		console.warn("Version lower than 1.0 detected, using internal types instead of Astro's");
	}

	const host: ts.LanguageServiceHost = {
		getNewLine: () => ts.sys.newLine,
		useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
		getDirectories: ts.sys.getDirectories,
		resolveModuleNames: astroModuleLoader.resolveModuleNames,
		readFile: astroModuleLoader.readFile,
		fileExists: astroModuleLoader.fileExists,
		readDirectory: astroModuleLoader.readDirectory,

		getCompilationSettings: () => compilerOptions,
		getCurrentDirectory: () => tsconfigRoot,
		getDefaultLibFileName: ts.getDefaultLibFilePath,

		getProjectVersion: () => projectVersion.toString(),
		getScriptFileNames: () =>
			Array.from(
				new Set([...snapshotManager.getProjectFileNames(), ...snapshotManager.getFileNames(), ...scriptFileNames])
			),
		getScriptSnapshot,
		getScriptVersion: (fileName: string) => getScriptSnapshot(fileName).version.toString(),
	};

	let languageService = ts.createLanguageService(host);

	docContext.globalSnapshotManager.onChange(() => {
		projectVersion++;
	});

	return {
		tsconfigPath,
		compilerOptions,
		getService: () => languageService,
		updateSnapshot,
		deleteSnapshot,
		updateProjectFiles,
		updateNonAstroFile,
		hasFile,
		fileBelongsToProject,
		snapshotManager,
	};

	function deleteSnapshot(filePath: string): void {
		astroModuleLoader.deleteFromModuleCache(filePath);
		snapshotManager.delete(filePath);
	}

	function updateSnapshot(documentOrFilePath: AstroDocument | string): DocumentSnapshot {
		return typeof documentOrFilePath === 'string'
			? updateSnapshotFromFilePath(documentOrFilePath)
			: updateSnapshotFromDocument(documentOrFilePath);
	}

	function updateSnapshotFromDocument(document: AstroDocument): DocumentSnapshot {
		const filePath = document.getFilePath() || '';
		const prevSnapshot = snapshotManager.get(filePath);
		if (prevSnapshot?.version === document.version) {
			return prevSnapshot;
		}

		if (!prevSnapshot) {
			astroModuleLoader.deleteUnresolvedResolutionsFromCache(filePath);
		}

		const newSnapshot = DocumentSnapshotUtils.createFromDocument(document);

		snapshotManager.set(filePath, newSnapshot);

		document.scriptTags.forEach((scriptTag, index) => {
			const scriptFilePath = filePath + `.__script${index}.js`;
			const scriptSnapshot = new ScriptTagDocumentSnapshot(scriptTag, document, scriptFilePath);
			snapshotManager.set(scriptFilePath, scriptSnapshot);

			newSnapshot.scriptTagSnapshots?.push(scriptSnapshot);
		});

		if (prevSnapshot && prevSnapshot.scriptKind !== newSnapshot.scriptKind) {
			// Restart language service as it doesn't handle script kind changes.
			languageService.dispose();
			languageService = ts.createLanguageService(host);
		}

		return newSnapshot;
	}

	function updateSnapshotFromFilePath(filePath: string): DocumentSnapshot {
		const prevSnapshot = snapshotManager.get(filePath);
		if (prevSnapshot) {
			return prevSnapshot;
		}

		astroModuleLoader.deleteUnresolvedResolutionsFromCache(filePath);
		const newSnapshot = DocumentSnapshotUtils.createFromFilePath(filePath, docContext.createDocument);
		snapshotManager.set(filePath, newSnapshot);
		return newSnapshot;
	}

	function getScriptSnapshot(fileName: string): DocumentSnapshot {
		fileName = ensureRealFilePath(fileName);

		let doc = snapshotManager.get(fileName);
		if (doc) {
			return doc;
		}

		astroModuleLoader.deleteUnresolvedResolutionsFromCache(fileName);
		doc = DocumentSnapshotUtils.createFromFilePath(fileName, docContext.createDocument);
		snapshotManager.set(fileName, doc);

		return doc;
	}

	function updateProjectFiles(): void {
		projectVersion++;
		snapshotManager.updateProjectFiles();
	}

	function hasFile(filePath: string): boolean {
		return snapshotManager.has(filePath);
	}

	function fileBelongsToProject(filePath: string): boolean {
		filePath = normalizePath(filePath);
		return hasFile(filePath) || getParsedTSConfig().fileNames.includes(filePath);
	}

	function updateNonAstroFile(fileName: string, changes?: TextDocumentContentChangeEvent[]): void {
		if (!snapshotManager.has(fileName)) {
			astroModuleLoader.deleteUnresolvedResolutionsFromCache(fileName);
		}
		snapshotManager.updateNonAstroFile(fileName, changes);
	}

	function getParsedTSConfig() {
		let configJson = (tsconfigPath && ts.readConfigFile(tsconfigPath, ts.sys.readFile).config) || {};

		// If our user has types in their config but it doesn't include the types needed for Astro, add them to the config
		if (configJson.compilerOptions?.types) {
			if (!configJson.compilerOptions?.types.includes('astro/env')) {
				configJson.compilerOptions.types.push('astro/env');
			}

			if (
				astroVersion.major >= 1 &&
				astroVersion.full !== '1.0.0-beta.0' &&
				!configJson.compilerOptions?.types.includes('astro/astro-jsx')
			) {
				configJson.compilerOptions.types.push('astro/astro-jsx');
			}
		}

		configJson.compilerOptions = Object.assign(getDefaultCompilerOptions(astroVersion), configJson.compilerOptions);

		// Delete include so that .astro files don't get mistakenly excluded by the user
		delete configJson.include;

		// If the user supplied exclude, let's use theirs otherwise, use ours
		configJson.exclude ?? (configJson.exclude = getDefaultExclude());

		// Everything here will always, unconditionally, be in the resulting config
		const forcedCompilerOptions: ts.CompilerOptions = {
			noEmit: true,
			declaration: false,

			allowNonTsExtensions: true,
			allowJs: true,
			jsx: ts.JsxEmit.Preserve,
			jsxImportSource: undefined,
			jsxFactory: 'astroHTML',
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ESNext,
			isolatedModules: true,
			moduleResolution: ts.ModuleResolutionKind.NodeJs,
		};

		const project = ts.parseJsonConfigFileContent(
			configJson,
			ts.sys,
			tsconfigRoot,
			forcedCompilerOptions,
			tsconfigPath,
			undefined,
			[
				{ extension: '.vue', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
				{ extension: '.svelte', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
				{ extension: '.astro', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
			]
		);

		return {
			...project,
			fileNames: project.fileNames.map(normalizePath),
			compilerOptions: {
				...project.options,
				...forcedCompilerOptions,
			},
		};
	}
}

/**
 * Default configuration used as a base and when the user doesn't have any
 */
function getDefaultCompilerOptions(astroVersion: AstroVersion): ts.CompilerOptions {
	const types = ['astro/env'];

	if (astroVersion.major >= 1 && astroVersion.full !== '1.0.0-beta.0') {
		types.push('astro/astro-jsx');
	}

	return {
		maxNodeModuleJsDepth: 2,
		allowSyntheticDefaultImports: true,
		types: types,
	};
}

function getDefaultExclude() {
	return ['dist', 'node_modules'];
}
