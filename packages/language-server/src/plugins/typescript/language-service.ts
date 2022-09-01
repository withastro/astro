import type { AstroDocument } from '../../core/documents';
import { dirname, resolve } from 'path';
import type { TextDocumentContentChangeEvent } from 'vscode-languageserver';
import { getAstroInstall, normalizePath, urlToPath } from '../../utils';
import { createAstroModuleLoader } from './module-loader';
import { GlobalSnapshotManager, SnapshotManager } from './snapshots/SnapshotManager';
import { ensureRealFilePath, findTsConfigPath, getScriptTagLanguage, isAstroFilePath } from './utils';
import { AstroSnapshot, DocumentSnapshot, ScriptTagDocumentSnapshot } from './snapshots/DocumentSnapshot';
import * as DocumentSnapshotUtils from './snapshots/utils';
import type { ConfigManager, LSTypescriptConfig } from '../../core/config';

export interface LanguageServiceContainer {
	readonly tsconfigPath: string;
	readonly compilerOptions: ts.CompilerOptions;
	/**
	 * @internal Public for tests only
	 */
	readonly snapshotManager: SnapshotManager;
	getService(): ts.LanguageService;
	updateSnapshot(
		documentOrFilePath: AstroDocument | string,
		ts: typeof import('typescript/lib/tsserverlibrary')
	): DocumentSnapshot;
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
	configManager: ConfigManager;
	ts: typeof import('typescript/lib/tsserverlibrary');
	tsLocalized: Record<string, string> | undefined;
}

