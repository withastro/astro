/**
 * Resolves an image src from a content file (such as markdown) to a module ID or import that can be resolved by Vite.
 *
 * @param imageSrc The src attribute of an image tag
 * @param filePath The path to the file that contains the image relative to the site root
 * @returns A module id of the image that can be resolved by Vite, or undefined if it is not a local image
 */
export declare function imageSrcToImportId(imageSrc: string, filePath?: string): string | undefined;
export declare const importIdToSymbolName: (importId: string) => string;
