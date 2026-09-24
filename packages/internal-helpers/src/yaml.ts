import { parseDocument, YAMLParseError } from 'yaml';

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
