export declare function transform(
	code: string,
	id: string,
): Promise<{
	code: string;
	map: import('magic-string').SourceMap;
}>;
