import { z } from 'zod';

export const cspAlgorithmSchema = z
	.enum(['SHA-512', 'SHA-384', 'SHA-256'])
	.optional()
	.default('SHA-256');

export type CspAlgorithm = z.infer<typeof cspAlgorithmSchema>;
