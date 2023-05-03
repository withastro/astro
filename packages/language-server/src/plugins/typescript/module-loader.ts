import type ts from 'typescript';
import type { ResolvedModule } from 'typescript';
import { getLastPartOfPath } from '../../utils';
import { createAstroSys } from './astro-sys';
import type { DocumentSnapshot } from './snapshots/DocumentSnapshot';
import {
	ensureRealFilePath,
	getExtensionFromScriptKind,
	isAstroFilePath,
	isFrameworkFilePath,
	isVirtualFilePath,
	toVirtualFilePath,
} from './utils';

/**
 * Caches resolved modules.
 */
class ModuleResolutionCache {
	private cache = new Map<string, ResolvedModule | undefined>();

	/**
	 * Tries to get a cached module.
	 */
	get(moduleName: string, containingFile: string): ResolvedModule | undefined {
		return this.cache.get(this.getKey(moduleName, containingFile));
	}

	/**
	 * Checks if has cached module.
	 */
	has(moduleName: string, containingFile: string): boolean {
		return this.cache.has(this.getKey(moduleName, containingFile));
	}

	/**
	 * Caches resolved module (or undefined).
	 */
	set(moduleName: string, containingFile: string, resolvedModule: ResolvedModule | undefined) {
		this.cache.set(this.getKey(moduleName, containingFile), resolvedModule);
	}

	/**
	 * Deletes module from cache. Call this if a file was deleted.
	 * @param resolvedModuleName full path of the module
	 */
	delete(resolvedModuleName: string): void {
		this.cache.forEach((val, key) => {
			if (val?.resolvedFileName === resolvedModuleName) {
				this.cache.delete(key);
			}
		});
	}

	/**
	 * Deletes everything from cache that resolved to `undefined`
	 * and which might match the path.
	 */
	deleteUnresolvedResolutionsFromCache(path: string): void {
		const fileNameWithoutEnding = getLastPartOfPath(path).split('.').shift() || '';
		this.cache.forEach((val, key) => {
			const moduleName = key.split(':::').pop() || '';
			if (!val && moduleName.includes(fileNameWithoutEnding)) {
				this.cache.delete(key);
			}
		});
	}

	private getKey(moduleName: string, containingFile: string) {
		return containingFile + ':::' + ensureRealFilePath(moduleName);
	}
}

class ImpliedNodeFormatResolver {
	private alreadyResolved = new Map<string, ReturnType<typeof this.ts.getModeForResolutionAtIndex>>();

	constructor(private readonly ts: typeof import('typescript/lib/tsserverlibrary')) {}

	resolve(
		importPath: string,
		importIdxInFile: number,
		sourceFile: ts.SourceFile | undefined,
		compilerOptions: ts.CompilerOptions
	) {
		// For Astro & Framework imports, we have to fallback to the old resolution algorithm or it doesn't work
		if (isAstroFilePath(importPath) || isFrameworkFilePath(importPath)) {
			return undefined;
		}

		let mode = undefined;
		if (sourceFile) {
			if (
				!sourceFile.impliedNodeFormat &&
				(isAstroFilePath(sourceFile.fileName) || isFrameworkFilePath(sourceFile.fileName))
			) {
				// impliedNodeFormat is not set for non-TS files, because the TS function which calculates this works with a
				// fixed set of extensions that does not include frameworks files
				if (!this.alreadyResolved.has(sourceFile.fileName)) {
					sourceFile.impliedNodeFormat = this.ts.getImpliedNodeFormatForFile(
						toVirtualFilePath(sourceFile.fileName) as any,
						undefined,
						this.ts.sys,
						compilerOptions
					);
					this.alreadyResolved.set(sourceFile.fileName, sourceFile.impliedNodeFormat);
				} else {
					sourceFile.impliedNodeFormat = this.alreadyResolved.get(sourceFile.fileName);
				}
			}
			mode = this.ts.getModeForResolutionAtIndex(sourceFile, importIdxInFile);
		}
		return mode;
	}
}

