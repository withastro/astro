import type { StringMatcher } from '../definitions.js';
export declare class LevenshteinStringMatcher implements StringMatcher {
	#private;
	getClosestMatch(target: string, candidates: Array<string>): string;
}
