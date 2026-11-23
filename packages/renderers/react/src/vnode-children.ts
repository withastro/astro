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
			// 0-length text gets omitted in JSX
			if (!node.value.trim()) return undefined;
			return RAW_TEXT_ELEMENTS.has(node.parent?.name?.toLowerCase())
				? node.value
				: decodeHTML(node.value);
		}
	}

	const root = createReactElementFromNode(doc);
	return root.props.children;
}
