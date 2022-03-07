// @ts-check

import { AbortController, AbortSignal } from 'abort-controller/dist/abort-controller.mjs'
import { requestAnimationFrame, cancelAnimationFrame } from './lib/AnimationFrame'
import { atob, btoa } from './lib/Base64'
import { CharacterData, Comment, Text } from './lib/CharacterData'
import { File, Blob } from 'fetch-blob/from.js'
import { CustomEvent } from './lib/CustomEvent'
import { DOMException } from './lib/DOMException'
import { TreeWalker } from './lib/TreeWalker'
import { cancelIdleCallback, requestIdleCallback } from './lib/IdleCallback'
import { Event, EventTarget } from 'event-target-shim'
import { fetch, Headers, Request, Response } from './lib/fetch'
import { FormData } from 'formdata-polyfill/esm.min.js'
import { ByteLengthQueuingStrategy, CountQueuingStrategy, ReadableByteStreamController, ReadableStream, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableStreamDefaultController, ReadableStreamDefaultReader, TransformStream, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter } from 'web-streams-polyfill/dist/ponyfill.es6.mjs'
import { URLPattern } from 'urlpattern-polyfill'
import { setTimeout, clearTimeout } from './lib/Timeout'
import structuredClone from './lib/structuredClone'

import { CanvasRenderingContext2D } from './lib/CanvasRenderingContext2D'
import { CSSStyleSheet, StyleSheet } from './lib/StyleSheet'
import { CustomElementRegistry, initCustomElementRegistry } from './lib/CustomElementRegistry'
import { Document, HTMLDocument, initDocument } from './lib/Document'
import { DocumentFragment, Node, NodeFilter, NodeIterator, ShadowRoot } from './lib/Node'
import { Element, HTMLElement, HTMLBodyElement, HTMLDivElement, HTMLHeadElement, HTMLHtmlElement, HTMLSpanElement, HTMLStyleElement, HTMLTemplateElement, HTMLUnknownElement } from './lib/Element'
import { HTMLCanvasElement } from './lib/HTMLCanvasElement'
import { HTMLImageElement } from './lib/HTMLImageElement'
import { Image } from './lib/Image'
import { ImageData } from './lib/ImageData'
import { IntersectionObserver, MutationObserver, ResizeObserver } from './lib/Observer'
import { MediaQueryList, initMediaQueryList } from './lib/MediaQueryList'
import { OffscreenCanvas } from './lib/OffscreenCanvas'
import { Storage, initStorage } from './lib/Storage'
import { Window, initWindow } from './lib/Window'

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
