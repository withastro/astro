import * as z from 'zod/v4';
import { defineLiveCollection } from '../content/config.js';
function createErrorFunction(message) {
	return () => {
		const error = new Error(`The ${message}() function is not available in live config files.`);
		const stackLines = error.stack?.split('\n');
		if (stackLines && stackLines.length > 1) {
			stackLines.splice(1, 1);
			error.stack = stackLines.join('\n');
		}
		throw error;
	};
}
const getCollection = createErrorFunction('getCollection');
const render = createErrorFunction('render');
const getEntry = createErrorFunction('getEntry');
const getEntries = createErrorFunction('getEntries');
const reference = createErrorFunction('reference');
const getLiveCollection = createErrorFunction('getLiveCollection');
const getLiveEntry = createErrorFunction('getLiveEntry');
const defineCollection = createErrorFunction('defineCollection');
export {
	defineCollection,
	defineLiveCollection,
	getCollection,
	getEntries,
	getEntry,
	getLiveCollection,
	getLiveEntry,
	reference,
	render,
	z,
};