export async function getLanguageService(
	path: string,
	workspaceUris: string[],
	docContext: LanguageServiceDocumentContext
): Promise<LanguageServiceContainer> {
	const tsconfigPath = findTsConfigPath(path, workspaceUris, docContext.ts);
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

	if (docContext.configManager.shouldRefreshTSServices) {
		services.clear();
		docContext.configManager.shouldRefreshTSServices = false;
	}

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
	const astroInstall = getAstroInstall([tsconfigRoot, workspacePath]);

	const config =
		(await docContext.configManager.getConfig<LSTypescriptConfig>('astro.typescript', workspacePath)) ?? {};
	const allowArbitraryAttrs = config.allowArbitraryAttributes ?? false;

	// `raw` here represent the tsconfig merged with any extended config
	const { compilerOptions, fileNames: files, raw: fullConfig } = getParsedTSConfig();

	let projectVersion = 0;

	const snapshotManager = new SnapshotManager(
		docContext.globalSnapshotManager,
		files,
		fullConfig,
		tsconfigRoot || process.cwd(),
		docContext.ts
	);

	const astroModuleLoader = createAstroModuleLoader(getScriptSnapshot, compilerOptions, docContext.ts);

	const scriptFileNames: string[] = [];

	if (astroInstall) {
		scriptFileNames.push(
			...['./env.d.ts', './astro-jsx.d.ts'].map((f) => docContext.ts.sys.resolvePath(resolve(astroInstall.path, f)))
		);
	}

	let languageServerDirectory: string;
	try {
		languageServerDirectory = dirname(require.resolve('@astrojs/language-server'));
	} catch (e) {
		languageServerDirectory = __dirname;
	}

	// Fallback to internal types when Astro is not installed or the Astro version is too old
	if (
		!astroInstall ||
		((astroInstall.version.major === 0 || astroInstall.version.full === '1.0.0-beta.0') &&
			!astroInstall.version.full.startsWith('0.0.0-rc-')) // 1.0.0's RC is considered to be 0.0.0, so we have to check for it
	) {
		scriptFileNames.push(
			...['../types/astro-jsx.d.ts', '../types/env.d.ts'].map((f) =>
				docContext.ts.sys.resolvePath(resolve(languageServerDirectory, f))
			)
		);

		console.warn("Couldn't load types from Astro, using internal types instead");
	}

	if (allowArbitraryAttrs) {
		const arbitraryAttrsDTS = docContext.ts.sys.resolvePath(
			resolve(languageServerDirectory, '../types/arbitrary-attrs.d.ts')
		);
		scriptFileNames.push(arbitraryAttrsDTS);
	}

	const host: ts.LanguageServiceHost = {
		getNewLine: () => docContext.ts.sys.newLine,
		useCaseSensitiveFileNames: () => docContext.ts.sys.useCaseSensitiveFileNames,
		getDirectories: docContext.ts.sys.getDirectories,
		resolveModuleNames: astroModuleLoader.resolveModuleNames,
		readFile: astroModuleLoader.readFile,
		fileExists: astroModuleLoader.fileExists,
		readDirectory: astroModuleLoader.readDirectory,

		getCompilationSettings: () => compilerOptions,
		getCurrentDirectory: () => tsconfigRoot,
		getDefaultLibFileName: docContext.ts.getDefaultLibFilePath,

		getProjectVersion: () => projectVersion.toString(),
		getScriptFileNames: () =>
			Array.from(
				new Set([...snapshotManager.getProjectFileNames(), ...snapshotManager.getFileNames(), ...scriptFileNames])
			),
		getScriptSnapshot,
		getScriptVersion: (fileName: string) => getScriptSnapshot(fileName).version.toString(),
	};

	if (docContext.tsLocalized) {
		host.getLocalizedDiagnosticMessages = () => docContext.tsLocalized;
	}

	let languageService = docContext.ts.createLanguageService(host);

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

		const newSnapshot = DocumentSnapshotUtils.createFromDocument(document, docContext.ts);

		snapshotManager.set(filePath, newSnapshot);

		const scriptTagSnapshots = createScriptTagsSnapshots(filePath, document);

		scriptTagSnapshots.forEach((snapshot) => {
			snapshotManager.set(snapshot.filePath, snapshot);
			newSnapshot.scriptTagSnapshots?.push(snapshot);
		});

		if (prevSnapshot && prevSnapshot.scriptKind !== newSnapshot.scriptKind) {
			// Restart language service as it doesn't handle script kind changes.
			languageService.dispose();
			languageService = docContext.ts.createLanguageService(host);
		}

		return newSnapshot;
	}

	function updateSnapshotFromFilePath(filePath: string): DocumentSnapshot {
		const prevSnapshot = snapshotManager.get(filePath);
		if (prevSnapshot) {
			return prevSnapshot;
		}

		astroModuleLoader.deleteUnresolvedResolutionsFromCache(filePath);
		const newSnapshot = DocumentSnapshotUtils.createFromFilePath(filePath, docContext.createDocument, docContext.ts);
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
		doc = DocumentSnapshotUtils.createFromFilePath(fileName, docContext.createDocument, docContext.ts);

		snapshotManager.set(fileName, doc);

		// If we needed to create an Astro snapshot, also create its script tags snapshots
		if (isAstroFilePath(fileName)) {
			const document = (doc as AstroSnapshot).parent;

			const scriptTagSnapshots = createScriptTagsSnapshots(fileName, document);

			scriptTagSnapshots.forEach((snapshot) => {
				snapshotManager.set(snapshot.filePath, snapshot);
				(doc as AstroSnapshot).scriptTagSnapshots?.push(snapshot);
			});
		}

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

	function createScriptTagsSnapshots(fileName: string, document: AstroDocument): ScriptTagDocumentSnapshot[] {
		return document.scriptTags.map((scriptTag, index) => {
			const scriptTagLanguage = getScriptTagLanguage(scriptTag);
			const scriptFilePath = fileName + `.__script${index}.${scriptTagLanguage}`;
			const scriptSnapshot = new ScriptTagDocumentSnapshot(scriptTag, document, scriptFilePath);

			return scriptSnapshot;
		});
	}

	function getParsedTSConfig() {
		let configJson =
			(tsconfigPath && docContext.ts.readConfigFile(tsconfigPath, docContext.ts.sys.readFile).config) || {};

		// Delete include so that .astro files don't get mistakenly excluded by the user
		delete configJson.include;

		// If the user supplied exclude, let's use theirs otherwise, use ours
		configJson.exclude ?? (configJson.exclude = getDefaultExclude());

		// Everything here will always, unconditionally, be in the resulting config
		const forcedCompilerOptions: ts.CompilerOptions = {
			noEmit: true,
			declaration: false,

			resolveJsonModule: true,
			allowSyntheticDefaultImports: true,
			allowNonTsExtensions: true,
			allowJs: true,
			jsx: docContext.ts.JsxEmit.Preserve,
			jsxImportSource: undefined,
			jsxFactory: 'astroHTML',
			module: docContext.ts.ModuleKind.ESNext,
			target: docContext.ts.ScriptTarget.ESNext,
			isolatedModules: true,
			moduleResolution: docContext.ts.ModuleResolutionKind.NodeJs,
		};

		const project = docContext.ts.parseJsonConfigFileContent(
			configJson,
			docContext.ts.sys,
			tsconfigRoot,
			forcedCompilerOptions,
			tsconfigPath,
			undefined,
			[
				{ extension: '.vue', isMixedContent: true, scriptKind: docContext.ts.ScriptKind.Deferred },
				{ extension: '.svelte', isMixedContent: true, scriptKind: docContext.ts.ScriptKind.Deferred },
				{ extension: '.astro', isMixedContent: true, scriptKind: docContext.ts.ScriptKind.Deferred },
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

function getDefaultExclude(): string[] {
	return ['dist', 'node_modules'];
}
