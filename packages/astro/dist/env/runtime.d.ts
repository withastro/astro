import { AstroError } from '../core/errors/index.js';
import type { ValidationResultInvalid } from './validators.js';
export { getEnvFieldType, validateEnvVariable } from './validators.js';
export type GetEnv = (key: string) => string | undefined;
type OnSetGetEnv = () => void;
export declare function setGetEnv(fn: GetEnv): void;
export declare function setOnSetGetEnv(fn: OnSetGetEnv): void;
export declare function getEnv(...args: Parameters<GetEnv>): string | undefined;
export declare function createInvalidVariablesError(
	key: string,
	type: string,
	result: ValidationResultInvalid,
): AstroError;
