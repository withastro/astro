import {
	AbortController,
	AbortSignal,
	Blob,
	ByteLengthQueuingStrategy,
	CanvasRenderingContext2D,
	CharacterData,
	Comment,
	CountQueuingStrategy,
	CSSStyleSheet,
	CustomElementRegistry,
	CustomEvent,
	DOMException,
	Document,
	DocumentFragment,
	Element,
	Event,
	EventTarget,
	File,
	FormData,
	HTMLDocument,
	HTMLElement,
	HTMLBodyElement,
	HTMLCanvasElement,
	HTMLDivElement,
	HTMLHeadElement,
	HTMLHtmlElement,
	HTMLImageElement,
	HTMLSpanElement,
	HTMLStyleElement,
	HTMLTemplateElement,
	HTMLUnknownElement,
	Headers,
	IntersectionObserver,
	Image,
	ImageData,
	MediaQueryList,
	MutationObserver,
	Node,
	NodeFilter,
	NodeIterator,
	OffscreenCanvas,
	ReadableByteStreamController,
	ReadableStream,
	ReadableStreamBYOBReader,
	ReadableStreamBYOBRequest,
	ReadableStreamDefaultController,
	ReadableStreamDefaultReader,
	Request,
	ResizeObserver,
	Response,
	ShadowRoot,
	Storage,
	StyleSheet,
	Text,
	TransformStream,
	TreeWalker,
	URLPattern,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
	Window,

	alert,
	atob,
	btoa,
	cancelAnimationFrame,
	cancelIdleCallback,
	clearTimeout,
	fetch,
	requestAnimationFrame,
	requestIdleCallback,
	setTimeout,
	structuredClone,

	initCustomElementRegistry,
	initDocument,
	initMediaQueryList,
	initObject,
	initPromise,
	initRelativeIndexingMethod,
	initStorage,
	initString,
	initWindow,
} from './ponyfill'

import { exclusions } from './exclusions'
import { inheritence } from './inheritence'

export {
	AbortController,
	AbortSignal,
	Blob,
	ByteLengthQueuingStrategy,
	CanvasRenderingContext2D,
	CharacterData,
	Comment,
	CountQueuingStrategy,
	CSSStyleSheet,
	CustomElementRegistry,
	CustomEvent,
	DOMException,
	Document,
	DocumentFragment,
	Element,
	Event,
	EventTarget,
	File,
	FormData,
	HTMLDocument,
	HTMLElement,
	HTMLBodyElement,
	HTMLCanvasElement,
	HTMLDivElement,
	HTMLHeadElement,
	HTMLHtmlElement,
	HTMLImageElement,
	HTMLSpanElement,
	HTMLStyleElement,
	HTMLTemplateElement,
	HTMLUnknownElement,
	Headers,
	IntersectionObserver,
	Image,
	ImageData,
	MediaQueryList,
	MutationObserver,
	Node,
	NodeFilter,
	NodeIterator,
	OffscreenCanvas,
	ReadableByteStreamController,
	ReadableStream,
	ReadableStreamBYOBReader,
	ReadableStreamBYOBRequest,
	ReadableStreamDefaultController,
	ReadableStreamDefaultReader,
	Request,
	ResizeObserver,
	Response,
	ShadowRoot,
	StyleSheet,
	Text,
	TransformStream,
	TreeWalker,
	URLPattern,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
	Window,

	alert,
	atob,
	btoa,
	cancelAnimationFrame,
	cancelIdleCallback,
	clearTimeout,
	fetch,
	requestAnimationFrame,
	requestIdleCallback,
	setTimeout,
	structuredClone,
} from './ponyfill.js'

export { pathToPosix } from './lib/utils'

