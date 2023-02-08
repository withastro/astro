// @ts-check
import { Event, EventTarget } from 'event-target-shim'
import { FormData } from 'formdata-polyfill/esm.min.js'
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
} from 'node:stream/web'
import { fetch, File, Headers, Request, Response } from 'undici'
import { URLPattern } from 'urlpattern-polyfill'
import {
	cancelAnimationFrame,
	requestAnimationFrame,
} from './lib/AnimationFrame'
import { CharacterData, Comment, Text } from './lib/CharacterData'
import { CustomEvent } from './lib/CustomEvent'
import { DOMException } from './lib/DOMException'
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

export {
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
	initStorage,
	initWindow,
}
