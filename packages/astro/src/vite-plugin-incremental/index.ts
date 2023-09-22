import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { existsSync, readFileSync, mkdirSync, writeFileSync,  } from 'node:fs';

interface IncrementalOptions {
	settings: AstroSettings;
}

export interface IncrementalAPI {
	cache: Cache;
}

type RollupTransformCache = Map<string, vite.Rollup.SourceDescription>;

export function incremental(opts: IncrementalOptions): vite.Plugin {
	const { settings } = opts;
	// let target: 'server' | 'client' = 'server';
	const diskCache = new DiskCache(settings)
	let cache: RollupTransformCache = new Map();

	const plugin: vite.Plugin = {
		name: 'astro:incremental',
        apply: 'build',
		config(viteConfig) {
			diskCache.setTarget(!!viteConfig?.build?.ssr ? 'server' : 'client');
			cache = diskCache.read();
			if (cache.size > 0) {
				console.log(`Cache restored!`, cache.size);
			}
			viteConfig.build!.rollupOptions!.perf = true;
		},
		buildStart(options) {
			// Important! Skips any `transform` calls for modules in the cache
			options.plugins = options.plugins.map(v => memoizePlugin(v, cache));
		},
		moduleParsed(info) {
			const meta = info.meta ?? {};
			meta.cached = true;
			cache.set(info.id, {
				ast: info.ast!,
				code: info.code!,
				assertions: info.assertions,
				meta,
				moduleSideEffects: info.moduleSideEffects,
				syntheticNamedExports: info.syntheticNamedExports,
			})
		},
		load(id) {
			if (cache.has(id)) {
				const cached = cache.get(id)!;
				// const { code } = this.load({ id });
				// No match, eject from cache and skip
				// if (cached.code !== code) {
				// 	cache.delete(id);
				// 	return;
				// }
				return cached;
			}
		},
		buildEnd() {
			diskCache.write(cache);
		}
	}
	return plugin;
}

class DiskCache {
	#url: URL;
	#raw: RollupTransformCache | undefined;
	constructor(settings: AstroSettings) {
		this.#url = new URL(`./node_modules/.astro/build.cache.json`, settings.config.root);
	}
	setTarget(target: 'server' | 'client') {
		this.#url = new URL(`./build-${target}.cache.json`, this.#url);
	}
	read(): RollupTransformCache {
		if (this.#raw) return this.#raw;
		try {
			if (existsSync(this.#url)) {
				return new Map(JSON.parse(readFileSync(this.#url, { encoding: 'utf-8' })));
			}
		} catch {}
		return new Map()
	}
	write(value: RollupTransformCache) {
		this.#raw = value;
		mkdirSync(new URL('./', this.#url), { recursive: true });
		writeFileSync(this.#url, JSON.stringify(Array.from(value.entries())), { encoding: 'utf-8' });
	}
}

// function checksum(code: string) {
// 	return crypto.createHash('md5').update(code, 'utf-8').digest('hex');
// }

function memoizeHook<T extends (...args: any[]) => any>(original: T, override: (params: Parameters<T>, original: () => ReturnType<T>) => ReturnType<T>) {
	return new Proxy(original, {
		apply(target, thisArg, argArray) {
			return override(argArray as Parameters<T>, () => Reflect.apply(target, thisArg, argArray))
		}
	})
}

function memoizePlugin(plugin: vite.Plugin, cache: RollupTransformCache) {
	if (typeof plugin.transform === 'function') {
		plugin.transform = memoizeHook(plugin.transform, function load([_code, id], next) {
			if (cache.has(id)) return;
			return next();
		})
	}
	return plugin;
}
