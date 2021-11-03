import type { ScriptInfo } from './astro-core';

/** Entire output of `astro build`, stored in memory */
export interface BuildOutput {
  [dist: string]: BuildFile;
}

export interface BuildFile {
  /** The original location. Needed for code frame errors. */
  srcPath: URL;
  /** File contents */
  contents: string | Buffer;
  /** File content type (to determine encoding, etc) */
  contentType: string;
  /** Encoding */
  encoding?: 'utf8';
  /** Extracted scripts */
  hoistedScripts?: ScriptInfo[];
}

/** Mapping of every URL and its required assets. All URLs are absolute relative to the project. */
export type BundleMap = {
  [pageUrl: string]: PageDependencies;
};

export interface PageDependencies {
  /** JavaScript files needed for page. No distinction between blocking/non-blocking or sync/async. */
  js: Set<string>;
  /** CSS needed for page, whether imported via <link>, JS, or Astro component. */
  css: Set<string>;
  /** Images needed for page. Can be loaded via CSS, <link>, or otherwise. */
  images: Set<string>;
  /** Async hoisted Javascript */
  hoistedJS: Map<string, ScriptInfo>;
}