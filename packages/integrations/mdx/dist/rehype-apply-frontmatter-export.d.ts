import type { Root } from 'hast';
import type { VFile } from 'vfile';
declare module 'vfile' {
	interface DataMap {
		applyFrontmatterExport?: {
			srcDir?: URL;
		};
	}
}
export declare function rehypeApplyFrontmatterExport(): (tree: Root, vfile: VFile) => void;
