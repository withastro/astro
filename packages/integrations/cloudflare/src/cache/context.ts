/**
 * TEMPORARY: Module-scoped execution context holder.
 *
 * This exists because `import { cache } from 'cloudflare:workers'` is not yet
 * available. Once it ships, delete this file and update provider.ts to import
 * `cache` directly from 'cloudflare:workers'.
 *
 * Workers are single-threaded, so a module-scoped reference is safe.
 */

interface CachePurgeOptions {
	tags?: string[];
	pathPrefixes?: string[];
	purgeEverything?: boolean;
}

export interface WorkerCache {
	purge(options: CachePurgeOptions): Promise<void>;
}

interface ExecutionContextWithCache extends ExecutionContext {
	cache?: WorkerCache;
}

let currentCtx: ExecutionContextWithCache | undefined;

// TODO: remove when `import { cache } from 'cloudflare:workers'` is available
export function setCurrentCtx(ctx: ExecutionContext): void {
	currentCtx = ctx as ExecutionContextWithCache;
}

// TODO: remove when `import { cache } from 'cloudflare:workers'` is available
export function getWorkerCache(): WorkerCache | undefined {
	return currentCtx?.cache;
}
