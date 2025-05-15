import { z } from 'zod';

export const ALGORITHMS = {
	'SHA-256': 'sha256',
	'SHA-384': 'sha384',
	'SHA-512': 'sha512',
} as const;

export const ALGORITHM_VALUES = Object.values(ALGORITHMS);

export const cspAlgorithmSchema = z
	.enum(['SHA-512', 'SHA-384', 'SHA-256'])
	.optional()
	.default('SHA-256');

export type CspAlgorithm = keyof typeof ALGORITHMS;
