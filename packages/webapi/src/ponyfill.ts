// @ts-check

import {
	AbortController,
	AbortSignal,
} from 'abort-controller/dist/abort-controller.mjs'
import { Event, EventTarget } from 'event-target-shim'
import { Blob, File } from 'fetch-blob/from.js'
import { FormData } from 'formdata-polyfill/esm.min.js'
import { URLPattern } from 'urlpattern-polyfill'
import {
	ByteLengthQueuingStrategy,
	CountQueuingStrategy,
	ReadableByteStreamController,
	ReadableStream,
	ReadableStreamBYOBReader,
	ReadableStreamBYOBRequest,
	ReadableStreamDefaultController,
	ReadableStreamDefaultReader,
	TransformStream,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
} from 'web-streams-polyfill/dist/ponyfill.es6.mjs'
import {
	cancelAnimationFrame,
	requestAnimationFrame,
} from './lib/AnimationFrame'
import { atob, btoa } from './lib/Base64'
import { CharacterData, Comment, Text } from './lib/CharacterData'
import { CustomEvent } from './lib/CustomEvent'
import { DOMException } from './lib/DOMException'
import { fetch, Headers, Request, Response } from './lib/fetch'
import { cancelIdleCallback, requestIdleCallback } from './lib/IdleCallback'
import structuredClone from './lib/structuredClone'
import { clearTimeout, setTimeout } from './lib/Timeout'
import { TreeWalker } from './lib/TreeWalker'

import { CanvasRenderingContext2D } from './lib/CanvasRenderingContext2D'
import {
	CustomElementRegistry,
	initCustomElementRegistry,
} from './lib/CustomElementRegistry'
import { Document, HTMLDocument, initDocument } from './lib/Document'
import {
	Element,
	HTMLBodyElement,
	HTMLDivElement,
	HTMLElement,
	HTMLHeadElement,
	HTMLHtmlElement,
	HTMLSpanElement,
	HTMLStyleElement,
	HTMLTemplateElement,
	HTMLUnknownElement,
} from './lib/Element'
import { HTMLCanvasElement } from './lib/HTMLCanvasElement'
import { HTMLImageElement } from './lib/HTMLImageElement'
import { Image } from './lib/Image'
import { ImageData } from './lib/ImageData'
import { initMediaQueryList, MediaQueryList } from './lib/MediaQueryList'
import {
	DocumentFragment,
	Node,
	NodeFilter,
	NodeIterator,
	ShadowRoot,
} from './lib/Node'
import {
	IntersectionObserver,
	MutationObserver,
	ResizeObserver,
} from './lib/Observer'
import { OffscreenCanvas } from './lib/OffscreenCanvas'
import { initStorage, Storage } from './lib/Storage'
import { CSSStyleSheet, StyleSheet } from './lib/StyleSheet'
import { initWindow, Window } from './lib/Window'

import { alert } from './lib/Alert'

import { initObject } from './lib/Object'
import { initPromise } from './lib/Promise'
import { initRelativeIndexingMethod } from './lib/RelativeIndexingMethod'
import { initString } from './lib/String'

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
	Headers,
	HTMLBodyElement,
	HTMLCanvasElement,
	HTMLDivElement,
	HTMLDocument,
	HTMLElement,
	HTMLHeadElement,
	HTMLHtmlElement,
	HTMLImageElement,
	HTMLSpanElement,
	HTMLStyleElement,
	HTMLTemplateElement,
	HTMLUnknownElement,
	Image,
	ImageData,
	IntersectionObserver,
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
}
