export type FilterPattern = readonly (string | RegExp)[] | string | RegExp | null;
export declare function createFilter(
	include?: FilterPattern,
	exclude?: FilterPattern,
): (id: string | unknown) => boolean;
