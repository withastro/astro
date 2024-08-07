// Copy of `yargs-parser` `Arguments` type. We don't use `yargs-parser`
// in runtime anymore, but our exposed API still relies on this shape.
export interface YargsArguments {
	_: Array<string | number>;
	'--'?: Array<string | number>;
	[argName: string]: any;
}
