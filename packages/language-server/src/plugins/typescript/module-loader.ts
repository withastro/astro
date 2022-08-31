import type { DocumentSnapshot } from './snapshots/DocumentSnapshot';
import { getExtensionFromScriptKind, ensureRealFilePath, isVirtualFilePath } from './utils';
import { createAstroSys } from './astro-sys';
import { getLastPartOfPath } from '../../utils';
import type { ResolvedModule } from 'typescript';

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
	ts: typeof import('typescript/lib/tsserverlibrary')
) {
	const astroSys = createAstroSys(getSnapshot, ts);
	const moduleCache = new ModuleResolutionCache();

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

	function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModule | undefined> {
		return moduleNames.map((moduleName) => {
			if (moduleCache.has(moduleName, containingFile)) {
				return moduleCache.get(moduleName, containingFile);
			}

			const resolvedModule = resolveModuleName(moduleName, containingFile);
			moduleCache.set(moduleName, containingFile, resolvedModule);
			return resolvedModule;
		});
	}

	function resolveModuleName(name: string, containingFile: string): ts.ResolvedModule | undefined {
		// Delegate to the TS resolver first.
		// If that does not bring up anything, try the Astro Module loader
		// which is able to deal with .astro and other frameworks files.

		const tsResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, ts.sys).resolvedModule;
		if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName)) {
			return tsResolvedModule;
		}

		const astroResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, astroSys).resolvedModule;
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
