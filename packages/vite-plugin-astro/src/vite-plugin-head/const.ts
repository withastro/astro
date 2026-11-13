/**
 * A dev-only virtual module that exposes accumulated component metadata (containsHead, propagation)
 * as a serialized array that can be statically imported.
 *
 * This exists to serve environments that cannot do live module graph traversal at request time —
 * specifically the non-runnable dev environment (`core/environment/dev-nonrunnable.ts`), used by
 * adapters like Cloudflare that run requests through their own server runtime rather than Vite's
 * runner. That environment cannot call `getComponentMetadata()` (which requires a `ModuleLoader`),
 * so it imports this virtual module instead to get equivalent metadata.
 *
 * The runnable dev environment does NOT use this module; it calls `getComponentMetadata()`
 * directly, which traverses the live Vite module graph and produces more accurate per-request data.
 *
 * The virtual module is invalidated whenever metadata propagation runs (on transform, resolveId)
 * and on file add/unlink, ensuring it stays fresh during HMR.
 */
export const VIRTUAL_COMPONENT_METADATA = 'virtual:astro:component-metadata';
export const RESOLVED_VIRTUAL_COMPONENT_METADATA = `\0${VIRTUAL_COMPONENT_METADATA}`;
