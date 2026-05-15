interface ErrorTemplateOptions {
	/** a short description of the error */
	pathname: string;
	/** HTTP error code */
	statusCode?: number;
	/** HTML <title> */
	tabTitle: string;
	/** page title */
	title: string;
	/** The body of the message, if one is provided */
	body?: string;
}
/** Display all errors */
export default function template({
	title,
	pathname,
	statusCode,
	tabTitle,
	body,
}: ErrorTemplateOptions): string;
export declare function subpathNotUsedTemplate(base: string, pathname: string): string;
export declare function trailingSlashMismatchTemplate(
	pathname: string,
	trailingSlash: 'always' | 'never' | 'ignore',
): string;
export declare function notFoundTemplate(pathname: string, message?: string): string;
export {};
