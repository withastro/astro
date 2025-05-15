import { z } from 'zod';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (
	arg: infer I,
) => void
	? I
	: never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (
	_: never,
) => infer W
	? [...UnionToTuple<Exclude<T, W>>, W]
	: [];

const ALGORITHMS = {
	'SHA-256': 'sha256-',
	'SHA-384': 'sha384-',
	'SHA-512': 'sha512-',
} as const;

type Algorithms = typeof ALGORITHMS;

export type CspAlgorithm = keyof Algorithms;
export type CspAlgorithmValue = Algorithms[keyof Algorithms];

export const ALGORITHM_VALUES = Object.values(ALGORITHMS) as UnionToTuple<CspAlgorithmValue>;

export const cspAlgorithmSchema = z
	.enum(Object.keys(ALGORITHMS) as UnionToTuple<CspAlgorithm>)
	.optional()
	.default('SHA-256');
