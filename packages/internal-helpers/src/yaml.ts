import { isNode, LineCounter, parseDocument, YAMLParseError } from 'yaml';

export function parseYaml(source: string): unknown {
	const document = parseDocument(source, {
		customTags: ['timestamp'],
		merge: true,
		schema: 'core',
	});
	if (document.errors.length > 0) {
		throw document.errors[0];
	}
	if (document.contents === null) {
		return undefined;
	}
	return document.toJS();
}

export { YAMLParseError };

export function getYamlPathLine(source: string, keys: PropertyKey[]): number | undefined {
	const lineCounter = new LineCounter();
	const document = parseDocument(source, { lineCounter });
	for (let length = keys.length; length > 0; length--) {
		const node = document.getIn(keys.slice(0, length), true);
		if (isNode(node) && node.range) return lineCounter.linePos(node.range[0]).line;
	}
}
