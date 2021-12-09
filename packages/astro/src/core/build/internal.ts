import type { RenderedChunk } from 'rollup';

export interface BuildInternals {
  // Pure CSS chunks are chunks that only contain CSS.
  pureCSSChunks: Set<RenderedChunk>;
  // chunkToReferenceIdMap maps them to a hash id used to find the final file.
  chunkToReferenceIdMap: Map<string, string>;

  // This is a mapping of pathname to the string source of all collected
  // inline <style> for a page.
  astroStyleMap: Map<string, string>;
  // This is a virtual JS module that imports all dependent styles for a page.
  astroPageStyleMap: Map<string, string>;

  // A mapping to entrypoints (facadeId) to assets (styles) that are added.
  facadeIdToAssetsMap: Map<string, string[]>;
}

/**
 * Creates internal maps used to coordinate the CSS and HTML plugins.
 * @returns {BuildInternals}
 */
export function createBuildInternals(): BuildInternals {
  // Pure CSS chunks are chunks that only contain CSS.
  // This is all of them, and chunkToReferenceIdMap maps them to a hash id used to find the final file.
  const pureCSSChunks = new Set<RenderedChunk>();
  const chunkToReferenceIdMap = new Map<string, string>();

  // This is a mapping of pathname to the string source of all collected
  // inline <style> for a page.
  const astroStyleMap = new Map<string, string>();
  // This is a virtual JS module that imports all dependent styles for a page.
  const astroPageStyleMap = new Map<string, string>();

  // A mapping to entrypoints (facadeId) to assets (styles) that are added.
  const facadeIdToAssetsMap = new Map<string, string[]>();

  return {
    pureCSSChunks,
    chunkToReferenceIdMap,
    astroStyleMap,
    astroPageStyleMap,
    facadeIdToAssetsMap,
  };
}
