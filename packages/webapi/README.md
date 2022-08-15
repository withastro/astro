# WebAPI

**WebAPI** lets you use Web APIs in Node v12, v14, and v16.

```sh
npm install @astrojs/webapi
```

```js
import { polyfill } from '@astrojs/webapi'

polyfill(globalThis)

const t = new EventTarget()
const e = new CustomEvent('hello')

t.addEventListener('hello', console.log)

t.dispatchEvent(e) // logs `e` event from `t`
```

These APIs are combined from popular open source projects and configured to share implementation details. This allows their behavior to match browser expectations as well as reduce their combined memory footprint.

## Features

- [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [ByteLengthQueuingStrategy](https://developer.mozilla.org/en-US/docs/Web/API/ByteLengthQueuingStrategy)
- [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
- [CSSStyleSheet](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet)
- [CountQueuingStrategy](https://developer.mozilla.org/en-US/docs/Web/API/CountQueuingStrategy)
- [CustomElementRegistry](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry)
- [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException)
- [Document](https://developer.mozilla.org/en-US/docs/Web/API/Document)
- [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)
- [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)
- [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event)
- [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [File](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [HTMLDocument](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDocument)
- [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
- [HTMLBodyElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement)
- [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement)
- [HTMLDivElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement)
- [HTMLHeadElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadElement)
- [HTMLHtmlElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHtmlElement)
- [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement)
- [HTMLSpanElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSpanElement)
- [HTMLStyleElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement)
- [HTMLTemplateElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement)
- [HTMLUnknownElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement)
- [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)
- [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)
- [Image](https://developer.mozilla.org/en-US/docs/Web/API/Image)
- [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
- [MediaQueryList](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList)
- [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)
- [NodeIterator](https://developer.mozilla.org/en-US/docs/Web/API/NodeIterator)
- [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [ReadableByteStreamController](https://developer.mozilla.org/en-US/docs/Web/API/ReadableByteStreamController)
- [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [ReadableStreamBYOBReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamBYOBReader)
- [ReadableStreamBYOBRequest](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamBYOBRequest)
- [ReadableStreamDefaultController](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController)
- [ReadableStreamDefaultReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader)
- [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)
- [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage)
- [StyleSheet](https://developer.mozilla.org/en-US/docs/Web/API/StyleSheet)
- [TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)
- [TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- [WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)
- [WritableStreamDefaultController](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultController)
- [WritableStreamDefaultWriter](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter)
- [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window)
- [atob](https://developer.mozilla.org/en-US/docs/Web/API/atob)
- [btoa](https://developer.mozilla.org/en-US/docs/Web/API/btoa)
- [cancelAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/cancelAnimationFrame)
- [cancelIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/cancelIdleCallback)
- [clearTimeout](https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout)
- [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/localStorage)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/requestAnimationFrame)
- [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/requestIdleCallback)
- [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
- [Promise.any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)
- [Array.prototype.at](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at)
- [String.prototype.at](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/at)
- [String.prototype.replaceAll](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll)
- [TypedArray.prototype.at](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/at)
- [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)

## Usage

You can use WebAPIs as individual exports.

```js
import { AbortController, Blob, Event, EventTarget, File, fetch, Response } from '@astrojs/webapi'
```

You can apply WebAPIs to an object, like `globalThis`.

```js
import { polyfill } from '@astrojs/webapi'

polyfill(globalThis)
```

## Polyfill Options

The `exclude` option receives a list of WebAPIs to exclude from polyfilling.

```js
polyfill(globalThis, {
	// disables polyfills for setTimeout clearTimeout
	exclude: 'setTimeout clearTimeout',
})
```

The `exclude` option accepts shorthands to exclude multiple polyfills. These shorthands end with the plus sign (`+`).

```js
polyfill(globalThis, {
	// disables polyfills for setTimeout clearTimeout
	exclude: 'Timeout+',
})
```

```js
polyfill(globalThis, {
	// disables polyfills for Node, Window, Document, HTMLElement, etc.
	exclude: 'Node+',
})
```

```js
polyfill(globalThis, {
	// disables polyfills for Event, EventTarget, Node, Window, Document, HTMLElement, etc.
	exclude: 'Event+',
})
```

| Shorthand      | Excludes |
|:-------------- |:-------- |
| `Blob+`        | `Blob`, `File` |
| `Document+`    | `Document`, `HTMLDocument` |
| `Element+`     | `Element`, and exclusions from `HTMLElement+` |
| `Event+`       | `Event`, `CustomEvent`, `EventTarget`, `AbortSignal`, `MediaQueryList`, `Window`, and exclusions from `Node+` |
| `EventTarget+` | `Event`, `CustomEvent`, `EventTarget`, `AbortSignal`, `MediaQueryList`, `Window`, and exclusions from `Node+` |
| `HTMLElement+` | `CustomElementsRegistry`, `HTMLElement`, `HTMLBodyElement`, `HTMLCanvasElement`, `HTMLDivElement`, `HTMLHeadElement`, `HTMLHtmlElement`, `HTMLImageElement`, `HTMLStyleElement`, `HTMLTemplateElement`, `HTMLUnknownElement`, `Image` |
| `Node+`        | `Node`, `DocumentFragment`, `ShadowRoot`, `Document`, `HTMLDocument`, and exclusions from `Element+` |
| `StyleSheet+`  | `StyleSheet`, `CSSStyleSheet` |

---



## License

Code original to this project is licensed under the CC0-1.0 License.

Code from [abort-controller](https://www.npmjs.com/package/abort-controller) is licensed under the MIT License (MIT), Copyright Toru Nagashima.

Code from [event-target-shim](https://www.npmjs.com/package/event-target-shim) is licensed under the MIT License (MIT), Copyright Toru Nagashima.

Code from [fetch-blob](https://www.npmjs.com/package/fetch-blob) is licensed under the MIT License (MIT), Copyright Jimmy Wärting.

Code from [formdata-polyfill](https://www.npmjs.com/package/formdata-polyfill) is licensed under the MIT License (MIT), Copyright Jimmy Wärting.

Code from [node-fetch](https://www.npmjs.com/package/node-fetch) is licensed under the MIT License (MIT), Copyright Node Fetch Team.

Code from [web-streams-polyfill](https://www.npmjs.com/package/web-streams-polyfill) is licensed under the MIT License (MIT), Copyright Mattias Buelens and Diwank Singh Tomer.