export const polyfill = (target: any, options?: PolyfillOptions) => {
	const webAPIs = {
		AbortController,
		AbortSignal,
		Blob,
		ByteLengthQueuingStrategy,
		CanvasRenderingContext2D,
		CharacterData,
		Comment,
		CountQueuingStrategy,
		CSSStyleSheet,
		CustomElementRegistry,
		CustomEvent,
		Document,
		DocumentFragment,
		DOMException,
		Element,
		Event,
		EventTarget,
		File,
		FormData,
		HTMLDocument,
		HTMLElement,
		HTMLBodyElement,
		HTMLCanvasElement,
		HTMLDivElement,
		HTMLHeadElement,
		HTMLHtmlElement,
		HTMLImageElement,
		HTMLSpanElement,
		HTMLStyleElement,
		HTMLTemplateElement,
		HTMLUnknownElement,
		Headers,
		IntersectionObserver,
		Image,
		ImageData,
		MediaQueryList,
		MutationObserver,
		Node,
		NodeFilter,
		NodeIterator,
		OffscreenCanvas,
		ReadableByteStreamController,
		ReadableStream,
		ReadableStreamBYOBReader,
		ReadableStreamBYOBRequest,
		ReadableStreamDefaultController,
		ReadableStreamDefaultReader,
		Request,
		ResizeObserver,
		Response,
		ShadowRoot,
		Storage,
		StyleSheet,
		Text,
		TransformStream,
		TreeWalker,
		URLPattern,
		WritableStream,
		WritableStreamDefaultController,
		WritableStreamDefaultWriter,
		Window,

		alert,
		atob,
		btoa,
		cancelAnimationFrame,
		cancelIdleCallback,
		clearTimeout,
		fetch,
		requestAnimationFrame,
		requestIdleCallback,
		setTimeout,
		structuredClone,
	}

	// initialize exclude options
	const excludeOptions = new Set(
		typeof Object(options).exclude === 'string'
			? String(Object(options).exclude).trim().split(/\s+/)
		: Array.isArray(Object(options).exclude)
			? Object(options).exclude.reduce(
				(array: string[], entry: unknown) => array.splice(array.length, 0, ...(typeof entry === 'string' ? entry.trim().split(/\s+/) : [])) && array,
				[]
			)
		: []
	) as Set<string>

	// expand exclude options using exclusion shorthands
	for (const excludeOption of excludeOptions) {
		if (excludeOption in exclusions) {
			for (const exclusion of exclusions[excludeOption as keyof typeof exclusions]) {
				excludeOptions.add(exclusion)
			}
		}
	}

	// apply each WebAPI
	for (const name of Object.keys(webAPIs)) {
		// skip WebAPIs that are excluded
		if (excludeOptions.has(name)) continue

		// skip WebAPIs that are built-in 
		if (Object.hasOwnProperty.call(target, name)) continue

		// define WebAPIs on the target
		Object.defineProperty(target, name, { configurable: true, enumerable: true, writable: true, value: webAPIs[name as keyof typeof webAPIs] })
	}

	// ensure WebAPIs correctly inherit other WebAPIs
	for (const name of Object.keys(webAPIs)) {
		// skip WebAPIs that are excluded
		if (excludeOptions.has(name)) continue

		// skip WebAPIs that do not extend other WebAPIs
		if (!Object.hasOwnProperty.call(inheritence, name)) continue

		const Class = target[name]
		const Super = target[inheritence[name as keyof typeof inheritence]]

		// skip WebAPIs that are not available
		if (!Class || !Super) continue

		// skip WebAPIs that are already inherited correctly 
		if (Object.getPrototypeOf(Class.prototype) === Super.prototype) continue

		// define WebAPIs inheritence
		Object.setPrototypeOf(Class.prototype, Super.prototype)
	}

	if (!excludeOptions.has('HTMLDocument') && !excludeOptions.has('HTMLElement')) {
		initDocument(target, excludeOptions)

		if (!excludeOptions.has('CustomElementRegistry')) {
			initCustomElementRegistry(target, excludeOptions)
		}
	}

	initObject(target, excludeOptions)
	initMediaQueryList(target, excludeOptions)
	initPromise(target, excludeOptions)
	initRelativeIndexingMethod(target, excludeOptions)
	initStorage(target, excludeOptions)
	initString(target, excludeOptions)
	initWindow(target, excludeOptions)

	return target
}

polyfill.internals = (target: any, name: string) => {
	const init = {
		CustomElementRegistry: initCustomElementRegistry,
		Document: initDocument,
		MediaQueryList: initMediaQueryList,
		Object: initObject,
		Promise: initPromise,
		RelativeIndexingMethod: initRelativeIndexingMethod,
		Storage: initStorage,
		String: initString,
		Window: initWindow,
	}

	init[name as keyof typeof init](target, new Set<string>())

	return target
}

interface PolyfillOptions {
	exclude?: string | string[]
	override?: Record<string, { (...args: any[]): any }>
}
