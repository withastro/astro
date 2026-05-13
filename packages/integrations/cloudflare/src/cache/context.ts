/**
 * TEMPORARY: Module-scoped execution context holder.
 *
 * This exists because `import { cache } from 'cloudflare:workers'` is not yet
 * available. Once it ships, delete this file and update provider.ts to import
 * `cache` directly from 'cloudflare:workers'.
 *
 * Workers are single-threaded, so a module-scoped reference is safe.
 */

let currentCtx: ExecutionContext | undefined;

// TODO: remove when `import { cache } from 'cloudflare:workers'` is available
export function setCurrentCtx(ctx: ExecutionContext): void {
	currentCtx = ctx;
}

// TODO: remove when `import { cache } from 'cloudflare:workers'` is available
export function getWorkerCache(): ExecutionContext['cache'] {
	return currentCtx?.cache;
}
