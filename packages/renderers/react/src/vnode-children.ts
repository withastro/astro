import { decodeHTML, decodeHTMLAttribute } from 'entities';
import { createElement, Fragment } from 'react';
import { DOCUMENT_NODE, ELEMENT_NODE, parse, TEXT_NODE } from 'ultrahtml';
import { isSkippedTopLevelText } from './whitespace.js';

// ultrahtml keeps character references such as `&amp;` in text and attribute values as written,
// and React escapes those strings again, so they are decoded first. Browsers leave references inside
// `<script>` and `<style>` undecoded, so text in these elements is kept as written.
// See: https://github.com/withastro/astro/issues/18785
const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);

// Browsers drop a line break that directly follows these start tags, so the client never receives
// it at the start of their first text. ultrahtml keeps it.
// See: https://github.com/withastro/astro/issues/18792
const LEADING_LINE_BREAK_ELEMENTS = new Set(['listing', 'pre', 'textarea']);

let ids = 0;
export default function convert(children: any) {
	let doc = parse(children.toString());
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
			const parentName = node.parent?.name?.toLowerCase();
			const text = RAW_TEXT_ELEMENTS.has(parentName) ? node.value : decodeHTML(node.value);
			if (node.parent?.type === DOCUMENT_NODE) {
				// Tested after decoding, because `client.ts` sees decoded text
				const siblings = node.parent.children;
				return isSkippedTopLevelText(text, siblings[0] === node, siblings.at(-1) === node)
					? undefined
					: text;
			}
			if (LEADING_LINE_BREAK_ELEMENTS.has(parentName) && node.parent.children[0] === node) {
				// A carriage return, with or without a line feed after it, reaches the client as a line feed
				return text.replace(/^(\r\n?|\n)/, '');
			}
			return text;
		}
	}

	const root = createReactElementFromNode(doc);
	return root.props.children;
}
