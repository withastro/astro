import { AstroError } from 'astro/errors';

export { defineDbIntegration } from './core/utils.js';
export { asDrizzleTable } from './runtime/index.js';

export class AstroDbError extends AstroError {
	name = 'Astro DB Error';
}
