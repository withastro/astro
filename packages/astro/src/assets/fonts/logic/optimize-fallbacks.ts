import type { ResolvedFontFamily } from '../types.js';
import type { GetMetricsForFamilyFont } from '../utils.js';

export async function optimizeFallbacks({}: {
	family: Pick<ResolvedFontFamily, 'name' | 'nameWithHash'>;
	fallbacks: Array<string>;
	// TODO: type is pretty bad
	font: GetMetricsForFamilyFont | null;
}): Promise<null | {
	css: string;
	fallbacks: Array<string>;
}> {}
