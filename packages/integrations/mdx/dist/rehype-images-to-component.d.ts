import type { Root } from 'hast';
import type { VFile } from 'vfile';
export declare const ASTRO_IMAGE_ELEMENT = 'astro-image';
export declare const ASTRO_IMAGE_IMPORT = '__AstroImage__';
export declare const USES_ASTRO_IMAGE_FLAG = '__usesAstroImage';
export declare function rehypeImageToComponent(): (tree: Root, file: VFile) => void;
