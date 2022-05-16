import { Fragment } from 'astro/server';

const AstroJSX = Symbol('@astrojs/jsx');

function createVNode(type: any, props: Record<string, any>, key?: string, __self?: string, __source?: string) {
	const vnode = {
		[AstroJSX]: true,
		type,
		props: props ?? {},
		key,
		__source,
		__self,
	};
	return vnode;
}


export {
	AstroJSX,
	createVNode as jsx,
	createVNode as jsxs,
	createVNode as jsxDEV,
	Fragment
}
