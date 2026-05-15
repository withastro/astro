import { type CompletionItem } from '@volar/language-server';
import type { FrontmatterStatus } from '../../core/parseAstro.js';
export declare function getSnippetCompletions(frontmatter: FrontmatterStatus): CompletionItem[];
