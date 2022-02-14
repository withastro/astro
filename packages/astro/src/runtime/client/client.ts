import diff from 'micromorph';

const serialize = (el: Element) => {
	let str = '';
	for (const attr of el.attributes) {
		str += ` ${attr.name}="${attr.value}"`;
	}
	return str;
}

const p = new DOMParser();
export function patch(from: Element, children: string) {
	const to = p.parseFromString(`<${from.localName} ${serialize(from)}>${children}</${from.localName}>`, 'text/html').body.children[0];
	return diff(from, to);
}
