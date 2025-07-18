export * as z from 'zod';
export { defineLiveCollection } from '../content/config.js';

function createErrorFunction(message: string) {
	return () => {
		const error = new Error(`The ${message}() function is not available in live config files.`);
		// Remove the virtual module path from the stack trace
		const stackLines = error.stack?.split('\n');
		if (stackLines && stackLines.length > 1) {
			stackLines.splice(1, 1);
			error.stack = stackLines.join('\n');
		}
		throw error;
	};
}

export const getCollection = createErrorFunction('getCollection');
export const render = createErrorFunction('render');
export const getEntry = createErrorFunction('getEntry');
export const getEntryBySlug = createErrorFunction('getEntryBySlug');
export const getDataEntryById = createErrorFunction('getDataEntryById');
export const getEntries = createErrorFunction('getEntries');
export const reference = createErrorFunction('reference');
export const getLiveCollection = createErrorFunction('getLiveCollection');
export const getLiveEntry = createErrorFunction('getLiveEntry');
export const defineCollection = createErrorFunction('defineCollection');
