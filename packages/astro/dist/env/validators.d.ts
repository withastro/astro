import type { AstroConfig } from '../types/public/index.js';
import type { EnvFieldType } from './schema.js';
type ValidationResultValue = EnvFieldType['default'];
export type ValidationResultErrors = ['missing'] | ['type'] | Array<string>;
interface ValidationResultValid {
	ok: true;
	value: ValidationResultValue;
}
export interface ValidationResultInvalid {
	ok: false;
	errors: ValidationResultErrors;
}
type ValidationResult = ValidationResultValid | ValidationResultInvalid;
export declare function getEnvFieldType(options: EnvFieldType): string;
export declare function validateEnvVariable(
	value: string | undefined,
	options: EnvFieldType,
): ValidationResult;
/**
 * Validates that `vite.envPrefix` doesn't match any environment variables declared
 * with `access: "secret"` in `env.schema`. If it does, those secrets would be exposed
 * by Vite in client-side bundles via `import.meta.env`, completely bypassing the
 * `access: "secret"` protection.
 *
 * Throws an `AstroError` if conflicts are found.
 */
export declare function validateEnvPrefixAgainstSchema(config: AstroConfig): void;
export {};
