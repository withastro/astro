import type { ValidationResultErrors } from './validators.js';
export interface InvalidVariable {
	key: string;
	type: string;
	errors: ValidationResultErrors;
}
export declare function invalidVariablesToError(invalid: Array<InvalidVariable>): string[];
