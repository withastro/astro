import { Fragment } from '../runtime/server/index.js';

const AstroJSX = Symbol('@astrojs/jsx');

function createVNode(type: any, props: Record<string, any>) {
 	const vnode = {
		[AstroJSX]: true,
		type,
		props: props ?? {},
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