/**
 * Creates a module loader specifically for `.astro` and other frameworks files.
 *
 * The typescript language service tries to look up other files that are referenced in the currently open astro file.
 * For `.ts`/`.js` files this works, for `.astro` and frameworks files it does not by default.
 * Reason: The typescript language service does not know about those file endings,
 * so it assumes it's a normal typescript file and searches for files like `../Component.astro.ts`, which is wrong.
 * In order to fix this, we need to wrap typescript's module resolution and reroute all `.astro.ts` file lookups to .astro.
 *
 * @param getSnapshot A function which returns a (in case of astro file fully preprocessed) typescript/javascript snapshot
 * @param compilerOptions The typescript compiler options
 */
export function createAstroModuleLoader(
	getSnapshot: (fileName: string) => DocumentSnapshot,
	compilerOptions: ts.CompilerOptions,
	ts: typeof import('typescript/lib/tsserverlibrary'),
	/* For tests */
	tsResolveModuleName?: typeof ts.resolveModuleName
) {
	const astroSys = createAstroSys(getSnapshot, ts);
	const tsResolver = tsResolveModuleName ? tsResolveModuleName : ts.resolveModuleName;
	const moduleCache = new ModuleResolutionCache();
	const impliedNodeFormatResolver = new ImpliedNodeFormatResolver(ts);

	return {
		fileExists: astroSys.fileExists,
		readFile: astroSys.readFile,
		readDirectory: astroSys.readDirectory,
		deleteFromModuleCache: (path: string) => {
			astroSys.deleteFromCache(path);
			moduleCache.delete(path);
		},
		deleteUnresolvedResolutionsFromCache: (path: string) => {
			astroSys.deleteFromCache(path);
			moduleCache.deleteUnresolvedResolutionsFromCache(path);
		},
		resolveModuleNames,
	};

	function resolveModuleNames(
		moduleNames: string[],
		containingFile: string,
		_reusedNames: string[] | undefined,
		_redirectedReference: ts.ResolvedProjectReference | undefined,
		_options: ts.CompilerOptions,
		containingSourceFile?: ts.SourceFile | undefined
	): Array<ts.ResolvedModule | undefined> {
		return moduleNames.map((moduleName, index) => {
			if (moduleCache.has(moduleName, containingFile)) {
				return moduleCache.get(moduleName, containingFile);
			}

			const resolvedModule = resolveModuleName(moduleName, containingFile, containingSourceFile, index);
			moduleCache.set(moduleName, containingFile, resolvedModule);
			return resolvedModule;
		});
	}

	function resolveModuleName(
		name: string,
		containingFile: string,
		containingSourceFile: ts.SourceFile | undefined,
		index: number
	): ts.ResolvedModule | undefined {
		const mode = impliedNodeFormatResolver.resolve(name, index, containingSourceFile, compilerOptions);

		// Delegate to the TS resolver first.
		// If that does not bring up anything, try the Astro Module loader
		// which is able to deal with .astro and other frameworks files.
		const tsResolvedModule = tsResolver(
			name,
			containingFile,
			compilerOptions,
			ts.sys,
			undefined,
			undefined,
			mode
		).resolvedModule;
		if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName)) {
			return tsResolvedModule;
		}

		const astroResolvedModule = tsResolver(
			name,
			containingFile,
			compilerOptions,
			astroSys,
			undefined,
			undefined,
			mode
		).resolvedModule;
		if (!astroResolvedModule || !isVirtualFilePath(astroResolvedModule.resolvedFileName)) {
			return astroResolvedModule;
		}

		const resolvedFileName = ensureRealFilePath(astroResolvedModule.resolvedFileName);
		const snapshot = getSnapshot(resolvedFileName);

		const resolvedAstroModule: ts.ResolvedModuleFull = {
			extension: getExtensionFromScriptKind(snapshot && snapshot.scriptKind, ts),
			resolvedFileName,
			isExternalLibraryImport: astroResolvedModule.isExternalLibraryImport,
		};
		return resolvedAstroModule;
	}
}
