import type { SSRManifest } from '../app/types.js';

// This module is the NON-VITE fallback for the '#astro-internal/ambient-manifest'
// specifier (mapped here by the package.json `imports` field). In every
// Vite-processed server environment the serialized-manifest plugin resolves that
// specifier to `virtual:astro:manifest` instead, so this file is never loaded
// there. In plain Node (unit tests, embedders) the ambient manifest is simply
// absent until `setAmbientManifest()` registers one.
export const manifest: SSRManifest | undefined = undefined;
