import type { ISizeCalculationResult } from './types/interface.ts';
/**
 * Return size information based on an Uint8Array
 *
 * @param {Uint8Array} input
 * @returns {ISizeCalculationResult}
 */
export declare function lookup(input: Uint8Array): ISizeCalculationResult;
