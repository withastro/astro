import type { AstroConfig } from '../../@types/astro.js';
import { compile, type CompileProps, type CompileResult } from './compile.js';

type CompilationCache = Map<string, CompileResult>;

const configCache = new WeakMap<AstroConfig, CompilationCache>();

interface CachedFile { 
	timestamp: number;
	content: string;
}
const fileCache = new Map<string, CachedFile>;

export function getCachedFileContent(filename: string) {
	return fileCache.get(filename);
}

export function isCached(config: AstroConfig, filename: string) {
	return configCache.has(config) && configCache.get(config)!.has(filename);
}

export function getCachedCompileResult(
	config: AstroConfig,
	filename: string
): CompileResult | null {
	if (!isCached(config, filename)) return null;
	return configCache.get(config)!.get(filename)!;
}

export function invalidateCompilation(config: AstroConfig, filename: string) {
	if (configCache.has(config)) {
		const cache = configCache.get(config)!;
		cache.delete(filename);
	}
}

export async function cachedCompilation(props: CompileProps): Promise<CompileResult> {
	const { astroConfig, filename } = props;
	let cache: CompilationCache;
	if (!configCache.has(astroConfig)) {
		cache = new Map();
		configCache.set(astroConfig, cache);
	} else {
		cache = configCache.get(astroConfig)!;
	}
	if (cache.has(filename)) {
		return cache.get(filename)!;
	}
	fileCache.set(props.filename, { timestamp: Date.now(), content: props.source });
	const compileResult = await compile(props);
	cache.set(filename, compileResult);
	return compileResult;
}
