import type { PreloadData, PreloadFilter } from '../types.js';
export declare function filterPreloads(
	data: Array<PreloadData>,
	preload: PreloadFilter,
): Array<PreloadData> | null;
