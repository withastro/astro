import type { 
	ComponentInstance,
	GetStaticPathsResult
} from '../../@types/astro';
import type { LogOptions } from '../logger';
import { warn } from '../logger.js';

/** Throw error for deprecated/malformed APIs */
export function validateGetStaticPathsModule(mod: ComponentInstance) {
	if ((mod as any).createCollection) {
		throw new Error(`[createCollection] deprecated. Please use getStaticPaths() instead.`);
	}
	if (!mod.getStaticPaths) {
		throw new Error(`[getStaticPaths] getStaticPaths() function is required. Make sure that you \`export\` the function from your component.`);
	}
}

/** Throw error for malformed getStaticPaths() response */
export function validateGetStaticPathsResult(result: GetStaticPathsResult, logging: LogOptions) {
	if (!Array.isArray(result)) {
		throw new Error(`[getStaticPaths] invalid return value. Expected an array of path objects, but got \`${JSON.stringify(result)}\`.`);
	}
	result.forEach((pathObject) => {
		if (!pathObject.params) {
			warn(logging, 'getStaticPaths', `invalid path object. Expected an object with key \`params\`, but got \`${JSON.stringify(pathObject)}\`. Skipped.`);
			return;
		}
		for (const [key, val] of Object.entries(pathObject.params)) {
			if (!(typeof val === 'undefined' || typeof val === 'string')) {
				warn(logging, 'getStaticPaths', `invalid path param: ${key}. A string value was expected, but got \`${JSON.stringify(val)}\`.`);
			}
			if (val === '') {
				warn(logging, 'getStaticPaths', `invalid path param: ${key}. \`undefined\` expected for an optional param, but got empty string.`);
			}
		}
	});
}
