declare module 'astro/jsx-runtime' {
	export const AstroJSX: unique symbol;
	export function jsx(type: any, props: any): any;
}

declare module 'astro/runtime/server/index.js' {
	export function renderJSX(result: any, vnode: any): Promise<string>;
}
