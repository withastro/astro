import { Fragment, Renderer } from '../runtime/server/index.js';
declare const AstroJSX = 'astro:jsx';
export interface AstroVNode {
	[Renderer]: string;
	[AstroJSX]: boolean;
	type: string | ((...args: any) => any);
	props: Record<string | symbol, any>;
}
export declare function isVNode(vnode: any): vnode is AstroVNode;
export declare function transformSlots(vnode: AstroVNode): AstroVNode | undefined;
declare function createVNode(
	type: any,
	props?: Record<string, any>,
	key?: string | number,
): AstroVNode;
export { AstroJSX, Fragment, createVNode as jsx, createVNode as jsxDEV, createVNode as jsxs };
