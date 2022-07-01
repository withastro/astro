export { pathToPosix } from './lib/utils';
export { AbortController, AbortSignal, alert, atob, Blob, btoa, ByteLengthQueuingStrategy, cancelAnimationFrame, cancelIdleCallback, CanvasRenderingContext2D, CharacterData, clearTimeout, Comment, CountQueuingStrategy, CSSStyleSheet, CustomElementRegistry, CustomEvent, Document, DocumentFragment, DOMException, Element, Event, EventTarget, fetch, File, FormData, Headers, HTMLBodyElement, HTMLCanvasElement, HTMLDivElement, HTMLDocument, HTMLElement, HTMLHeadElement, HTMLHtmlElement, HTMLImageElement, HTMLSpanElement, HTMLStyleElement, HTMLTemplateElement, HTMLUnknownElement, Image, ImageData, IntersectionObserver, MediaQueryList, MutationObserver, Node, NodeFilter, NodeIterator, OffscreenCanvas, ReadableByteStreamController, ReadableStream, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableStreamDefaultController, ReadableStreamDefaultReader, Request, requestAnimationFrame, requestIdleCallback, ResizeObserver, Response, setTimeout, ShadowRoot, structuredClone, StyleSheet, Text, TransformStream, TreeWalker, URLPattern, Window, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter, } from './mod.js';
export declare const polyfill: {
    (target: any, options?: PolyfillOptions): any;
    internals(target: any, name: string): any;
};
interface PolyfillOptions {
    exclude?: string | string[];
    override?: Record<string, {
        (...args: any[]): any;
    }>;
}
