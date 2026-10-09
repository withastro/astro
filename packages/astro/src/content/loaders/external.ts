import type { ExternalLoaderContext, LoaderContext } from './types.js';

/**
 * Returns `true` when a loader runs for a collection defined with `storage: 'external'`.
 * In that case, the methods of `context.store` and `context.meta` return promises.
 *
 * The following loader saves the same entry in both kinds of collections:
 *
 * ```ts
 * import { isExternalLoaderContext, type ExternalStorageLoader } from 'astro/loaders';
 *
 * export const loader: ExternalStorageLoader = {
 *   name: 'my-loader',
 *   supportsExternalStorage: true,
 *   async load(context) {
 *     const entry = { id: 'hello', data: { title: 'Hello' } };
 *     if (isExternalLoaderContext(context)) {
 *       await context.store.set(entry);
 *     } else {
 *       context.store.set(entry);
 *     }
 *   },
 * };
 * ```
 */
export function isExternalLoaderContext(
	context: LoaderContext | ExternalLoaderContext,
): context is ExternalLoaderContext {
	return 'storage' in context && context.storage === 'external';
}
