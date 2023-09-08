/* eslint-disable @typescript-eslint/ban-types */
// Q: Why is this not in @types?
// A: `@types` is for types that are part of the public API. This is just a bunch of utilities we use throughout the codebase. (Mostly by Erika)

// Merge all the intersection of a type into one type. This is useful for making tooltips better in the editor for complex types
// Ex: The Image component props are a merge of all the properties that can be on an `img` tag and our props, in the editor
// this results in a very opaque type that just says `ImgAttributes & ImageComponentProps`. With this, all the props shows.
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

// Mark certain properties of a type as required. Think of it like "This type, with those specific properties required"
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Name is pretty self descriptive, but it removes the index signature of an object
export type OmitIndexSignature<ObjectType> = {
	[KeyType in keyof ObjectType as {} extends Record<KeyType, unknown>
		? never
		: KeyType]: ObjectType[KeyType];
};

// Similar to `keyof`, gets the type of all the values of an object
export type ValueOf<T> = T[keyof T];
