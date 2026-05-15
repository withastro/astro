export type Simplify<T> = {
	[KeyType in keyof T]: T[KeyType];
} & {};
export type WithRequired<T, K extends keyof T> = T & {
	[P in K]-?: T[P];
};
export type OmitIndexSignature<ObjectType> = {
	[KeyType in keyof ObjectType as object extends Record<KeyType, unknown>
		? never
		: KeyType]: ObjectType[KeyType];
};
export type OmitPreservingIndexSignature<T, K extends PropertyKey> = {
	[P in keyof T as Exclude<P, K>]: T[P];
};
export type ValueOf<T> = T[keyof T];
export type MapValue<T> = T extends Map<any, infer V> ? V : never;
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? DeepPartial<U>[]
		: T[P] extends object | undefined
			? DeepPartial<T[P]>
			: T[P];
};
