'use strict';
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
	if ((from && typeof from === 'object') || typeof from === 'function') {
		for (let key of __getOwnPropNames(from))
			if (!__hasOwnProp.call(to, key) && key !== except)
				__defProp(to, key, {
					get: () => from[key],
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
				});
	}
	return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);
var editor_exports = {};
__export(editor_exports, {
	toTSX: () => toTSX,
});
module.exports = __toCommonJS(editor_exports);
var import_compiler_sfc = require('@vue/compiler-sfc');
function toTSX(code, className) {
	let result = `export default function ${className}__AstroComponent_(_props: import('@astrojs/vue/vue-shims.d.ts').PropsWithHTMLAttributes<Record<string, any>>): any {}`;
	try {
		const parsedResult = (0, import_compiler_sfc.parse)(code);
		if (parsedResult.errors.length > 0) {
			return `
				let ${className}__AstroComponent_: Error
				export default ${className}__AstroComponent_
			`;
		}
		const regularScriptBlockContent = parsedResult.descriptor.script?.content ?? '';
		const { scriptSetup } = parsedResult.descriptor;
		if (scriptSetup) {
			const codeWithoutComments = scriptSetup.content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
			const definePropsType = /defineProps<([\s\S]+?)>\s?\(\)/.exec(codeWithoutComments);
			const propsGeneric = scriptSetup.attrs.generic;
			const propsGenericType = propsGeneric ? `<${propsGeneric}>` : '';
			if (definePropsType) {
				result = `
						${regularScriptBlockContent}
						${scriptSetup.content}

						export default function ${className}__AstroComponent_${propsGenericType}(_props: import('@astrojs/vue/vue-shims.d.ts').PropsWithHTMLAttributes<${definePropsType[1]}>): any {
							<div></div>
						}
				`;
			} else {
				const defineProps = /defineProps\([\s\S]+?\)/.exec(codeWithoutComments);
				if (defineProps) {
					result = `
					import { defineProps } from 'vue';

					${regularScriptBlockContent}

					const Props = ${defineProps[0]}

					export default function ${className}__AstroComponent_${propsGenericType}(_props: import('@astrojs/vue/vue-shims.d.ts').PropsWithHTMLAttributes<typeof Props>): any {
						<div></div>
					}
				`;
				}
			}
		}
	} catch {
		return result;
	}
	return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
	(module.exports = {
		toTSX,
	});
