'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.VIRTUAL_CODE_ID = void 0;
exports.yaml2ts = yaml2ts;
const yaml_1 = __importStar(require('yaml'));
exports.VIRTUAL_CODE_ID = 'frontmatter-ts';
const ONLY_NAV_CODE_INFO = {
	verification: false,
	completion: false,
	semantic: false,
	navigation: true,
	structure: false,
	format: false,
};
function yaml2ts(frontmatter, collection) {
	const frontmatterMappings = [];
	const frontmatterContent = (0, yaml_1.parseDocument)(frontmatter, {
		keepSourceTokens: true,
		customTags: ['timestamp'], // Handle YAML timestamps
		// Those two options prevent `yaml` from throwing errors when it encounters parsing errors, which is useful for handling incomplete content
		strict: false,
		logLevel: 'silent',
	});
	let fullResult = 'import type { InferEntrySchema } from "astro:content";\n\n(\n';
	let objectContent = frontmatter.trim().length > 0 ? '' : '{}'; // If there's no content, provide an empty object so that there's no syntax error
	yaml_1.default.visit(frontmatterContent, {
		Value(key, value) {
			if ((0, yaml_1.isCollection)(value)) {
				if ((0, yaml_1.isMap)(value)) {
					mapMap(value, key);
				}
				if ((0, yaml_1.isSeq)(value)) {
					mapSeq(value);
				}
			}
			// If we didn't hit any of the above, we have a scalar value which in almost all cases is a Pair that's just not fully written yet
			if ((0, yaml_1.isScalar)(value)) {
				const itemKey = mapScalarKey(value);
				// We don't care about values, just keys, since we're only interested in the structure
				objectContent += `${itemKey}: null\n`;
			}
			return yaml_1.default.visit.REMOVE;
		},
	});
	function mapMap(map, key) {
		objectContent += '{\n';
		// Go through all the items in the map
		map.items.forEach((item) => {
			// Pairs keys are not always scalars (they can even be totally arbitrary nodes), but in practice, it's really rare for them to be anything other than scalars
			// Anyway, Zod does not support non-scalar keys, so it's fine to just not handle anything other than scalars
			if ((0, yaml_1.isScalar)(item.key)) {
				const itemKey = mapScalarKey(item.key);
				if ((0, yaml_1.isScalar)(item.value) || item.value === null) {
					objectContent += `${itemKey}: null,\n`; // Don't care about value, just key
				}
				if ((0, yaml_1.isMap)(item.value)) {
					objectContent += `${itemKey}: `;
					mapMap(item.value);
				}
				if ((0, yaml_1.isSeq)(item.value)) {
					objectContent += `${itemKey}: `;
					mapSeq(item.value);
				}
			}
			return yaml_1.default.visit.REMOVE;
		});
		objectContent += '}';
		if (key !== null) {
			objectContent += ',';
		}
		objectContent += '\n';
		return yaml_1.default.visit.REMOVE;
	}
	function mapSeq(seq) {
		objectContent += '[';
		seq.items.forEach((item) => {
			if ((0, yaml_1.isScalar)(item)) {
				objectContent += `null,`;
			}
			if ((0, yaml_1.isMap)(item)) {
				mapMap(item);
			}
			if ((0, yaml_1.isSeq)(item)) {
				mapSeq(item);
			}
			return yaml_1.default.visit.REMOVE;
		});
		objectContent += '],\n';
		return yaml_1.default.visit.REMOVE;
	}
	function mapScalarKey(scalar) {
		// Stringify a YAML scalar key, handling invalid JS identifiers, escaping quotes etc. correctly.
		const itemKey = JSON.stringify(scalar.toJS(frontmatterContent));
		// Get the length of the original written key
		// This condition will always be true because we're only handling scalar keys
		const sourceTokenLength = yaml_1.CST.isScalar(scalar.srcToken)
			? scalar.srcToken.source.length
			: 0;
		frontmatterMappings.push({
			generatedOffsets: [fullResult.length + objectContent.length],
			sourceOffsets: [scalar.range[0]], // For scalar keys, the range is always defined
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
			id: exports.VIRTUAL_CODE_ID,
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
//# sourceMappingURL=yaml2ts.js.map
