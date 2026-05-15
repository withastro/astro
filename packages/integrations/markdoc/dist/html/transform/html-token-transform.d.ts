/** biome-ignore-all lint/correctness/noUnusedImports: not correctly detected because type isn't exported */
import type { Tokenizer } from '@markdoc/markdoc';
import type * as Token from 'markdown-it/lib/token';
export declare function htmlTokenTransform(tokenizer: Tokenizer, tokens: Token[]): Token[];
