import type { Loader } from './types.js';
type ParserOutput = Record<string, Record<string, unknown>> | Array<Record<string, unknown>>;
interface FileOptions {
	/**
	 * the parsing function to use for this data
	 * @default JSON.parse or yaml.load, depending on the extension of the file
	 * */
	parser?: (text: string) => Promise<ParserOutput> | ParserOutput;
}
/**
 * Loads entries from a JSON file. The file must contain an array of objects that contain unique `id` fields, or an object with string keys.
 * @param fileName The path to the JSON file to load, relative to the content directory.
 * @param options Additional options for the file loader
 */
export declare function file(fileName: string, options?: FileOptions): Loader;
export {};
