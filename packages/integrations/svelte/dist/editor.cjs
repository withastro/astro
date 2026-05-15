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
	extractGenerics: () => extractGenerics,
	toTSX: () => toTSX,
});
module.exports = __toCommonJS(editor_exports);
var import_svelte2tsx = require('svelte2tsx');
const genericNameRE = /^(?:const |in |out )*(\w+)/;
function toTSX(code, className) {
	let result = `
		let ${className}__AstroComponent_: Error
		export default ${className}__AstroComponent_
	`;
	try {
		let tsx = (0, import_svelte2tsx.svelte2tsx)(code, { mode: 'ts', isTsFile: true }).code;
		tsx = "import '@astrojs/svelte/svelte-shims.d.ts';\n" + tsx;
		if (tsx.includes('export default $$Component;')) {
			const generics = extractGenerics(tsx);
			const genericSuffix = generics ? `<${generics.params}>` : '';
			const innerType = generics
				? `ReturnType<__sveltets_Render<${generics.names}>['props']>`
				: `import('svelte').ComponentProps<typeof $$$$Component>`;
			const propsType = generics ? 'GenericPropsWithClientDirectives' : 'PropsWithClientDirectives';
			result = tsx.replace(
				'export default $$Component;',
				`export default function ${className}__AstroComponent_${genericSuffix}(_props: import('@astrojs/svelte/svelte-shims.d.ts').${propsType}<${innerType}>): any {}`,
			);
		} else {
			result = tsx.replace(
				'export default class extends __sveltets_2_createSvelte2TsxComponent(',
				`export default function ${className}__AstroComponent_(_props: import('@astrojs/svelte/svelte-shims.d.ts').PropsWithClientDirectives<typeof Component.props>): any {}
let Component = `,
			);
		}
	} catch {
		return result;
	}
	return result;
}
function extractGenerics(tsx) {
	const marker = 'class __sveltets_Render<';
	const startIdx = tsx.indexOf(marker);
	if (startIdx === -1) return null;
	const genericStart = startIdx + marker.length;
	let depth = 1;
	let i = genericStart;
	while (i < tsx.length && depth > 0) {
		if (tsx[i] === '<') depth++;
		if (tsx[i] === '>' && tsx[i - 1] !== '=') depth--;
		i++;
	}
	const params = tsx.substring(genericStart, i - 1);
	const names = [];
	let current = '';
	let depth2 = 0;
	let prev = '';
	for (const ch of params) {
		if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth2++;
		if ((ch === '>' && prev !== '=') || ch === ')' || ch === '}' || ch === ']') depth2--;
		if (ch === ',' && depth2 === 0) {
			const name = genericNameRE.exec(current.trim())?.[1];
			if (name) names.push(name);
			current = '';
		} else {
			current += ch;
		}
		prev = ch;
	}
	const lastName = genericNameRE.exec(current.trim())?.[1];
	if (lastName) names.push(lastName);
	return { params, names: names.join(', ') };
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
	(module.exports = {
		extractGenerics,
		toTSX,
	});
