import extract from 'acorn-globals'

const GLOBALS = new Set([
	'AbortController',
	'AbortSignal',
	'Blob',
	'ByteLengthQueuingStrategy',
	'CanvasRenderingContext2D',
	'CharacterData',
	'Comment',
	'CountQueuingStrategy',
	'CSSStyleSheet',
	'CustomElementRegistry',
	'CustomEvent',
	'DocumentFragment',
	'DOMException',
	'Element',
	'Event',
	'EventTarget',
	'File',
	'FormData',
	'HTMLDocument',
	'HTMLElement',
	'HTMLBodyElement',
	'HTMLCanvasElement',
	'HTMLDivElement',
	'HTMLHeadElement',
	'HTMLHtmlElement',
	'HTMLImageElement',
	'HTMLSpanElement',
	'HTMLStyleElement',
	'HTMLTemplateElement',
	'HTMLUnknownElement',
	'Headers',
	'IntersectionObserver',
	'Image',
	'ImageData',
	'MediaQueryList',
	'MutationObserver',
	'Node',
	'NodeFilter',
	'NodeIterator',
	'OffscreenCanvas',
	'ReadableByteStreamController',
	'ReadableStream',
	'ReadableStreamBYOBReader',
	'ReadableStreamBYOBRequest',
	'ReadableStreamDefaultController',
	'ReadableStreamDefaultReader',
	'Request',
	'ResizeObserver',
	'Response',
	'ShadowRoot',
	'Storage',
	'StyleSheet',
	'Text',
	'TransformStream',
	'TreeWalker',
	'URLPattern',
	'WritableStream',
	'WritableStreamDefaultController',
	'WritableStreamDefaultWriter',

	'alert',
	'atob',
	'btoa',
	'cancelAnimationFrame',
	'cancelIdleCallback',
	'clearTimeout',
	'fetch',
	'requestAnimationFrame',
	'requestIdleCallback',
	'setTimeout',
	'structuredClone',
])

export default function webapi() {
	const virtualModuleId = 'virtual:@astrojs/webapi'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

	const needsPolyfill = new Set();

	/** @type {import('rollup').Plugin} */
	const plugin = {
		name: '@astrojs/webapi',
		enforce: 'post',
		resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
		load(id) {
      if (id === resolvedVirtualModuleId) {
				if (needsPolyfill.size === 0) {
					return `export const polyfill = () => {};`
				}
        return createPolyfill(needsPolyfill);
      }
    },
		transform(code, _, opts) {
			if (!opts || !opts.ssr) return;
			const ast = this.parse(code)
			const globals = extract(ast)
			for (const { name } of globals) {
				if (GLOBALS.has(name)) {
					needsPolyfill.add(name);
				}
			}
		},
	}

	return plugin;
}

function createPolyfill(globals) {
	return `
import {
	${Array.from(globals).join(',\n\t')},
} from '@astrojs/webapi'

export const polyfill = (target, options) => {
	const webAPIs = {
		${Array.from(globals).join(',\n\t\t')}
	}
	console.log(webAPIs);
	return target
}
`	
}
