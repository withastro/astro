import { decodeHTML, decodeHTMLAttribute } from 'entities';
import { createElement, Fragment } from 'react';
import { DOCUMENT_NODE, ELEMENT_NODE, parse, TEXT_NODE } from 'ultrahtml';

// ultrahtml keeps character references such as `&amp;` in text and attribute values as written,
// and React escapes those strings again, so they are decoded first. Browsers leave references inside
// `<script>` and `<style>` undecoded, so text in these elements is kept as written.
// See: https://github.com/withastro/astro/issues/18785
const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);

let ids = 0;
export default function convert(children: any) {
	let doc = parse(children.toString().trim());
	let id = ids++;
	let key = 0;

	function createReactElementFromNode(node: any) {
		const childVnodes =
			Array.isArray(node.children) && node.children.length
				? node.children.map((child: any) => createReactElementFromNode(child)).filter(Boolean)
				: undefined;

		if (node.type === DOCUMENT_NODE) {
			return createElement(Fragment, {}, childVnodes);
		} else if (node.type === ELEMENT_NODE) {
			const attributes: Record<string, string> = {};
			for (const [name, value] of Object.entries<string>(node.attributes)) {
				attributes[name] = decodeHTMLAttribute(value);
			}
			const { class: className, ...props } = attributes;
			return createElement(node.name, { ...props, className, key: `${id}-${key++}` }, childVnodes);
		} else if (node.type === TEXT_NODE) {
			// Whitespace is kept as the HTML parser keeps it, so the server builds the same tree as
			// the client (`client.ts` applies the same rules). Only whitespace with a line break between
			// top-level children is dropped, as JSX drops it between elements.
			// See: https://github.com/withastro/astro/issues/18792
			if (!node.value) return undefined;
			if (node.parent?.type === DOCUMENT_NODE && !node.value.trim() && node.value.includes('\n')) {
				return undefined;
			}
			const parentName = node.parent?.name?.toLowerCase();
			if (RAW_TEXT_ELEMENTS.has(parentName)) return node.value;
			// The HTML parser drops a line break right after a `<pre>` start tag, and the client builds
			// its tree from children parsed by the browser, so the server drops it too.
			const value =
				parentName === 'pre' && node.parent.children[0] === node
					? node.value.replace(/^\n/, '')
					: node.value;
			return value ? decodeHTML(value) : undefined;
		}
	}

	const root = createReactElementFromNode(doc);
	return root.props.children;
}
