// @ts-check
import { Event, EventTarget } from 'event-target-shim' // Look into removing when Node 18 is dropped for Node 20
import { webcrypto as crypto } from 'node:crypto' // Remove when Node 18 is dropped for Node 20
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
} from 'node:stream/web' // Remove when Node 16 is dropped for Node 18.
import { File, FormData, Headers, Request, Response, fetch } from 'undici' // Remove when Node 16 is dropped for Node 18.
import { URLPattern } from 'urlpattern-polyfill'
import {
	cancelAnimationFrame,
	requestAnimationFrame,
} from './lib/AnimationFrame'
import { CharacterData, Comment, Text } from './lib/CharacterData'
import { CustomEvent } from './lib/CustomEvent' // Look into removing when Node 18 is dropped for Node 20
import { DOMException } from './lib/DOMException'
import { cancelIdleCallback, requestIdleCallback } from './lib/IdleCallback'
import { clearTimeout, setTimeout } from './lib/Timeout'
import { TreeWalker } from './lib/TreeWalker'
import structuredClone from './lib/structuredClone' // Remove when Node 16 is dropped for Node 18.

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
import { MediaQueryList, initMediaQueryList } from './lib/MediaQueryList'
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
import { Storage, initStorage } from './lib/Storage'
import { CSSStyleSheet, StyleSheet } from './lib/StyleSheet'
import { Window, initWindow } from './lib/Window'

import { alert } from './lib/Alert'

export {
	ByteLengthQueuingStrategy,
	CSSStyleSheet,
	CanvasRenderingContext2D,
	CharacterData,
	Comment,
	CountQueuingStrategy,
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
	Headers,
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
	Window,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
	alert,
	cancelAnimationFrame,
	cancelIdleCallback,
	clearTimeout,
	crypto,
	fetch,
	initCustomElementRegistry,
	initDocument,
	initMediaQueryList,
	initStorage,
	initWindow,
	requestAnimationFrame,
	requestIdleCallback,
	setTimeout,
	structuredClone,
}
