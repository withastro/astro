/**
 * Build a client directive entrypoint into code that can directly run in a `<script>` tag.
 */
export declare function buildClientDirectiveEntrypoint(
	name: string,
	entrypoint: string | URL,
	root: URL,
): Promise<string>;
