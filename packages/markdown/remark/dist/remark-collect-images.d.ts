import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import type { AstroMarkdownProcessorOptions } from './types.js';
export declare function remarkCollectImages(
	opts: AstroMarkdownProcessorOptions['image'],
): (tree: Root, vfile: VFile) => void;
