/**
 * Infer the image format from a source path or URL by examining
 * the file extension. For data: URIs, the MIME type is extracted.
 * Returns undefined if the format cannot be determined.
 */
export declare function inferSourceFormat(src: string): string | undefined;
