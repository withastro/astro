import type { CodeMapping, VirtualCode } from '@volar/language-core';
import type { YAMLError, YAMLMap, YAMLSeq } from 'yaml';
import YAML, { CST, isCollection, isMap, isScalar, isSeq, parseDocument } from 'yaml';

export const VIRTUAL_CODE_ID = 'frontmatter-ts';

export type YAML2TSResult = {
	errors: YAMLError[];
	virtualCode: VirtualCode;
};

const ONLY_NAV_CODE_INFO: CodeMapping['data'] = {
	verification: false,
	completion: false,
	semantic: false,
	navigation: true,
	structure: false,
	format: false,
};

export function yaml2ts(frontmatter: string, collection: string): YAML2TSResult {
	const frontmatterMappings: CodeMapping[] = [];
	const frontmatterContent = parseDocument(frontmatter, {
		keepSourceTokens: true,
		customTags: ['timestamp'], // Handle YAML timestamps
		// Those two options prevent `yaml` from throwing errors when it encounters parsing errors, which is useful for handling incomplete content
		strict: false,
		logLevel: 'silent',
	});

	let fullResult = 'import type { InferEntrySchema } from "astro:content";\n\n(\n';
	let objectContent = frontmatter.trim().length > 0 ? '' : '{}'; // If there's no content, provide an empty object so that there's no syntax error

	YAML.visit(frontmatterContent, {
		Value(key, value) {
			if (isCollection(value)) {
				if (isMap(value)) {
					mapMap(value, key);
				}

				if (isSeq(value)) {
					mapSeq(value);
				}
			}

			// If we didn't hit any of the above, we have a scalar value which in almost all cases is a Pair that's just not fully written yet
			if (isScalar(value)) {
				const itemKey = mapScalarKey(value);
				// We don't care about values, just keys, since we're only interested in the structure
				objectContent += `${itemKey}: null\n`;
			}

			return YAML.visit.REMOVE;
		},
	});

	function mapMap(map: YAMLMap, key?: string | number | null) {
		objectContent += '{\n';

		// Go through all the items in the map
		map.items.forEach((item) => {
			// Pairs keys are not always scalars (they can even be totally arbitrary nodes), but in practice, it's really rare for them to be anything other than scalars
			// Anyway, Zod does not support non-scalar keys, so it's fine to just not handle anything other than scalars
			if (isScalar(item.key)) {
				const itemKey = mapScalarKey(item.key);

				if (isScalar(item.value) || item.value === null) {
					objectContent += `${itemKey}: null,\n`; // Don't care about value, just key
				}

				if (isMap(item.value)) {
					objectContent += `${itemKey}: `;
					mapMap(item.value);
				}

				if (isSeq(item.value)) {
					objectContent += `${itemKey}: `;
					mapSeq(item.value);
				}
			}

			return YAML.visit.REMOVE;
		});

		objectContent += '}';

		if (key !== null) {
			objectContent += ',';
		}

		objectContent += '\n';

		return YAML.visit.REMOVE;
	}

	function mapSeq(seq: YAMLSeq) {
		objectContent += '[';

		seq.items.forEach((item) => {
			if (isScalar(item)) {
				objectContent += `null,`;
			}

			if (isMap(item)) {
				mapMap(item);
			}

			if (isSeq(item)) {
				mapSeq(item);
			}

			return YAML.visit.REMOVE;
		});

		objectContent += '],\n';

		return YAML.visit.REMOVE;
	}

	function mapScalarKey(scalar: YAML.Scalar) {
		// Stringify a YAML scalar key, handling invalid JS identifiers, escaping quotes etc. correctly.
		const itemKey = JSON.stringify(scalar.toJS(frontmatterContent));

		// Get the length of the original written key
		// This condition will always be true because we're only handling scalar keys
		const sourceTokenLength = CST.isScalar(scalar.srcToken) ? scalar.srcToken.source.length : 0;

		frontmatterMappings.push({
			generatedOffsets: [fullResult.length + objectContent.length],
			sourceOffsets: [scalar.range![0]], // For scalar keys, the range is always defined
			lengths: [sourceTokenLength],
			generatedLengths: [itemKey.length],
			data: ONLY_NAV_CODE_INFO,
		});

		return itemKey;
	}

	fullResult += `${objectContent}) satisfies InferEntrySchema<"${collection}">;\n\n`;

	return {
		errors: frontmatterContent.errors,
		virtualCode: {
			id: VIRTUAL_CODE_ID,
			languageId: 'typescript',
			snapshot: {
				getText: (start, end) => fullResult.substring(start, end),
				getLength: () => fullResult.length,
				getChangeRange: () => undefined,
			},
			mappings: frontmatterMappings,
		},
	};
}
