export declare const escapeHTML: (str: string) => string;
/**
 * Serializes a value to a JSON string that is safe to embed inside a `<script>` tag.
 * All `<` characters are escaped to `\u003c` so the browser's HTML parser cannot be
 * tricked into closing the script block early via `</script>` variants (case-insensitive,
 * whitespace, or self-closing forms) or `<!--` comment injection.
 * @see https://mathiasbynens.be/notes/etago
 */
export declare function stringifyForScript(value: any): string;
export declare class HTMLBytes extends Uint8Array {}
declare const htmlStringSymbol: unique symbol;
/**
 * A "blessed" extension of String that tells Astro that the string
 * has already been escaped. This helps prevent double-escaping of HTML.
 */
export declare class HTMLString extends String {
	[htmlStringSymbol]: boolean;
}
type BlessedType = string | HTMLBytes;
/**
 * markHTMLString marks a string as raw or "already escaped" by returning
 * a `HTMLString` instance. This is meant for internal use, and should not
 * be returned through any public JS API.
 */
export declare const markHTMLString: (value: any) => any;
export declare function isHTMLString(value: any): value is HTMLString;
export declare function isHTMLBytes(value: any): value is HTMLBytes;
export declare function unescapeHTML(
	str: any,
):
	| BlessedType
	| Promise<BlessedType | AsyncGenerator<BlessedType, void, unknown>>
	| AsyncGenerator<BlessedType, void, unknown>;
export {};
