import type ts from 'typescript/lib/tsserverlibrary';
import type { AstroSnapshotManager } from './astro-snapshots.js';
import { createAstroSys } from './astro-sys.js';
import type { Logger } from './logger.js';
import { ensureRealAstroFilePath, isVirtualAstroFilePath } from './utils.js';

/**
 * Caches resolved modules.
 */
class ModuleResolutionCache {
	private cache = new Map<string, ts.ResolvedModule>();

	/**
	 * Tries to get a cached module.
	 */
	get(moduleName: string, containingFile: string): ts.ResolvedModule | undefined {
		return this.cache.get(this.getKey(moduleName, containingFile));
	}

	/**
	 * Caches resolved module, if it is not undefined.
	 */
	set(moduleName: string, containingFile: string, resolvedModule: ts.ResolvedModule | undefined) {
		if (!resolvedModule) {
			return;
		}
		this.cache.set(this.getKey(moduleName, containingFile), resolvedModule);
	}

	/**
	 * Deletes module from cache. Call this if a file was deleted.
	 * @param resolvedModuleName full path of the module
	 */
	delete(resolvedModuleName: string): void {
		this.cache.forEach((val, key) => {
			if (val.resolvedFileName === resolvedModuleName) {
				this.cache.delete(key);
			}
		});
	}

	private getKey(moduleName: string, containingFile: string) {
		return containingFile + ':::' + ensureRealAstroFilePath(moduleName);
	}
}

/**
 * Creates a module loader than can also resolve `.astro` files.
 *
 * The typescript language service tries to look up other files that are referenced in the currently open astro file.
 * For `.ts`/`.js` files this works, for `.astro` files it does not by default.
 * Reason: The typescript language service does not know about the `.astro` file ending,
 * so it assumes it's a normal typescript file and searches for files like `../Component.astro.ts`, which is wrong.
 * In order to fix this, we need to wrap typescript's module resolution and reroute all `.astro.ts` file lookups to .astro.
 */
export function patchModuleLoader(
	logger: Logger,
	snapshotManager: AstroSnapshotManager,
	typescript: typeof ts,
	lsHost: ts.LanguageServiceHost,
	project: ts.server.Project
): void {
	const astroSys = createAstroSys(logger);
	const moduleCache = new ModuleResolutionCache();
	const origResolveModuleNames = lsHost.resolveModuleNames?.bind(lsHost);

	lsHost.resolveModuleNames = resolveModuleNames;

	const origRemoveFile = project.removeFile.bind(project);
	project.removeFile = (info, fileExists, detachFromProject) => {
		logger.log('File is being removed. Delete from cache: ', info.fileName);
		moduleCache.delete(info.fileName);
		return origRemoveFile(info, fileExists, detachFromProject);
	};

	// Patch readDirectory so we get completions for .astro files
	const origReadDirectory = project.readDirectory.bind(project);
	project.readDirectory = (path, extensions, exclude, include, depth) => {
		const extensionsWithAstro = (extensions ?? []).concat('.astro', '.md', '.mdx');
		return origReadDirectory(path, extensionsWithAstro, exclude, include, depth);
	};

	function resolveModuleNames(
		moduleNames: string[],
		containingFile: string,
		reusedNames: string[] | undefined,
		redirectedReference: ts.ResolvedProjectReference | undefined,
		compilerOptions: ts.CompilerOptions
	): Array<ts.ResolvedModule | undefined> {
		// logger.log('Resolving modules names for ' + containingFile);

		// Try resolving all module names with the original method first.
		// The ones that are undefined will be re-checked if they are a
		// astro file and if so, are resolved, too. This way we can defer
		// all module resolving logic except for astro files to TypeScript.
		const resolved =
			origResolveModuleNames?.(moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions) ||
			Array.from<undefined>(Array(moduleNames.length));

		return resolved.map((moduleName, idx) => {
			const fileName = moduleNames[idx];
			if (moduleName || !ensureRealAstroFilePath(fileName).endsWith('.astro')) {
				return moduleName;
			}

			const cachedModule = moduleCache.get(fileName, containingFile);
			if (cachedModule) {
				return cachedModule;
			}

			const resolvedModule = resolveModuleName(fileName, containingFile, compilerOptions);
			moduleCache.set(fileName, containingFile, resolvedModule);
			return resolvedModule;
		});
	}

	function resolveModuleName(
		name: string,
		containingFile: string,
		compilerOptions: ts.CompilerOptions
	): ts.ResolvedModule | undefined {
		const astroResolvedModule = typescript.resolveModuleName(
			name,
			containingFile,
			compilerOptions,
			astroSys
		).resolvedModule;
		if (!astroResolvedModule || !isVirtualAstroFilePath(astroResolvedModule.resolvedFileName)) {
			return astroResolvedModule;
		}

		const resolvedFileName = ensureRealAstroFilePath(astroResolvedModule.resolvedFileName);
		logger.log('Resolved', name, 'to astro file', resolvedFileName);
		const snapshot = snapshotManager.create(resolvedFileName);
		if (!snapshot) {
			return undefined;
		}

		const resolvedAstroModule: ts.ResolvedModuleFull = {
			extension: typescript.Extension.Tsx,
			resolvedFileName,
		};
		return resolvedAstroModule;
	}
}
