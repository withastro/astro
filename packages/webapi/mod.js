import {
	setTimeout as setTimeout$1,
	clearTimeout as clearTimeout$1,
} from 'node:timers'
import http from 'node:http'
import https from 'node:https'
import zlib from 'node:zlib'
import Stream, { PassThrough, pipeline as pipeline$1 } from 'node:stream'
import { promisify, deprecate, types } from 'node:util'
import { format as format$1 } from 'node:url'
import { isIP } from 'node:net'
import { performance } from 'node:perf_hooks'

/** Returns the function bound to the given object. */
const __function_bind = Function.bind.bind(Function.call)
/** Returns the function called with the specified values. */
Function.call.bind(Function.call)
/** Returns whether an object has a property with the specified name. */
const __object_hasOwnProperty = Function.call.bind(
	Object.prototype.hasOwnProperty
)
/** Returns a string representation of an object. */
Function.call.bind(Object.prototype.toString)
/** Returns whether the object prototype exists in another object. */
const __object_isPrototypeOf = Function.call.bind(
	Object.prototype.isPrototypeOf
)
/** Current high resolution millisecond timestamp. */
const __performance_now = performance.now
/** Returns the string escaped for use inside regular expressions. */
const __string_escapeRegExp = (value) =>
	value.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
// @ts-ignore
const INTERNALS$3 = new WeakMap()
const internalsOf = (target, className, propName) => {
	const internals = INTERNALS$3.get(target)
	if (!internals)
		throw new TypeError(
			`${className}.${propName} can only be used on instances of ${className}`
		)
	return internals
}
const allowStringTag = (value) =>
	(value.prototype[Symbol.toStringTag] = value.name)
/** Returns any kind of path as a posix path. */
const pathToPosix = (pathname) =>
	String(pathname == null ? '' : pathname)
		.replace(
			// convert slashes
			/\\+/g,
			'/'
		)
		.replace(
			// prefix a slash to drive letters
			/^(?=[A-Za-z]:\/)/,
			'/'
		)
		.replace(
			// encode path characters
			/%/g,
			'%25'
		)
		.replace(/\n/g, '%0A')
		.replace(/\r/g, '%0D')
		.replace(/\t/g, '%09')

class DOMException extends Error {
	constructor(message = '', name = 'Error') {
		super(message)
		this.code = 0
		this.name = name
	}
}
DOMException.INDEX_SIZE_ERR = 1
DOMException.DOMSTRING_SIZE_ERR = 2
DOMException.HIERARCHY_REQUEST_ERR = 3
DOMException.WRONG_DOCUMENT_ERR = 4
DOMException.INVALID_CHARACTER_ERR = 5
DOMException.NO_DATA_ALLOWED_ERR = 6
DOMException.NO_MODIFICATION_ALLOWED_ERR = 7
DOMException.NOT_FOUND_ERR = 8
DOMException.NOT_SUPPORTED_ERR = 9
DOMException.INUSE_ATTRIBUTE_ERR = 10
DOMException.INVALID_STATE_ERR = 11
DOMException.SYNTAX_ERR = 12
DOMException.INVALID_MODIFICATION_ERR = 13
DOMException.NAMESPACE_ERR = 14
DOMException.INVALID_ACCESS_ERR = 15
DOMException.VALIDATION_ERR = 16
DOMException.TYPE_MISMATCH_ERR = 17
DOMException.SECURITY_ERR = 18
DOMException.NETWORK_ERR = 19
DOMException.ABORT_ERR = 20
DOMException.URL_MISMATCH_ERR = 21
DOMException.QUOTA_EXCEEDED_ERR = 22
DOMException.TIMEOUT_ERR = 23
DOMException.INVALID_NODE_TYPE_ERR = 24
DOMException.DATA_CLONE_ERR = 25
allowStringTag(DOMException)

/**
 * Assert a condition.
 * @param condition The condition that it should satisfy.
 * @param message The error message.
 * @param args The arguments for replacing placeholders in the message.
 */
function assertType(condition, message, ...args) {
	if (!condition) {
		throw new TypeError(format(message, args))
	}
}
/**
 * Convert a text and arguments to one string.
 * @param message The formating text
 * @param args The arguments.
 */
function format(message, args) {
	let i = 0
	return message.replace(/%[os]/gu, () => anyToString(args[i++]))
}
/**
 * Convert a value to a string representation.
 * @param x The value to get the string representation.
 */
function anyToString(x) {
	if (typeof x !== 'object' || x === null) {
		return String(x)
	}
	return Object.prototype.toString.call(x)
}

let currentErrorHandler
/**
 * Print a error message.
 * @param maybeError The error object.
 */
function reportError(maybeError) {
	try {
		const error =
			maybeError instanceof Error
				? maybeError
				: new Error(anyToString(maybeError))
		// Call the user-defined error handler if exists.
		if (currentErrorHandler);
		// Dispatch an `error` event if this is on a browser.
		if (
			typeof dispatchEvent === 'function' &&
			typeof ErrorEvent === 'function'
		) {
			dispatchEvent(new ErrorEvent('error', { error, message: error.message }))
		}
		// Emit an `uncaughtException` event if this is on Node.js.
		//istanbul ignore else
		else if (
			typeof process !== 'undefined' &&
			typeof process.emit === 'function'
		) {
			process.emit('uncaughtException', error)
			return
		}
		// Otherwise, print the error.
		console.error(error)
	} catch (_a) {
		// ignore.
	}
}

let currentWarnHandler
/**
 * The warning information.
 */
class Warning {
	constructor(code, message) {
		this.code = code
		this.message = message
	}
	/**
	 * Report this warning.
	 * @param args The arguments of the warning.
	 */
	warn(...args) {
		var _a
		try {
			// Call the user-defined warning handler if exists.
			if (currentWarnHandler);
			// Otherwise, print the warning.
			const stack = (
				(_a = new Error().stack) !== null && _a !== void 0 ? _a : ''
			).replace(/^(?:.+?\n){2}/gu, '\n')
			console.warn(this.message, ...args, stack)
		} catch (_b) {
			// Ignore.
		}
	}
}

const InitEventWasCalledWhileDispatching = new Warning(
	'W01',
	'Unable to initialize event under dispatching.'
)
const FalsyWasAssignedToCancelBubble = new Warning(
	'W02',
	"Assigning any falsy value to 'cancelBubble' property has no effect."
)
const TruthyWasAssignedToReturnValue = new Warning(
	'W03',
	"Assigning any truthy value to 'returnValue' property has no effect."
)
const NonCancelableEventWasCanceled = new Warning(
	'W04',
	'Unable to preventDefault on non-cancelable events.'
)
const CanceledInPassiveListener = new Warning(
	'W05',
	'Unable to preventDefault inside passive event listener invocation.'
)
const EventListenerWasDuplicated = new Warning(
	'W06',
	"An event listener wasn't added because it has been added already: %o, %o"
)
const OptionWasIgnored = new Warning(
	'W07',
	"The %o option value was abandoned because the event listener wasn't added as duplicated."
)
const InvalidEventListener = new Warning(
	'W08',
	"The 'callback' argument must be a function or an object that has 'handleEvent' method: %o"
)
const InvalidAttributeHandler = new Warning(
	'W09',
	'Event attribute handler must be a function: %o'
)

/*eslint-disable class-methods-use-this */
/**
 * An implementation of `Event` interface, that wraps a given event object.
 * `EventTarget` shim can control the internal state of this `Event` objects.
 * @see https://dom.spec.whatwg.org/#event
 */
class Event {
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-none
	 */
	static get NONE() {
		return NONE
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-capturing_phase
	 */
	static get CAPTURING_PHASE() {
		return CAPTURING_PHASE
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-at_target
	 */
	static get AT_TARGET() {
		return AT_TARGET
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-bubbling_phase
	 */
	static get BUBBLING_PHASE() {
		return BUBBLING_PHASE
	}
	/**
	 * Initialize this event instance.
	 * @param type The type of this event.
	 * @param eventInitDict Options to initialize.
	 * @see https://dom.spec.whatwg.org/#dom-event-event
	 */
	constructor(type, eventInitDict) {
		Object.defineProperty(this, 'isTrusted', {
			value: false,
			enumerable: true,
		})
		const opts =
			eventInitDict !== null && eventInitDict !== void 0 ? eventInitDict : {}
		internalDataMap.set(this, {
			type: String(type),
			bubbles: Boolean(opts.bubbles),
			cancelable: Boolean(opts.cancelable),
			composed: Boolean(opts.composed),
			target: null,
			currentTarget: null,
			stopPropagationFlag: false,
			stopImmediatePropagationFlag: false,
			canceledFlag: false,
			inPassiveListenerFlag: false,
			dispatchFlag: false,
			timeStamp: Date.now(),
		})
	}
	/**
	 * The type of this event.
	 * @see https://dom.spec.whatwg.org/#dom-event-type
	 */
	get type() {
		return $(this).type
	}
	/**
	 * The event target of the current dispatching.
	 * @see https://dom.spec.whatwg.org/#dom-event-target
	 */
	get target() {
		return $(this).target
	}
	/**
	 * The event target of the current dispatching.
	 * @deprecated Use the `target` property instead.
	 * @see https://dom.spec.whatwg.org/#dom-event-srcelement
	 */
	get srcElement() {
		return $(this).target
	}
	/**
	 * The event target of the current dispatching.
	 * @see https://dom.spec.whatwg.org/#dom-event-currenttarget
	 */
	get currentTarget() {
		return $(this).currentTarget
	}
	/**
	 * The event target of the current dispatching.
	 * This doesn't support node tree.
	 * @see https://dom.spec.whatwg.org/#dom-event-composedpath
	 */
	composedPath() {
		const currentTarget = $(this).currentTarget
		if (currentTarget) {
			return [currentTarget]
		}
		return []
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-none
	 */
	get NONE() {
		return NONE
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-capturing_phase
	 */
	get CAPTURING_PHASE() {
		return CAPTURING_PHASE
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-at_target
	 */
	get AT_TARGET() {
		return AT_TARGET
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-bubbling_phase
	 */
	get BUBBLING_PHASE() {
		return BUBBLING_PHASE
	}
	/**
	 * The current event phase.
	 * @see https://dom.spec.whatwg.org/#dom-event-eventphase
	 */
	get eventPhase() {
		return $(this).dispatchFlag ? 2 : 0
	}
	/**
	 * Stop event bubbling.
	 * Because this shim doesn't support node tree, this merely changes the `cancelBubble` property value.
	 * @see https://dom.spec.whatwg.org/#dom-event-stoppropagation
	 */
	stopPropagation() {
		$(this).stopPropagationFlag = true
	}
	/**
	 * `true` if event bubbling was stopped.
	 * @deprecated
	 * @see https://dom.spec.whatwg.org/#dom-event-cancelbubble
	 */
	get cancelBubble() {
		return $(this).stopPropagationFlag
	}
	/**
	 * Stop event bubbling if `true` is set.
	 * @deprecated Use the `stopPropagation()` method instead.
	 * @see https://dom.spec.whatwg.org/#dom-event-cancelbubble
	 */
	set cancelBubble(value) {
		if (value) {
			$(this).stopPropagationFlag = true
		} else {
			FalsyWasAssignedToCancelBubble.warn()
		}
	}
	/**
	 * Stop event bubbling and subsequent event listener callings.
	 * @see https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
	 */
	stopImmediatePropagation() {
		const data = $(this)
		data.stopPropagationFlag = data.stopImmediatePropagationFlag = true
	}
	/**
	 * `true` if this event will bubble.
	 * @see https://dom.spec.whatwg.org/#dom-event-bubbles
	 */
	get bubbles() {
		return $(this).bubbles
	}
	/**
	 * `true` if this event can be canceled by the `preventDefault()` method.
	 * @see https://dom.spec.whatwg.org/#dom-event-cancelable
	 */
	get cancelable() {
		return $(this).cancelable
	}
	/**
	 * `true` if the default behavior will act.
	 * @deprecated Use the `defaultPrevented` proeprty instead.
	 * @see https://dom.spec.whatwg.org/#dom-event-returnvalue
	 */
	get returnValue() {
		return !$(this).canceledFlag
	}
	/**
	 * Cancel the default behavior if `false` is set.
	 * @deprecated Use the `preventDefault()` method instead.
	 * @see https://dom.spec.whatwg.org/#dom-event-returnvalue
	 */
	set returnValue(value) {
		if (!value) {
			setCancelFlag($(this))
		} else {
			TruthyWasAssignedToReturnValue.warn()
		}
	}
	/**
	 * Cancel the default behavior.
	 * @see https://dom.spec.whatwg.org/#dom-event-preventdefault
	 */
	preventDefault() {
		setCancelFlag($(this))
	}
	/**
	 * `true` if the default behavior was canceled.
	 * @see https://dom.spec.whatwg.org/#dom-event-defaultprevented
	 */
	get defaultPrevented() {
		return $(this).canceledFlag
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-composed
	 */
	get composed() {
		return $(this).composed
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-istrusted
	 */
	//istanbul ignore next
	get isTrusted() {
		return false
	}
	/**
	 * @see https://dom.spec.whatwg.org/#dom-event-timestamp
	 */
	get timeStamp() {
		return $(this).timeStamp
	}
	/**
	 * @deprecated Don't use this method. The constructor did initialization.
	 */
	initEvent(type, bubbles = false, cancelable = false) {
		const data = $(this)
		if (data.dispatchFlag) {
			InitEventWasCalledWhileDispatching.warn()
			return
		}
		internalDataMap.set(this, {
			...data,
			type: String(type),
			bubbles: Boolean(bubbles),
			cancelable: Boolean(cancelable),
			target: null,
			currentTarget: null,
			stopPropagationFlag: false,
			stopImmediatePropagationFlag: false,
			canceledFlag: false,
		})
	}
}
//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
const NONE = 0
const CAPTURING_PHASE = 1
const AT_TARGET = 2
const BUBBLING_PHASE = 3
/**
 * Private data for event wrappers.
 */
const internalDataMap = new WeakMap()
/**
 * Get private data.
 * @param event The event object to get private data.
 * @param name The variable name to report.
 * @returns The private data of the event.
 */
function $(event, name = 'this') {
	const retv = internalDataMap.get(event)
	assertType(
		retv != null,
		"'%s' must be an object that Event constructor created, but got another one: %o",
		name,
		event
	)
	return retv
}
/**
 * https://dom.spec.whatwg.org/#set-the-canceled-flag
 * @param data private data.
 */
function setCancelFlag(data) {
	if (data.inPassiveListenerFlag) {
		CanceledInPassiveListener.warn()
		return
	}
	if (!data.cancelable) {
		NonCancelableEventWasCanceled.warn()
		return
	}
	data.canceledFlag = true
}
// Set enumerable
Object.defineProperty(Event, 'NONE', { enumerable: true })
Object.defineProperty(Event, 'CAPTURING_PHASE', { enumerable: true })
Object.defineProperty(Event, 'AT_TARGET', { enumerable: true })
Object.defineProperty(Event, 'BUBBLING_PHASE', { enumerable: true })
const keys$1 = Object.getOwnPropertyNames(Event.prototype)
for (let i = 0; i < keys$1.length; ++i) {
	if (keys$1[i] === 'constructor') {
		continue
	}
	Object.defineProperty(Event.prototype, keys$1[i], { enumerable: true })
}

/**
 * An implementation of `Event` interface, that wraps a given event object.
 * This class controls the internal state of `Event`.
 * @see https://dom.spec.whatwg.org/#interface-event
 */
class EventWrapper extends Event {
	/**
	 * Wrap a given event object to control states.
	 * @param event The event-like object to wrap.
	 */
	static wrap(event) {
		return new (getWrapperClassOf(event))(event)
	}
	constructor(event) {
		super(event.type, {
			bubbles: event.bubbles,
			cancelable: event.cancelable,
			composed: event.composed,
		})
		if (event.cancelBubble) {
			super.stopPropagation()
		}
		if (event.defaultPrevented) {
			super.preventDefault()
		}
		internalDataMap$1.set(this, { original: event })
		// Define accessors
		const keys = Object.keys(event)
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i]
			if (!(key in this)) {
				Object.defineProperty(this, key, defineRedirectDescriptor(event, key))
			}
		}
	}
	stopPropagation() {
		super.stopPropagation()
		const { original } = $$1(this)
		if ('stopPropagation' in original) {
			original.stopPropagation()
		}
	}
	get cancelBubble() {
		return super.cancelBubble
	}
	set cancelBubble(value) {
		super.cancelBubble = value
		const { original } = $$1(this)
		if ('cancelBubble' in original) {
			original.cancelBubble = value
		}
	}
	stopImmediatePropagation() {
		super.stopImmediatePropagation()
		const { original } = $$1(this)
		if ('stopImmediatePropagation' in original) {
			original.stopImmediatePropagation()
		}
	}
	get returnValue() {
		return super.returnValue
	}
	set returnValue(value) {
		super.returnValue = value
		const { original } = $$1(this)
		if ('returnValue' in original) {
			original.returnValue = value
		}
	}
	preventDefault() {
		super.preventDefault()
		const { original } = $$1(this)
		if ('preventDefault' in original) {
			original.preventDefault()
		}
	}
	get timeStamp() {
		const { original } = $$1(this)
		if ('timeStamp' in original) {
			return original.timeStamp
		}
		return super.timeStamp
	}
}
/**
 * Private data for event wrappers.
 */
const internalDataMap$1 = new WeakMap()
/**
 * Get private data.
 * @param event The event object to get private data.
 * @returns The private data of the event.
 */
function $$1(event) {
	const retv = internalDataMap$1.get(event)
	assertType(retv != null, "'this' is expected an Event object, but got", event)
	return retv
}
/**
 * Cache for wrapper classes.
 * @type {WeakMap<Object, Function>}
 * @private
 */
const wrapperClassCache = new WeakMap()
// Make association for wrappers.
wrapperClassCache.set(Object.prototype, EventWrapper)
/**
 * Get the wrapper class of a given prototype.
 * @param originalEvent The event object to wrap.
 */
function getWrapperClassOf(originalEvent) {
	const prototype = Object.getPrototypeOf(originalEvent)
	if (prototype == null) {
		return EventWrapper
	}
	let wrapper = wrapperClassCache.get(prototype)
	if (wrapper == null) {
		wrapper = defineWrapper(getWrapperClassOf(prototype), prototype)
		wrapperClassCache.set(prototype, wrapper)
	}
	return wrapper
}
/**
 * Define new wrapper class.
 * @param BaseEventWrapper The base wrapper class.
 * @param originalPrototype The prototype of the original event.
 */
function defineWrapper(BaseEventWrapper, originalPrototype) {
	class CustomEventWrapper extends BaseEventWrapper {}
	const keys = Object.keys(originalPrototype)
	for (let i = 0; i < keys.length; ++i) {
		Object.defineProperty(
			CustomEventWrapper.prototype,
			keys[i],
			defineRedirectDescriptor(originalPrototype, keys[i])
		)
	}
	return CustomEventWrapper
}
/**
 * Get the property descriptor to redirect a given property.
 */
function defineRedirectDescriptor(obj, key) {
	const d = Object.getOwnPropertyDescriptor(obj, key)
	return {
		get() {
			const original = $$1(this).original
			const value = original[key]
			if (typeof value === 'function') {
				return value.bind(original)
			}
			return value
		},
		set(value) {
			const original = $$1(this).original
			original[key] = value
		},
		configurable: d.configurable,
		enumerable: d.enumerable,
	}
}

/**
 * Create a new listener.
 * @param callback The callback function.
 * @param capture The capture flag.
 * @param passive The passive flag.
 * @param once The once flag.
 * @param signal The abort signal.
 * @param signalListener The abort event listener for the abort signal.
 */
function createListener(
	callback,
	capture,
	passive,
	once,
	signal,
	signalListener
) {
	return {
		callback,
		flags:
			(capture ? 1 /* Capture */ : 0) |
			(passive ? 2 /* Passive */ : 0) |
			(once ? 4 /* Once */ : 0),
		signal,
		signalListener,
	}
}
/**
 * Set the `removed` flag to the given listener.
 * @param listener The listener to check.
 */
function setRemoved(listener) {
	listener.flags |= 8 /* Removed */
}
/**
 * Check if the given listener has the `capture` flag or not.
 * @param listener The listener to check.
 */
function isCapture(listener) {
	return (listener.flags & 1) /* Capture */ === 1 /* Capture */
}
/**
 * Check if the given listener has the `passive` flag or not.
 * @param listener The listener to check.
 */
function isPassive(listener) {
	return (listener.flags & 2) /* Passive */ === 2 /* Passive */
}
/**
 * Check if the given listener has the `once` flag or not.
 * @param listener The listener to check.
 */
function isOnce(listener) {
	return (listener.flags & 4) /* Once */ === 4 /* Once */
}
/**
 * Check if the given listener has the `removed` flag or not.
 * @param listener The listener to check.
 */
function isRemoved(listener) {
	return (listener.flags & 8) /* Removed */ === 8 /* Removed */
}
/**
 * Call an event listener.
 * @param listener The listener to call.
 * @param target The event target object for `thisArg`.
 * @param event The event object for the first argument.
 * @param attribute `true` if this callback is an event attribute handler.
 */
function invokeCallback({ callback }, target, event) {
	try {
		if (typeof callback === 'function') {
			callback.call(target, event)
		} else if (typeof callback.handleEvent === 'function') {
			callback.handleEvent(event)
		}
	} catch (thrownError) {
		reportError(thrownError)
	}
}

/**
 * Find the index of given listener.
 * This returns `-1` if not found.
 * @param list The listener list.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 */
function findIndexOfListener({ listeners }, callback, capture) {
	for (let i = 0; i < listeners.length; ++i) {
		if (
			listeners[i].callback === callback &&
			isCapture(listeners[i]) === capture
		) {
			return i
		}
	}
	return -1
}
/**
 * Add the given listener.
 * Does copy-on-write if needed.
 * @param list The listener list.
 * @param callback The callback function.
 * @param capture The capture flag.
 * @param passive The passive flag.
 * @param once The once flag.
 * @param signal The abort signal.
 */
function addListener(list, callback, capture, passive, once, signal) {
	let signalListener
	if (signal) {
		signalListener = removeListener.bind(null, list, callback, capture)
		signal.addEventListener('abort', signalListener)
	}
	const listener = createListener(
		callback,
		capture,
		passive,
		once,
		signal,
		signalListener
	)
	if (list.cow) {
		list.cow = false
		list.listeners = [...list.listeners, listener]
	} else {
		list.listeners.push(listener)
	}
	return listener
}
/**
 * Remove a listener.
 * @param list The listener list.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 * @returns `true` if it mutated the list directly.
 */
function removeListener(list, callback, capture) {
	const index = findIndexOfListener(list, callback, capture)
	if (index !== -1) {
		return removeListenerAt(list, index)
	}
	return false
}
/**
 * Remove a listener.
 * @param list The listener list.
 * @param index The index of the target listener.
 * @param disableCow Disable copy-on-write if true.
 * @returns `true` if it mutated the `listeners` array directly.
 */
function removeListenerAt(list, index, disableCow = false) {
	const listener = list.listeners[index]
	// Set the removed flag.
	setRemoved(listener)
	// Dispose the abort signal listener if exists.
	if (listener.signal) {
		listener.signal.removeEventListener('abort', listener.signalListener)
	}
	// Remove it from the array.
	if (list.cow && !disableCow) {
		list.cow = false
		list.listeners = list.listeners.filter((_, i) => i !== index)
		return false
	}
	list.listeners.splice(index, 1)
	return true
}

/**
 * Create a new `ListenerListMap` object.
 */
function createListenerListMap() {
	return Object.create(null)
}
/**
 * Get the listener list of the given type.
 * If the listener list has not been initialized, initialize and return it.
 * @param listenerMap The listener list map.
 * @param type The event type to get.
 */
function ensureListenerList(listenerMap, type) {
	var _a
	return (_a = listenerMap[type]) !== null && _a !== void 0
		? _a
		: (listenerMap[type] = {
				attrCallback: undefined,
				attrListener: undefined,
				cow: false,
				listeners: [],
		  })
}

/**
 * An implementation of the `EventTarget` interface.
 * @see https://dom.spec.whatwg.org/#eventtarget
 */
class EventTarget {
	/**
	 * Initialize this instance.
	 */
	constructor() {
		internalDataMap$2.set(this, createListenerListMap())
	}
	// Implementation
	addEventListener(type0, callback0, options0) {
		const listenerMap = $$2(this)
		const { callback, capture, once, passive, signal, type } =
			normalizeAddOptions(type0, callback0, options0)
		if (
			callback == null ||
			(signal === null || signal === void 0 ? void 0 : signal.aborted)
		) {
			return
		}
		const list = ensureListenerList(listenerMap, type)
		// Find existing listener.
		const i = findIndexOfListener(list, callback, capture)
		if (i !== -1) {
			warnDuplicate(list.listeners[i], passive, once, signal)
			return
		}
		// Add the new listener.
		addListener(list, callback, capture, passive, once, signal)
	}
	// Implementation
	removeEventListener(type0, callback0, options0) {
		const listenerMap = $$2(this)
		const { callback, capture, type } = normalizeOptions(
			type0,
			callback0,
			options0
		)
		const list = listenerMap[type]
		if (callback != null && list) {
			removeListener(list, callback, capture)
		}
	}
	// Implementation
	dispatchEvent(e) {
		const list = $$2(this)[String(e.type)]
		if (list == null) {
			return true
		}
		const event = e instanceof Event ? e : EventWrapper.wrap(e)
		const eventData = $(event, 'event')
		if (eventData.dispatchFlag) {
			throw new DOMException('This event has been in dispatching.')
		}
		eventData.dispatchFlag = true
		eventData.target = eventData.currentTarget = this
		if (!eventData.stopPropagationFlag) {
			const { cow, listeners } = list
			// Set copy-on-write flag.
			list.cow = true
			// Call listeners.
			for (let i = 0; i < listeners.length; ++i) {
				const listener = listeners[i]
				// Skip if removed.
				if (isRemoved(listener)) {
					continue
				}
				// Remove this listener if has the `once` flag.
				if (isOnce(listener) && removeListenerAt(list, i, !cow)) {
					// Because this listener was removed, the next index is the
					// same as the current value.
					i -= 1
				}
				// Call this listener with the `passive` flag.
				eventData.inPassiveListenerFlag = isPassive(listener)
				invokeCallback(listener, this, event)
				eventData.inPassiveListenerFlag = false
				// Stop if the `event.stopImmediatePropagation()` method was called.
				if (eventData.stopImmediatePropagationFlag) {
					break
				}
			}
			// Restore copy-on-write flag.
			if (!cow) {
				list.cow = false
			}
		}
		eventData.target = null
		eventData.currentTarget = null
		eventData.stopImmediatePropagationFlag = false
		eventData.stopPropagationFlag = false
		eventData.dispatchFlag = false
		return !eventData.canceledFlag
	}
}
/**
 * Internal data.
 */
const internalDataMap$2 = new WeakMap()
/**
 * Get private data.
 * @param target The event target object to get private data.
 * @param name The variable name to report.
 * @returns The private data of the event.
 */
function $$2(target, name = 'this') {
	const retv = internalDataMap$2.get(target)
	assertType(
		retv != null,
		"'%s' must be an object that EventTarget constructor created, but got another one: %o",
		name,
		target
	)
	return retv
}
/**
 * Normalize options.
 * @param options The options to normalize.
 */
function normalizeAddOptions(type, callback, options) {
	var _a
	assertCallback(callback)
	if (typeof options === 'object' && options !== null) {
		return {
			type: String(type),
			callback: callback !== null && callback !== void 0 ? callback : undefined,
			capture: Boolean(options.capture),
			passive: Boolean(options.passive),
			once: Boolean(options.once),
			signal: (_a = options.signal) !== null && _a !== void 0 ? _a : undefined,
		}
	}
	return {
		type: String(type),
		callback: callback !== null && callback !== void 0 ? callback : undefined,
		capture: Boolean(options),
		passive: false,
		once: false,
		signal: undefined,
	}
}
/**
 * Normalize options.
 * @param options The options to normalize.
 */
function normalizeOptions(type, callback, options) {
	assertCallback(callback)
	if (typeof options === 'object' && options !== null) {
		return {
			type: String(type),
			callback: callback !== null && callback !== void 0 ? callback : undefined,
			capture: Boolean(options.capture),
		}
	}
	return {
		type: String(type),
		callback: callback !== null && callback !== void 0 ? callback : undefined,
		capture: Boolean(options),
	}
}
/**
 * Assert the type of 'callback' argument.
 * @param callback The callback to check.
 */
function assertCallback(callback) {
	if (
		typeof callback === 'function' ||
		(typeof callback === 'object' &&
			callback !== null &&
			typeof callback.handleEvent === 'function')
	) {
		return
	}
	if (callback == null || typeof callback === 'object') {
		InvalidEventListener.warn(callback)
		return
	}
	throw new TypeError(format(InvalidEventListener.message, [callback]))
}
/**
 * Print warning for duplicated.
 * @param listener The current listener that is duplicated.
 * @param passive The passive flag of the new duplicated listener.
 * @param once The once flag of the new duplicated listener.
 * @param signal The signal object of the new duplicated listener.
 */
function warnDuplicate(listener, passive, once, signal) {
	EventListenerWasDuplicated.warn(
		isCapture(listener) ? 'capture' : 'bubble',
		listener.callback
	)
	if (isPassive(listener) !== passive) {
		OptionWasIgnored.warn('passive')
	}
	if (isOnce(listener) !== once) {
		OptionWasIgnored.warn('once')
	}
	if (listener.signal !== signal) {
		OptionWasIgnored.warn('signal')
	}
}
// Set enumerable
const keys$1$1 = Object.getOwnPropertyNames(EventTarget.prototype)
for (let i = 0; i < keys$1$1.length; ++i) {
	if (keys$1$1[i] === 'constructor') {
		continue
	}
	Object.defineProperty(EventTarget.prototype, keys$1$1[i], {
		enumerable: true,
	})
}
// Ensure `eventTarget instanceof window.EventTarget` is `true`.

/**
 * Get the current value of a given event attribute.
 * @param target The `EventTarget` object to get.
 * @param type The event type.
 */
function getEventAttributeValue(target, type) {
	var _a, _b
	const listMap = $$2(target, 'target')
	return (_b =
		(_a = listMap[type]) === null || _a === void 0
			? void 0
			: _a.attrCallback) !== null && _b !== void 0
		? _b
		: null
}
/**
 * Set an event listener to a given event attribute.
 * @param target The `EventTarget` object to set.
 * @param type The event type.
 * @param callback The event listener.
 */
function setEventAttributeValue(target, type, callback) {
	if (callback != null && typeof callback !== 'function') {
		InvalidAttributeHandler.warn(callback)
	}
	if (
		typeof callback === 'function' ||
		(typeof callback === 'object' && callback !== null)
	) {
		upsertEventAttributeListener(target, type, callback)
	} else {
		removeEventAttributeListener(target, type)
	}
}
//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
/**
 * Update or insert the given event attribute handler.
 * @param target The `EventTarget` object to set.
 * @param type The event type.
 * @param callback The event listener.
 */
function upsertEventAttributeListener(target, type, callback) {
	const list = ensureListenerList($$2(target, 'target'), String(type))
	list.attrCallback = callback
	if (list.attrListener == null) {
		list.attrListener = addListener(
			list,
			defineEventAttributeCallback(list),
			false,
			false,
			false,
			undefined
		)
	}
}
/**
 * Remove the given event attribute handler.
 * @param target The `EventTarget` object to remove.
 * @param type The event type.
 * @param callback The event listener.
 */
function removeEventAttributeListener(target, type) {
	const listMap = $$2(target, 'target')
	const list = listMap[String(type)]
	if (list && list.attrListener) {
		removeListener(list, list.attrListener.callback, false)
		list.attrCallback = list.attrListener = undefined
	}
}
/**
 * Define the callback function for the given listener list object.
 * It calls `attrCallback` property if the property value is a function.
 * @param list The `ListenerList` object.
 */
function defineEventAttributeCallback(list) {
	return function (event) {
		const callback = list.attrCallback
		if (typeof callback === 'function') {
			callback.call(this, event)
		}
	}
}
/**
 * Define an event attribute.
 * @param target The `EventTarget` object to define an event attribute.
 * @param type The event type to define.
 * @param _eventClass Unused, but to infer `Event` class type.
 * @deprecated Use `getEventAttributeValue`/`setEventAttributeValue` pair on your derived class instead because of static analysis friendly.
 */
function defineEventAttribute(target, type, _eventClass) {
	Object.defineProperty(target, `on${type}`, {
		get() {
			return getEventAttributeValue(this, type)
		},
		set(value) {
			setEventAttributeValue(this, type, value)
		},
		configurable: true,
		enumerable: true,
	})
}

/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */

/**
 * The signal class.
 * @see https://dom.spec.whatwg.org/#abortsignal
 */
class AbortSignal extends EventTarget {
	/**
	 * AbortSignal cannot be constructed directly.
	 */
	constructor() {
		super()
		throw new TypeError('AbortSignal cannot be constructed directly')
	}
	/**
	 * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
	 */
	get aborted() {
		const aborted = abortedFlags.get(this)
		if (typeof aborted !== 'boolean') {
			throw new TypeError(
				`Expected 'this' to be an 'AbortSignal' object, but got ${
					this === null ? 'null' : typeof this
				}`
			)
		}
		return aborted
	}
}
defineEventAttribute(AbortSignal.prototype, 'abort')
/**
 * Create an AbortSignal object.
 */
function createAbortSignal() {
	const signal = Object.create(AbortSignal.prototype)
	EventTarget.call(signal)
	abortedFlags.set(signal, false)
	return signal
}
/**
 * Abort a given signal.
 */
function abortSignal(signal) {
	if (abortedFlags.get(signal) !== false) {
		return
	}
	abortedFlags.set(signal, true)
	signal.dispatchEvent({ type: 'abort' })
}
/**
 * Aborted flag for each instances.
 */
const abortedFlags = new WeakMap()
// Properties should be enumerable.
Object.defineProperties(AbortSignal.prototype, {
	aborted: { enumerable: true },
})
// `toString()` should return `"[object AbortSignal]"`
if (typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol') {
	Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
		configurable: true,
		value: 'AbortSignal',
	})
}

/**
 * The AbortController.
 * @see https://dom.spec.whatwg.org/#abortcontroller
 */
class AbortController {
	/**
	 * Initialize this controller.
	 */
	constructor() {
		signals.set(this, createAbortSignal())
	}
	/**
	 * Returns the `AbortSignal` object associated with this object.
	 */
	get signal() {
		return getSignal(this)
	}
	/**
	 * Abort and signal to any observers that the associated activity is to be aborted.
	 */
	abort() {
		abortSignal(getSignal(this))
	}
}
/**
 * Associated signals.
 */
const signals = new WeakMap()
/**
 * Get the associated signal of a given controller.
 */
function getSignal(controller) {
	const signal = signals.get(controller)
	if (signal == null) {
		throw new TypeError(
			`Expected 'this' to be an 'AbortController' object, but got ${
				controller === null ? 'null' : typeof controller
			}`
		)
	}
	return signal
}
// Properties should be enumerable.
Object.defineProperties(AbortController.prototype, {
	signal: { enumerable: true },
	abort: { enumerable: true },
})
if (typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol') {
	Object.defineProperty(AbortController.prototype, Symbol.toStringTag, {
		configurable: true,
		value: 'AbortController',
	})
}

const INTERNAL$2 = { tick: 0, pool: new Map() }
function requestAnimationFrame(callback) {
	if (!INTERNAL$2.pool.size) {
		setTimeout$1(() => {
			const next = __performance_now()
			for (const func of INTERNAL$2.pool.values()) {
				func(next)
			}
			INTERNAL$2.pool.clear()
		}, 1000 / 16)
	}
	const func = __function_bind(callback, undefined)
	const tick = ++INTERNAL$2.tick
	INTERNAL$2.pool.set(tick, func)
	return tick
}
function cancelAnimationFrame(requestId) {
	const timeout = INTERNAL$2.pool.get(requestId)
	if (timeout) {
		clearTimeout$1(timeout)
		INTERNAL$2.pool.delete(requestId)
	}
}

function atob(data) {
	return Buffer.from(data, 'base64').toString('binary')
}
function btoa(data) {
	return Buffer.from(data, 'binary').toString('base64')
}

class Node extends EventTarget {
	append(...nodesOrDOMStrings) {}
	appendChild(childNode) {
		return childNode
	}
	after(...nodesOrDOMStrings) {}
	before(...nodesOrDOMStrings) {}
	prepend(...nodesOrDOMStrings) {}
	replaceChild(newChild, oldChild) {
		return oldChild
	}
	removeChild(childNode) {
		return childNode
	}
	get attributes() {
		return {}
	}
	get childNodes() {
		return []
	}
	get children() {
		return []
	}
	get ownerDocument() {
		return null
	}
	get nodeValue() {
		return ''
	}
	set nodeValue(value) {}
	get textContent() {
		return ''
	}
	set textContent(value) {}
	get previousElementSibling() {
		return null
	}
	get nextElementSibling() {
		return null
	}
	[Symbol.for('nodejs.util.inspect.custom')](depth, options) {
		return `${this.constructor.name}`
	}
}
class DocumentFragment extends Node {}
class ShadowRoot extends DocumentFragment {
	get innerHTML() {
		return ''
	}
	set innerHTML(value) {}
}
const NodeFilter$1 = Object.assign(
	{
		NodeFilter() {
			throw new TypeError('Illegal constructor')
		},
	}.NodeFilter,
	{
		FILTER_ACCEPT: 1,
		FILTER_REJECT: 2,
		FILTER_SKIP: 3,
		SHOW_ALL: 4294967295,
		SHOW_ELEMENT: 1,
		SHOW_ATTRIBUTE: 2,
		SHOW_TEXT: 4,
		SHOW_CDATA_SECTION: 8,
		SHOW_ENTITY_REFERENCE: 16,
		SHOW_ENTITY: 32,
		SHOW_PROCESSING_INSTRUCTION: 64,
		SHOW_COMMENT: 128,
		SHOW_DOCUMENT: 256,
		SHOW_DOCUMENT_TYPE: 512,
		SHOW_DOCUMENT_FRAGMENT: 1024,
		SHOW_NOTATION: 2048,
	}
)
class NodeIterator$1 {
	nextNode() {
		return null
	}
	previousNode() {
		return null
	}
	get filter() {
		const internals = internalsOf(this, 'NodeIterator', 'filter')
		return internals.filter
	}
	get pointerBeforeReferenceNode() {
		const internals = internalsOf(
			this,
			'NodeIterator',
			'pointerBeforeReferenceNode'
		)
		return internals.pointerBeforeReferenceNode
	}
	get referenceNode() {
		const internals = internalsOf(this, 'NodeIterator', 'referenceNode')
		return internals.referenceNode
	}
	get root() {
		const internals = internalsOf(this, 'NodeIterator', 'root')
		return internals.root
	}
	get whatToShow() {
		const internals = internalsOf(this, 'NodeIterator', 'whatToShow')
		return internals.whatToShow
	}
}
allowStringTag(Node)
allowStringTag(NodeIterator$1)
allowStringTag(DocumentFragment)
allowStringTag(ShadowRoot)

class CharacterData extends Node {
	constructor(data) {
		INTERNALS$3.set(super(), {
			data: String(data),
		})
	}
	get data() {
		return internalsOf(this, 'CharacterData', 'data').data
	}
	get textContent() {
		return internalsOf(this, 'CharacterData', 'textContent').data
	}
}
class Comment extends CharacterData {}
class Text extends CharacterData {
	get assignedSlot() {
		return null
	}
	get wholeText() {
		return internalsOf(this, 'CharacterData', 'textContent').data
	}
}
allowStringTag(CharacterData)
allowStringTag(Text)
allowStringTag(Comment)

/**
 * web-streams-polyfill v3.2.0
 */
/// <reference lib="es2015.symbol" />
const SymbolPolyfill = Symbol

/// <reference lib="dom" />
function noop$1() {
	return undefined
}

function typeIsObject(x) {
	return (typeof x === 'object' && x !== null) || typeof x === 'function'
}
const rethrowAssertionErrorRejection = noop$1

const originalPromise = Promise
const originalPromiseThen = Promise.prototype.then
const originalPromiseResolve = Promise.resolve.bind(originalPromise)
const originalPromiseReject = Promise.reject.bind(originalPromise)
function newPromise(executor) {
	return new originalPromise(executor)
}
function promiseResolvedWith(value) {
	return originalPromiseResolve(value)
}
function promiseRejectedWith(reason) {
	return originalPromiseReject(reason)
}
function PerformPromiseThen(promise, onFulfilled, onRejected) {
	// There doesn't appear to be any way to correctly emulate the behaviour from JavaScript, so this is just an
	// approximation.
	return originalPromiseThen.call(promise, onFulfilled, onRejected)
}
function uponPromise(promise, onFulfilled, onRejected) {
	PerformPromiseThen(
		PerformPromiseThen(promise, onFulfilled, onRejected),
		undefined,
		rethrowAssertionErrorRejection
	)
}
function uponFulfillment(promise, onFulfilled) {
	uponPromise(promise, onFulfilled)
}
function uponRejection(promise, onRejected) {
	uponPromise(promise, undefined, onRejected)
}
function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
	return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler)
}
function setPromiseIsHandledToTrue(promise) {
	PerformPromiseThen(promise, undefined, rethrowAssertionErrorRejection)
}
function reflectCall(F, V, args) {
	if (typeof F !== 'function') {
		throw new TypeError('Argument is not a function')
	}
	return Function.prototype.apply.call(F, V, args)
}
function promiseCall(F, V, args) {
	try {
		return promiseResolvedWith(reflectCall(F, V, args))
	} catch (value) {
		return promiseRejectedWith(value)
	}
}

// Original from Chromium
// https://chromium.googlesource.com/chromium/src/+/0aee4434a4dba42a42abaea9bfbc0cd196a63bc1/third_party/blink/renderer/core/streams/SimpleQueue.js
const QUEUE_MAX_ARRAY_SIZE = 16384
/**
 * Simple queue structure.
 *
 * Avoids scalability issues with using a packed array directly by using
 * multiple arrays in a linked list and keeping the array size bounded.
 */
class SimpleQueue {
	constructor() {
		this._cursor = 0
		this._size = 0
		// _front and _back are always defined.
		this._front = {
			_elements: [],
			_next: undefined,
		}
		this._back = this._front
		// The cursor is used to avoid calling Array.shift().
		// It contains the index of the front element of the array inside the
		// front-most node. It is always in the range [0, QUEUE_MAX_ARRAY_SIZE).
		this._cursor = 0
		// When there is only one node, size === elements.length - cursor.
		this._size = 0
	}
	get length() {
		return this._size
	}
	// For exception safety, this method is structured in order:
	// 1. Read state
	// 2. Calculate required state mutations
	// 3. Perform state mutations
	push(element) {
		const oldBack = this._back
		let newBack = oldBack
		if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
			newBack = {
				_elements: [],
				_next: undefined,
			}
		}
		// push() is the mutation most likely to throw an exception, so it
		// goes first.
		oldBack._elements.push(element)
		if (newBack !== oldBack) {
			this._back = newBack
			oldBack._next = newBack
		}
		++this._size
	}
	// Like push(), shift() follows the read -> calculate -> mutate pattern for
	// exception safety.
	shift() {
		// must not be called on an empty queue
		const oldFront = this._front
		let newFront = oldFront
		const oldCursor = this._cursor
		let newCursor = oldCursor + 1
		const elements = oldFront._elements
		const element = elements[oldCursor]
		if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
			newFront = oldFront._next
			newCursor = 0
		}
		// No mutations before this point.
		--this._size
		this._cursor = newCursor
		if (oldFront !== newFront) {
			this._front = newFront
		}
		// Permit shifted element to be garbage collected.
		elements[oldCursor] = undefined
		return element
	}
	// The tricky thing about forEach() is that it can be called
	// re-entrantly. The queue may be mutated inside the callback. It is easy to
	// see that push() within the callback has no negative effects since the end
	// of the queue is checked for on every iteration. If shift() is called
	// repeatedly within the callback then the next iteration may return an
	// element that has been removed. In this case the callback will be called
	// with undefined values until we either "catch up" with elements that still
	// exist or reach the back of the queue.
	forEach(callback) {
		let i = this._cursor
		let node = this._front
		let elements = node._elements
		while (i !== elements.length || node._next !== undefined) {
			if (i === elements.length) {
				node = node._next
				elements = node._elements
				i = 0
				if (elements.length === 0) {
					break
				}
			}
			callback(elements[i])
			++i
		}
	}
	// Return the element that would be returned if shift() was called now,
	// without modifying the queue.
	peek() {
		// must not be called on an empty queue
		const front = this._front
		const cursor = this._cursor
		return front._elements[cursor]
	}
}

function ReadableStreamReaderGenericInitialize(reader, stream) {
	reader._ownerReadableStream = stream
	stream._reader = reader
	if (stream._state === 'readable') {
		defaultReaderClosedPromiseInitialize(reader)
	} else if (stream._state === 'closed') {
		defaultReaderClosedPromiseInitializeAsResolved(reader)
	} else {
		defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError)
	}
}
// A client of ReadableStreamDefaultReader and ReadableStreamBYOBReader may use these functions directly to bypass state
// check.
function ReadableStreamReaderGenericCancel(reader, reason) {
	const stream = reader._ownerReadableStream
	return ReadableStreamCancel(stream, reason)
}
function ReadableStreamReaderGenericRelease(reader) {
	if (reader._ownerReadableStream._state === 'readable') {
		defaultReaderClosedPromiseReject(
			reader,
			new TypeError(
				`Reader was released and can no longer be used to monitor the stream's closedness`
			)
		)
	} else {
		defaultReaderClosedPromiseResetToRejected(
			reader,
			new TypeError(
				`Reader was released and can no longer be used to monitor the stream's closedness`
			)
		)
	}
	reader._ownerReadableStream._reader = undefined
	reader._ownerReadableStream = undefined
}
// Helper functions for the readers.
function readerLockException(name) {
	return new TypeError('Cannot ' + name + ' a stream using a released reader')
}
// Helper functions for the ReadableStreamDefaultReader.
function defaultReaderClosedPromiseInitialize(reader) {
	reader._closedPromise = newPromise((resolve, reject) => {
		reader._closedPromise_resolve = resolve
		reader._closedPromise_reject = reject
	})
}
function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
	defaultReaderClosedPromiseInitialize(reader)
	defaultReaderClosedPromiseReject(reader, reason)
}
function defaultReaderClosedPromiseInitializeAsResolved(reader) {
	defaultReaderClosedPromiseInitialize(reader)
	defaultReaderClosedPromiseResolve(reader)
}
function defaultReaderClosedPromiseReject(reader, reason) {
	if (reader._closedPromise_reject === undefined) {
		return
	}
	setPromiseIsHandledToTrue(reader._closedPromise)
	reader._closedPromise_reject(reason)
	reader._closedPromise_resolve = undefined
	reader._closedPromise_reject = undefined
}
function defaultReaderClosedPromiseResetToRejected(reader, reason) {
	defaultReaderClosedPromiseInitializeAsRejected(reader, reason)
}
function defaultReaderClosedPromiseResolve(reader) {
	if (reader._closedPromise_resolve === undefined) {
		return
	}
	reader._closedPromise_resolve(undefined)
	reader._closedPromise_resolve = undefined
	reader._closedPromise_reject = undefined
}

const AbortSteps = SymbolPolyfill('[[AbortSteps]]')
const ErrorSteps = SymbolPolyfill('[[ErrorSteps]]')
const CancelSteps = SymbolPolyfill('[[CancelSteps]]')
const PullSteps = SymbolPolyfill('[[PullSteps]]')

/// <reference lib="es2015.core" />
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite#Polyfill
const NumberIsFinite =
	Number.isFinite ||
	function (x) {
		return typeof x === 'number' && isFinite(x)
	}

/// <reference lib="es2015.core" />
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#Polyfill
const MathTrunc =
	Math.trunc ||
	function (v) {
		return v < 0 ? Math.ceil(v) : Math.floor(v)
	}

// https://heycam.github.io/webidl/#idl-dictionaries
function isDictionary(x) {
	return typeof x === 'object' || typeof x === 'function'
}
function assertDictionary(obj, context) {
	if (obj !== undefined && !isDictionary(obj)) {
		throw new TypeError(`${context} is not an object.`)
	}
}
// https://heycam.github.io/webidl/#idl-callback-functions
function assertFunction(x, context) {
	if (typeof x !== 'function') {
		throw new TypeError(`${context} is not a function.`)
	}
}
// https://heycam.github.io/webidl/#idl-object
function isObject(x) {
	return (typeof x === 'object' && x !== null) || typeof x === 'function'
}
function assertObject(x, context) {
	if (!isObject(x)) {
		throw new TypeError(`${context} is not an object.`)
	}
}
function assertRequiredArgument(x, position, context) {
	if (x === undefined) {
		throw new TypeError(`Parameter ${position} is required in '${context}'.`)
	}
}
function assertRequiredField(x, field, context) {
	if (x === undefined) {
		throw new TypeError(`${field} is required in '${context}'.`)
	}
}
// https://heycam.github.io/webidl/#idl-unrestricted-double
function convertUnrestrictedDouble(value) {
	return Number(value)
}
function censorNegativeZero(x) {
	return x === 0 ? 0 : x
}
function integerPart(x) {
	return censorNegativeZero(MathTrunc(x))
}
// https://heycam.github.io/webidl/#idl-unsigned-long-long
function convertUnsignedLongLongWithEnforceRange(value, context) {
	const lowerBound = 0
	const upperBound = Number.MAX_SAFE_INTEGER
	let x = Number(value)
	x = censorNegativeZero(x)
	if (!NumberIsFinite(x)) {
		throw new TypeError(`${context} is not a finite number`)
	}
	x = integerPart(x)
	if (x < lowerBound || x > upperBound) {
		throw new TypeError(
			`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`
		)
	}
	if (!NumberIsFinite(x) || x === 0) {
		return 0
	}
	// TODO Use BigInt if supported?
	// let xBigInt = BigInt(integerPart(x));
	// xBigInt = BigInt.asUintN(64, xBigInt);
	// return Number(xBigInt);
	return x
}

function assertReadableStream(x, context) {
	if (!IsReadableStream(x)) {
		throw new TypeError(`${context} is not a ReadableStream.`)
	}
}

// Abstract operations for the ReadableStream.
function AcquireReadableStreamDefaultReader(stream) {
	return new ReadableStreamDefaultReader(stream)
}
// ReadableStream API exposed for controllers.
function ReadableStreamAddReadRequest(stream, readRequest) {
	stream._reader._readRequests.push(readRequest)
}
function ReadableStreamFulfillReadRequest(stream, chunk, done) {
	const reader = stream._reader
	const readRequest = reader._readRequests.shift()
	if (done) {
		readRequest._closeSteps()
	} else {
		readRequest._chunkSteps(chunk)
	}
}
function ReadableStreamGetNumReadRequests(stream) {
	return stream._reader._readRequests.length
}
function ReadableStreamHasDefaultReader(stream) {
	const reader = stream._reader
	if (reader === undefined) {
		return false
	}
	if (!IsReadableStreamDefaultReader(reader)) {
		return false
	}
	return true
}
/**
 * A default reader vended by a {@link ReadableStream}.
 *
 * @public
 */
class ReadableStreamDefaultReader {
	constructor(stream) {
		assertRequiredArgument(stream, 1, 'ReadableStreamDefaultReader')
		assertReadableStream(stream, 'First parameter')
		if (IsReadableStreamLocked(stream)) {
			throw new TypeError(
				'This stream has already been locked for exclusive reading by another reader'
			)
		}
		ReadableStreamReaderGenericInitialize(this, stream)
		this._readRequests = new SimpleQueue()
	}
	/**
	 * Returns a promise that will be fulfilled when the stream becomes closed,
	 * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
	 */
	get closed() {
		if (!IsReadableStreamDefaultReader(this)) {
			return promiseRejectedWith(defaultReaderBrandCheckException('closed'))
		}
		return this._closedPromise
	}
	/**
	 * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
	 */
	cancel(reason = undefined) {
		if (!IsReadableStreamDefaultReader(this)) {
			return promiseRejectedWith(defaultReaderBrandCheckException('cancel'))
		}
		if (this._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('cancel'))
		}
		return ReadableStreamReaderGenericCancel(this, reason)
	}
	/**
	 * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
	 *
	 * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
	 */
	read() {
		if (!IsReadableStreamDefaultReader(this)) {
			return promiseRejectedWith(defaultReaderBrandCheckException('read'))
		}
		if (this._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('read from'))
		}
		let resolvePromise
		let rejectPromise
		const promise = newPromise((resolve, reject) => {
			resolvePromise = resolve
			rejectPromise = reject
		})
		const readRequest = {
			_chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
			_closeSteps: () => resolvePromise({ value: undefined, done: true }),
			_errorSteps: (e) => rejectPromise(e),
		}
		ReadableStreamDefaultReaderRead(this, readRequest)
		return promise
	}
	/**
	 * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
	 * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
	 * from now on; otherwise, the reader will appear closed.
	 *
	 * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
	 * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
	 * do so will throw a `TypeError` and leave the reader locked to the stream.
	 */
	releaseLock() {
		if (!IsReadableStreamDefaultReader(this)) {
			throw defaultReaderBrandCheckException('releaseLock')
		}
		if (this._ownerReadableStream === undefined) {
			return
		}
		if (this._readRequests.length > 0) {
			throw new TypeError(
				'Tried to release a reader lock when that reader has pending read() calls un-settled'
			)
		}
		ReadableStreamReaderGenericRelease(this)
	}
}
Object.defineProperties(ReadableStreamDefaultReader.prototype, {
	cancel: { enumerable: true },
	read: { enumerable: true },
	releaseLock: { enumerable: true },
	closed: { enumerable: true },
})
// Abstract operations for the readers.
function IsReadableStreamDefaultReader(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_readRequests')) {
		return false
	}
	return x instanceof ReadableStreamDefaultReader
}
function ReadableStreamDefaultReaderRead(reader, readRequest) {
	const stream = reader._ownerReadableStream
	stream._disturbed = true
	if (stream._state === 'closed') {
		readRequest._closeSteps()
	} else if (stream._state === 'errored') {
		readRequest._errorSteps(stream._storedError)
	} else {
		stream._readableStreamController[PullSteps](readRequest)
	}
}
// Helper functions for the ReadableStreamDefaultReader.
function defaultReaderBrandCheckException(name) {
	return new TypeError(
		`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`
	)
}

/// <reference lib="es2018.asynciterable" />
class ReadableStreamAsyncIteratorImpl {
	constructor(reader, preventCancel) {
		this._ongoingPromise = undefined
		this._isFinished = false
		this._reader = reader
		this._preventCancel = preventCancel
	}
	next() {
		const nextSteps = () => this._nextSteps()
		this._ongoingPromise = this._ongoingPromise
			? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps)
			: nextSteps()
		return this._ongoingPromise
	}
	return(value) {
		const returnSteps = () => this._returnSteps(value)
		return this._ongoingPromise
			? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps)
			: returnSteps()
	}
	_nextSteps() {
		if (this._isFinished) {
			return Promise.resolve({ value: undefined, done: true })
		}
		const reader = this._reader
		if (reader._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('iterate'))
		}
		let resolvePromise
		let rejectPromise
		const promise = newPromise((resolve, reject) => {
			resolvePromise = resolve
			rejectPromise = reject
		})
		const readRequest = {
			_chunkSteps: (chunk) => {
				this._ongoingPromise = undefined
				// This needs to be delayed by one microtask, otherwise we stop pulling too early which breaks a test.
				// FIXME Is this a bug in the specification, or in the test?
				queueMicrotask(() => resolvePromise({ value: chunk, done: false }))
			},
			_closeSteps: () => {
				this._ongoingPromise = undefined
				this._isFinished = true
				ReadableStreamReaderGenericRelease(reader)
				resolvePromise({ value: undefined, done: true })
			},
			_errorSteps: (reason) => {
				this._ongoingPromise = undefined
				this._isFinished = true
				ReadableStreamReaderGenericRelease(reader)
				rejectPromise(reason)
			},
		}
		ReadableStreamDefaultReaderRead(reader, readRequest)
		return promise
	}
	_returnSteps(value) {
		if (this._isFinished) {
			return Promise.resolve({ value, done: true })
		}
		this._isFinished = true
		const reader = this._reader
		if (reader._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('finish iterating'))
		}
		if (!this._preventCancel) {
			const result = ReadableStreamReaderGenericCancel(reader, value)
			ReadableStreamReaderGenericRelease(reader)
			return transformPromiseWith(result, () => ({ value, done: true }))
		}
		ReadableStreamReaderGenericRelease(reader)
		return promiseResolvedWith({ value, done: true })
	}
}
const ReadableStreamAsyncIteratorPrototype = {
	next() {
		if (!IsReadableStreamAsyncIterator(this)) {
			return promiseRejectedWith(streamAsyncIteratorBrandCheckException('next'))
		}
		return this._asyncIteratorImpl.next()
	},
	return(value) {
		if (!IsReadableStreamAsyncIterator(this)) {
			return promiseRejectedWith(
				streamAsyncIteratorBrandCheckException('return')
			)
		}
		return this._asyncIteratorImpl.return(value)
	},
}
// Abstract operations for the ReadableStream.
function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
	const reader = AcquireReadableStreamDefaultReader(stream)
	const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel)
	const iterator = Object.create(ReadableStreamAsyncIteratorPrototype)
	iterator._asyncIteratorImpl = impl
	return iterator
}
function IsReadableStreamAsyncIterator(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_asyncIteratorImpl')) {
		return false
	}
	try {
		// noinspection SuspiciousTypeOfGuard
		return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl
	} catch (_a) {
		return false
	}
}
// Helper functions for the ReadableStream.
function streamAsyncIteratorBrandCheckException(name) {
	return new TypeError(
		`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`
	)
}

/// <reference lib="es2015.core" />
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN#Polyfill
const NumberIsNaN =
	Number.isNaN ||
	function (x) {
		// eslint-disable-next-line no-self-compare
		return x !== x
	}

function CreateArrayFromList(elements) {
	// We use arrays to represent lists, so this is basically a no-op.
	// Do a slice though just in case we happen to depend on the unique-ness.
	return elements.slice()
}
function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
	new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset)
}
// Not implemented correctly
function TransferArrayBuffer(O) {
	return O
}
// Not implemented correctly
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function IsDetachedBuffer(O) {
	return false
}
function ArrayBufferSlice(buffer, begin, end) {
	// ArrayBuffer.prototype.slice is not available on IE10
	// https://www.caniuse.com/mdn-javascript_builtins_arraybuffer_slice
	if (buffer.slice) {
		return buffer.slice(begin, end)
	}
	const length = end - begin
	const slice = new ArrayBuffer(length)
	CopyDataBlockBytes(slice, 0, buffer, begin, length)
	return slice
}

function IsNonNegativeNumber(v) {
	if (typeof v !== 'number') {
		return false
	}
	if (NumberIsNaN(v)) {
		return false
	}
	if (v < 0) {
		return false
	}
	return true
}
function CloneAsUint8Array(O) {
	const buffer = ArrayBufferSlice(
		O.buffer,
		O.byteOffset,
		O.byteOffset + O.byteLength
	)
	return new Uint8Array(buffer)
}

function DequeueValue(container) {
	const pair = container._queue.shift()
	container._queueTotalSize -= pair.size
	if (container._queueTotalSize < 0) {
		container._queueTotalSize = 0
	}
	return pair.value
}
function EnqueueValueWithSize(container, value, size) {
	if (!IsNonNegativeNumber(size) || size === Infinity) {
		throw new RangeError('Size must be a finite, non-NaN, non-negative number.')
	}
	container._queue.push({ value, size })
	container._queueTotalSize += size
}
function PeekQueueValue(container) {
	const pair = container._queue.peek()
	return pair.value
}
function ResetQueue(container) {
	container._queue = new SimpleQueue()
	container._queueTotalSize = 0
}

/**
 * A pull-into request in a {@link ReadableByteStreamController}.
 *
 * @public
 */
class ReadableStreamBYOBRequest {
	constructor() {
		throw new TypeError('Illegal constructor')
	}
	/**
	 * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
	 */
	get view() {
		if (!IsReadableStreamBYOBRequest(this)) {
			throw byobRequestBrandCheckException('view')
		}
		return this._view
	}
	respond(bytesWritten) {
		if (!IsReadableStreamBYOBRequest(this)) {
			throw byobRequestBrandCheckException('respond')
		}
		assertRequiredArgument(bytesWritten, 1, 'respond')
		bytesWritten = convertUnsignedLongLongWithEnforceRange(
			bytesWritten,
			'First parameter'
		)
		if (this._associatedReadableByteStreamController === undefined) {
			throw new TypeError('This BYOB request has been invalidated')
		}
		if (IsDetachedBuffer(this._view.buffer));
		ReadableByteStreamControllerRespond(
			this._associatedReadableByteStreamController,
			bytesWritten
		)
	}
	respondWithNewView(view) {
		if (!IsReadableStreamBYOBRequest(this)) {
			throw byobRequestBrandCheckException('respondWithNewView')
		}
		assertRequiredArgument(view, 1, 'respondWithNewView')
		if (!ArrayBuffer.isView(view)) {
			throw new TypeError('You can only respond with array buffer views')
		}
		if (this._associatedReadableByteStreamController === undefined) {
			throw new TypeError('This BYOB request has been invalidated')
		}
		if (IsDetachedBuffer(view.buffer));
		ReadableByteStreamControllerRespondWithNewView(
			this._associatedReadableByteStreamController,
			view
		)
	}
}
Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
	respond: { enumerable: true },
	respondWithNewView: { enumerable: true },
	view: { enumerable: true },
})
/**
 * Allows control of a {@link ReadableStream | readable byte stream}'s state and internal queue.
 *
 * @public
 */
class ReadableByteStreamController {
	constructor() {
		throw new TypeError('Illegal constructor')
	}
	/**
	 * Returns the current BYOB pull request, or `null` if there isn't one.
	 */
	get byobRequest() {
		if (!IsReadableByteStreamController(this)) {
			throw byteStreamControllerBrandCheckException('byobRequest')
		}
		return ReadableByteStreamControllerGetBYOBRequest(this)
	}
	/**
	 * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
	 * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
	 */
	get desiredSize() {
		if (!IsReadableByteStreamController(this)) {
			throw byteStreamControllerBrandCheckException('desiredSize')
		}
		return ReadableByteStreamControllerGetDesiredSize(this)
	}
	/**
	 * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
	 * the stream, but once those are read, the stream will become closed.
	 */
	close() {
		if (!IsReadableByteStreamController(this)) {
			throw byteStreamControllerBrandCheckException('close')
		}
		if (this._closeRequested) {
			throw new TypeError(
				'The stream has already been closed; do not close it again!'
			)
		}
		const state = this._controlledReadableByteStream._state
		if (state !== 'readable') {
			throw new TypeError(
				`The stream (in ${state} state) is not in the readable state and cannot be closed`
			)
		}
		ReadableByteStreamControllerClose(this)
	}
	enqueue(chunk) {
		if (!IsReadableByteStreamController(this)) {
			throw byteStreamControllerBrandCheckException('enqueue')
		}
		assertRequiredArgument(chunk, 1, 'enqueue')
		if (!ArrayBuffer.isView(chunk)) {
			throw new TypeError('chunk must be an array buffer view')
		}
		if (chunk.byteLength === 0) {
			throw new TypeError('chunk must have non-zero byteLength')
		}
		if (chunk.buffer.byteLength === 0) {
			throw new TypeError(`chunk's buffer must have non-zero byteLength`)
		}
		if (this._closeRequested) {
			throw new TypeError('stream is closed or draining')
		}
		const state = this._controlledReadableByteStream._state
		if (state !== 'readable') {
			throw new TypeError(
				`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`
			)
		}
		ReadableByteStreamControllerEnqueue(this, chunk)
	}
	/**
	 * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
	 */
	error(e = undefined) {
		if (!IsReadableByteStreamController(this)) {
			throw byteStreamControllerBrandCheckException('error')
		}
		ReadableByteStreamControllerError(this, e)
	}
	/** @internal */
	[CancelSteps](reason) {
		ReadableByteStreamControllerClearPendingPullIntos(this)
		ResetQueue(this)
		const result = this._cancelAlgorithm(reason)
		ReadableByteStreamControllerClearAlgorithms(this)
		return result
	}
	/** @internal */
	[PullSteps](readRequest) {
		const stream = this._controlledReadableByteStream
		if (this._queueTotalSize > 0) {
			const entry = this._queue.shift()
			this._queueTotalSize -= entry.byteLength
			ReadableByteStreamControllerHandleQueueDrain(this)
			const view = new Uint8Array(
				entry.buffer,
				entry.byteOffset,
				entry.byteLength
			)
			readRequest._chunkSteps(view)
			return
		}
		const autoAllocateChunkSize = this._autoAllocateChunkSize
		if (autoAllocateChunkSize !== undefined) {
			let buffer
			try {
				buffer = new ArrayBuffer(autoAllocateChunkSize)
			} catch (bufferE) {
				readRequest._errorSteps(bufferE)
				return
			}
			const pullIntoDescriptor = {
				buffer,
				bufferByteLength: autoAllocateChunkSize,
				byteOffset: 0,
				byteLength: autoAllocateChunkSize,
				bytesFilled: 0,
				elementSize: 1,
				viewConstructor: Uint8Array,
				readerType: 'default',
			}
			this._pendingPullIntos.push(pullIntoDescriptor)
		}
		ReadableStreamAddReadRequest(stream, readRequest)
		ReadableByteStreamControllerCallPullIfNeeded(this)
	}
}
Object.defineProperties(ReadableByteStreamController.prototype, {
	close: { enumerable: true },
	enqueue: { enumerable: true },
	error: { enumerable: true },
	byobRequest: { enumerable: true },
	desiredSize: { enumerable: true },
})
// Abstract operations for the ReadableByteStreamController.
function IsReadableByteStreamController(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (
		!Object.prototype.hasOwnProperty.call(x, '_controlledReadableByteStream')
	) {
		return false
	}
	return x instanceof ReadableByteStreamController
}
function IsReadableStreamBYOBRequest(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (
		!Object.prototype.hasOwnProperty.call(
			x,
			'_associatedReadableByteStreamController'
		)
	) {
		return false
	}
	return x instanceof ReadableStreamBYOBRequest
}
function ReadableByteStreamControllerCallPullIfNeeded(controller) {
	const shouldPull = ReadableByteStreamControllerShouldCallPull(controller)
	if (!shouldPull) {
		return
	}
	if (controller._pulling) {
		controller._pullAgain = true
		return
	}
	controller._pulling = true
	// TODO: Test controller argument
	const pullPromise = controller._pullAlgorithm()
	uponPromise(
		pullPromise,
		() => {
			controller._pulling = false
			if (controller._pullAgain) {
				controller._pullAgain = false
				ReadableByteStreamControllerCallPullIfNeeded(controller)
			}
		},
		(e) => {
			ReadableByteStreamControllerError(controller, e)
		}
	)
}
function ReadableByteStreamControllerClearPendingPullIntos(controller) {
	ReadableByteStreamControllerInvalidateBYOBRequest(controller)
	controller._pendingPullIntos = new SimpleQueue()
}
function ReadableByteStreamControllerCommitPullIntoDescriptor(
	stream,
	pullIntoDescriptor
) {
	let done = false
	if (stream._state === 'closed') {
		done = true
	}
	const filledView =
		ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor)
	if (pullIntoDescriptor.readerType === 'default') {
		ReadableStreamFulfillReadRequest(stream, filledView, done)
	} else {
		ReadableStreamFulfillReadIntoRequest(stream, filledView, done)
	}
}
function ReadableByteStreamControllerConvertPullIntoDescriptor(
	pullIntoDescriptor
) {
	const bytesFilled = pullIntoDescriptor.bytesFilled
	const elementSize = pullIntoDescriptor.elementSize
	return new pullIntoDescriptor.viewConstructor(
		pullIntoDescriptor.buffer,
		pullIntoDescriptor.byteOffset,
		bytesFilled / elementSize
	)
}
function ReadableByteStreamControllerEnqueueChunkToQueue(
	controller,
	buffer,
	byteOffset,
	byteLength
) {
	controller._queue.push({ buffer, byteOffset, byteLength })
	controller._queueTotalSize += byteLength
}
function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
	controller,
	pullIntoDescriptor
) {
	const elementSize = pullIntoDescriptor.elementSize
	const currentAlignedBytes =
		pullIntoDescriptor.bytesFilled -
		(pullIntoDescriptor.bytesFilled % elementSize)
	const maxBytesToCopy = Math.min(
		controller._queueTotalSize,
		pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled
	)
	const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy
	const maxAlignedBytes = maxBytesFilled - (maxBytesFilled % elementSize)
	let totalBytesToCopyRemaining = maxBytesToCopy
	let ready = false
	if (maxAlignedBytes > currentAlignedBytes) {
		totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled
		ready = true
	}
	const queue = controller._queue
	while (totalBytesToCopyRemaining > 0) {
		const headOfQueue = queue.peek()
		const bytesToCopy = Math.min(
			totalBytesToCopyRemaining,
			headOfQueue.byteLength
		)
		const destStart =
			pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled
		CopyDataBlockBytes(
			pullIntoDescriptor.buffer,
			destStart,
			headOfQueue.buffer,
			headOfQueue.byteOffset,
			bytesToCopy
		)
		if (headOfQueue.byteLength === bytesToCopy) {
			queue.shift()
		} else {
			headOfQueue.byteOffset += bytesToCopy
			headOfQueue.byteLength -= bytesToCopy
		}
		controller._queueTotalSize -= bytesToCopy
		ReadableByteStreamControllerFillHeadPullIntoDescriptor(
			controller,
			bytesToCopy,
			pullIntoDescriptor
		)
		totalBytesToCopyRemaining -= bytesToCopy
	}
	return ready
}
function ReadableByteStreamControllerFillHeadPullIntoDescriptor(
	controller,
	size,
	pullIntoDescriptor
) {
	pullIntoDescriptor.bytesFilled += size
}
function ReadableByteStreamControllerHandleQueueDrain(controller) {
	if (controller._queueTotalSize === 0 && controller._closeRequested) {
		ReadableByteStreamControllerClearAlgorithms(controller)
		ReadableStreamClose(controller._controlledReadableByteStream)
	} else {
		ReadableByteStreamControllerCallPullIfNeeded(controller)
	}
}
function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
	if (controller._byobRequest === null) {
		return
	}
	controller._byobRequest._associatedReadableByteStreamController = undefined
	controller._byobRequest._view = null
	controller._byobRequest = null
}
function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(
	controller
) {
	while (controller._pendingPullIntos.length > 0) {
		if (controller._queueTotalSize === 0) {
			return
		}
		const pullIntoDescriptor = controller._pendingPullIntos.peek()
		if (
			ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
				controller,
				pullIntoDescriptor
			)
		) {
			ReadableByteStreamControllerShiftPendingPullInto(controller)
			ReadableByteStreamControllerCommitPullIntoDescriptor(
				controller._controlledReadableByteStream,
				pullIntoDescriptor
			)
		}
	}
}
function ReadableByteStreamControllerPullInto(
	controller,
	view,
	readIntoRequest
) {
	const stream = controller._controlledReadableByteStream
	let elementSize = 1
	if (view.constructor !== DataView) {
		elementSize = view.constructor.BYTES_PER_ELEMENT
	}
	const ctor = view.constructor
	// try {
	const buffer = TransferArrayBuffer(view.buffer)
	// } catch (e) {
	//   readIntoRequest._errorSteps(e);
	//   return;
	// }
	const pullIntoDescriptor = {
		buffer,
		bufferByteLength: buffer.byteLength,
		byteOffset: view.byteOffset,
		byteLength: view.byteLength,
		bytesFilled: 0,
		elementSize,
		viewConstructor: ctor,
		readerType: 'byob',
	}
	if (controller._pendingPullIntos.length > 0) {
		controller._pendingPullIntos.push(pullIntoDescriptor)
		// No ReadableByteStreamControllerCallPullIfNeeded() call since:
		// - No change happens on desiredSize
		// - The source has already been notified of that there's at least 1 pending read(view)
		ReadableStreamAddReadIntoRequest(stream, readIntoRequest)
		return
	}
	if (stream._state === 'closed') {
		const emptyView = new ctor(
			pullIntoDescriptor.buffer,
			pullIntoDescriptor.byteOffset,
			0
		)
		readIntoRequest._closeSteps(emptyView)
		return
	}
	if (controller._queueTotalSize > 0) {
		if (
			ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
				controller,
				pullIntoDescriptor
			)
		) {
			const filledView =
				ReadableByteStreamControllerConvertPullIntoDescriptor(
					pullIntoDescriptor
				)
			ReadableByteStreamControllerHandleQueueDrain(controller)
			readIntoRequest._chunkSteps(filledView)
			return
		}
		if (controller._closeRequested) {
			const e = new TypeError(
				'Insufficient bytes to fill elements in the given buffer'
			)
			ReadableByteStreamControllerError(controller, e)
			readIntoRequest._errorSteps(e)
			return
		}
	}
	controller._pendingPullIntos.push(pullIntoDescriptor)
	ReadableStreamAddReadIntoRequest(stream, readIntoRequest)
	ReadableByteStreamControllerCallPullIfNeeded(controller)
}
function ReadableByteStreamControllerRespondInClosedState(
	controller,
	firstDescriptor
) {
	const stream = controller._controlledReadableByteStream
	if (ReadableStreamHasBYOBReader(stream)) {
		while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
			const pullIntoDescriptor =
				ReadableByteStreamControllerShiftPendingPullInto(controller)
			ReadableByteStreamControllerCommitPullIntoDescriptor(
				stream,
				pullIntoDescriptor
			)
		}
	}
}
function ReadableByteStreamControllerRespondInReadableState(
	controller,
	bytesWritten,
	pullIntoDescriptor
) {
	ReadableByteStreamControllerFillHeadPullIntoDescriptor(
		controller,
		bytesWritten,
		pullIntoDescriptor
	)
	if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
		return
	}
	ReadableByteStreamControllerShiftPendingPullInto(controller)
	const remainderSize =
		pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize
	if (remainderSize > 0) {
		const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled
		const remainder = ArrayBufferSlice(
			pullIntoDescriptor.buffer,
			end - remainderSize,
			end
		)
		ReadableByteStreamControllerEnqueueChunkToQueue(
			controller,
			remainder,
			0,
			remainder.byteLength
		)
	}
	pullIntoDescriptor.bytesFilled -= remainderSize
	ReadableByteStreamControllerCommitPullIntoDescriptor(
		controller._controlledReadableByteStream,
		pullIntoDescriptor
	)
	ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller)
}
function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
	const firstDescriptor = controller._pendingPullIntos.peek()
	ReadableByteStreamControllerInvalidateBYOBRequest(controller)
	const state = controller._controlledReadableByteStream._state
	if (state === 'closed') {
		ReadableByteStreamControllerRespondInClosedState(controller)
	} else {
		ReadableByteStreamControllerRespondInReadableState(
			controller,
			bytesWritten,
			firstDescriptor
		)
	}
	ReadableByteStreamControllerCallPullIfNeeded(controller)
}
function ReadableByteStreamControllerShiftPendingPullInto(controller) {
	const descriptor = controller._pendingPullIntos.shift()
	return descriptor
}
function ReadableByteStreamControllerShouldCallPull(controller) {
	const stream = controller._controlledReadableByteStream
	if (stream._state !== 'readable') {
		return false
	}
	if (controller._closeRequested) {
		return false
	}
	if (!controller._started) {
		return false
	}
	if (
		ReadableStreamHasDefaultReader(stream) &&
		ReadableStreamGetNumReadRequests(stream) > 0
	) {
		return true
	}
	if (
		ReadableStreamHasBYOBReader(stream) &&
		ReadableStreamGetNumReadIntoRequests(stream) > 0
	) {
		return true
	}
	const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller)
	if (desiredSize > 0) {
		return true
	}
	return false
}
function ReadableByteStreamControllerClearAlgorithms(controller) {
	controller._pullAlgorithm = undefined
	controller._cancelAlgorithm = undefined
}
// A client of ReadableByteStreamController may use these functions directly to bypass state check.
function ReadableByteStreamControllerClose(controller) {
	const stream = controller._controlledReadableByteStream
	if (controller._closeRequested || stream._state !== 'readable') {
		return
	}
	if (controller._queueTotalSize > 0) {
		controller._closeRequested = true
		return
	}
	if (controller._pendingPullIntos.length > 0) {
		const firstPendingPullInto = controller._pendingPullIntos.peek()
		if (firstPendingPullInto.bytesFilled > 0) {
			const e = new TypeError(
				'Insufficient bytes to fill elements in the given buffer'
			)
			ReadableByteStreamControllerError(controller, e)
			throw e
		}
	}
	ReadableByteStreamControllerClearAlgorithms(controller)
	ReadableStreamClose(stream)
}
function ReadableByteStreamControllerEnqueue(controller, chunk) {
	const stream = controller._controlledReadableByteStream
	if (controller._closeRequested || stream._state !== 'readable') {
		return
	}
	const buffer = chunk.buffer
	const byteOffset = chunk.byteOffset
	const byteLength = chunk.byteLength
	const transferredBuffer = TransferArrayBuffer(buffer)
	if (controller._pendingPullIntos.length > 0) {
		const firstPendingPullInto = controller._pendingPullIntos.peek()
		if (IsDetachedBuffer(firstPendingPullInto.buffer));
		firstPendingPullInto.buffer = TransferArrayBuffer(
			firstPendingPullInto.buffer
		)
	}
	ReadableByteStreamControllerInvalidateBYOBRequest(controller)
	if (ReadableStreamHasDefaultReader(stream)) {
		if (ReadableStreamGetNumReadRequests(stream) === 0) {
			ReadableByteStreamControllerEnqueueChunkToQueue(
				controller,
				transferredBuffer,
				byteOffset,
				byteLength
			)
		} else {
			if (controller._pendingPullIntos.length > 0) {
				ReadableByteStreamControllerShiftPendingPullInto(controller)
			}
			const transferredView = new Uint8Array(
				transferredBuffer,
				byteOffset,
				byteLength
			)
			ReadableStreamFulfillReadRequest(stream, transferredView, false)
		}
	} else if (ReadableStreamHasBYOBReader(stream)) {
		// TODO: Ideally in this branch detaching should happen only if the buffer is not consumed fully.
		ReadableByteStreamControllerEnqueueChunkToQueue(
			controller,
			transferredBuffer,
			byteOffset,
			byteLength
		)
		ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller)
	} else {
		ReadableByteStreamControllerEnqueueChunkToQueue(
			controller,
			transferredBuffer,
			byteOffset,
			byteLength
		)
	}
	ReadableByteStreamControllerCallPullIfNeeded(controller)
}
function ReadableByteStreamControllerError(controller, e) {
	const stream = controller._controlledReadableByteStream
	if (stream._state !== 'readable') {
		return
	}
	ReadableByteStreamControllerClearPendingPullIntos(controller)
	ResetQueue(controller)
	ReadableByteStreamControllerClearAlgorithms(controller)
	ReadableStreamError(stream, e)
}
function ReadableByteStreamControllerGetBYOBRequest(controller) {
	if (
		controller._byobRequest === null &&
		controller._pendingPullIntos.length > 0
	) {
		const firstDescriptor = controller._pendingPullIntos.peek()
		const view = new Uint8Array(
			firstDescriptor.buffer,
			firstDescriptor.byteOffset + firstDescriptor.bytesFilled,
			firstDescriptor.byteLength - firstDescriptor.bytesFilled
		)
		const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype)
		SetUpReadableStreamBYOBRequest(byobRequest, controller, view)
		controller._byobRequest = byobRequest
	}
	return controller._byobRequest
}
function ReadableByteStreamControllerGetDesiredSize(controller) {
	const state = controller._controlledReadableByteStream._state
	if (state === 'errored') {
		return null
	}
	if (state === 'closed') {
		return 0
	}
	return controller._strategyHWM - controller._queueTotalSize
}
function ReadableByteStreamControllerRespond(controller, bytesWritten) {
	const firstDescriptor = controller._pendingPullIntos.peek()
	const state = controller._controlledReadableByteStream._state
	if (state === 'closed') {
		if (bytesWritten !== 0) {
			throw new TypeError(
				'bytesWritten must be 0 when calling respond() on a closed stream'
			)
		}
	} else {
		if (bytesWritten === 0) {
			throw new TypeError(
				'bytesWritten must be greater than 0 when calling respond() on a readable stream'
			)
		}
		if (
			firstDescriptor.bytesFilled + bytesWritten >
			firstDescriptor.byteLength
		) {
			throw new RangeError('bytesWritten out of range')
		}
	}
	firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer)
	ReadableByteStreamControllerRespondInternal(controller, bytesWritten)
}
function ReadableByteStreamControllerRespondWithNewView(controller, view) {
	const firstDescriptor = controller._pendingPullIntos.peek()
	const state = controller._controlledReadableByteStream._state
	if (state === 'closed') {
		if (view.byteLength !== 0) {
			throw new TypeError(
				"The view's length must be 0 when calling respondWithNewView() on a closed stream"
			)
		}
	} else {
		if (view.byteLength === 0) {
			throw new TypeError(
				"The view's length must be greater than 0 when calling respondWithNewView() on a readable stream"
			)
		}
	}
	if (
		firstDescriptor.byteOffset + firstDescriptor.bytesFilled !==
		view.byteOffset
	) {
		throw new RangeError(
			'The region specified by view does not match byobRequest'
		)
	}
	if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
		throw new RangeError(
			'The buffer of view has different capacity than byobRequest'
		)
	}
	if (
		firstDescriptor.bytesFilled + view.byteLength >
		firstDescriptor.byteLength
	) {
		throw new RangeError(
			'The region specified by view is larger than byobRequest'
		)
	}
	const viewByteLength = view.byteLength
	firstDescriptor.buffer = TransferArrayBuffer(view.buffer)
	ReadableByteStreamControllerRespondInternal(controller, viewByteLength)
}
function SetUpReadableByteStreamController(
	stream,
	controller,
	startAlgorithm,
	pullAlgorithm,
	cancelAlgorithm,
	highWaterMark,
	autoAllocateChunkSize
) {
	controller._controlledReadableByteStream = stream
	controller._pullAgain = false
	controller._pulling = false
	controller._byobRequest = null
	// Need to set the slots so that the assert doesn't fire. In the spec the slots already exist implicitly.
	controller._queue = controller._queueTotalSize = undefined
	ResetQueue(controller)
	controller._closeRequested = false
	controller._started = false
	controller._strategyHWM = highWaterMark
	controller._pullAlgorithm = pullAlgorithm
	controller._cancelAlgorithm = cancelAlgorithm
	controller._autoAllocateChunkSize = autoAllocateChunkSize
	controller._pendingPullIntos = new SimpleQueue()
	stream._readableStreamController = controller
	const startResult = startAlgorithm()
	uponPromise(
		promiseResolvedWith(startResult),
		() => {
			controller._started = true
			ReadableByteStreamControllerCallPullIfNeeded(controller)
		},
		(r) => {
			ReadableByteStreamControllerError(controller, r)
		}
	)
}
function SetUpReadableByteStreamControllerFromUnderlyingSource(
	stream,
	underlyingByteSource,
	highWaterMark
) {
	const controller = Object.create(ReadableByteStreamController.prototype)
	let startAlgorithm = () => undefined
	let pullAlgorithm = () => promiseResolvedWith(undefined)
	let cancelAlgorithm = () => promiseResolvedWith(undefined)
	if (underlyingByteSource.start !== undefined) {
		startAlgorithm = () => underlyingByteSource.start(controller)
	}
	if (underlyingByteSource.pull !== undefined) {
		pullAlgorithm = () => underlyingByteSource.pull(controller)
	}
	if (underlyingByteSource.cancel !== undefined) {
		cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason)
	}
	const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize
	if (autoAllocateChunkSize === 0) {
		throw new TypeError('autoAllocateChunkSize must be greater than 0')
	}
	SetUpReadableByteStreamController(
		stream,
		controller,
		startAlgorithm,
		pullAlgorithm,
		cancelAlgorithm,
		highWaterMark,
		autoAllocateChunkSize
	)
}
function SetUpReadableStreamBYOBRequest(request, controller, view) {
	request._associatedReadableByteStreamController = controller
	request._view = view
}
// Helper functions for the ReadableStreamBYOBRequest.
function byobRequestBrandCheckException(name) {
	return new TypeError(
		`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`
	)
}
// Helper functions for the ReadableByteStreamController.
function byteStreamControllerBrandCheckException(name) {
	return new TypeError(
		`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`
	)
}

// Abstract operations for the ReadableStream.
function AcquireReadableStreamBYOBReader(stream) {
	return new ReadableStreamBYOBReader(stream)
}
// ReadableStream API exposed for controllers.
function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
	stream._reader._readIntoRequests.push(readIntoRequest)
}
function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
	const reader = stream._reader
	const readIntoRequest = reader._readIntoRequests.shift()
	if (done) {
		readIntoRequest._closeSteps(chunk)
	} else {
		readIntoRequest._chunkSteps(chunk)
	}
}
function ReadableStreamGetNumReadIntoRequests(stream) {
	return stream._reader._readIntoRequests.length
}
function ReadableStreamHasBYOBReader(stream) {
	const reader = stream._reader
	if (reader === undefined) {
		return false
	}
	if (!IsReadableStreamBYOBReader(reader)) {
		return false
	}
	return true
}
/**
 * A BYOB reader vended by a {@link ReadableStream}.
 *
 * @public
 */
class ReadableStreamBYOBReader {
	constructor(stream) {
		assertRequiredArgument(stream, 1, 'ReadableStreamBYOBReader')
		assertReadableStream(stream, 'First parameter')
		if (IsReadableStreamLocked(stream)) {
			throw new TypeError(
				'This stream has already been locked for exclusive reading by another reader'
			)
		}
		if (!IsReadableByteStreamController(stream._readableStreamController)) {
			throw new TypeError(
				'Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte ' +
					'source'
			)
		}
		ReadableStreamReaderGenericInitialize(this, stream)
		this._readIntoRequests = new SimpleQueue()
	}
	/**
	 * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
	 * the reader's lock is released before the stream finishes closing.
	 */
	get closed() {
		if (!IsReadableStreamBYOBReader(this)) {
			return promiseRejectedWith(byobReaderBrandCheckException('closed'))
		}
		return this._closedPromise
	}
	/**
	 * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
	 */
	cancel(reason = undefined) {
		if (!IsReadableStreamBYOBReader(this)) {
			return promiseRejectedWith(byobReaderBrandCheckException('cancel'))
		}
		if (this._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('cancel'))
		}
		return ReadableStreamReaderGenericCancel(this, reason)
	}
	/**
	 * Attempts to reads bytes into view, and returns a promise resolved with the result.
	 *
	 * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
	 */
	read(view) {
		if (!IsReadableStreamBYOBReader(this)) {
			return promiseRejectedWith(byobReaderBrandCheckException('read'))
		}
		if (!ArrayBuffer.isView(view)) {
			return promiseRejectedWith(
				new TypeError('view must be an array buffer view')
			)
		}
		if (view.byteLength === 0) {
			return promiseRejectedWith(
				new TypeError('view must have non-zero byteLength')
			)
		}
		if (view.buffer.byteLength === 0) {
			return promiseRejectedWith(
				new TypeError(`view's buffer must have non-zero byteLength`)
			)
		}
		if (IsDetachedBuffer(view.buffer));
		if (this._ownerReadableStream === undefined) {
			return promiseRejectedWith(readerLockException('read from'))
		}
		let resolvePromise
		let rejectPromise
		const promise = newPromise((resolve, reject) => {
			resolvePromise = resolve
			rejectPromise = reject
		})
		const readIntoRequest = {
			_chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
			_closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
			_errorSteps: (e) => rejectPromise(e),
		}
		ReadableStreamBYOBReaderRead(this, view, readIntoRequest)
		return promise
	}
	/**
	 * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
	 * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
	 * from now on; otherwise, the reader will appear closed.
	 *
	 * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
	 * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
	 * do so will throw a `TypeError` and leave the reader locked to the stream.
	 */
	releaseLock() {
		if (!IsReadableStreamBYOBReader(this)) {
			throw byobReaderBrandCheckException('releaseLock')
		}
		if (this._ownerReadableStream === undefined) {
			return
		}
		if (this._readIntoRequests.length > 0) {
			throw new TypeError(
				'Tried to release a reader lock when that reader has pending read() calls un-settled'
			)
		}
		ReadableStreamReaderGenericRelease(this)
	}
}
Object.defineProperties(ReadableStreamBYOBReader.prototype, {
	cancel: { enumerable: true },
	read: { enumerable: true },
	releaseLock: { enumerable: true },
	closed: { enumerable: true },
})
// Abstract operations for the readers.
function IsReadableStreamBYOBReader(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_readIntoRequests')) {
		return false
	}
	return x instanceof ReadableStreamBYOBReader
}
function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
	const stream = reader._ownerReadableStream
	stream._disturbed = true
	if (stream._state === 'errored') {
		readIntoRequest._errorSteps(stream._storedError)
	} else {
		ReadableByteStreamControllerPullInto(
			stream._readableStreamController,
			view,
			readIntoRequest
		)
	}
}
// Helper functions for the ReadableStreamBYOBReader.
function byobReaderBrandCheckException(name) {
	return new TypeError(
		`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`
	)
}

function ExtractHighWaterMark(strategy, defaultHWM) {
	const { highWaterMark } = strategy
	if (highWaterMark === undefined) {
		return defaultHWM
	}
	if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
		throw new RangeError('Invalid highWaterMark')
	}
	return highWaterMark
}
function ExtractSizeAlgorithm(strategy) {
	const { size } = strategy
	if (!size) {
		return () => 1
	}
	return size
}

function convertQueuingStrategy(init, context) {
	assertDictionary(init, context)
	const highWaterMark =
		init === null || init === void 0 ? void 0 : init.highWaterMark
	const size = init === null || init === void 0 ? void 0 : init.size
	return {
		highWaterMark:
			highWaterMark === undefined
				? undefined
				: convertUnrestrictedDouble(highWaterMark),
		size:
			size === undefined
				? undefined
				: convertQueuingStrategySize(size, `${context} has member 'size' that`),
	}
}
function convertQueuingStrategySize(fn, context) {
	assertFunction(fn, context)
	return (chunk) => convertUnrestrictedDouble(fn(chunk))
}

function convertUnderlyingSink(original, context) {
	assertDictionary(original, context)
	const abort =
		original === null || original === void 0 ? void 0 : original.abort
	const close =
		original === null || original === void 0 ? void 0 : original.close
	const start =
		original === null || original === void 0 ? void 0 : original.start
	const type = original === null || original === void 0 ? void 0 : original.type
	const write =
		original === null || original === void 0 ? void 0 : original.write
	return {
		abort:
			abort === undefined
				? undefined
				: convertUnderlyingSinkAbortCallback(
						abort,
						original,
						`${context} has member 'abort' that`
				  ),
		close:
			close === undefined
				? undefined
				: convertUnderlyingSinkCloseCallback(
						close,
						original,
						`${context} has member 'close' that`
				  ),
		start:
			start === undefined
				? undefined
				: convertUnderlyingSinkStartCallback(
						start,
						original,
						`${context} has member 'start' that`
				  ),
		write:
			write === undefined
				? undefined
				: convertUnderlyingSinkWriteCallback(
						write,
						original,
						`${context} has member 'write' that`
				  ),
		type,
	}
}
function convertUnderlyingSinkAbortCallback(fn, original, context) {
	assertFunction(fn, context)
	return (reason) => promiseCall(fn, original, [reason])
}
function convertUnderlyingSinkCloseCallback(fn, original, context) {
	assertFunction(fn, context)
	return () => promiseCall(fn, original, [])
}
function convertUnderlyingSinkStartCallback(fn, original, context) {
	assertFunction(fn, context)
	return (controller) => reflectCall(fn, original, [controller])
}
function convertUnderlyingSinkWriteCallback(fn, original, context) {
	assertFunction(fn, context)
	return (chunk, controller) => promiseCall(fn, original, [chunk, controller])
}

function assertWritableStream(x, context) {
	if (!IsWritableStream(x)) {
		throw new TypeError(`${context} is not a WritableStream.`)
	}
}

function isAbortSignal$1(value) {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	try {
		return typeof value.aborted === 'boolean'
	} catch (_a) {
		// AbortSignal.prototype.aborted throws if its brand check fails
		return false
	}
}

/**
 * A writable stream represents a destination for data, into which you can write.
 *
 * @public
 */
class WritableStream {
	constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
		if (rawUnderlyingSink === undefined) {
			rawUnderlyingSink = null
		} else {
			assertObject(rawUnderlyingSink, 'First parameter')
		}
		const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter')
		const underlyingSink = convertUnderlyingSink(
			rawUnderlyingSink,
			'First parameter'
		)
		InitializeWritableStream(this)
		const type = underlyingSink.type
		if (type !== undefined) {
			throw new RangeError('Invalid type is specified')
		}
		const sizeAlgorithm = ExtractSizeAlgorithm(strategy)
		const highWaterMark = ExtractHighWaterMark(strategy, 1)
		SetUpWritableStreamDefaultControllerFromUnderlyingSink(
			this,
			underlyingSink,
			highWaterMark,
			sizeAlgorithm
		)
	}
	/**
	 * Returns whether or not the writable stream is locked to a writer.
	 */
	get locked() {
		if (!IsWritableStream(this)) {
			throw streamBrandCheckException$2('locked')
		}
		return IsWritableStreamLocked(this)
	}
	/**
	 * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
	 * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
	 * mechanism of the underlying sink.
	 *
	 * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
	 * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
	 * the stream) if the stream is currently locked.
	 */
	abort(reason = undefined) {
		if (!IsWritableStream(this)) {
			return promiseRejectedWith(streamBrandCheckException$2('abort'))
		}
		if (IsWritableStreamLocked(this)) {
			return promiseRejectedWith(
				new TypeError('Cannot abort a stream that already has a writer')
			)
		}
		return WritableStreamAbort(this, reason)
	}
	/**
	 * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
	 * close behavior. During this time any further attempts to write will fail (without erroring the stream).
	 *
	 * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
	 * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
	 * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
	 */
	close() {
		if (!IsWritableStream(this)) {
			return promiseRejectedWith(streamBrandCheckException$2('close'))
		}
		if (IsWritableStreamLocked(this)) {
			return promiseRejectedWith(
				new TypeError('Cannot close a stream that already has a writer')
			)
		}
		if (WritableStreamCloseQueuedOrInFlight(this)) {
			return promiseRejectedWith(
				new TypeError('Cannot close an already-closing stream')
			)
		}
		return WritableStreamClose(this)
	}
	/**
	 * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
	 * is locked, no other writer can be acquired until this one is released.
	 *
	 * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
	 * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
	 * the same time, which would cause the resulting written data to be unpredictable and probably useless.
	 */
	getWriter() {
		if (!IsWritableStream(this)) {
			throw streamBrandCheckException$2('getWriter')
		}
		return AcquireWritableStreamDefaultWriter(this)
	}
}
Object.defineProperties(WritableStream.prototype, {
	abort: { enumerable: true },
	close: { enumerable: true },
	getWriter: { enumerable: true },
	locked: { enumerable: true },
})
// Abstract operations for the WritableStream.
function AcquireWritableStreamDefaultWriter(stream) {
	return new WritableStreamDefaultWriter(stream)
}
// Throws if and only if startAlgorithm throws.
function CreateWritableStream(
	startAlgorithm,
	writeAlgorithm,
	closeAlgorithm,
	abortAlgorithm,
	highWaterMark = 1,
	sizeAlgorithm = () => 1
) {
	const stream = Object.create(WritableStream.prototype)
	InitializeWritableStream(stream)
	const controller = Object.create(WritableStreamDefaultController.prototype)
	SetUpWritableStreamDefaultController(
		stream,
		controller,
		startAlgorithm,
		writeAlgorithm,
		closeAlgorithm,
		abortAlgorithm,
		highWaterMark,
		sizeAlgorithm
	)
	return stream
}
function InitializeWritableStream(stream) {
	stream._state = 'writable'
	// The error that will be reported by new method calls once the state becomes errored. Only set when [[state]] is
	// 'erroring' or 'errored'. May be set to an undefined value.
	stream._storedError = undefined
	stream._writer = undefined
	// Initialize to undefined first because the constructor of the controller checks this
	// variable to validate the caller.
	stream._writableStreamController = undefined
	// This queue is placed here instead of the writer class in order to allow for passing a writer to the next data
	// producer without waiting for the queued writes to finish.
	stream._writeRequests = new SimpleQueue()
	// Write requests are removed from _writeRequests when write() is called on the underlying sink. This prevents
	// them from being erroneously rejected on error. If a write() call is in-flight, the request is stored here.
	stream._inFlightWriteRequest = undefined
	// The promise that was returned from writer.close(). Stored here because it may be fulfilled after the writer
	// has been detached.
	stream._closeRequest = undefined
	// Close request is removed from _closeRequest when close() is called on the underlying sink. This prevents it
	// from being erroneously rejected on error. If a close() call is in-flight, the request is stored here.
	stream._inFlightCloseRequest = undefined
	// The promise that was returned from writer.abort(). This may also be fulfilled after the writer has detached.
	stream._pendingAbortRequest = undefined
	// The backpressure signal set by the controller.
	stream._backpressure = false
}
function IsWritableStream(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_writableStreamController')) {
		return false
	}
	return x instanceof WritableStream
}
function IsWritableStreamLocked(stream) {
	if (stream._writer === undefined) {
		return false
	}
	return true
}
function WritableStreamAbort(stream, reason) {
	var _a
	if (stream._state === 'closed' || stream._state === 'errored') {
		return promiseResolvedWith(undefined)
	}
	stream._writableStreamController._abortReason = reason
	;(_a = stream._writableStreamController._abortController) === null ||
	_a === void 0
		? void 0
		: _a.abort()
	// TypeScript narrows the type of `stream._state` down to 'writable' | 'erroring',
	// but it doesn't know that signaling abort runs author code that might have changed the state.
	// Widen the type again by casting to WritableStreamState.
	const state = stream._state
	if (state === 'closed' || state === 'errored') {
		return promiseResolvedWith(undefined)
	}
	if (stream._pendingAbortRequest !== undefined) {
		return stream._pendingAbortRequest._promise
	}
	let wasAlreadyErroring = false
	if (state === 'erroring') {
		wasAlreadyErroring = true
		// reason will not be used, so don't keep a reference to it.
		reason = undefined
	}
	const promise = newPromise((resolve, reject) => {
		stream._pendingAbortRequest = {
			_promise: undefined,
			_resolve: resolve,
			_reject: reject,
			_reason: reason,
			_wasAlreadyErroring: wasAlreadyErroring,
		}
	})
	stream._pendingAbortRequest._promise = promise
	if (!wasAlreadyErroring) {
		WritableStreamStartErroring(stream, reason)
	}
	return promise
}
function WritableStreamClose(stream) {
	const state = stream._state
	if (state === 'closed' || state === 'errored') {
		return promiseRejectedWith(
			new TypeError(
				`The stream (in ${state} state) is not in the writable state and cannot be closed`
			)
		)
	}
	const promise = newPromise((resolve, reject) => {
		const closeRequest = {
			_resolve: resolve,
			_reject: reject,
		}
		stream._closeRequest = closeRequest
	})
	const writer = stream._writer
	if (writer !== undefined && stream._backpressure && state === 'writable') {
		defaultWriterReadyPromiseResolve(writer)
	}
	WritableStreamDefaultControllerClose(stream._writableStreamController)
	return promise
}
// WritableStream API exposed for controllers.
function WritableStreamAddWriteRequest(stream) {
	const promise = newPromise((resolve, reject) => {
		const writeRequest = {
			_resolve: resolve,
			_reject: reject,
		}
		stream._writeRequests.push(writeRequest)
	})
	return promise
}
function WritableStreamDealWithRejection(stream, error) {
	const state = stream._state
	if (state === 'writable') {
		WritableStreamStartErroring(stream, error)
		return
	}
	WritableStreamFinishErroring(stream)
}
function WritableStreamStartErroring(stream, reason) {
	const controller = stream._writableStreamController
	stream._state = 'erroring'
	stream._storedError = reason
	const writer = stream._writer
	if (writer !== undefined) {
		WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason)
	}
	if (
		!WritableStreamHasOperationMarkedInFlight(stream) &&
		controller._started
	) {
		WritableStreamFinishErroring(stream)
	}
}
function WritableStreamFinishErroring(stream) {
	stream._state = 'errored'
	stream._writableStreamController[ErrorSteps]()
	const storedError = stream._storedError
	stream._writeRequests.forEach((writeRequest) => {
		writeRequest._reject(storedError)
	})
	stream._writeRequests = new SimpleQueue()
	if (stream._pendingAbortRequest === undefined) {
		WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
		return
	}
	const abortRequest = stream._pendingAbortRequest
	stream._pendingAbortRequest = undefined
	if (abortRequest._wasAlreadyErroring) {
		abortRequest._reject(storedError)
		WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
		return
	}
	const promise = stream._writableStreamController[AbortSteps](
		abortRequest._reason
	)
	uponPromise(
		promise,
		() => {
			abortRequest._resolve()
			WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
		},
		(reason) => {
			abortRequest._reject(reason)
			WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
		}
	)
}
function WritableStreamFinishInFlightWrite(stream) {
	stream._inFlightWriteRequest._resolve(undefined)
	stream._inFlightWriteRequest = undefined
}
function WritableStreamFinishInFlightWriteWithError(stream, error) {
	stream._inFlightWriteRequest._reject(error)
	stream._inFlightWriteRequest = undefined
	WritableStreamDealWithRejection(stream, error)
}
function WritableStreamFinishInFlightClose(stream) {
	stream._inFlightCloseRequest._resolve(undefined)
	stream._inFlightCloseRequest = undefined
	const state = stream._state
	if (state === 'erroring') {
		// The error was too late to do anything, so it is ignored.
		stream._storedError = undefined
		if (stream._pendingAbortRequest !== undefined) {
			stream._pendingAbortRequest._resolve()
			stream._pendingAbortRequest = undefined
		}
	}
	stream._state = 'closed'
	const writer = stream._writer
	if (writer !== undefined) {
		defaultWriterClosedPromiseResolve(writer)
	}
}
function WritableStreamFinishInFlightCloseWithError(stream, error) {
	stream._inFlightCloseRequest._reject(error)
	stream._inFlightCloseRequest = undefined
	// Never execute sink abort() after sink close().
	if (stream._pendingAbortRequest !== undefined) {
		stream._pendingAbortRequest._reject(error)
		stream._pendingAbortRequest = undefined
	}
	WritableStreamDealWithRejection(stream, error)
}
// TODO(ricea): Fix alphabetical order.
function WritableStreamCloseQueuedOrInFlight(stream) {
	if (
		stream._closeRequest === undefined &&
		stream._inFlightCloseRequest === undefined
	) {
		return false
	}
	return true
}
function WritableStreamHasOperationMarkedInFlight(stream) {
	if (
		stream._inFlightWriteRequest === undefined &&
		stream._inFlightCloseRequest === undefined
	) {
		return false
	}
	return true
}
function WritableStreamMarkCloseRequestInFlight(stream) {
	stream._inFlightCloseRequest = stream._closeRequest
	stream._closeRequest = undefined
}
function WritableStreamMarkFirstWriteRequestInFlight(stream) {
	stream._inFlightWriteRequest = stream._writeRequests.shift()
}
function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
	if (stream._closeRequest !== undefined) {
		stream._closeRequest._reject(stream._storedError)
		stream._closeRequest = undefined
	}
	const writer = stream._writer
	if (writer !== undefined) {
		defaultWriterClosedPromiseReject(writer, stream._storedError)
	}
}
function WritableStreamUpdateBackpressure(stream, backpressure) {
	const writer = stream._writer
	if (writer !== undefined && backpressure !== stream._backpressure) {
		if (backpressure) {
			defaultWriterReadyPromiseReset(writer)
		} else {
			defaultWriterReadyPromiseResolve(writer)
		}
	}
	stream._backpressure = backpressure
}
/**
 * A default writer vended by a {@link WritableStream}.
 *
 * @public
 */
class WritableStreamDefaultWriter {
	constructor(stream) {
		assertRequiredArgument(stream, 1, 'WritableStreamDefaultWriter')
		assertWritableStream(stream, 'First parameter')
		if (IsWritableStreamLocked(stream)) {
			throw new TypeError(
				'This stream has already been locked for exclusive writing by another writer'
			)
		}
		this._ownerWritableStream = stream
		stream._writer = this
		const state = stream._state
		if (state === 'writable') {
			if (
				!WritableStreamCloseQueuedOrInFlight(stream) &&
				stream._backpressure
			) {
				defaultWriterReadyPromiseInitialize(this)
			} else {
				defaultWriterReadyPromiseInitializeAsResolved(this)
			}
			defaultWriterClosedPromiseInitialize(this)
		} else if (state === 'erroring') {
			defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError)
			defaultWriterClosedPromiseInitialize(this)
		} else if (state === 'closed') {
			defaultWriterReadyPromiseInitializeAsResolved(this)
			defaultWriterClosedPromiseInitializeAsResolved(this)
		} else {
			const storedError = stream._storedError
			defaultWriterReadyPromiseInitializeAsRejected(this, storedError)
			defaultWriterClosedPromiseInitializeAsRejected(this, storedError)
		}
	}
	/**
	 * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
	 * the writer’s lock is released before the stream finishes closing.
	 */
	get closed() {
		if (!IsWritableStreamDefaultWriter(this)) {
			return promiseRejectedWith(defaultWriterBrandCheckException('closed'))
		}
		return this._closedPromise
	}
	/**
	 * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
	 * A producer can use this information to determine the right amount of data to write.
	 *
	 * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
	 * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
	 * the writer’s lock is released.
	 */
	get desiredSize() {
		if (!IsWritableStreamDefaultWriter(this)) {
			throw defaultWriterBrandCheckException('desiredSize')
		}
		if (this._ownerWritableStream === undefined) {
			throw defaultWriterLockException('desiredSize')
		}
		return WritableStreamDefaultWriterGetDesiredSize(this)
	}
	/**
	 * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
	 * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
	 * back to zero or below, the getter will return a new promise that stays pending until the next transition.
	 *
	 * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
	 * rejected.
	 */
	get ready() {
		if (!IsWritableStreamDefaultWriter(this)) {
			return promiseRejectedWith(defaultWriterBrandCheckException('ready'))
		}
		return this._readyPromise
	}
	/**
	 * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
	 */
	abort(reason = undefined) {
		if (!IsWritableStreamDefaultWriter(this)) {
			return promiseRejectedWith(defaultWriterBrandCheckException('abort'))
		}
		if (this._ownerWritableStream === undefined) {
			return promiseRejectedWith(defaultWriterLockException('abort'))
		}
		return WritableStreamDefaultWriterAbort(this, reason)
	}
	/**
	 * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
	 */
	close() {
		if (!IsWritableStreamDefaultWriter(this)) {
			return promiseRejectedWith(defaultWriterBrandCheckException('close'))
		}
		const stream = this._ownerWritableStream
		if (stream === undefined) {
			return promiseRejectedWith(defaultWriterLockException('close'))
		}
		if (WritableStreamCloseQueuedOrInFlight(stream)) {
			return promiseRejectedWith(
				new TypeError('Cannot close an already-closing stream')
			)
		}
		return WritableStreamDefaultWriterClose(this)
	}
	/**
	 * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
	 * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
	 * now on; otherwise, the writer will appear closed.
	 *
	 * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
	 * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
	 * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
	 * other producers from writing in an interleaved manner.
	 */
	releaseLock() {
		if (!IsWritableStreamDefaultWriter(this)) {
			throw defaultWriterBrandCheckException('releaseLock')
		}
		const stream = this._ownerWritableStream
		if (stream === undefined) {
			return
		}
		WritableStreamDefaultWriterRelease(this)
	}
	write(chunk = undefined) {
		if (!IsWritableStreamDefaultWriter(this)) {
			return promiseRejectedWith(defaultWriterBrandCheckException('write'))
		}
		if (this._ownerWritableStream === undefined) {
			return promiseRejectedWith(defaultWriterLockException('write to'))
		}
		return WritableStreamDefaultWriterWrite(this, chunk)
	}
}
Object.defineProperties(WritableStreamDefaultWriter.prototype, {
	abort: { enumerable: true },
	close: { enumerable: true },
	releaseLock: { enumerable: true },
	write: { enumerable: true },
	closed: { enumerable: true },
	desiredSize: { enumerable: true },
	ready: { enumerable: true },
})
// Abstract operations for the WritableStreamDefaultWriter.
function IsWritableStreamDefaultWriter(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_ownerWritableStream')) {
		return false
	}
	return x instanceof WritableStreamDefaultWriter
}
// A client of WritableStreamDefaultWriter may use these functions directly to bypass state check.
function WritableStreamDefaultWriterAbort(writer, reason) {
	const stream = writer._ownerWritableStream
	return WritableStreamAbort(stream, reason)
}
function WritableStreamDefaultWriterClose(writer) {
	const stream = writer._ownerWritableStream
	return WritableStreamClose(stream)
}
function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
	const stream = writer._ownerWritableStream
	const state = stream._state
	if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
		return promiseResolvedWith(undefined)
	}
	if (state === 'errored') {
		return promiseRejectedWith(stream._storedError)
	}
	return WritableStreamDefaultWriterClose(writer)
}
function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
	if (writer._closedPromiseState === 'pending') {
		defaultWriterClosedPromiseReject(writer, error)
	} else {
		defaultWriterClosedPromiseResetToRejected(writer, error)
	}
}
function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
	if (writer._readyPromiseState === 'pending') {
		defaultWriterReadyPromiseReject(writer, error)
	} else {
		defaultWriterReadyPromiseResetToRejected(writer, error)
	}
}
function WritableStreamDefaultWriterGetDesiredSize(writer) {
	const stream = writer._ownerWritableStream
	const state = stream._state
	if (state === 'errored' || state === 'erroring') {
		return null
	}
	if (state === 'closed') {
		return 0
	}
	return WritableStreamDefaultControllerGetDesiredSize(
		stream._writableStreamController
	)
}
function WritableStreamDefaultWriterRelease(writer) {
	const stream = writer._ownerWritableStream
	const releasedError = new TypeError(
		`Writer was released and can no longer be used to monitor the stream's closedness`
	)
	WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError)
	// The state transitions to "errored" before the sink abort() method runs, but the writer.closed promise is not
	// rejected until afterwards. This means that simply testing state will not work.
	WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError)
	stream._writer = undefined
	writer._ownerWritableStream = undefined
}
function WritableStreamDefaultWriterWrite(writer, chunk) {
	const stream = writer._ownerWritableStream
	const controller = stream._writableStreamController
	const chunkSize = WritableStreamDefaultControllerGetChunkSize(
		controller,
		chunk
	)
	if (stream !== writer._ownerWritableStream) {
		return promiseRejectedWith(defaultWriterLockException('write to'))
	}
	const state = stream._state
	if (state === 'errored') {
		return promiseRejectedWith(stream._storedError)
	}
	if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
		return promiseRejectedWith(
			new TypeError('The stream is closing or closed and cannot be written to')
		)
	}
	if (state === 'erroring') {
		return promiseRejectedWith(stream._storedError)
	}
	const promise = WritableStreamAddWriteRequest(stream)
	WritableStreamDefaultControllerWrite(controller, chunk, chunkSize)
	return promise
}
const closeSentinel = {}
/**
 * Allows control of a {@link WritableStream | writable stream}'s state and internal queue.
 *
 * @public
 */
class WritableStreamDefaultController {
	constructor() {
		throw new TypeError('Illegal constructor')
	}
	/**
	 * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
	 *
	 * @deprecated
	 *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
	 *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
	 */
	get abortReason() {
		if (!IsWritableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$2('abortReason')
		}
		return this._abortReason
	}
	/**
	 * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
	 */
	get signal() {
		if (!IsWritableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$2('signal')
		}
		if (this._abortController === undefined) {
			// Older browsers or older Node versions may not support `AbortController` or `AbortSignal`.
			// We don't want to bundle and ship an `AbortController` polyfill together with our polyfill,
			// so instead we only implement support for `signal` if we find a global `AbortController` constructor.
			throw new TypeError(
				'WritableStreamDefaultController.prototype.signal is not supported'
			)
		}
		return this._abortController.signal
	}
	/**
	 * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
	 *
	 * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
	 * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
	 * normal lifecycle of interactions with the underlying sink.
	 */
	error(e = undefined) {
		if (!IsWritableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$2('error')
		}
		const state = this._controlledWritableStream._state
		if (state !== 'writable') {
			// The stream is closed, errored or will be soon. The sink can't do anything useful if it gets an error here, so
			// just treat it as a no-op.
			return
		}
		WritableStreamDefaultControllerError(this, e)
	}
	/** @internal */
	[AbortSteps](reason) {
		const result = this._abortAlgorithm(reason)
		WritableStreamDefaultControllerClearAlgorithms(this)
		return result
	}
	/** @internal */
	[ErrorSteps]() {
		ResetQueue(this)
	}
}
Object.defineProperties(WritableStreamDefaultController.prototype, {
	abortReason: { enumerable: true },
	signal: { enumerable: true },
	error: { enumerable: true },
})
// Abstract operations implementing interface required by the WritableStream.
function IsWritableStreamDefaultController(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_controlledWritableStream')) {
		return false
	}
	return x instanceof WritableStreamDefaultController
}
function SetUpWritableStreamDefaultController(
	stream,
	controller,
	startAlgorithm,
	writeAlgorithm,
	closeAlgorithm,
	abortAlgorithm,
	highWaterMark,
	sizeAlgorithm
) {
	controller._controlledWritableStream = stream
	stream._writableStreamController = controller
	// Need to set the slots so that the assert doesn't fire. In the spec the slots already exist implicitly.
	controller._queue = undefined
	controller._queueTotalSize = undefined
	ResetQueue(controller)
	controller._abortReason = undefined
	controller._abortController = new AbortController()
	controller._started = false
	controller._strategySizeAlgorithm = sizeAlgorithm
	controller._strategyHWM = highWaterMark
	controller._writeAlgorithm = writeAlgorithm
	controller._closeAlgorithm = closeAlgorithm
	controller._abortAlgorithm = abortAlgorithm
	const backpressure =
		WritableStreamDefaultControllerGetBackpressure(controller)
	WritableStreamUpdateBackpressure(stream, backpressure)
	const startResult = startAlgorithm()
	const startPromise = promiseResolvedWith(startResult)
	uponPromise(
		startPromise,
		() => {
			controller._started = true
			WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
		},
		(r) => {
			controller._started = true
			WritableStreamDealWithRejection(stream, r)
		}
	)
}
function SetUpWritableStreamDefaultControllerFromUnderlyingSink(
	stream,
	underlyingSink,
	highWaterMark,
	sizeAlgorithm
) {
	const controller = Object.create(WritableStreamDefaultController.prototype)
	let startAlgorithm = () => undefined
	let writeAlgorithm = () => promiseResolvedWith(undefined)
	let closeAlgorithm = () => promiseResolvedWith(undefined)
	let abortAlgorithm = () => promiseResolvedWith(undefined)
	if (underlyingSink.start !== undefined) {
		startAlgorithm = () => underlyingSink.start(controller)
	}
	if (underlyingSink.write !== undefined) {
		writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller)
	}
	if (underlyingSink.close !== undefined) {
		closeAlgorithm = () => underlyingSink.close()
	}
	if (underlyingSink.abort !== undefined) {
		abortAlgorithm = (reason) => underlyingSink.abort(reason)
	}
	SetUpWritableStreamDefaultController(
		stream,
		controller,
		startAlgorithm,
		writeAlgorithm,
		closeAlgorithm,
		abortAlgorithm,
		highWaterMark,
		sizeAlgorithm
	)
}
// ClearAlgorithms may be called twice. Erroring the same stream in multiple ways will often result in redundant calls.
function WritableStreamDefaultControllerClearAlgorithms(controller) {
	controller._writeAlgorithm = undefined
	controller._closeAlgorithm = undefined
	controller._abortAlgorithm = undefined
	controller._strategySizeAlgorithm = undefined
}
function WritableStreamDefaultControllerClose(controller) {
	EnqueueValueWithSize(controller, closeSentinel, 0)
	WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
}
function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
	try {
		return controller._strategySizeAlgorithm(chunk)
	} catch (chunkSizeE) {
		WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE)
		return 1
	}
}
function WritableStreamDefaultControllerGetDesiredSize(controller) {
	return controller._strategyHWM - controller._queueTotalSize
}
function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
	try {
		EnqueueValueWithSize(controller, chunk, chunkSize)
	} catch (enqueueE) {
		WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE)
		return
	}
	const stream = controller._controlledWritableStream
	if (
		!WritableStreamCloseQueuedOrInFlight(stream) &&
		stream._state === 'writable'
	) {
		const backpressure =
			WritableStreamDefaultControllerGetBackpressure(controller)
		WritableStreamUpdateBackpressure(stream, backpressure)
	}
	WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
}
// Abstract operations for the WritableStreamDefaultController.
function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
	const stream = controller._controlledWritableStream
	if (!controller._started) {
		return
	}
	if (stream._inFlightWriteRequest !== undefined) {
		return
	}
	const state = stream._state
	if (state === 'erroring') {
		WritableStreamFinishErroring(stream)
		return
	}
	if (controller._queue.length === 0) {
		return
	}
	const value = PeekQueueValue(controller)
	if (value === closeSentinel) {
		WritableStreamDefaultControllerProcessClose(controller)
	} else {
		WritableStreamDefaultControllerProcessWrite(controller, value)
	}
}
function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
	if (controller._controlledWritableStream._state === 'writable') {
		WritableStreamDefaultControllerError(controller, error)
	}
}
function WritableStreamDefaultControllerProcessClose(controller) {
	const stream = controller._controlledWritableStream
	WritableStreamMarkCloseRequestInFlight(stream)
	DequeueValue(controller)
	const sinkClosePromise = controller._closeAlgorithm()
	WritableStreamDefaultControllerClearAlgorithms(controller)
	uponPromise(
		sinkClosePromise,
		() => {
			WritableStreamFinishInFlightClose(stream)
		},
		(reason) => {
			WritableStreamFinishInFlightCloseWithError(stream, reason)
		}
	)
}
function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
	const stream = controller._controlledWritableStream
	WritableStreamMarkFirstWriteRequestInFlight(stream)
	const sinkWritePromise = controller._writeAlgorithm(chunk)
	uponPromise(
		sinkWritePromise,
		() => {
			WritableStreamFinishInFlightWrite(stream)
			const state = stream._state
			DequeueValue(controller)
			if (
				!WritableStreamCloseQueuedOrInFlight(stream) &&
				state === 'writable'
			) {
				const backpressure =
					WritableStreamDefaultControllerGetBackpressure(controller)
				WritableStreamUpdateBackpressure(stream, backpressure)
			}
			WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
		},
		(reason) => {
			if (stream._state === 'writable') {
				WritableStreamDefaultControllerClearAlgorithms(controller)
			}
			WritableStreamFinishInFlightWriteWithError(stream, reason)
		}
	)
}
function WritableStreamDefaultControllerGetBackpressure(controller) {
	const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller)
	return desiredSize <= 0
}
// A client of WritableStreamDefaultController may use these functions directly to bypass state check.
function WritableStreamDefaultControllerError(controller, error) {
	const stream = controller._controlledWritableStream
	WritableStreamDefaultControllerClearAlgorithms(controller)
	WritableStreamStartErroring(stream, error)
}
// Helper functions for the WritableStream.
function streamBrandCheckException$2(name) {
	return new TypeError(
		`WritableStream.prototype.${name} can only be used on a WritableStream`
	)
}
// Helper functions for the WritableStreamDefaultController.
function defaultControllerBrandCheckException$2(name) {
	return new TypeError(
		`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`
	)
}
// Helper functions for the WritableStreamDefaultWriter.
function defaultWriterBrandCheckException(name) {
	return new TypeError(
		`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`
	)
}
function defaultWriterLockException(name) {
	return new TypeError('Cannot ' + name + ' a stream using a released writer')
}
function defaultWriterClosedPromiseInitialize(writer) {
	writer._closedPromise = newPromise((resolve, reject) => {
		writer._closedPromise_resolve = resolve
		writer._closedPromise_reject = reject
		writer._closedPromiseState = 'pending'
	})
}
function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
	defaultWriterClosedPromiseInitialize(writer)
	defaultWriterClosedPromiseReject(writer, reason)
}
function defaultWriterClosedPromiseInitializeAsResolved(writer) {
	defaultWriterClosedPromiseInitialize(writer)
	defaultWriterClosedPromiseResolve(writer)
}
function defaultWriterClosedPromiseReject(writer, reason) {
	if (writer._closedPromise_reject === undefined) {
		return
	}
	setPromiseIsHandledToTrue(writer._closedPromise)
	writer._closedPromise_reject(reason)
	writer._closedPromise_resolve = undefined
	writer._closedPromise_reject = undefined
	writer._closedPromiseState = 'rejected'
}
function defaultWriterClosedPromiseResetToRejected(writer, reason) {
	defaultWriterClosedPromiseInitializeAsRejected(writer, reason)
}
function defaultWriterClosedPromiseResolve(writer) {
	if (writer._closedPromise_resolve === undefined) {
		return
	}
	writer._closedPromise_resolve(undefined)
	writer._closedPromise_resolve = undefined
	writer._closedPromise_reject = undefined
	writer._closedPromiseState = 'resolved'
}
function defaultWriterReadyPromiseInitialize(writer) {
	writer._readyPromise = newPromise((resolve, reject) => {
		writer._readyPromise_resolve = resolve
		writer._readyPromise_reject = reject
	})
	writer._readyPromiseState = 'pending'
}
function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
	defaultWriterReadyPromiseInitialize(writer)
	defaultWriterReadyPromiseReject(writer, reason)
}
function defaultWriterReadyPromiseInitializeAsResolved(writer) {
	defaultWriterReadyPromiseInitialize(writer)
	defaultWriterReadyPromiseResolve(writer)
}
function defaultWriterReadyPromiseReject(writer, reason) {
	if (writer._readyPromise_reject === undefined) {
		return
	}
	setPromiseIsHandledToTrue(writer._readyPromise)
	writer._readyPromise_reject(reason)
	writer._readyPromise_resolve = undefined
	writer._readyPromise_reject = undefined
	writer._readyPromiseState = 'rejected'
}
function defaultWriterReadyPromiseReset(writer) {
	defaultWriterReadyPromiseInitialize(writer)
}
function defaultWriterReadyPromiseResetToRejected(writer, reason) {
	defaultWriterReadyPromiseInitializeAsRejected(writer, reason)
}
function defaultWriterReadyPromiseResolve(writer) {
	if (writer._readyPromise_resolve === undefined) {
		return
	}
	writer._readyPromise_resolve(undefined)
	writer._readyPromise_resolve = undefined
	writer._readyPromise_reject = undefined
	writer._readyPromiseState = 'fulfilled'
}
// eslint-disable-next-line no-redeclarelet DOMException$1=DOMException

function ReadableStreamPipeTo(
	source,
	dest,
	preventClose,
	preventAbort,
	preventCancel,
	signal
) {
	const reader = AcquireReadableStreamDefaultReader(source)
	const writer = AcquireWritableStreamDefaultWriter(dest)
	source._disturbed = true
	let shuttingDown = false
	// This is used to keep track of the spec's requirement that we wait for ongoing writes during shutdown.
	let currentWrite = promiseResolvedWith(undefined)
	return newPromise((resolve, reject) => {
		let abortAlgorithm
		if (signal !== undefined) {
			abortAlgorithm = () => {
				const error = new DOMException('Aborted', 'AbortError')
				const actions = []
				if (!preventAbort) {
					actions.push(() => {
						if (dest._state === 'writable') {
							return WritableStreamAbort(dest, error)
						}
						return promiseResolvedWith(undefined)
					})
				}
				if (!preventCancel) {
					actions.push(() => {
						if (source._state === 'readable') {
							return ReadableStreamCancel(source, error)
						}
						return promiseResolvedWith(undefined)
					})
				}
				shutdownWithAction(
					() => Promise.all(actions.map((action) => action())),
					true,
					error
				)
			}
			if (signal.aborted) {
				abortAlgorithm()
				return
			}
			signal.addEventListener('abort', abortAlgorithm)
		}
		// Using reader and writer, read all chunks from this and write them to dest
		// - Backpressure must be enforced
		// - Shutdown must stop all activity
		function pipeLoop() {
			return newPromise((resolveLoop, rejectLoop) => {
				function next(done) {
					if (done) {
						resolveLoop()
					} else {
						// Use `PerformPromiseThen` instead of `uponPromise` to avoid
						// adding unnecessary `.catch(rethrowAssertionErrorRejection)` handlers
						PerformPromiseThen(pipeStep(), next, rejectLoop)
					}
				}
				next(false)
			})
		}
		function pipeStep() {
			if (shuttingDown) {
				return promiseResolvedWith(true)
			}
			return PerformPromiseThen(writer._readyPromise, () => {
				return newPromise((resolveRead, rejectRead) => {
					ReadableStreamDefaultReaderRead(reader, {
						_chunkSteps: (chunk) => {
							currentWrite = PerformPromiseThen(
								WritableStreamDefaultWriterWrite(writer, chunk),
								undefined,
								noop$1
							)
							resolveRead(false)
						},
						_closeSteps: () => resolveRead(true),
						_errorSteps: rejectRead,
					})
				})
			})
		}
		// Errors must be propagated forward
		isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
			if (!preventAbort) {
				shutdownWithAction(
					() => WritableStreamAbort(dest, storedError),
					true,
					storedError
				)
			} else {
				shutdown(true, storedError)
			}
		})
		// Errors must be propagated backward
		isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
			if (!preventCancel) {
				shutdownWithAction(
					() => ReadableStreamCancel(source, storedError),
					true,
					storedError
				)
			} else {
				shutdown(true, storedError)
			}
		})
		// Closing must be propagated forward
		isOrBecomesClosed(source, reader._closedPromise, () => {
			if (!preventClose) {
				shutdownWithAction(() =>
					WritableStreamDefaultWriterCloseWithErrorPropagation(writer)
				)
			} else {
				shutdown()
			}
		})
		// Closing must be propagated backward
		if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === 'closed') {
			const destClosed = new TypeError(
				'the destination writable stream closed before all data could be piped to it'
			)
			if (!preventCancel) {
				shutdownWithAction(
					() => ReadableStreamCancel(source, destClosed),
					true,
					destClosed
				)
			} else {
				shutdown(true, destClosed)
			}
		}
		setPromiseIsHandledToTrue(pipeLoop())
		function waitForWritesToFinish() {
			// Another write may have started while we were waiting on this currentWrite, so we have to be sure to wait
			// for that too.
			const oldCurrentWrite = currentWrite
			return PerformPromiseThen(currentWrite, () =>
				oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : undefined
			)
		}
		function isOrBecomesErrored(stream, promise, action) {
			if (stream._state === 'errored') {
				action(stream._storedError)
			} else {
				uponRejection(promise, action)
			}
		}
		function isOrBecomesClosed(stream, promise, action) {
			if (stream._state === 'closed') {
				action()
			} else {
				uponFulfillment(promise, action)
			}
		}
		function shutdownWithAction(action, originalIsError, originalError) {
			if (shuttingDown) {
				return
			}
			shuttingDown = true
			if (
				dest._state === 'writable' &&
				!WritableStreamCloseQueuedOrInFlight(dest)
			) {
				uponFulfillment(waitForWritesToFinish(), doTheRest)
			} else {
				doTheRest()
			}
			function doTheRest() {
				uponPromise(
					action(),
					() => finalize(originalIsError, originalError),
					(newError) => finalize(true, newError)
				)
			}
		}
		function shutdown(isError, error) {
			if (shuttingDown) {
				return
			}
			shuttingDown = true
			if (
				dest._state === 'writable' &&
				!WritableStreamCloseQueuedOrInFlight(dest)
			) {
				uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error))
			} else {
				finalize(isError, error)
			}
		}
		function finalize(isError, error) {
			WritableStreamDefaultWriterRelease(writer)
			ReadableStreamReaderGenericRelease(reader)
			if (signal !== undefined) {
				signal.removeEventListener('abort', abortAlgorithm)
			}
			if (isError) {
				reject(error)
			} else {
				resolve(undefined)
			}
		}
	})
}

/**
 * Allows control of a {@link ReadableStream | readable stream}'s state and internal queue.
 *
 * @public
 */
class ReadableStreamDefaultController {
	constructor() {
		throw new TypeError('Illegal constructor')
	}
	/**
	 * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
	 * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
	 */
	get desiredSize() {
		if (!IsReadableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$1('desiredSize')
		}
		return ReadableStreamDefaultControllerGetDesiredSize(this)
	}
	/**
	 * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
	 * the stream, but once those are read, the stream will become closed.
	 */
	close() {
		if (!IsReadableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$1('close')
		}
		if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError('The stream is not in a state that permits close')
		}
		ReadableStreamDefaultControllerClose(this)
	}
	enqueue(chunk = undefined) {
		if (!IsReadableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$1('enqueue')
		}
		if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError('The stream is not in a state that permits enqueue')
		}
		return ReadableStreamDefaultControllerEnqueue(this, chunk)
	}
	/**
	 * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
	 */
	error(e = undefined) {
		if (!IsReadableStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException$1('error')
		}
		ReadableStreamDefaultControllerError(this, e)
	}
	/** @internal */
	[CancelSteps](reason) {
		ResetQueue(this)
		const result = this._cancelAlgorithm(reason)
		ReadableStreamDefaultControllerClearAlgorithms(this)
		return result
	}
	/** @internal */
	[PullSteps](readRequest) {
		const stream = this._controlledReadableStream
		if (this._queue.length > 0) {
			const chunk = DequeueValue(this)
			if (this._closeRequested && this._queue.length === 0) {
				ReadableStreamDefaultControllerClearAlgorithms(this)
				ReadableStreamClose(stream)
			} else {
				ReadableStreamDefaultControllerCallPullIfNeeded(this)
			}
			readRequest._chunkSteps(chunk)
		} else {
			ReadableStreamAddReadRequest(stream, readRequest)
			ReadableStreamDefaultControllerCallPullIfNeeded(this)
		}
	}
}
Object.defineProperties(ReadableStreamDefaultController.prototype, {
	close: { enumerable: true },
	enqueue: { enumerable: true },
	error: { enumerable: true },
	desiredSize: { enumerable: true },
})
// Abstract operations for the ReadableStreamDefaultController.
function IsReadableStreamDefaultController(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableStream')) {
		return false
	}
	return x instanceof ReadableStreamDefaultController
}
function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
	const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller)
	if (!shouldPull) {
		return
	}
	if (controller._pulling) {
		controller._pullAgain = true
		return
	}
	controller._pulling = true
	const pullPromise = controller._pullAlgorithm()
	uponPromise(
		pullPromise,
		() => {
			controller._pulling = false
			if (controller._pullAgain) {
				controller._pullAgain = false
				ReadableStreamDefaultControllerCallPullIfNeeded(controller)
			}
		},
		(e) => {
			ReadableStreamDefaultControllerError(controller, e)
		}
	)
}
function ReadableStreamDefaultControllerShouldCallPull(controller) {
	const stream = controller._controlledReadableStream
	if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
		return false
	}
	if (!controller._started) {
		return false
	}
	if (
		IsReadableStreamLocked(stream) &&
		ReadableStreamGetNumReadRequests(stream) > 0
	) {
		return true
	}
	const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller)
	if (desiredSize > 0) {
		return true
	}
	return false
}
function ReadableStreamDefaultControllerClearAlgorithms(controller) {
	controller._pullAlgorithm = undefined
	controller._cancelAlgorithm = undefined
	controller._strategySizeAlgorithm = undefined
}
// A client of ReadableStreamDefaultController may use these functions directly to bypass state check.
function ReadableStreamDefaultControllerClose(controller) {
	if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
		return
	}
	const stream = controller._controlledReadableStream
	controller._closeRequested = true
	if (controller._queue.length === 0) {
		ReadableStreamDefaultControllerClearAlgorithms(controller)
		ReadableStreamClose(stream)
	}
}
function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
	if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
		return
	}
	const stream = controller._controlledReadableStream
	if (
		IsReadableStreamLocked(stream) &&
		ReadableStreamGetNumReadRequests(stream) > 0
	) {
		ReadableStreamFulfillReadRequest(stream, chunk, false)
	} else {
		let chunkSize
		try {
			chunkSize = controller._strategySizeAlgorithm(chunk)
		} catch (chunkSizeE) {
			ReadableStreamDefaultControllerError(controller, chunkSizeE)
			throw chunkSizeE
		}
		try {
			EnqueueValueWithSize(controller, chunk, chunkSize)
		} catch (enqueueE) {
			ReadableStreamDefaultControllerError(controller, enqueueE)
			throw enqueueE
		}
	}
	ReadableStreamDefaultControllerCallPullIfNeeded(controller)
}
function ReadableStreamDefaultControllerError(controller, e) {
	const stream = controller._controlledReadableStream
	if (stream._state !== 'readable') {
		return
	}
	ResetQueue(controller)
	ReadableStreamDefaultControllerClearAlgorithms(controller)
	ReadableStreamError(stream, e)
}
function ReadableStreamDefaultControllerGetDesiredSize(controller) {
	const state = controller._controlledReadableStream._state
	if (state === 'errored') {
		return null
	}
	if (state === 'closed') {
		return 0
	}
	return controller._strategyHWM - controller._queueTotalSize
}
// This is used in the implementation of TransformStream.
function ReadableStreamDefaultControllerHasBackpressure(controller) {
	if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
		return false
	}
	return true
}
function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
	const state = controller._controlledReadableStream._state
	if (!controller._closeRequested && state === 'readable') {
		return true
	}
	return false
}
function SetUpReadableStreamDefaultController(
	stream,
	controller,
	startAlgorithm,
	pullAlgorithm,
	cancelAlgorithm,
	highWaterMark,
	sizeAlgorithm
) {
	controller._controlledReadableStream = stream
	controller._queue = undefined
	controller._queueTotalSize = undefined
	ResetQueue(controller)
	controller._started = false
	controller._closeRequested = false
	controller._pullAgain = false
	controller._pulling = false
	controller._strategySizeAlgorithm = sizeAlgorithm
	controller._strategyHWM = highWaterMark
	controller._pullAlgorithm = pullAlgorithm
	controller._cancelAlgorithm = cancelAlgorithm
	stream._readableStreamController = controller
	const startResult = startAlgorithm()
	uponPromise(
		promiseResolvedWith(startResult),
		() => {
			controller._started = true
			ReadableStreamDefaultControllerCallPullIfNeeded(controller)
		},
		(r) => {
			ReadableStreamDefaultControllerError(controller, r)
		}
	)
}
function SetUpReadableStreamDefaultControllerFromUnderlyingSource(
	stream,
	underlyingSource,
	highWaterMark,
	sizeAlgorithm
) {
	const controller = Object.create(ReadableStreamDefaultController.prototype)
	let startAlgorithm = () => undefined
	let pullAlgorithm = () => promiseResolvedWith(undefined)
	let cancelAlgorithm = () => promiseResolvedWith(undefined)
	if (underlyingSource.start !== undefined) {
		startAlgorithm = () => underlyingSource.start(controller)
	}
	if (underlyingSource.pull !== undefined) {
		pullAlgorithm = () => underlyingSource.pull(controller)
	}
	if (underlyingSource.cancel !== undefined) {
		cancelAlgorithm = (reason) => underlyingSource.cancel(reason)
	}
	SetUpReadableStreamDefaultController(
		stream,
		controller,
		startAlgorithm,
		pullAlgorithm,
		cancelAlgorithm,
		highWaterMark,
		sizeAlgorithm
	)
}
// Helper functions for the ReadableStreamDefaultController.
function defaultControllerBrandCheckException$1(name) {
	return new TypeError(
		`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`
	)
}

function ReadableStreamTee(stream, cloneForBranch2) {
	if (IsReadableByteStreamController(stream._readableStreamController)) {
		return ReadableByteStreamTee(stream)
	}
	return ReadableStreamDefaultTee(stream)
}
function ReadableStreamDefaultTee(stream, cloneForBranch2) {
	const reader = AcquireReadableStreamDefaultReader(stream)
	let reading = false
	let readAgain = false
	let canceled1 = false
	let canceled2 = false
	let reason1
	let reason2
	let branch1
	let branch2
	let resolveCancelPromise
	const cancelPromise = newPromise((resolve) => {
		resolveCancelPromise = resolve
	})
	function pullAlgorithm() {
		if (reading) {
			readAgain = true
			return promiseResolvedWith(undefined)
		}
		reading = true
		const readRequest = {
			_chunkSteps: (chunk) => {
				// This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
				// reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
				// successful synchronously-available reads get ahead of asynchronously-available errors.
				queueMicrotask(() => {
					readAgain = false
					const chunk1 = chunk
					const chunk2 = chunk
					// There is no way to access the cloning code right now in the reference implementation.
					// If we add one then we'll need an implementation for serializable objects.
					// if (!canceled2 && cloneForBranch2) {
					//   chunk2 = StructuredDeserialize(StructuredSerialize(chunk2));
					// }
					if (!canceled1) {
						ReadableStreamDefaultControllerEnqueue(
							branch1._readableStreamController,
							chunk1
						)
					}
					if (!canceled2) {
						ReadableStreamDefaultControllerEnqueue(
							branch2._readableStreamController,
							chunk2
						)
					}
					reading = false
					if (readAgain) {
						pullAlgorithm()
					}
				})
			},
			_closeSteps: () => {
				reading = false
				if (!canceled1) {
					ReadableStreamDefaultControllerClose(
						branch1._readableStreamController
					)
				}
				if (!canceled2) {
					ReadableStreamDefaultControllerClose(
						branch2._readableStreamController
					)
				}
				if (!canceled1 || !canceled2) {
					resolveCancelPromise(undefined)
				}
			},
			_errorSteps: () => {
				reading = false
			},
		}
		ReadableStreamDefaultReaderRead(reader, readRequest)
		return promiseResolvedWith(undefined)
	}
	function cancel1Algorithm(reason) {
		canceled1 = true
		reason1 = reason
		if (canceled2) {
			const compositeReason = CreateArrayFromList([reason1, reason2])
			const cancelResult = ReadableStreamCancel(stream, compositeReason)
			resolveCancelPromise(cancelResult)
		}
		return cancelPromise
	}
	function cancel2Algorithm(reason) {
		canceled2 = true
		reason2 = reason
		if (canceled1) {
			const compositeReason = CreateArrayFromList([reason1, reason2])
			const cancelResult = ReadableStreamCancel(stream, compositeReason)
			resolveCancelPromise(cancelResult)
		}
		return cancelPromise
	}
	function startAlgorithm() {
		// do nothing
	}
	branch1 = CreateReadableStream(
		startAlgorithm,
		pullAlgorithm,
		cancel1Algorithm
	)
	branch2 = CreateReadableStream(
		startAlgorithm,
		pullAlgorithm,
		cancel2Algorithm
	)
	uponRejection(reader._closedPromise, (r) => {
		ReadableStreamDefaultControllerError(branch1._readableStreamController, r)
		ReadableStreamDefaultControllerError(branch2._readableStreamController, r)
		if (!canceled1 || !canceled2) {
			resolveCancelPromise(undefined)
		}
	})
	return [branch1, branch2]
}
function ReadableByteStreamTee(stream) {
	let reader = AcquireReadableStreamDefaultReader(stream)
	let reading = false
	let readAgainForBranch1 = false
	let readAgainForBranch2 = false
	let canceled1 = false
	let canceled2 = false
	let reason1
	let reason2
	let branch1
	let branch2
	let resolveCancelPromise
	const cancelPromise = newPromise((resolve) => {
		resolveCancelPromise = resolve
	})
	function forwardReaderError(thisReader) {
		uponRejection(thisReader._closedPromise, (r) => {
			if (thisReader !== reader) {
				return
			}
			ReadableByteStreamControllerError(branch1._readableStreamController, r)
			ReadableByteStreamControllerError(branch2._readableStreamController, r)
			if (!canceled1 || !canceled2) {
				resolveCancelPromise(undefined)
			}
		})
	}
	function pullWithDefaultReader() {
		if (IsReadableStreamBYOBReader(reader)) {
			ReadableStreamReaderGenericRelease(reader)
			reader = AcquireReadableStreamDefaultReader(stream)
			forwardReaderError(reader)
		}
		const readRequest = {
			_chunkSteps: (chunk) => {
				// This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
				// reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
				// successful synchronously-available reads get ahead of asynchronously-available errors.
				queueMicrotask(() => {
					readAgainForBranch1 = false
					readAgainForBranch2 = false
					const chunk1 = chunk
					let chunk2 = chunk
					if (!canceled1 && !canceled2) {
						try {
							chunk2 = CloneAsUint8Array(chunk)
						} catch (cloneE) {
							ReadableByteStreamControllerError(
								branch1._readableStreamController,
								cloneE
							)
							ReadableByteStreamControllerError(
								branch2._readableStreamController,
								cloneE
							)
							resolveCancelPromise(ReadableStreamCancel(stream, cloneE))
							return
						}
					}
					if (!canceled1) {
						ReadableByteStreamControllerEnqueue(
							branch1._readableStreamController,
							chunk1
						)
					}
					if (!canceled2) {
						ReadableByteStreamControllerEnqueue(
							branch2._readableStreamController,
							chunk2
						)
					}
					reading = false
					if (readAgainForBranch1) {
						pull1Algorithm()
					} else if (readAgainForBranch2) {
						pull2Algorithm()
					}
				})
			},
			_closeSteps: () => {
				reading = false
				if (!canceled1) {
					ReadableByteStreamControllerClose(branch1._readableStreamController)
				}
				if (!canceled2) {
					ReadableByteStreamControllerClose(branch2._readableStreamController)
				}
				if (branch1._readableStreamController._pendingPullIntos.length > 0) {
					ReadableByteStreamControllerRespond(
						branch1._readableStreamController,
						0
					)
				}
				if (branch2._readableStreamController._pendingPullIntos.length > 0) {
					ReadableByteStreamControllerRespond(
						branch2._readableStreamController,
						0
					)
				}
				if (!canceled1 || !canceled2) {
					resolveCancelPromise(undefined)
				}
			},
			_errorSteps: () => {
				reading = false
			},
		}
		ReadableStreamDefaultReaderRead(reader, readRequest)
	}
	function pullWithBYOBReader(view, forBranch2) {
		if (IsReadableStreamDefaultReader(reader)) {
			ReadableStreamReaderGenericRelease(reader)
			reader = AcquireReadableStreamBYOBReader(stream)
			forwardReaderError(reader)
		}
		const byobBranch = forBranch2 ? branch2 : branch1
		const otherBranch = forBranch2 ? branch1 : branch2
		const readIntoRequest = {
			_chunkSteps: (chunk) => {
				// This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
				// reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
				// successful synchronously-available reads get ahead of asynchronously-available errors.
				queueMicrotask(() => {
					readAgainForBranch1 = false
					readAgainForBranch2 = false
					const byobCanceled = forBranch2 ? canceled2 : canceled1
					const otherCanceled = forBranch2 ? canceled1 : canceled2
					if (!otherCanceled) {
						let clonedChunk
						try {
							clonedChunk = CloneAsUint8Array(chunk)
						} catch (cloneE) {
							ReadableByteStreamControllerError(
								byobBranch._readableStreamController,
								cloneE
							)
							ReadableByteStreamControllerError(
								otherBranch._readableStreamController,
								cloneE
							)
							resolveCancelPromise(ReadableStreamCancel(stream, cloneE))
							return
						}
						if (!byobCanceled) {
							ReadableByteStreamControllerRespondWithNewView(
								byobBranch._readableStreamController,
								chunk
							)
						}
						ReadableByteStreamControllerEnqueue(
							otherBranch._readableStreamController,
							clonedChunk
						)
					} else if (!byobCanceled) {
						ReadableByteStreamControllerRespondWithNewView(
							byobBranch._readableStreamController,
							chunk
						)
					}
					reading = false
					if (readAgainForBranch1) {
						pull1Algorithm()
					} else if (readAgainForBranch2) {
						pull2Algorithm()
					}
				})
			},
			_closeSteps: (chunk) => {
				reading = false
				const byobCanceled = forBranch2 ? canceled2 : canceled1
				const otherCanceled = forBranch2 ? canceled1 : canceled2
				if (!byobCanceled) {
					ReadableByteStreamControllerClose(
						byobBranch._readableStreamController
					)
				}
				if (!otherCanceled) {
					ReadableByteStreamControllerClose(
						otherBranch._readableStreamController
					)
				}
				if (chunk !== undefined) {
					if (!byobCanceled) {
						ReadableByteStreamControllerRespondWithNewView(
							byobBranch._readableStreamController,
							chunk
						)
					}
					if (
						!otherCanceled &&
						otherBranch._readableStreamController._pendingPullIntos.length > 0
					) {
						ReadableByteStreamControllerRespond(
							otherBranch._readableStreamController,
							0
						)
					}
				}
				if (!byobCanceled || !otherCanceled) {
					resolveCancelPromise(undefined)
				}
			},
			_errorSteps: () => {
				reading = false
			},
		}
		ReadableStreamBYOBReaderRead(reader, view, readIntoRequest)
	}
	function pull1Algorithm() {
		if (reading) {
			readAgainForBranch1 = true
			return promiseResolvedWith(undefined)
		}
		reading = true
		const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
			branch1._readableStreamController
		)
		if (byobRequest === null) {
			pullWithDefaultReader()
		} else {
			pullWithBYOBReader(byobRequest._view, false)
		}
		return promiseResolvedWith(undefined)
	}
	function pull2Algorithm() {
		if (reading) {
			readAgainForBranch2 = true
			return promiseResolvedWith(undefined)
		}
		reading = true
		const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
			branch2._readableStreamController
		)
		if (byobRequest === null) {
			pullWithDefaultReader()
		} else {
			pullWithBYOBReader(byobRequest._view, true)
		}
		return promiseResolvedWith(undefined)
	}
	function cancel1Algorithm(reason) {
		canceled1 = true
		reason1 = reason
		if (canceled2) {
			const compositeReason = CreateArrayFromList([reason1, reason2])
			const cancelResult = ReadableStreamCancel(stream, compositeReason)
			resolveCancelPromise(cancelResult)
		}
		return cancelPromise
	}
	function cancel2Algorithm(reason) {
		canceled2 = true
		reason2 = reason
		if (canceled1) {
			const compositeReason = CreateArrayFromList([reason1, reason2])
			const cancelResult = ReadableStreamCancel(stream, compositeReason)
			resolveCancelPromise(cancelResult)
		}
		return cancelPromise
	}
	function startAlgorithm() {
		return
	}
	branch1 = CreateReadableByteStream(
		startAlgorithm,
		pull1Algorithm,
		cancel1Algorithm
	)
	branch2 = CreateReadableByteStream(
		startAlgorithm,
		pull2Algorithm,
		cancel2Algorithm
	)
	forwardReaderError(reader)
	return [branch1, branch2]
}

function convertUnderlyingDefaultOrByteSource(source, context) {
	assertDictionary(source, context)
	const original = source
	const autoAllocateChunkSize =
		original === null || original === void 0
			? void 0
			: original.autoAllocateChunkSize
	const cancel =
		original === null || original === void 0 ? void 0 : original.cancel
	const pull = original === null || original === void 0 ? void 0 : original.pull
	const start =
		original === null || original === void 0 ? void 0 : original.start
	const type = original === null || original === void 0 ? void 0 : original.type
	return {
		autoAllocateChunkSize:
			autoAllocateChunkSize === undefined
				? undefined
				: convertUnsignedLongLongWithEnforceRange(
						autoAllocateChunkSize,
						`${context} has member 'autoAllocateChunkSize' that`
				  ),
		cancel:
			cancel === undefined
				? undefined
				: convertUnderlyingSourceCancelCallback(
						cancel,
						original,
						`${context} has member 'cancel' that`
				  ),
		pull:
			pull === undefined
				? undefined
				: convertUnderlyingSourcePullCallback(
						pull,
						original,
						`${context} has member 'pull' that`
				  ),
		start:
			start === undefined
				? undefined
				: convertUnderlyingSourceStartCallback(
						start,
						original,
						`${context} has member 'start' that`
				  ),
		type:
			type === undefined
				? undefined
				: convertReadableStreamType(type, `${context} has member 'type' that`),
	}
}
function convertUnderlyingSourceCancelCallback(fn, original, context) {
	assertFunction(fn, context)
	return (reason) => promiseCall(fn, original, [reason])
}
function convertUnderlyingSourcePullCallback(fn, original, context) {
	assertFunction(fn, context)
	return (controller) => promiseCall(fn, original, [controller])
}
function convertUnderlyingSourceStartCallback(fn, original, context) {
	assertFunction(fn, context)
	return (controller) => reflectCall(fn, original, [controller])
}
function convertReadableStreamType(type, context) {
	type = `${type}`
	if (type !== 'bytes') {
		throw new TypeError(
			`${context} '${type}' is not a valid enumeration value for ReadableStreamType`
		)
	}
	return type
}

function convertReaderOptions(options, context) {
	assertDictionary(options, context)
	const mode = options === null || options === void 0 ? void 0 : options.mode
	return {
		mode:
			mode === undefined
				? undefined
				: convertReadableStreamReaderMode(
						mode,
						`${context} has member 'mode' that`
				  ),
	}
}
function convertReadableStreamReaderMode(mode, context) {
	mode = `${mode}`
	if (mode !== 'byob') {
		throw new TypeError(
			`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`
		)
	}
	return mode
}

function convertIteratorOptions(options, context) {
	assertDictionary(options, context)
	const preventCancel =
		options === null || options === void 0 ? void 0 : options.preventCancel
	return { preventCancel: Boolean(preventCancel) }
}

function convertPipeOptions(options, context) {
	assertDictionary(options, context)
	const preventAbort =
		options === null || options === void 0 ? void 0 : options.preventAbort
	const preventCancel =
		options === null || options === void 0 ? void 0 : options.preventCancel
	const preventClose =
		options === null || options === void 0 ? void 0 : options.preventClose
	const signal =
		options === null || options === void 0 ? void 0 : options.signal
	if (signal !== undefined) {
		assertAbortSignal(signal, `${context} has member 'signal' that`)
	}
	return {
		preventAbort: Boolean(preventAbort),
		preventCancel: Boolean(preventCancel),
		preventClose: Boolean(preventClose),
		signal,
	}
}
function assertAbortSignal(signal, context) {
	if (!isAbortSignal$1(signal)) {
		throw new TypeError(`${context} is not an AbortSignal.`)
	}
}

function convertReadableWritablePair(pair, context) {
	assertDictionary(pair, context)
	const readable = pair === null || pair === void 0 ? void 0 : pair.readable
	assertRequiredField(readable, 'readable', 'ReadableWritablePair')
	assertReadableStream(readable, `${context} has member 'readable' that`)
	const writable = pair === null || pair === void 0 ? void 0 : pair.writable
	assertRequiredField(writable, 'writable', 'ReadableWritablePair')
	assertWritableStream(writable, `${context} has member 'writable' that`)
	return { readable, writable }
}

/**
 * A readable stream represents a source of data, from which you can read.
 *
 * @public
 */
class ReadableStream {
	constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
		if (rawUnderlyingSource === undefined) {
			rawUnderlyingSource = null
		} else {
			assertObject(rawUnderlyingSource, 'First parameter')
		}
		const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter')
		const underlyingSource = convertUnderlyingDefaultOrByteSource(
			rawUnderlyingSource,
			'First parameter'
		)
		InitializeReadableStream(this)
		if (underlyingSource.type === 'bytes') {
			if (strategy.size !== undefined) {
				throw new RangeError(
					'The strategy for a byte stream cannot have a size function'
				)
			}
			const highWaterMark = ExtractHighWaterMark(strategy, 0)
			SetUpReadableByteStreamControllerFromUnderlyingSource(
				this,
				underlyingSource,
				highWaterMark
			)
		} else {
			const sizeAlgorithm = ExtractSizeAlgorithm(strategy)
			const highWaterMark = ExtractHighWaterMark(strategy, 1)
			SetUpReadableStreamDefaultControllerFromUnderlyingSource(
				this,
				underlyingSource,
				highWaterMark,
				sizeAlgorithm
			)
		}
	}
	/**
	 * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
	 */
	get locked() {
		if (!IsReadableStream(this)) {
			throw streamBrandCheckException$1('locked')
		}
		return IsReadableStreamLocked(this)
	}
	/**
	 * Cancels the stream, signaling a loss of interest in the stream by a consumer.
	 *
	 * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
	 * method, which might or might not use it.
	 */
	cancel(reason = undefined) {
		if (!IsReadableStream(this)) {
			return promiseRejectedWith(streamBrandCheckException$1('cancel'))
		}
		if (IsReadableStreamLocked(this)) {
			return promiseRejectedWith(
				new TypeError('Cannot cancel a stream that already has a reader')
			)
		}
		return ReadableStreamCancel(this, reason)
	}
	getReader(rawOptions = undefined) {
		if (!IsReadableStream(this)) {
			throw streamBrandCheckException$1('getReader')
		}
		const options = convertReaderOptions(rawOptions, 'First parameter')
		if (options.mode === undefined) {
			return AcquireReadableStreamDefaultReader(this)
		}
		return AcquireReadableStreamBYOBReader(this)
	}
	pipeThrough(rawTransform, rawOptions = {}) {
		if (!IsReadableStream(this)) {
			throw streamBrandCheckException$1('pipeThrough')
		}
		assertRequiredArgument(rawTransform, 1, 'pipeThrough')
		const transform = convertReadableWritablePair(
			rawTransform,
			'First parameter'
		)
		const options = convertPipeOptions(rawOptions, 'Second parameter')
		if (IsReadableStreamLocked(this)) {
			throw new TypeError(
				'ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream'
			)
		}
		if (IsWritableStreamLocked(transform.writable)) {
			throw new TypeError(
				'ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream'
			)
		}
		const promise = ReadableStreamPipeTo(
			this,
			transform.writable,
			options.preventClose,
			options.preventAbort,
			options.preventCancel,
			options.signal
		)
		setPromiseIsHandledToTrue(promise)
		return transform.readable
	}
	pipeTo(destination, rawOptions = {}) {
		if (!IsReadableStream(this)) {
			return promiseRejectedWith(streamBrandCheckException$1('pipeTo'))
		}
		if (destination === undefined) {
			return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`)
		}
		if (!IsWritableStream(destination)) {
			return promiseRejectedWith(
				new TypeError(
					`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`
				)
			)
		}
		let options
		try {
			options = convertPipeOptions(rawOptions, 'Second parameter')
		} catch (e) {
			return promiseRejectedWith(e)
		}
		if (IsReadableStreamLocked(this)) {
			return promiseRejectedWith(
				new TypeError(
					'ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream'
				)
			)
		}
		if (IsWritableStreamLocked(destination)) {
			return promiseRejectedWith(
				new TypeError(
					'ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream'
				)
			)
		}
		return ReadableStreamPipeTo(
			this,
			destination,
			options.preventClose,
			options.preventAbort,
			options.preventCancel,
			options.signal
		)
	}
	/**
	 * Tees this readable stream, returning a two-element array containing the two resulting branches as
	 * new {@link ReadableStream} instances.
	 *
	 * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
	 * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
	 * propagated to the stream's underlying source.
	 *
	 * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
	 * this could allow interference between the two branches.
	 */
	tee() {
		if (!IsReadableStream(this)) {
			throw streamBrandCheckException$1('tee')
		}
		const branches = ReadableStreamTee(this)
		return CreateArrayFromList(branches)
	}
	values(rawOptions = undefined) {
		if (!IsReadableStream(this)) {
			throw streamBrandCheckException$1('values')
		}
		const options = convertIteratorOptions(rawOptions, 'First parameter')
		return AcquireReadableStreamAsyncIterator(this, options.preventCancel)
	}
}
Object.defineProperties(ReadableStream.prototype, {
	cancel: { enumerable: true },
	getReader: { enumerable: true },
	pipeThrough: { enumerable: true },
	pipeTo: { enumerable: true },
	tee: { enumerable: true },
	values: { enumerable: true },
	locked: { enumerable: true },
})
// Abstract operations for the ReadableStream.
// Throws if and only if startAlgorithm throws.
function CreateReadableStream(
	startAlgorithm,
	pullAlgorithm,
	cancelAlgorithm,
	highWaterMark = 1,
	sizeAlgorithm = () => 1
) {
	const stream = Object.create(ReadableStream.prototype)
	InitializeReadableStream(stream)
	const controller = Object.create(ReadableStreamDefaultController.prototype)
	SetUpReadableStreamDefaultController(
		stream,
		controller,
		startAlgorithm,
		pullAlgorithm,
		cancelAlgorithm,
		highWaterMark,
		sizeAlgorithm
	)
	return stream
}
// Throws if and only if startAlgorithm throws.
function CreateReadableByteStream(
	startAlgorithm,
	pullAlgorithm,
	cancelAlgorithm
) {
	const stream = Object.create(ReadableStream.prototype)
	InitializeReadableStream(stream)
	const controller = Object.create(ReadableByteStreamController.prototype)
	SetUpReadableByteStreamController(
		stream,
		controller,
		startAlgorithm,
		pullAlgorithm,
		cancelAlgorithm,
		0,
		undefined
	)
	return stream
}
function InitializeReadableStream(stream) {
	stream._state = 'readable'
	stream._reader = undefined
	stream._storedError = undefined
	stream._disturbed = false
}
function IsReadableStream(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_readableStreamController')) {
		return false
	}
	return x instanceof ReadableStream
}
function IsReadableStreamLocked(stream) {
	if (stream._reader === undefined) {
		return false
	}
	return true
}
// ReadableStream API exposed for controllers.
function ReadableStreamCancel(stream, reason) {
	stream._disturbed = true
	if (stream._state === 'closed') {
		return promiseResolvedWith(undefined)
	}
	if (stream._state === 'errored') {
		return promiseRejectedWith(stream._storedError)
	}
	ReadableStreamClose(stream)
	const reader = stream._reader
	if (reader !== undefined && IsReadableStreamBYOBReader(reader)) {
		reader._readIntoRequests.forEach((readIntoRequest) => {
			readIntoRequest._closeSteps(undefined)
		})
		reader._readIntoRequests = new SimpleQueue()
	}
	const sourceCancelPromise =
		stream._readableStreamController[CancelSteps](reason)
	return transformPromiseWith(sourceCancelPromise, noop$1)
}
function ReadableStreamClose(stream) {
	stream._state = 'closed'
	const reader = stream._reader
	if (reader === undefined) {
		return
	}
	defaultReaderClosedPromiseResolve(reader)
	if (IsReadableStreamDefaultReader(reader)) {
		reader._readRequests.forEach((readRequest) => {
			readRequest._closeSteps()
		})
		reader._readRequests = new SimpleQueue()
	}
}
function ReadableStreamError(stream, e) {
	stream._state = 'errored'
	stream._storedError = e
	const reader = stream._reader
	if (reader === undefined) {
		return
	}
	defaultReaderClosedPromiseReject(reader, e)
	if (IsReadableStreamDefaultReader(reader)) {
		reader._readRequests.forEach((readRequest) => {
			readRequest._errorSteps(e)
		})
		reader._readRequests = new SimpleQueue()
	} else {
		reader._readIntoRequests.forEach((readIntoRequest) => {
			readIntoRequest._errorSteps(e)
		})
		reader._readIntoRequests = new SimpleQueue()
	}
}
// Helper functions for the ReadableStream.
function streamBrandCheckException$1(name) {
	return new TypeError(
		`ReadableStream.prototype.${name} can only be used on a ReadableStream`
	)
}

function convertQueuingStrategyInit(init, context) {
	assertDictionary(init, context)
	const highWaterMark =
		init === null || init === void 0 ? void 0 : init.highWaterMark
	assertRequiredField(highWaterMark, 'highWaterMark', 'QueuingStrategyInit')
	return {
		highWaterMark: convertUnrestrictedDouble(highWaterMark),
	}
}

// The size function must not have a prototype property nor be a constructor
const byteLengthSizeFunction = (chunk) => {
	return chunk.byteLength
}
Object.defineProperty(byteLengthSizeFunction, 'name', {
	value: 'size',
	configurable: true,
})
/**
 * A queuing strategy that counts the number of bytes in each chunk.
 *
 * @public
 */
class ByteLengthQueuingStrategy {
	constructor(options) {
		assertRequiredArgument(options, 1, 'ByteLengthQueuingStrategy')
		options = convertQueuingStrategyInit(options, 'First parameter')
		this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark
	}
	/**
	 * Returns the high water mark provided to the constructor.
	 */
	get highWaterMark() {
		if (!IsByteLengthQueuingStrategy(this)) {
			throw byteLengthBrandCheckException('highWaterMark')
		}
		return this._byteLengthQueuingStrategyHighWaterMark
	}
	/**
	 * Measures the size of `chunk` by returning the value of its `byteLength` property.
	 */
	get size() {
		if (!IsByteLengthQueuingStrategy(this)) {
			throw byteLengthBrandCheckException('size')
		}
		return byteLengthSizeFunction
	}
}
Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
	highWaterMark: { enumerable: true },
	size: { enumerable: true },
})
// Helper functions for the ByteLengthQueuingStrategy.
function byteLengthBrandCheckException(name) {
	return new TypeError(
		`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`
	)
}
function IsByteLengthQueuingStrategy(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (
		!Object.prototype.hasOwnProperty.call(
			x,
			'_byteLengthQueuingStrategyHighWaterMark'
		)
	) {
		return false
	}
	return x instanceof ByteLengthQueuingStrategy
}

// The size function must not have a prototype property nor be a constructor
const countSizeFunction = () => {
	return 1
}
Object.defineProperty(countSizeFunction, 'name', {
	value: 'size',
	configurable: true,
})
/**
 * A queuing strategy that counts the number of chunks.
 *
 * @public
 */
class CountQueuingStrategy {
	constructor(options) {
		assertRequiredArgument(options, 1, 'CountQueuingStrategy')
		options = convertQueuingStrategyInit(options, 'First parameter')
		this._countQueuingStrategyHighWaterMark = options.highWaterMark
	}
	/**
	 * Returns the high water mark provided to the constructor.
	 */
	get highWaterMark() {
		if (!IsCountQueuingStrategy(this)) {
			throw countBrandCheckException('highWaterMark')
		}
		return this._countQueuingStrategyHighWaterMark
	}
	/**
	 * Measures the size of `chunk` by always returning 1.
	 * This ensures that the total queue size is a count of the number of chunks in the queue.
	 */
	get size() {
		if (!IsCountQueuingStrategy(this)) {
			throw countBrandCheckException('size')
		}
		return countSizeFunction
	}
}
Object.defineProperties(CountQueuingStrategy.prototype, {
	highWaterMark: { enumerable: true },
	size: { enumerable: true },
})
// Helper functions for the CountQueuingStrategy.
function countBrandCheckException(name) {
	return new TypeError(
		`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`
	)
}
function IsCountQueuingStrategy(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (
		!Object.prototype.hasOwnProperty.call(
			x,
			'_countQueuingStrategyHighWaterMark'
		)
	) {
		return false
	}
	return x instanceof CountQueuingStrategy
}

function convertTransformer(original, context) {
	assertDictionary(original, context)
	const flush =
		original === null || original === void 0 ? void 0 : original.flush
	const readableType =
		original === null || original === void 0 ? void 0 : original.readableType
	const start =
		original === null || original === void 0 ? void 0 : original.start
	const transform =
		original === null || original === void 0 ? void 0 : original.transform
	const writableType =
		original === null || original === void 0 ? void 0 : original.writableType
	return {
		flush:
			flush === undefined
				? undefined
				: convertTransformerFlushCallback(
						flush,
						original,
						`${context} has member 'flush' that`
				  ),
		readableType,
		start:
			start === undefined
				? undefined
				: convertTransformerStartCallback(
						start,
						original,
						`${context} has member 'start' that`
				  ),
		transform:
			transform === undefined
				? undefined
				: convertTransformerTransformCallback(
						transform,
						original,
						`${context} has member 'transform' that`
				  ),
		writableType,
	}
}
function convertTransformerFlushCallback(fn, original, context) {
	assertFunction(fn, context)
	return (controller) => promiseCall(fn, original, [controller])
}
function convertTransformerStartCallback(fn, original, context) {
	assertFunction(fn, context)
	return (controller) => reflectCall(fn, original, [controller])
}
function convertTransformerTransformCallback(fn, original, context) {
	assertFunction(fn, context)
	return (chunk, controller) => promiseCall(fn, original, [chunk, controller])
}

// Class TransformStream
/**
 * A transform stream consists of a pair of streams: a {@link WritableStream | writable stream},
 * known as its writable side, and a {@link ReadableStream | readable stream}, known as its readable side.
 * In a manner specific to the transform stream in question, writes to the writable side result in new data being
 * made available for reading from the readable side.
 *
 * @public
 */
class TransformStream {
	constructor(
		rawTransformer = {},
		rawWritableStrategy = {},
		rawReadableStrategy = {}
	) {
		if (rawTransformer === undefined) {
			rawTransformer = null
		}
		const writableStrategy = convertQueuingStrategy(
			rawWritableStrategy,
			'Second parameter'
		)
		const readableStrategy = convertQueuingStrategy(
			rawReadableStrategy,
			'Third parameter'
		)
		const transformer = convertTransformer(rawTransformer, 'First parameter')
		if (transformer.readableType !== undefined) {
			throw new RangeError('Invalid readableType specified')
		}
		if (transformer.writableType !== undefined) {
			throw new RangeError('Invalid writableType specified')
		}
		const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0)
		const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy)
		const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1)
		const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy)
		let startPromise_resolve
		const startPromise = newPromise((resolve) => {
			startPromise_resolve = resolve
		})
		InitializeTransformStream(
			this,
			startPromise,
			writableHighWaterMark,
			writableSizeAlgorithm,
			readableHighWaterMark,
			readableSizeAlgorithm
		)
		SetUpTransformStreamDefaultControllerFromTransformer(this, transformer)
		if (transformer.start !== undefined) {
			startPromise_resolve(transformer.start(this._transformStreamController))
		} else {
			startPromise_resolve(undefined)
		}
	}
	/**
	 * The readable side of the transform stream.
	 */
	get readable() {
		if (!IsTransformStream(this)) {
			throw streamBrandCheckException('readable')
		}
		return this._readable
	}
	/**
	 * The writable side of the transform stream.
	 */
	get writable() {
		if (!IsTransformStream(this)) {
			throw streamBrandCheckException('writable')
		}
		return this._writable
	}
}
Object.defineProperties(TransformStream.prototype, {
	readable: { enumerable: true },
	writable: { enumerable: true },
})
function InitializeTransformStream(
	stream,
	startPromise,
	writableHighWaterMark,
	writableSizeAlgorithm,
	readableHighWaterMark,
	readableSizeAlgorithm
) {
	function startAlgorithm() {
		return startPromise
	}
	function writeAlgorithm(chunk) {
		return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk)
	}
	function abortAlgorithm(reason) {
		return TransformStreamDefaultSinkAbortAlgorithm(stream, reason)
	}
	function closeAlgorithm() {
		return TransformStreamDefaultSinkCloseAlgorithm(stream)
	}
	stream._writable = CreateWritableStream(
		startAlgorithm,
		writeAlgorithm,
		closeAlgorithm,
		abortAlgorithm,
		writableHighWaterMark,
		writableSizeAlgorithm
	)
	function pullAlgorithm() {
		return TransformStreamDefaultSourcePullAlgorithm(stream)
	}
	function cancelAlgorithm(reason) {
		TransformStreamErrorWritableAndUnblockWrite(stream, reason)
		return promiseResolvedWith(undefined)
	}
	stream._readable = CreateReadableStream(
		startAlgorithm,
		pullAlgorithm,
		cancelAlgorithm,
		readableHighWaterMark,
		readableSizeAlgorithm
	)
	// The [[backpressure]] slot is set to undefined so that it can be initialised by TransformStreamSetBackpressure.
	stream._backpressure = undefined
	stream._backpressureChangePromise = undefined
	stream._backpressureChangePromise_resolve = undefined
	TransformStreamSetBackpressure(stream, true)
	stream._transformStreamController = undefined
}
function IsTransformStream(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_transformStreamController')) {
		return false
	}
	return x instanceof TransformStream
}
// This is a no-op if both sides are already errored.
function TransformStreamError(stream, e) {
	ReadableStreamDefaultControllerError(
		stream._readable._readableStreamController,
		e
	)
	TransformStreamErrorWritableAndUnblockWrite(stream, e)
}
function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
	TransformStreamDefaultControllerClearAlgorithms(
		stream._transformStreamController
	)
	WritableStreamDefaultControllerErrorIfNeeded(
		stream._writable._writableStreamController,
		e
	)
	if (stream._backpressure) {
		// Pretend that pull() was called to permit any pending write() calls to complete. TransformStreamSetBackpressure()
		// cannot be called from enqueue() or pull() once the ReadableStream is errored, so this will will be the final time
		// _backpressure is set.
		TransformStreamSetBackpressure(stream, false)
	}
}
function TransformStreamSetBackpressure(stream, backpressure) {
	// Passes also when called during construction.
	if (stream._backpressureChangePromise !== undefined) {
		stream._backpressureChangePromise_resolve()
	}
	stream._backpressureChangePromise = newPromise((resolve) => {
		stream._backpressureChangePromise_resolve = resolve
	})
	stream._backpressure = backpressure
}
// Class TransformStreamDefaultController
/**
 * Allows control of the {@link ReadableStream} and {@link WritableStream} of the associated {@link TransformStream}.
 *
 * @public
 */
class TransformStreamDefaultController {
	constructor() {
		throw new TypeError('Illegal constructor')
	}
	/**
	 * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
	 */
	get desiredSize() {
		if (!IsTransformStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException('desiredSize')
		}
		const readableController =
			this._controlledTransformStream._readable._readableStreamController
		return ReadableStreamDefaultControllerGetDesiredSize(readableController)
	}
	enqueue(chunk = undefined) {
		if (!IsTransformStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException('enqueue')
		}
		TransformStreamDefaultControllerEnqueue(this, chunk)
	}
	/**
	 * Errors both the readable side and the writable side of the controlled transform stream, making all future
	 * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
	 */
	error(reason = undefined) {
		if (!IsTransformStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException('error')
		}
		TransformStreamDefaultControllerError(this, reason)
	}
	/**
	 * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
	 * transformer only needs to consume a portion of the chunks written to the writable side.
	 */
	terminate() {
		if (!IsTransformStreamDefaultController(this)) {
			throw defaultControllerBrandCheckException('terminate')
		}
		TransformStreamDefaultControllerTerminate(this)
	}
}
Object.defineProperties(TransformStreamDefaultController.prototype, {
	enqueue: { enumerable: true },
	error: { enumerable: true },
	terminate: { enumerable: true },
	desiredSize: { enumerable: true },
})
// Transform Stream Default Controller Abstract Operations
function IsTransformStreamDefaultController(x) {
	if (!typeIsObject(x)) {
		return false
	}
	if (!Object.prototype.hasOwnProperty.call(x, '_controlledTransformStream')) {
		return false
	}
	return x instanceof TransformStreamDefaultController
}
function SetUpTransformStreamDefaultController(
	stream,
	controller,
	transformAlgorithm,
	flushAlgorithm
) {
	controller._controlledTransformStream = stream
	stream._transformStreamController = controller
	controller._transformAlgorithm = transformAlgorithm
	controller._flushAlgorithm = flushAlgorithm
}
function SetUpTransformStreamDefaultControllerFromTransformer(
	stream,
	transformer
) {
	const controller = Object.create(TransformStreamDefaultController.prototype)
	let transformAlgorithm = (chunk) => {
		try {
			TransformStreamDefaultControllerEnqueue(controller, chunk)
			return promiseResolvedWith(undefined)
		} catch (transformResultE) {
			return promiseRejectedWith(transformResultE)
		}
	}
	let flushAlgorithm = () => promiseResolvedWith(undefined)
	if (transformer.transform !== undefined) {
		transformAlgorithm = (chunk) => transformer.transform(chunk, controller)
	}
	if (transformer.flush !== undefined) {
		flushAlgorithm = () => transformer.flush(controller)
	}
	SetUpTransformStreamDefaultController(
		stream,
		controller,
		transformAlgorithm,
		flushAlgorithm
	)
}
function TransformStreamDefaultControllerClearAlgorithms(controller) {
	controller._transformAlgorithm = undefined
	controller._flushAlgorithm = undefined
}
function TransformStreamDefaultControllerEnqueue(controller, chunk) {
	const stream = controller._controlledTransformStream
	const readableController = stream._readable._readableStreamController
	if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
		throw new TypeError('Readable side is not in a state that permits enqueue')
	}
	// We throttle transform invocations based on the backpressure of the ReadableStream, but we still
	// accept TransformStreamDefaultControllerEnqueue() calls.
	try {
		ReadableStreamDefaultControllerEnqueue(readableController, chunk)
	} catch (e) {
		// This happens when readableStrategy.size() throws.
		TransformStreamErrorWritableAndUnblockWrite(stream, e)
		throw stream._readable._storedError
	}
	const backpressure =
		ReadableStreamDefaultControllerHasBackpressure(readableController)
	if (backpressure !== stream._backpressure) {
		TransformStreamSetBackpressure(stream, true)
	}
}
function TransformStreamDefaultControllerError(controller, e) {
	TransformStreamError(controller._controlledTransformStream, e)
}
function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
	const transformPromise = controller._transformAlgorithm(chunk)
	return transformPromiseWith(transformPromise, undefined, (r) => {
		TransformStreamError(controller._controlledTransformStream, r)
		throw r
	})
}
function TransformStreamDefaultControllerTerminate(controller) {
	const stream = controller._controlledTransformStream
	const readableController = stream._readable._readableStreamController
	ReadableStreamDefaultControllerClose(readableController)
	const error = new TypeError('TransformStream terminated')
	TransformStreamErrorWritableAndUnblockWrite(stream, error)
}
// TransformStreamDefaultSink Algorithms
function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
	const controller = stream._transformStreamController
	if (stream._backpressure) {
		const backpressureChangePromise = stream._backpressureChangePromise
		return transformPromiseWith(backpressureChangePromise, () => {
			const writable = stream._writable
			const state = writable._state
			if (state === 'erroring') {
				throw writable._storedError
			}
			return TransformStreamDefaultControllerPerformTransform(controller, chunk)
		})
	}
	return TransformStreamDefaultControllerPerformTransform(controller, chunk)
}
function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
	// abort() is not called synchronously, so it is possible for abort() to be called when the stream is already
	// errored.
	TransformStreamError(stream, reason)
	return promiseResolvedWith(undefined)
}
function TransformStreamDefaultSinkCloseAlgorithm(stream) {
	// stream._readable cannot change after construction, so caching it across a call to user code is safe.
	const readable = stream._readable
	const controller = stream._transformStreamController
	const flushPromise = controller._flushAlgorithm()
	TransformStreamDefaultControllerClearAlgorithms(controller)
	// Return a promise that is fulfilled with undefined on success.
	return transformPromiseWith(
		flushPromise,
		() => {
			if (readable._state === 'errored') {
				throw readable._storedError
			}
			ReadableStreamDefaultControllerClose(readable._readableStreamController)
		},
		(r) => {
			TransformStreamError(stream, r)
			throw readable._storedError
		}
	)
}
// TransformStreamDefaultSource Algorithms
function TransformStreamDefaultSourcePullAlgorithm(stream) {
	// Invariant. Enforced by the promises returned by start() and pull().
	TransformStreamSetBackpressure(stream, false)
	// Prevent the next pull() call until there is backpressure.
	return stream._backpressureChangePromise
}
// Helper functions for the TransformStreamDefaultController.
function defaultControllerBrandCheckException(name) {
	return new TypeError(
		`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`
	)
}
// Helper functions for the TransformStream.
function streamBrandCheckException(name) {
	return new TypeError(
		`TransformStream.prototype.${name} can only be used on a TransformStream`
	)
}

/* c8 ignore start */
// 64 KiB (same size chrome slice theirs blob into Uint8array's)
const POOL_SIZE$1 = 65536

try {
	// Don't use node: prefix for this, require+node: is not supported until node v14.14
	// Only `import()` can use prefix in 12.20 and later
	const { Blob } = require('buffer')
	if (Blob && !Blob.prototype.stream) {
		Blob.prototype.stream = function name(params) {
			let position = 0
			const blob = this

			return new ReadableStream({
				type: 'bytes',
				async pull(ctrl) {
					const chunk = blob.slice(
						position,
						Math.min(blob.size, position + POOL_SIZE$1)
					)
					const buffer = await chunk.arrayBuffer()
					position += buffer.byteLength
					ctrl.enqueue(new Uint8Array(buffer))

					if (position === blob.size) {
						ctrl.close()
					}
				},
			})
		}
	}
} catch (error) {}
/* c8 ignore end */

// 64 KiB (same size chrome slice theirs blob into Uint8array's)
const POOL_SIZE = 65536

/** @param {(Blob | Uint8Array)[]} parts */
async function* toIterator(parts, clone = true) {
	for (const part of parts) {
		if ('stream' in part) {
			yield* /** @type {AsyncIterableIterator<Uint8Array>} */ (part.stream())
		} else if (ArrayBuffer.isView(part)) {
			if (clone) {
				let position = part.byteOffset
				const end = part.byteOffset + part.byteLength
				while (position !== end) {
					const size = Math.min(end - position, POOL_SIZE)
					const chunk = part.buffer.slice(position, position + size)
					position += chunk.byteLength
					yield new Uint8Array(chunk)
				}
			} else {
				yield part
			}
			/* c8 ignore next 10 */
		} else {
			// For blobs that have arrayBuffer but no stream method (nodes buffer.Blob)
			let position = 0,
				b = /** @type {Blob} */ (part)
			while (position !== b.size) {
				const chunk = b.slice(position, Math.min(b.size, position + POOL_SIZE))
				const buffer = await chunk.arrayBuffer()
				position += buffer.byteLength
				yield new Uint8Array(buffer)
			}
		}
	}
}

const _Blob = class Blob {
	/** @type {Array.<(Blob|Uint8Array)>} */
	#parts = []
	#type = ''
	#size = 0
	#endings = 'transparent'

	/**
	 * The Blob() constructor returns a new Blob object. The content
	 * of the blob consists of the concatenation of the values given
	 * in the parameter array.
	 *
	 * @param {*} blobParts
	 * @param {{ type?: string, endings?: string }} [options]
	 */
	constructor(blobParts = [], options = {}) {
		if (typeof blobParts !== 'object' || blobParts === null) {
			throw new TypeError(
				"Failed to construct 'Blob': The provided value cannot be converted to a sequence."
			)
		}

		if (typeof blobParts[Symbol.iterator] !== 'function') {
			throw new TypeError(
				"Failed to construct 'Blob': The object must have a callable @@iterator property."
			)
		}

		if (typeof options !== 'object' && typeof options !== 'function') {
			throw new TypeError(
				"Failed to construct 'Blob': parameter 2 cannot convert to dictionary."
			)
		}

		if (options === null) options = {}

		const encoder = new TextEncoder()
		for (const element of blobParts) {
			let part
			if (ArrayBuffer.isView(element)) {
				part = new Uint8Array(
					element.buffer.slice(
						element.byteOffset,
						element.byteOffset + element.byteLength
					)
				)
			} else if (element instanceof ArrayBuffer) {
				part = new Uint8Array(element.slice(0))
			} else if (element instanceof Blob) {
				part = element
			} else {
				part = encoder.encode(`${element}`)
			}

			this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size
			this.#parts.push(part)
		}

		this.#endings = `${
			options.endings === undefined ? 'transparent' : options.endings
		}`
		const type = options.type === undefined ? '' : String(options.type)
		this.#type = /^[\x20-\x7E]*$/.test(type) ? type : ''
	}

	/**
	 * The Blob interface's size property returns the
	 * size of the Blob in bytes.
	 */
	get size() {
		return this.#size
	}

	/**
	 * The type property of a Blob object returns the MIME type of the file.
	 */
	get type() {
		return this.#type
	}

	/**
	 * The text() method in the Blob interface returns a Promise
	 * that resolves with a string containing the contents of
	 * the blob, interpreted as UTF-8.
	 *
	 * @return {Promise<string>}
	 */
	async text() {
		// More optimized than using this.arrayBuffer()
		// that requires twice as much ram
		const decoder = new TextDecoder()
		let str = ''
		for await (const part of toIterator(this.#parts, false)) {
			str += decoder.decode(part, { stream: true })
		}
		// Remaining
		str += decoder.decode()
		return str
	}

	/**
	 * The arrayBuffer() method in the Blob interface returns a
	 * Promise that resolves with the contents of the blob as
	 * binary data contained in an ArrayBuffer.
	 *
	 * @return {Promise<ArrayBuffer>}
	 */
	async arrayBuffer() {
		// Easier way... Just a unnecessary overhead
		// const view = new Uint8Array(this.size);
		// await this.stream().getReader({mode: 'byob'}).read(view);
		// return view.buffer;

		const data = new Uint8Array(this.size)
		let offset = 0
		for await (const chunk of toIterator(this.#parts, false)) {
			data.set(chunk, offset)
			offset += chunk.length
		}

		return data.buffer
	}

	stream() {
		const it = toIterator(this.#parts, true)

		return new ReadableStream({
			// @ts-ignore
			type: 'bytes',
			async pull(ctrl) {
				const chunk = await it.next()
				chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value)
			},

			async cancel() {
				await it.return()
			},
		})
	}

	/**
	 * The Blob interface's slice() method creates and returns a
	 * new Blob object which contains data from a subset of the
	 * blob on which it's called.
	 *
	 * @param {number} [start]
	 * @param {number} [end]
	 * @param {string} [type]
	 */
	slice(start = 0, end = this.size, type = '') {
		const { size } = this

		let relativeStart =
			start < 0 ? Math.max(size + start, 0) : Math.min(start, size)
		let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size)

		const span = Math.max(relativeEnd - relativeStart, 0)
		const parts = this.#parts
		const blobParts = []
		let added = 0

		for (const part of parts) {
			// don't add the overflow to new blobParts
			if (added >= span) {
				break
			}

			const size = ArrayBuffer.isView(part) ? part.byteLength : part.size
			if (relativeStart && size <= relativeStart) {
				// Skip the beginning and change the relative
				// start & end position as we skip the unwanted parts
				relativeStart -= size
				relativeEnd -= size
			} else {
				let chunk
				if (ArrayBuffer.isView(part)) {
					chunk = part.subarray(relativeStart, Math.min(size, relativeEnd))
					added += chunk.byteLength
				} else {
					chunk = part.slice(relativeStart, Math.min(size, relativeEnd))
					added += chunk.size
				}
				relativeEnd -= size
				blobParts.push(chunk)
				relativeStart = 0 // All next sequential parts should start at 0
			}
		}

		const blob = new Blob([], { type: String(type).toLowerCase() })
		blob.#size = span
		blob.#parts = blobParts

		return blob
	}

	get [Symbol.toStringTag]() {
		return 'Blob'
	}

	static [Symbol.hasInstance](object) {
		return (
			object &&
			typeof object === 'object' &&
			typeof object.constructor === 'function' &&
			(typeof object.stream === 'function' ||
				typeof object.arrayBuffer === 'function') &&
			/^(Blob|File)$/.test(object[Symbol.toStringTag])
		)
	}
}

Object.defineProperties(_Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true },
})

/** @type {typeof globalThis.Blob} */
const Blob = _Blob

const _File = class File extends Blob {
	#lastModified = 0
	#name = ''

	/**
	 * @param {*[]} fileBits
	 * @param {string} fileName
	 * @param {{lastModified?: number, type?: string}} options
	 */ // @ts-ignore
	constructor(fileBits, fileName, options = {}) {
		if (arguments.length < 2) {
			throw new TypeError(
				`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`
			)
		}
		super(fileBits, options)

		if (options === null) options = {}

		// Simulate WebIDL type casting for NaN value in lastModified option.
		const lastModified =
			options.lastModified === undefined
				? Date.now()
				: Number(options.lastModified)
		if (!Number.isNaN(lastModified)) {
			this.#lastModified = lastModified
		}

		this.#name = String(fileName)
	}

	get name() {
		return this.#name
	}

	get lastModified() {
		return this.#lastModified
	}

	get [Symbol.toStringTag]() {
		return 'File'
	}

	static [Symbol.hasInstance](object) {
		return (
			!!object &&
			object instanceof Blob &&
			/^(File)$/.test(object[Symbol.toStringTag])
		)
	}
}

/** @type {typeof globalThis.File} */ // @ts-ignore
const File = _File

class CustomEvent extends Event {
	constructor(type, params) {
		params = Object(params)
		super(type, params)
		if ('detail' in params) this.detail = params.detail
	}
}
allowStringTag(CustomEvent)

class TreeWalker {
	parentNode() {
		return null
	}
	firstChild() {
		return null
	}
	lastChild() {
		return null
	}
	previousSibling() {
		return null
	}
	nextSibling() {
		return null
	}
	previousNode() {
		return null
	}
	nextNode() {
		return null
	}
	get currentNode() {
		const internals = internalsOf(this, 'TreeWalker', 'currentNode')
		return internals.currentNode
	}
	get root() {
		const internals = internalsOf(this, 'TreeWalker', 'root')
		return internals.root
	}
	get whatToShow() {
		const internals = internalsOf(this, 'TreeWalker', 'whatToShow')
		return internals.whatToShow
	}
}
allowStringTag(TreeWalker)

const INTERNAL$1 = { tick: 0, pool: new Map() }
function requestIdleCallback(callback) {
	if (!INTERNAL$1.pool.size) {
		setTimeout$1(() => {
			const next = __performance_now()
			for (const func of INTERNAL$1.pool.values()) {
				func(next)
			}
			INTERNAL$1.pool.clear()
		}, 1000 / 16)
	}
	const func = __function_bind(callback, undefined)
	const tick = ++INTERNAL$1.tick
	INTERNAL$1.pool.set(tick, func)
	return tick
}
function cancelIdleCallback(requestId) {
	const timeout = INTERNAL$1.pool.get(requestId)
	if (timeout) {
		clearTimeout$1(timeout)
		INTERNAL$1.pool.delete(requestId)
	}
}

/**
 * Returns a `Buffer` instance from the given data URI `uri`.
 *
 * @param {String} uri Data URI to turn into a Buffer instance
 * @returns {Buffer} Buffer instance from Data URI
 * @api public
 */
function dataUriToBuffer(uri) {
	if (!/^data:/i.test(uri)) {
		throw new TypeError(
			'`uri` does not appear to be a Data URI (must begin with "data:")'
		)
	}
	// strip newlines
	uri = uri.replace(/\r?\n/g, '')
	// split the URI up into the "metadata" and the "data" portions
	const firstComma = uri.indexOf(',')
	if (firstComma === -1 || firstComma <= 4) {
		throw new TypeError('malformed data: URI')
	}
	// remove the "data:" scheme and parse the metadata
	const meta = uri.substring(5, firstComma).split(';')
	let charset = ''
	let base64 = false
	const type = meta[0] || 'text/plain'
	let typeFull = type
	for (let i = 1; i < meta.length; i++) {
		if (meta[i] === 'base64') {
			base64 = true
		} else {
			typeFull += `;${meta[i]}`
			if (meta[i].indexOf('charset=') === 0) {
				charset = meta[i].substring(8)
			}
		}
	}
	// defaults to US-ASCII only if type is not provided
	if (!meta[0] && !charset.length) {
		typeFull += ';charset=US-ASCII'
		charset = 'US-ASCII'
	}
	// get the encoded data portion and decode URI-encoded chars
	const encoding = base64 ? 'base64' : 'ascii'
	const data = unescape(uri.substring(firstComma + 1))
	const buffer = Buffer.from(data, encoding)
	// set `.type` and `.typeFull` properties to MIME type
	buffer.type = type
	buffer.typeFull = typeFull
	// set the `.charset` property
	buffer.charset = charset
	return buffer
}

/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

var { toStringTag: t$1, iterator: i$1, hasInstance: h$1 } = Symbol,
	r$1 = Math.random,
	m$1 =
		'append,set,get,getAll,delete,keys,values,entries,forEach,constructor'.split(
			','
		),
	f$2 = (a, b, c) => (
		(a += ''),
		/^(Blob|File)$/.test(b && b[t$1])
			? [
					((c = c !== void 0 ? c + '' : b[t$1] == 'File' ? b.name : 'blob'), a),
					b.name !== c || b[t$1] == 'blob' ? new File([b], c, b) : b,
			  ]
			: [a, b + '']
	),
	e$1 = (c, f) =>
		(f ? c : c.replace(/\r?\n|\r/g, '\r\n'))
			.replace(/\n/g, '%0A')
			.replace(/\r/g, '%0D')
			.replace(/"/g, '%22'),
	x$1 = (n, a, e) => {
		if (a.length < e) {
			throw new TypeError(
				`Failed to execute '${n}' on 'FormData': ${e} arguments required, but only ${a.length} present.`
			)
		}
	}

/** @type {typeof globalThis.FormData} */
const FormData = class FormData {
	#d = []
	constructor(...a) {
		if (a.length)
			throw new TypeError(
				`Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`
			)
	}
	get [t$1]() {
		return 'FormData'
	}
	[i$1]() {
		return this.entries()
	}
	static [h$1](o) {
		return (
			o &&
			typeof o === 'object' &&
			o[t$1] === 'FormData' &&
			!m$1.some((m) => typeof o[m] != 'function')
		)
	}
	append(...a) {
		x$1('append', arguments, 2)
		this.#d.push(f$2(...a))
	}
	delete(a) {
		x$1('delete', arguments, 1)
		a += ''
		this.#d = this.#d.filter(([b]) => b !== a)
	}
	get(a) {
		x$1('get', arguments, 1)
		a += ''
		for (var b = this.#d, l = b.length, c = 0; c < l; c++)
			if (b[c][0] === a) return b[c][1]
		return null
	}
	getAll(a, b) {
		x$1('getAll', arguments, 1)
		b = []
		a += ''
		this.#d.forEach((c) => c[0] === a && b.push(c[1]))
		return b
	}
	has(a) {
		x$1('has', arguments, 1)
		a += ''
		return this.#d.some((b) => b[0] === a)
	}
	forEach(a, b) {
		x$1('forEach', arguments, 1)
		for (var [c, d] of this) a.call(b, d, c, this)
	}
	set(...a) {
		x$1('set', arguments, 2)
		var b = [],
			c = !0
		a = f$2(...a)
		this.#d.forEach((d) => {
			d[0] === a[0] ? c && (c = !b.push(a)) : b.push(d)
		})
		c && b.push(a)
		this.#d = b
	}
	*entries() {
		yield* this.#d
	}
	*keys() {
		for (var [a] of this) yield a
	}
	*values() {
		for (var [, a] of this) yield a
	}
}

/** @param {FormData} F */
function formDataToBlob(F, B = Blob) {
	var b = `${r$1()}${r$1()}`.replace(/\./g, '').slice(-28).padStart(32, '-'),
		c = [],
		p = `--${b}\r\nContent-Disposition: form-data; name="`
	F.forEach((v, n) =>
		typeof v == 'string'
			? c.push(
					p +
						e$1(n) +
						`"\r\n\r\n${v.replace(/\r(?!\n)|(?<!\r)\n/g, '\r\n')}\r\n`
			  )
			: c.push(
					p +
						e$1(n) +
						`"; filename="${e$1(v.name, 1)}"\r\nContent-Type: ${
							v.type || 'application/octet-stream'
						}\r\n\r\n`,
					v,
					'\r\n'
			  )
	)
	c.push(`--${b}--`)
	return new B(c, { type: 'multipart/form-data; boundary=' + b })
}

class FetchBaseError extends Error {
	constructor(message, type) {
		super(message)
		// Hide custom error implementation details from end-users
		Error.captureStackTrace(this, this.constructor)

		this.type = type
	}

	get name() {
		return this.constructor.name
	}

	get [Symbol.toStringTag]() {
		return this.constructor.name
	}
}

/**
 * @typedef {{ address?: string, code: string, dest?: string, errno: number, info?: object, message: string, path?: string, port?: number, syscall: string}} SystemError
 */

/**
 * FetchError interface for operational errors
 */
class FetchError extends FetchBaseError {
	/**
	 * @param  {string} message -      Error message for human
	 * @param  {string} [type] -        Error type for machine
	 * @param  {SystemError} [systemError] - For Node.js system error
	 */
	constructor(message, type, systemError) {
		super(message, type)
		// When err.type is `system`, err.erroredSysCall contains system error and err.code contains system error code
		if (systemError) {
			// eslint-disable-next-line no-multi-assign
			this.code = this.errno = systemError.code
			this.erroredSysCall = systemError.syscall
		}
	}
}

/**
 * Is.js
 *
 * Object type checks.
 */

const NAME = Symbol.toStringTag

/**
 * Check if `obj` is a URLSearchParams object
 * ref: https://github.com/node-fetch/node-fetch/issues/296#issuecomment-307598143
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isURLSearchParameters = (object) => {
	return (
		typeof object === 'object' &&
		typeof object.append === 'function' &&
		typeof object.delete === 'function' &&
		typeof object.get === 'function' &&
		typeof object.getAll === 'function' &&
		typeof object.has === 'function' &&
		typeof object.set === 'function' &&
		typeof object.sort === 'function' &&
		object[NAME] === 'URLSearchParams'
	)
}

/**
 * Check if `object` is a W3C `Blob` object (which `File` inherits from)
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isBlob = (object) => {
	return (
		object &&
		typeof object === 'object' &&
		typeof object.arrayBuffer === 'function' &&
		typeof object.type === 'string' &&
		typeof object.stream === 'function' &&
		typeof object.constructor === 'function' &&
		/^(Blob|File)$/.test(object[NAME])
	)
}

/**
 * Check if `obj` is an instance of AbortSignal.
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isAbortSignal = (object) => {
	return (
		typeof object === 'object' &&
		(object[NAME] === 'AbortSignal' || object[NAME] === 'EventTarget')
	)
}

/**
 * isDomainOrSubdomain reports whether sub is a subdomain (or exact match) of
 * the parent domain.
 *
 * Both domains must already be in canonical form.
 * @param {string|URL} original
 * @param {string|URL} destination
 */
const isDomainOrSubdomain = (destination, original) => {
	const orig = new URL(original).hostname
	const dest = new URL(destination).hostname

	return orig === dest || orig.endsWith(`.${dest}`)
}

const pipeline = promisify(Stream.pipeline)
const INTERNALS$2 = Symbol('Body internals')

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Body {
	constructor(body, { size = 0 } = {}) {
		let boundary = null

		if (body === null) {
			// Body is undefined or null
			body = null
		} else if (isURLSearchParameters(body)) {
			// Body is a URLSearchParams
			body = Buffer.from(body.toString())
		} else if (isBlob(body));
		else if (Buffer.isBuffer(body));
		else if (types.isAnyArrayBuffer(body)) {
			// Body is ArrayBuffer
			body = Buffer.from(body)
		} else if (ArrayBuffer.isView(body)) {
			// Body is ArrayBufferView
			body = Buffer.from(body.buffer, body.byteOffset, body.byteLength)
		} else if (body instanceof Stream);
		else if (body instanceof FormData) {
			// Body is FormData
			body = formDataToBlob(body)
			boundary = body.type.split('=')[1]
		} else {
			// None of the above
			// coerce to string then buffer
			body = Buffer.from(String(body))
		}

		let stream = body

		if (Buffer.isBuffer(body)) {
			stream = Stream.Readable.from(body)
		} else if (isBlob(body)) {
			stream = Stream.Readable.from(body.stream())
		}

		this[INTERNALS$2] = {
			body,
			stream,
			boundary,
			disturbed: false,
			error: null,
		}
		this.size = size

		if (body instanceof Stream) {
			body.on('error', (error_) => {
				const error =
					error_ instanceof FetchBaseError
						? error_
						: new FetchError(
								`Invalid response body while trying to fetch ${this.url}: ${error_.message}`,
								'system',
								error_
						  )
				this[INTERNALS$2].error = error
			})
		}
	}

	get body() {
		return this[INTERNALS$2].stream
	}

	get bodyUsed() {
		return this[INTERNALS$2].disturbed
	}

	/**
	 * Decode response as ArrayBuffer
	 *
	 * @return  Promise
	 */
	async arrayBuffer() {
		const { buffer, byteOffset, byteLength } = await consumeBody(this)
		return buffer.slice(byteOffset, byteOffset + byteLength)
	}

	async formData() {
		const ct = this.headers.get('content-type')

		if (ct.startsWith('application/x-www-form-urlencoded')) {
			const formData = new FormData()
			const parameters = new URLSearchParams(await this.text())

			for (const [name, value] of parameters) {
				formData.append(name, value)
			}

			return formData
		}

		const { toFormData } = await Promise.resolve().then(function () {
			return multipartParser
		})
		return toFormData(this.body, ct)
	}

	/**
	 * Return raw response as Blob
	 *
	 * @return Promise
	 */
	async blob() {
		const ct =
			(this.headers && this.headers.get('content-type')) ||
			(this[INTERNALS$2].body && this[INTERNALS$2].body.type) ||
			''
		const buf = await this.arrayBuffer()

		return new Blob([buf], {
			type: ct,
		})
	}

	/**
	 * Decode response as json
	 *
	 * @return  Promise
	 */
	async json() {
		const buffer = await consumeBody(this)
		return JSON.parse(buffer.toString())
	}

	/**
	 * Decode response as text
	 *
	 * @return  Promise
	 */
	async text() {
		const buffer = await consumeBody(this)
		return buffer.toString()
	}

	/**
	 * Decode response as buffer (non-spec api)
	 *
	 * @return  Promise
	 */
	buffer() {
		return consumeBody(this)
	}
}

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true },
})

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return Promise
 */
async function consumeBody(data) {
	if (data[INTERNALS$2].disturbed) {
		throw new TypeError(`body used already for: ${data.url}`)
	}

	data[INTERNALS$2].disturbed = true

	if (data[INTERNALS$2].error) {
		throw data[INTERNALS$2].error
	}

	const { body } = data

	// Body is null
	if (body === null) {
		return Buffer.alloc(0)
	}

	/* c8 ignore next 3 */
	if (!(body instanceof Stream)) {
		return Buffer.alloc(0)
	}

	// Body is stream
	// get ready to actually consume the body
	const accum = []
	let accumBytes = 0

	try {
		for await (const chunk of body) {
			if (data.size > 0 && accumBytes + chunk.length > data.size) {
				const error = new FetchError(
					`content size at ${data.url} over limit: ${data.size}`,
					'max-size'
				)
				body.destroy(error)
				throw error
			}

			accumBytes += chunk.length
			accum.push(chunk)
		}
	} catch (error) {
		const error_ =
			error instanceof FetchBaseError
				? error
				: new FetchError(
						`Invalid response body while trying to fetch ${data.url}: ${error.message}`,
						'system',
						error
				  )
		throw error_
	}

	if (body.readableEnded === true || body._readableState.ended === true) {
		try {
			if (accum.every((c) => typeof c === 'string')) {
				return Buffer.from(accum.join(''))
			}

			return Buffer.concat(accum, accumBytes)
		} catch (error) {
			throw new FetchError(
				`Could not create Buffer from response body for ${data.url}: ${error.message}`,
				'system',
				error
			)
		}
	} else {
		throw new FetchError(
			`Premature close of server response while trying to fetch ${data.url}`
		)
	}
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed   instance       Response or Request instance
 * @param   String  highWaterMark  highWaterMark for both PassThrough body streams
 * @return  Mixed
 */
const clone = (instance, highWaterMark) => {
	let p1
	let p2
	let { body } = instance[INTERNALS$2]

	// Don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used')
	}

	// Check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// Tee instance body
		p1 = new PassThrough({ highWaterMark })
		p2 = new PassThrough({ highWaterMark })
		body.pipe(p1)
		body.pipe(p2)
		// Set instance body to teed body and return the other teed body
		instance[INTERNALS$2].stream = p1
		body = p2
	}

	return body
}

const getNonSpecFormDataBoundary = deprecate(
	(body) => body.getBoundary(),
	"form-data doesn't follow the spec and requires special treatment. Use alternative package",
	'https://github.com/node-fetch/node-fetch/issues/1167'
)

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param {any} body Any options.body input
 * @returns {string | null}
 */
const extractContentType = (body, request) => {
	// Body is null or undefined
	if (body === null) {
		return null
	}

	// Body is string
	if (typeof body === 'string') {
		return 'text/plain;charset=UTF-8'
	}

	// Body is a URLSearchParams
	if (isURLSearchParameters(body)) {
		return 'application/x-www-form-urlencoded;charset=UTF-8'
	}

	// Body is blob
	if (isBlob(body)) {
		return body.type || null
	}

	// Body is a Buffer (Buffer, ArrayBuffer or ArrayBufferView)
	if (
		Buffer.isBuffer(body) ||
		types.isAnyArrayBuffer(body) ||
		ArrayBuffer.isView(body)
	) {
		return null
	}

	if (body instanceof FormData) {
		return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`
	}

	// Detect form data input from form-data module
	if (body && typeof body.getBoundary === 'function') {
		return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`
	}

	// Body is stream - can't really do much about this
	if (body instanceof Stream) {
		return null
	}

	// Body constructor defaults other things to string
	return 'text/plain;charset=UTF-8'
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param {any} obj.body Body object from the Body instance.
 * @returns {number | null}
 */
const getTotalBytes = (request) => {
	const { body } = request[INTERNALS$2]

	// Body is null or undefined
	if (body === null) {
		return 0
	}

	// Body is Blob
	if (isBlob(body)) {
		return body.size
	}

	// Body is Buffer
	if (Buffer.isBuffer(body)) {
		return body.length
	}

	// Detect form data input from form-data module
	if (body && typeof body.getLengthSync === 'function') {
		return body.hasKnownLength && body.hasKnownLength()
			? body.getLengthSync()
			: null
	}

	// Body is stream
	return null
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param {Stream.Writable} dest The stream to write to.
 * @param obj.body Body object from the Body instance.
 * @returns {Promise<void>}
 */
const writeToStream = async (dest, { body }) => {
	if (body === null) {
		// Body is null
		dest.end()
	} else {
		// Body is stream
		await pipeline(body, dest)
	}
}

/**
 * Headers.js
 *
 * Headers class offers convenient helpers
 */

/* c8 ignore next 9 */
const validateHeaderName =
	typeof http.validateHeaderName === 'function'
		? http.validateHeaderName
		: (name) => {
				if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
					const error = new TypeError(
						`Header name must be a valid HTTP token [${name}]`
					)
					Object.defineProperty(error, 'code', {
						value: 'ERR_INVALID_HTTP_TOKEN',
					})
					throw error
				}
		  }

/* c8 ignore next 9 */
const validateHeaderValue =
	typeof http.validateHeaderValue === 'function'
		? http.validateHeaderValue
		: (name, value) => {
				if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
					const error = new TypeError(
						`Invalid character in header content ["${name}"]`
					)
					Object.defineProperty(error, 'code', { value: 'ERR_INVALID_CHAR' })
					throw error
				}
		  }

/**
 * @typedef {Headers | Record<string, string> | Iterable<readonly [string, string]> | Iterable<Iterable<string>>} HeadersInit
 */

/**
 * This Fetch API interface allows you to perform various actions on HTTP request and response headers.
 * These actions include retrieving, setting, adding to, and removing.
 * A Headers object has an associated header list, which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples.)
 * In all methods of this interface, header names are matched by case-insensitive byte sequence.
 *
 */
class Headers extends URLSearchParams {
	/**
	 * Headers class
	 *
	 * @constructor
	 * @param {HeadersInit} [init] - Response headers
	 */
	constructor(init) {
		// Validate and normalize init object in [name, value(s)][]
		/** @type {string[][]} */
		let result = []
		if (init instanceof Headers) {
			const raw = init.raw()
			for (const [name, values] of Object.entries(raw)) {
				result.push(...values.map((value) => [name, value]))
			}
		} else if (init == null);
		else if (typeof init === 'object' && !types.isBoxedPrimitive(init)) {
			const method = init[Symbol.iterator]
			// eslint-disable-next-line no-eq-null, eqeqeq
			if (method == null) {
				// Record<ByteString, ByteString>
				result.push(...Object.entries(init))
			} else {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable')
				}

				// Sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				result = [...init]
					.map((pair) => {
						if (typeof pair !== 'object' || types.isBoxedPrimitive(pair)) {
							throw new TypeError('Each header pair must be an iterable object')
						}

						return [...pair]
					})
					.map((pair) => {
						if (pair.length !== 2) {
							throw new TypeError('Each header pair must be a name/value tuple')
						}

						return [...pair]
					})
			}
		} else {
			throw new TypeError(
				"Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)"
			)
		}

		// Validate and lowercase
		result =
			result.length > 0
				? result.map(([name, value]) => {
						validateHeaderName(name)
						validateHeaderValue(name, String(value))
						return [String(name).toLowerCase(), String(value)]
				  })
				: undefined

		super(result)

		// Returning a Proxy that will lowercase key names, validate parameters and sort keys
		// eslint-disable-next-line no-constructor-return
		return new Proxy(this, {
			get(target, p, receiver) {
				switch (p) {
					case 'append':
					case 'set':
						return (name, value) => {
							validateHeaderName(name)
							validateHeaderValue(name, String(value))
							return URLSearchParams.prototype[p].call(
								target,
								String(name).toLowerCase(),
								String(value)
							)
						}

					case 'delete':
					case 'has':
					case 'getAll':
						return (name) => {
							validateHeaderName(name)
							return URLSearchParams.prototype[p].call(
								target,
								String(name).toLowerCase()
							)
						}

					case 'keys':
						return () => {
							target.sort()
							return new Set(URLSearchParams.prototype.keys.call(target)).keys()
						}

					default:
						return Reflect.get(target, p, receiver)
				}
			},
		})
		/* c8 ignore next */
	}

	get [Symbol.toStringTag]() {
		return this.constructor.name
	}

	toString() {
		return Object.prototype.toString.call(this)
	}

	get(name) {
		const values = this.getAll(name)
		if (values.length === 0) {
			return null
		}

		let value = values.join(', ')
		if (/^content-encoding$/i.test(name)) {
			value = value.toLowerCase()
		}

		return value
	}

	forEach(callback, thisArg = undefined) {
		for (const name of this.keys()) {
			Reflect.apply(callback, thisArg, [this.get(name), name, this])
		}
	}

	*values() {
		for (const name of this.keys()) {
			yield this.get(name)
		}
	}

	/**
	 * @type {() => IterableIterator<[string, string]>}
	 */
	*entries() {
		for (const name of this.keys()) {
			yield [name, this.get(name)]
		}
	}

	[Symbol.iterator]() {
		return this.entries()
	}

	/**
	 * Node-fetch non-spec method
	 * returning all headers and their values as array
	 * @returns {Record<string, string[]>}
	 */
	raw() {
		return [...this.keys()].reduce((result, key) => {
			result[key] = this.getAll(key)
			return result
		}, {})
	}

	/**
	 * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
	 */
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return [...this.keys()].reduce((result, key) => {
			const values = this.getAll(key)
			// Http.request() only supports string as Host header.
			// This hack makes specifying custom Host header possible.
			if (key === 'host') {
				result[key] = values[0]
			} else {
				result[key] = values.length > 1 ? values : values[0]
			}

			return result
		}, {})
	}
}

/**
 * Re-shaping object for Web IDL tests
 * Only need to do it for overridden methods
 */
Object.defineProperties(
	Headers.prototype,
	['get', 'entries', 'forEach', 'values'].reduce((result, property) => {
		result[property] = { enumerable: true }
		return result
	}, {})
)

/**
 * Create a Headers object from an http.IncomingMessage.rawHeaders, ignoring those that do
 * not conform to HTTP grammar productions.
 * @param {import('http').IncomingMessage['rawHeaders']} headers
 */
function fromRawHeaders(headers = []) {
	return new Headers(
		headers
			// Split into pairs
			.reduce((result, value, index, array) => {
				if (index % 2 === 0) {
					result.push(array.slice(index, index + 2))
				}

				return result
			}, [])
			.filter(([name, value]) => {
				try {
					validateHeaderName(name)
					validateHeaderValue(name, String(value))
					return true
				} catch {
					return false
				}
			})
	)
}

const redirectStatus = new Set([301, 302, 303, 307, 308])

/**
 * Redirect code matching
 *
 * @param {number} code - Status code
 * @return {boolean}
 */
const isRedirect = (code) => {
	return redirectStatus.has(code)
}

/**
 * Response.js
 *
 * Response class provides content decoding
 */

const INTERNALS$1 = Symbol('Response internals')

/**
 * Response class
 *
 * Ref: https://fetch.spec.whatwg.org/#response-class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response extends Body {
	constructor(body = null, options = {}) {
		super(body, options)

		// eslint-disable-next-line no-eq-null, eqeqeq, no-negated-condition
		const status = options.status != null ? options.status : 200

		const headers = new Headers(options.headers)

		if (body !== null && !headers.has('Content-Type')) {
			const contentType = extractContentType(body, this)
			if (contentType) {
				headers.append('Content-Type', contentType)
			}
		}

		this[INTERNALS$1] = {
			type: 'default',
			url: options.url,
			status,
			statusText: options.statusText || '',
			headers,
			counter: options.counter,
			highWaterMark: options.highWaterMark,
		}
	}

	get type() {
		return this[INTERNALS$1].type
	}

	get url() {
		return this[INTERNALS$1].url || ''
	}

	get status() {
		return this[INTERNALS$1].status
	}

	/**
	 * Convenience property representing if the request ended normally
	 */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300
	}

	get redirected() {
		return this[INTERNALS$1].counter > 0
	}

	get statusText() {
		return this[INTERNALS$1].statusText
	}

	get headers() {
		return this[INTERNALS$1].headers
	}

	get highWaterMark() {
		return this[INTERNALS$1].highWaterMark
	}

	/**
	 * Clone this response
	 *
	 * @return  Response
	 */
	clone() {
		return new Response(clone(this, this.highWaterMark), {
			type: this.type,
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected,
			size: this.size,
			highWaterMark: this.highWaterMark,
		})
	}

	/**
	 * @param {string} url    The URL that the new response is to originate from.
	 * @param {number} status An optional status code for the response (e.g., 302.)
	 * @returns {Response}    A Response object.
	 */
	static redirect(url, status = 302) {
		if (!isRedirect(status)) {
			throw new RangeError(
				'Failed to execute "redirect" on "response": Invalid status code'
			)
		}

		return new Response(null, {
			headers: {
				location: new URL(url).toString(),
			},
			status,
		})
	}

	static error() {
		const response = new Response(null, { status: 0, statusText: '' })
		response[INTERNALS$1].type = 'error'
		return response
	}

	get [Symbol.toStringTag]() {
		return 'Response'
	}
}

Object.defineProperties(Response.prototype, {
	type: { enumerable: true },
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	redirected: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true },
})

const getSearch = (parsedURL) => {
	if (parsedURL.search) {
		return parsedURL.search
	}

	const lastOffset = parsedURL.href.length - 1
	const hash = parsedURL.hash || (parsedURL.href[lastOffset] === '#' ? '#' : '')
	return parsedURL.href[lastOffset - hash.length] === '?' ? '?' : ''
}

/**
 * @external URL
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL|URL}
 */

/**
 * @module utils/referrer
 * @private
 */

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#strip-url|Referrer Policy §8.4. Strip url for use as a referrer}
 * @param {string} URL
 * @param {boolean} [originOnly=false]
 */
function stripURLForUseAsAReferrer(url, originOnly = false) {
	// 1. If url is null, return no referrer.
	if (url == null) {
		// eslint-disable-line no-eq-null, eqeqeq
		return 'no-referrer'
	}

	url = new URL(url)

	// 2. If url's scheme is a local scheme, then return no referrer.
	if (/^(about|blob|data):$/.test(url.protocol)) {
		return 'no-referrer'
	}

	// 3. Set url's username to the empty string.
	url.username = ''

	// 4. Set url's password to null.
	// Note: `null` appears to be a mistake as this actually results in the password being `"null"`.
	url.password = ''

	// 5. Set url's fragment to null.
	// Note: `null` appears to be a mistake as this actually results in the fragment being `"#null"`.
	url.hash = ''

	// 6. If the origin-only flag is true, then:
	if (originOnly) {
		// 6.1. Set url's path to null.
		// Note: `null` appears to be a mistake as this actually results in the path being `"/null"`.
		url.pathname = ''

		// 6.2. Set url's query to null.
		// Note: `null` appears to be a mistake as this actually results in the query being `"?null"`.
		url.search = ''
	}

	// 7. Return url.
	return url
}

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#enumdef-referrerpolicy|enum ReferrerPolicy}
 */
const ReferrerPolicy = new Set([
	'',
	'no-referrer',
	'no-referrer-when-downgrade',
	'same-origin',
	'origin',
	'strict-origin',
	'origin-when-cross-origin',
	'strict-origin-when-cross-origin',
	'unsafe-url',
])

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#default-referrer-policy|default referrer policy}
 */
const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin'

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#referrer-policies|Referrer Policy §3. Referrer Policies}
 * @param {string} referrerPolicy
 * @returns {string} referrerPolicy
 */
function validateReferrerPolicy(referrerPolicy) {
	if (!ReferrerPolicy.has(referrerPolicy)) {
		throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`)
	}

	return referrerPolicy
}

/**
 * @see {@link https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy|Referrer Policy §3.2. Is origin potentially trustworthy?}
 * @param {external:URL} url
 * @returns `true`: "Potentially Trustworthy", `false`: "Not Trustworthy"
 */
function isOriginPotentiallyTrustworthy(url) {
	// 1. If origin is an opaque origin, return "Not Trustworthy".
	// Not applicable

	// 2. Assert: origin is a tuple origin.
	// Not for implementations

	// 3. If origin's scheme is either "https" or "wss", return "Potentially Trustworthy".
	if (/^(http|ws)s:$/.test(url.protocol)) {
		return true
	}

	// 4. If origin's host component matches one of the CIDR notations 127.0.0.0/8 or ::1/128 [RFC4632], return "Potentially Trustworthy".
	const hostIp = url.host.replace(/(^\[)|(]$)/g, '')
	const hostIPVersion = isIP(hostIp)

	if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
		return true
	}

	if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
		return true
	}

	// 5. If origin's host component is "localhost" or falls within ".localhost", and the user agent conforms to the name resolution rules in [let-localhost-be-localhost], return "Potentially Trustworthy".
	// We are returning FALSE here because we cannot ensure conformance to
	// let-localhost-be-loalhost (https://tools.ietf.org/html/draft-west-let-localhost-be-localhost)
	if (/^(.+\.)*localhost$/.test(url.host)) {
		return false
	}

	// 6. If origin's scheme component is file, return "Potentially Trustworthy".
	if (url.protocol === 'file:') {
		return true
	}

	// 7. If origin's scheme component is one which the user agent considers to be authenticated, return "Potentially Trustworthy".
	// Not supported

	// 8. If origin has been configured as a trustworthy origin, return "Potentially Trustworthy".
	// Not supported

	// 9. Return "Not Trustworthy".
	return false
}

/**
 * @see {@link https://w3c.github.io/webappsec-secure-contexts/#is-url-trustworthy|Referrer Policy §3.3. Is url potentially trustworthy?}
 * @param {external:URL} url
 * @returns `true`: "Potentially Trustworthy", `false`: "Not Trustworthy"
 */
function isUrlPotentiallyTrustworthy(url) {
	// 1. If url is "about:blank" or "about:srcdoc", return "Potentially Trustworthy".
	if (/^about:(blank|srcdoc)$/.test(url)) {
		return true
	}

	// 2. If url's scheme is "data", return "Potentially Trustworthy".
	if (url.protocol === 'data:') {
		return true
	}

	// Note: The origin of blob: and filesystem: URLs is the origin of the context in which they were
	// created. Therefore, blobs created in a trustworthy origin will themselves be potentially
	// trustworthy.
	if (/^(blob|filesystem):$/.test(url.protocol)) {
		return true
	}

	// 3. Return the result of executing §3.2 Is origin potentially trustworthy? on url's origin.
	return isOriginPotentiallyTrustworthy(url)
}

/**
 * Modifies the referrerURL to enforce any extra security policy considerations.
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy §8.3. Determine request's Referrer}, step 7
 * @callback module:utils/referrer~referrerURLCallback
 * @param {external:URL} referrerURL
 * @returns {external:URL} modified referrerURL
 */

/**
 * Modifies the referrerOrigin to enforce any extra security policy considerations.
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy §8.3. Determine request's Referrer}, step 7
 * @callback module:utils/referrer~referrerOriginCallback
 * @param {external:URL} referrerOrigin
 * @returns {external:URL} modified referrerOrigin
 */

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy §8.3. Determine request's Referrer}
 * @param {Request} request
 * @param {object} o
 * @param {module:utils/referrer~referrerURLCallback} o.referrerURLCallback
 * @param {module:utils/referrer~referrerOriginCallback} o.referrerOriginCallback
 * @returns {external:URL} Request's referrer
 */
function determineRequestsReferrer(
	request,
	{ referrerURLCallback, referrerOriginCallback } = {}
) {
	// There are 2 notes in the specification about invalid pre-conditions.  We return null, here, for
	// these cases:
	// > Note: If request's referrer is "no-referrer", Fetch will not call into this algorithm.
	// > Note: If request's referrer policy is the empty string, Fetch will not call into this
	// > algorithm.
	if (request.referrer === 'no-referrer' || request.referrerPolicy === '') {
		return null
	}

	// 1. Let policy be request's associated referrer policy.
	const policy = request.referrerPolicy

	// 2. Let environment be request's client.
	// not applicable to node.js

	// 3. Switch on request's referrer:
	if (request.referrer === 'about:client') {
		return 'no-referrer'
	}

	// "a URL": Let referrerSource be request's referrer.
	const referrerSource = request.referrer

	// 4. Let request's referrerURL be the result of stripping referrerSource for use as a referrer.
	let referrerURL = stripURLForUseAsAReferrer(referrerSource)

	// 5. Let referrerOrigin be the result of stripping referrerSource for use as a referrer, with the
	//    origin-only flag set to true.
	let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true)

	// 6. If the result of serializing referrerURL is a string whose length is greater than 4096, set
	//    referrerURL to referrerOrigin.
	if (referrerURL.toString().length > 4096) {
		referrerURL = referrerOrigin
	}

	// 7. The user agent MAY alter referrerURL or referrerOrigin at this point to enforce arbitrary
	//    policy considerations in the interests of minimizing data leakage. For example, the user
	//    agent could strip the URL down to an origin, modify its host, replace it with an empty
	//    string, etc.
	if (referrerURLCallback) {
		referrerURL = referrerURLCallback(referrerURL)
	}

	if (referrerOriginCallback) {
		referrerOrigin = referrerOriginCallback(referrerOrigin)
	}

	// 8.Execute the statements corresponding to the value of policy:
	const currentURL = new URL(request.url)

	switch (policy) {
		case 'no-referrer':
			return 'no-referrer'

		case 'origin':
			return referrerOrigin

		case 'unsafe-url':
			return referrerURL

		case 'strict-origin':
			// 1. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (
				isUrlPotentiallyTrustworthy(referrerURL) &&
				!isUrlPotentiallyTrustworthy(currentURL)
			) {
				return 'no-referrer'
			}

			// 2. Return referrerOrigin.
			return referrerOrigin.toString()

		case 'strict-origin-when-cross-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL
			}

			// 2. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (
				isUrlPotentiallyTrustworthy(referrerURL) &&
				!isUrlPotentiallyTrustworthy(currentURL)
			) {
				return 'no-referrer'
			}

			// 3. Return referrerOrigin.
			return referrerOrigin

		case 'same-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL
			}

			// 2. Return no referrer.
			return 'no-referrer'

		case 'origin-when-cross-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL
			}

			// Return referrerOrigin.
			return referrerOrigin

		case 'no-referrer-when-downgrade':
			// 1. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (
				isUrlPotentiallyTrustworthy(referrerURL) &&
				!isUrlPotentiallyTrustworthy(currentURL)
			) {
				return 'no-referrer'
			}

			// 2. Return referrerURL.
			return referrerURL

		default:
			throw new TypeError(`Invalid referrerPolicy: ${policy}`)
	}
}

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#parse-referrer-policy-from-header|Referrer Policy §8.1. Parse a referrer policy from a Referrer-Policy header}
 * @param {Headers} headers Response headers
 * @returns {string} policy
 */
function parseReferrerPolicyFromHeader(headers) {
	// 1. Let policy-tokens be the result of extracting header list values given `Referrer-Policy`
	//    and response’s header list.
	const policyTokens = (headers.get('referrer-policy') || '').split(/[,\s]+/)

	// 2. Let policy be the empty string.
	let policy = ''

	// 3. For each token in policy-tokens, if token is a referrer policy and token is not the empty
	//    string, then set policy to token.
	// Note: This algorithm loops over multiple policy values to allow deployment of new policy
	// values with fallbacks for older user agents, as described in § 11.1 Unknown Policy Values.
	for (const token of policyTokens) {
		if (token && ReferrerPolicy.has(token)) {
			policy = token
		}
	}

	// 4. Return policy.
	return policy
}

/**
 * Request.js
 *
 * Request class contains server only options
 *
 * All spec algorithm step numbers are based on https://fetch.spec.whatwg.org/commit-snapshots/ae716822cb3a61843226cd090eefc6589446c1d2/.
 */

const INTERNALS = Symbol('Request internals')

/**
 * Check if `obj` is an instance of Request.
 *
 * @param  {*} object
 * @return {boolean}
 */
const isRequest = (object) => {
	return typeof object === 'object' && typeof object[INTERNALS] === 'object'
}

const doBadDataWarn = deprecate(
	() => {},
	'.data is not a valid RequestInit property, use .body instead',
	'https://github.com/node-fetch/node-fetch/issues/1000 (request)'
)

/**
 * Request class
 *
 * Ref: https://fetch.spec.whatwg.org/#request-class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request extends Body {
	constructor(input, init = {}) {
		let parsedURL

		// Normalize input and force URL to be encoded as UTF-8 (https://github.com/node-fetch/node-fetch/issues/245)
		if (isRequest(input)) {
			parsedURL = new URL(input.url)
		} else {
			parsedURL = new URL(input)
			input = {}
		}

		if (parsedURL.username !== '' || parsedURL.password !== '') {
			throw new TypeError(`${parsedURL} is an url with embedded credentials.`)
		}

		let method = init.method || input.method || 'GET'
		method = method.toUpperCase()

		if ('data' in init) {
			doBadDataWarn()
		}

		// eslint-disable-next-line no-eq-null, eqeqeq
		if (
			(init.body != null || (isRequest(input) && input.body !== null)) &&
			(method === 'GET' || method === 'HEAD')
		) {
			throw new TypeError('Request with GET/HEAD method cannot have body')
		}

		const inputBody = init.body
			? init.body
			: isRequest(input) && input.body !== null
			? clone(input)
			: null

		super(inputBody, {
			size: init.size || input.size || 0,
		})

		const headers = new Headers(init.headers || input.headers || {})

		if (inputBody !== null && !headers.has('Content-Type')) {
			const contentType = extractContentType(inputBody, this)
			if (contentType) {
				headers.set('Content-Type', contentType)
			}
		}

		let signal = isRequest(input) ? input.signal : null
		if ('signal' in init) {
			signal = init.signal
		}

		// eslint-disable-next-line no-eq-null, eqeqeq
		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError(
				'Expected signal to be an instanceof AbortSignal or EventTarget'
			)
		}

		// §5.4, Request constructor steps, step 15.1
		// eslint-disable-next-line no-eq-null, eqeqeq
		let referrer = init.referrer == null ? input.referrer : init.referrer
		if (referrer === '') {
			// §5.4, Request constructor steps, step 15.2
			referrer = 'no-referrer'
		} else if (referrer) {
			// §5.4, Request constructor steps, step 15.3.1, 15.3.2
			const parsedReferrer = new URL(referrer)
			// §5.4, Request constructor steps, step 15.3.3, 15.3.4
			referrer = /^about:(\/\/)?client$/.test(parsedReferrer)
				? 'client'
				: parsedReferrer
		} else {
			referrer = undefined
		}

		this[INTERNALS] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal,
			referrer,
		}

		// Node-fetch-only options
		this.follow =
			init.follow === undefined
				? input.follow === undefined
					? 20
					: input.follow
				: init.follow
		this.compress =
			init.compress === undefined
				? input.compress === undefined
					? true
					: input.compress
				: init.compress
		this.counter = init.counter || input.counter || 0
		this.agent = init.agent || input.agent
		this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384
		this.insecureHTTPParser =
			init.insecureHTTPParser || input.insecureHTTPParser || false

		// §5.4, Request constructor steps, step 16.
		// Default is empty string per https://fetch.spec.whatwg.org/#concept-request-referrer-policy
		this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || ''
	}

	/** @returns {string} */
	get method() {
		return this[INTERNALS].method
	}

	/** @returns {string} */
	get url() {
		return format$1(this[INTERNALS].parsedURL)
	}

	/** @returns {Headers} */
	get headers() {
		return this[INTERNALS].headers
	}

	get redirect() {
		return this[INTERNALS].redirect
	}

	/** @returns {AbortSignal} */
	get signal() {
		return this[INTERNALS].signal
	}

	// https://fetch.spec.whatwg.org/#dom-request-referrer
	get referrer() {
		if (this[INTERNALS].referrer === 'no-referrer') {
			return ''
		}

		if (this[INTERNALS].referrer === 'client') {
			return 'about:client'
		}

		if (this[INTERNALS].referrer) {
			return this[INTERNALS].referrer.toString()
		}

		return undefined
	}

	get referrerPolicy() {
		return this[INTERNALS].referrerPolicy
	}

	set referrerPolicy(referrerPolicy) {
		this[INTERNALS].referrerPolicy = validateReferrerPolicy(referrerPolicy)
	}

	/**
	 * Clone this request
	 *
	 * @return  Request
	 */
	clone() {
		return new Request(this)
	}

	get [Symbol.toStringTag]() {
		return 'Request'
	}
}

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true },
	referrer: { enumerable: true },
	referrerPolicy: { enumerable: true },
})

/**
 * Convert a Request to Node.js http request options.
 *
 * @param {Request} request - A Request instance
 * @return The options object to be passed to http.request
 */
const getNodeRequestOptions = (request) => {
	const { parsedURL } = request[INTERNALS]
	const headers = new Headers(request[INTERNALS].headers)

	// Fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*')
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null
	if (request.body === null && /^(post|put)$/i.test(request.method)) {
		contentLengthValue = '0'
	}

	if (request.body !== null) {
		const totalBytes = getTotalBytes(request)
		// Set Content-Length if totalBytes is a number (that is not NaN)
		if (typeof totalBytes === 'number' && !Number.isNaN(totalBytes)) {
			contentLengthValue = String(totalBytes)
		}
	}

	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue)
	}

	// 4.1. Main fetch, step 2.6
	// > If request's referrer policy is the empty string, then set request's referrer policy to the
	// > default referrer policy.
	if (request.referrerPolicy === '') {
		request.referrerPolicy = DEFAULT_REFERRER_POLICY
	}

	// 4.1. Main fetch, step 2.7
	// > If request's referrer is not "no-referrer", set request's referrer to the result of invoking
	// > determine request's referrer.
	if (request.referrer && request.referrer !== 'no-referrer') {
		request[INTERNALS].referrer = determineRequestsReferrer(request)
	} else {
		request[INTERNALS].referrer = 'no-referrer'
	}

	// 4.5. HTTP-network-or-cache fetch, step 6.9
	// > If httpRequest's referrer is a URL, then append `Referer`/httpRequest's referrer, serialized
	// >  and isomorphic encoded, to httpRequest's header list.
	if (request[INTERNALS].referrer instanceof URL) {
		headers.set('Referer', request.referrer)
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch')
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate,br')
	}

	let { agent } = request
	if (typeof agent === 'function') {
		agent = agent(parsedURL)
	}

	if (!headers.has('Connection') && !agent) {
		headers.set('Connection', 'close')
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	const search = getSearch(parsedURL)

	// Pass the full URL directly to request(), but overwrite the following
	// options:
	const options = {
		// Overwrite search to retain trailing ? (issue #776)
		path: parsedURL.pathname + search,
		// The following options are not expressed in the URL
		method: request.method,
		headers: headers[Symbol.for('nodejs.util.inspect.custom')](),
		insecureHTTPParser: request.insecureHTTPParser,
		agent,
	}

	return {
		/** @type {URL} */
		parsedURL,
		options,
	}
}

/**
 * AbortError interface for cancelled requests
 */
class AbortError extends FetchBaseError {
	constructor(message, type = 'aborted') {
		super(message, type)
	}
}

/**
 * Index.js
 *
 * a request API compatible with window.fetch
 *
 * All spec algorithm step numbers are based on https://fetch.spec.whatwg.org/commit-snapshots/ae716822cb3a61843226cd090eefc6589446c1d2/.
 */

const supportedSchemas = new Set(['data:', 'http:', 'https:'])

/**
 * Fetch function
 *
 * @param   {string | URL | import('./request').default} url - Absolute url or Request instance
 * @param   {*} [options_] - Fetch options
 * @return  {Promise<import('./response').default>}
 */
async function fetch$1(url, options_) {
	return new Promise((resolve, reject) => {
		// Build request object
		const request = new Request(url, options_)
		const { parsedURL, options } = getNodeRequestOptions(request)
		if (!supportedSchemas.has(parsedURL.protocol)) {
			throw new TypeError(
				`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(
					/:$/,
					''
				)}" is not supported.`
			)
		}

		if (parsedURL.protocol === 'data:') {
			const data = dataUriToBuffer(request.url)
			const response = new Response(data, {
				headers: { 'Content-Type': data.typeFull },
			})
			resolve(response)
			return
		}

		// Wrap http.request into fetch
		const send = (parsedURL.protocol === 'https:' ? https : http).request
		const { signal } = request
		let response = null

		const abort = () => {
			const error = new AbortError('The operation was aborted.')
			reject(error)
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error)
			}

			if (!response || !response.body) {
				return
			}

			response.body.emit('error', error)
		}

		if (signal && signal.aborted) {
			abort()
			return
		}

		const abortAndFinalize = () => {
			abort()
			finalize()
		}

		// Send request
		const request_ = send(parsedURL.toString(), options)

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize)
		}

		const finalize = () => {
			request_.abort()
			if (signal) {
				signal.removeEventListener('abort', abortAndFinalize)
			}
		}

		request_.on('error', (error) => {
			reject(
				new FetchError(
					`request to ${request.url} failed, reason: ${error.message}`,
					'system',
					error
				)
			)
			finalize()
		})

		fixResponseChunkedTransferBadEnding(request_, (error) => {
			response.body.destroy(error)
		})

		/* c8 ignore next 18 */
		if (process.version < 'v14') {
			// Before Node.js 14, pipeline() does not fully support async iterators and does not always
			// properly handle when the socket close/end events are out of order.
			request_.on('socket', (s) => {
				let endedWithEventsCount
				s.prependListener('end', () => {
					endedWithEventsCount = s._eventsCount
				})
				s.prependListener('close', (hadError) => {
					// if end happened before close but the socket didn't emit an error, do it now
					if (response && endedWithEventsCount < s._eventsCount && !hadError) {
						const error = new Error('Premature close')
						error.code = 'ERR_STREAM_PREMATURE_CLOSE'
						response.body.emit('error', error)
					}
				})
			})
		}

		request_.on('response', (response_) => {
			request_.setTimeout(0)
			const headers = fromRawHeaders(response_.rawHeaders)

			// HTTP fetch step 5
			if (isRedirect(response_.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location')

				// HTTP fetch step 5.3
				let locationURL = null
				try {
					locationURL =
						location === null ? null : new URL(location, request.url)
				} catch {
					// error here can only be invalid URL in Location: header
					// do not throw when options.redirect == manual
					// let the user extract the errorneous redirect URL
					if (request.redirect !== 'manual') {
						reject(
							new FetchError(
								`uri requested responds with an invalid redirect URL: ${location}`,
								'invalid-redirect'
							)
						)
						finalize()
						return
					}
				}

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(
							new FetchError(
								`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`,
								'no-redirect'
							)
						)
						finalize()
						return
					case 'manual':
						// Nothing to do
						break
					case 'follow': {
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(
								new FetchError(
									`maximum redirect reached at: ${request.url}`,
									'max-redirect'
								)
							)
							finalize()
							return
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOptions = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: clone(request),
							signal: request.signal,
							size: request.size,
							referrer: request.referrer,
							referrerPolicy: request.referrerPolicy,
						}

						// when forwarding sensitive headers like "Authorization",
						// "WWW-Authenticate", and "Cookie" to untrusted targets,
						// headers will be ignored when following a redirect to a domain
						// that is not a subdomain match or exact match of the initial domain.
						// For example, a redirect from "foo.com" to either "foo.com" or "sub.foo.com"
						// will forward the sensitive headers, but a redirect to "bar.com" will not.
						if (!isDomainOrSubdomain(request.url, locationURL)) {
							for (const name of [
								'authorization',
								'www-authenticate',
								'cookie',
								'cookie2',
							]) {
								requestOptions.headers.delete(name)
							}
						}

						// HTTP-redirect fetch step 9
						if (
							response_.statusCode !== 303 &&
							request.body &&
							options_.body instanceof Stream.Readable
						) {
							reject(
								new FetchError(
									'Cannot follow redirect with body being a readable stream',
									'unsupported-redirect'
								)
							)
							finalize()
							return
						}

						// HTTP-redirect fetch step 11
						if (
							response_.statusCode === 303 ||
							((response_.statusCode === 301 || response_.statusCode === 302) &&
								request.method === 'POST')
						) {
							requestOptions.method = 'GET'
							requestOptions.body = undefined
							requestOptions.headers.delete('content-length')
						}

						// HTTP-redirect fetch step 14
						const responseReferrerPolicy =
							parseReferrerPolicyFromHeader(headers)
						if (responseReferrerPolicy) {
							requestOptions.referrerPolicy = responseReferrerPolicy
						}

						// HTTP-redirect fetch step 15
						resolve(fetch$1(new Request(locationURL, requestOptions)))
						finalize()
						return
					}

					default:
						return reject(
							new TypeError(
								`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`
							)
						)
				}
			}

			// Prepare response
			if (signal) {
				response_.once('end', () => {
					signal.removeEventListener('abort', abortAndFinalize)
				})
			}

			let body = pipeline$1(response_, new PassThrough(), (error) => {
				if (error) {
					reject(error)
				}
			})
			// see https://github.com/nodejs/node/pull/29376
			/* c8 ignore next 3 */
			if (process.version < 'v12.10') {
				response_.on('aborted', abortAndFinalize)
			}

			const responseOptions = {
				url: request.url,
				status: response_.statusCode,
				statusText: response_.statusMessage,
				headers,
				size: request.size,
				counter: request.counter,
				highWaterMark: request.highWaterMark,
			}

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding')

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (
				!request.compress ||
				request.method === 'HEAD' ||
				codings === null ||
				response_.statusCode === 204 ||
				response_.statusCode === 304
			) {
				response = new Response(body, responseOptions)
				resolve(response)
				return
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH,
			}

			// For gzip
			if (codings === 'gzip' || codings === 'x-gzip') {
				body = pipeline$1(body, zlib.createGunzip(zlibOptions), (error) => {
					if (error) {
						reject(error)
					}
				})
				response = new Response(body, responseOptions)
				resolve(response)
				return
			}

			// For deflate
			if (codings === 'deflate' || codings === 'x-deflate') {
				// Handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = pipeline$1(response_, new PassThrough(), (error) => {
					if (error) {
						reject(error)
					}
				})
				raw.once('data', (chunk) => {
					// See http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0f) === 0x08) {
						body = pipeline$1(body, zlib.createInflate(), (error) => {
							if (error) {
								reject(error)
							}
						})
					} else {
						body = pipeline$1(body, zlib.createInflateRaw(), (error) => {
							if (error) {
								reject(error)
							}
						})
					}

					response = new Response(body, responseOptions)
					resolve(response)
				})
				raw.once('end', () => {
					// Some old IIS servers return zero-length OK deflate responses, so
					// 'data' is never emitted. See https://github.com/node-fetch/node-fetch/pull/903
					if (!response) {
						response = new Response(body, responseOptions)
						resolve(response)
					}
				})
				return
			}

			// For br
			if (codings === 'br') {
				body = pipeline$1(body, zlib.createBrotliDecompress(), (error) => {
					if (error) {
						reject(error)
					}
				})
				response = new Response(body, responseOptions)
				resolve(response)
				return
			}

			// Otherwise, use response as-is
			response = new Response(body, responseOptions)
			resolve(response)
		})

		// eslint-disable-next-line promise/prefer-await-to-then
		writeToStream(request_, request).catch(reject)
	})
}

function fixResponseChunkedTransferBadEnding(request, errorCallback) {
	const LAST_CHUNK = Buffer.from('0\r\n\r\n')

	let isChunkedTransfer = false
	let properLastChunkReceived = false
	let previousChunk

	request.on('response', (response) => {
		const { headers } = response
		isChunkedTransfer =
			headers['transfer-encoding'] === 'chunked' && !headers['content-length']
	})

	request.on('socket', (socket) => {
		const onSocketClose = () => {
			if (isChunkedTransfer && !properLastChunkReceived) {
				const error = new Error('Premature close')
				error.code = 'ERR_STREAM_PREMATURE_CLOSE'
				errorCallback(error)
			}
		}

		socket.prependListener('close', onSocketClose)

		request.on('abort', () => {
			socket.removeListener('close', onSocketClose)
		})

		socket.on('data', (buf) => {
			properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0

			// Sometimes final 0-length chunk and end of message code are in separate packets
			if (!properLastChunkReceived && previousChunk) {
				properLastChunkReceived =
					Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) ===
						0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0
			}

			previousChunk = buf
		})
	})
}

const fetch = {
	fetch(resource, init) {
		const resourceURL = new URL(
			__object_isPrototypeOf(Request.prototype, resource)
				? resource.url
				: pathToPosix(resource),
			typeof Object(globalThis.process).cwd === 'function'
				? 'file:' + pathToPosix(process.cwd()) + '/'
				: 'file:'
		)
		if (resourceURL.protocol.toLowerCase() === 'file:') {
			return import('node:fs').then((fs) => {
				try {
					const stats = fs.statSync(resourceURL)
					const body = fs.createReadStream(resourceURL)
					return new Response(body, {
						status: 200,
						statusText: '',
						headers: {
							'content-length': String(stats.size),
							date: new Date().toUTCString(),
							'last-modified': new Date(stats.mtimeMs).toUTCString(),
						},
					})
				} catch (error) {
					const body = new Stream.Readable()
					body._read = () => {}
					body.push(null)
					return new Response(body, {
						status: 404,
						statusText: '',
						headers: {
							date: new Date().toUTCString(),
						},
					})
				}
			})
		} else {
			return fetch$1(resource, init)
		}
	},
}.fetch

function u(u, D) {
	for (var t = 0; t < D.length; t++) {
		var F = D[t]
		;(F.enumerable = F.enumerable || !1),
			(F.configurable = !0),
			'value' in F && (F.writable = !0),
			Object.defineProperty(u, F.key, F)
	}
}
function D(D, t, F) {
	return t && u(D.prototype, t), F && u(D, F), D
}
function t(u, D) {
	;(null == D || D > u.length) && (D = u.length)
	for (var t = 0, F = new Array(D); t < D; t++) F[t] = u[t]
	return F
}
function F$1(u, D) {
	var F =
		('undefined' != typeof Symbol && u[Symbol.iterator]) || u['@@iterator']
	if (F) return (F = F.call(u)).next.bind(F)
	if (
		Array.isArray(u) ||
		(F = (function (u, D) {
			if (u) {
				if ('string' == typeof u) return t(u, D)
				var F = Object.prototype.toString.call(u).slice(8, -1)
				return (
					'Object' === F && u.constructor && (F = u.constructor.name),
					'Map' === F || 'Set' === F
						? Array.from(u)
						: 'Arguments' === F ||
						  /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(F)
						? t(u, D)
						: void 0
				)
			}
		})(u)) ||
		(D && u && 'number' == typeof u.length)
	) {
		F && (u = F)
		var e = 0
		return function () {
			return e >= u.length ? { done: !0 } : { done: !1, value: u[e++] }
		}
	}
	throw new TypeError(
		'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
	)
}
var e =
		/(?:[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82C[\uDC00-\uDD1E\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDEC0-\uDEEB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDD\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])/,
	C =
		/(?:[\$0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u07FD\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u08D3-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u09FE\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D81-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1ABF\u1AC0\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CD0-\u1CD2\u1CD4-\u1CFA\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA827\uA82C\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD27\uDD30-\uDD39\uDE80-\uDEA9\uDEAB\uDEAC\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF50\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD44-\uDD47\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDC9-\uDDCC\uDDCE-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3B-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC5E-\uDC61\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB8\uDEC0-\uDEC9\uDF00-\uDF1A\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDC00-\uDC3A\uDCA0-\uDCE9\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD35\uDD37\uDD38\uDD3B-\uDD43\uDD50-\uDD59\uDDA0-\uDDA7\uDDAA-\uDDD7\uDDDA-\uDDE1\uDDE3\uDDE4\uDE00-\uDE3E\uDE47\uDE50-\uDE99\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF6\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF4F-\uDF87\uDF8F-\uDF9F\uDFE0\uDFE1\uDFE3\uDFE4\uDFF0\uDFF1]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82C[\uDC00-\uDD1E\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDD00-\uDD2C\uDD30-\uDD3D\uDD40-\uDD49\uDD4E\uDEC0-\uDEF9]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4B\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83E[\uDFF0-\uDFF9]|\uD869[\uDC00-\uDEDD\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]|\uDB40[\uDD00-\uDDEF])/
function A$1(u, D) {
	return (D ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(u)
}
function E(u, D) {
	void 0 === D && (D = !1)
	for (var t = [], F = 0; F < u.length; ) {
		var E = u[F],
			n = function (e) {
				if (!D) throw new TypeError(e)
				t.push({ type: 'INVALID_CHAR', index: F, value: u[F++] })
			}
		if ('*' !== E)
			if ('+' !== E && '?' !== E)
				if ('\\' !== E)
					if ('{' !== E)
						if ('}' !== E)
							if (':' !== E)
								if ('(' !== E) t.push({ type: 'CHAR', index: F, value: u[F++] })
								else {
									var r = 1,
										i = '',
										s = F + 1,
										a = !1
									if ('?' === u[s]) {
										n('Pattern cannot start with "?" at ' + s)
										continue
									}
									for (; s < u.length; ) {
										if (!A$1(u[s], !1)) {
											n("Invalid character '" + u[s] + "' at " + s + '.'),
												(a = !0)
											break
										}
										if ('\\' !== u[s]) {
											if (')' === u[s]) {
												if (0 == --r) {
													s++
													break
												}
											} else if ('(' === u[s] && (r++, '?' !== u[s + 1])) {
												n('Capturing groups are not allowed at ' + s), (a = !0)
												break
											}
											i += u[s++]
										} else i += u[s++] + u[s++]
									}
									if (a) continue
									if (r) {
										n('Unbalanced pattern at ' + F)
										continue
									}
									if (!i) {
										n('Missing pattern at ' + F)
										continue
									}
									t.push({ type: 'PATTERN', index: F, value: i }), (F = s)
								}
							else {
								for (var B = '', o = F + 1; o < u.length; ) {
									var h = u.substr(o, 1)
									if (
										!((o === F + 1 && e.test(h)) || (o !== F + 1 && C.test(h)))
									)
										break
									B += u[o++]
								}
								if (!B) {
									n('Missing parameter name at ' + F)
									continue
								}
								t.push({ type: 'NAME', index: F, value: B }), (F = o)
							}
						else t.push({ type: 'CLOSE', index: F, value: u[F++] })
					else t.push({ type: 'OPEN', index: F, value: u[F++] })
				else t.push({ type: 'ESCAPED_CHAR', index: F++, value: u[F++] })
			else t.push({ type: 'MODIFIER', index: F, value: u[F++] })
		else t.push({ type: 'ASTERISK', index: F, value: u[F++] })
	}
	return t.push({ type: 'END', index: F, value: '' }), t
}
function n(u, D) {
	void 0 === D && (D = {})
	for (
		var t = E(u),
			F = D.prefixes,
			e = void 0 === F ? './' : F,
			C = '[^' + r(D.delimiter || '/#?') + ']+?',
			A = [],
			n = 0,
			i = 0,
			s = '',
			a = new Set(),
			B = function (u) {
				if (i < t.length && t[i].type === u) return t[i++].value
			},
			o = function () {
				return B('MODIFIER') || B('ASTERISK')
			},
			h = function (u) {
				var D = B(u)
				if (void 0 !== D) return D
				var F = t[i]
				throw new TypeError(
					'Unexpected ' + F.type + ' at ' + F.index + ', expected ' + u
				)
			},
			p = function () {
				for (var u, D = ''; (u = B('CHAR') || B('ESCAPED_CHAR')); ) D += u
				return D
			},
			c =
				D.encodePart ||
				function (u) {
					return u
				};
		i < t.length;

	) {
		var f = B('CHAR'),
			l = B('NAME'),
			m = B('PATTERN')
		if ((l || m || !B('ASTERISK') || (m = '.*'), l || m)) {
			var d = f || ''
			;-1 === e.indexOf(d) && ((s += d), (d = '')),
				s && (A.push(c(s)), (s = ''))
			var g = l || n++
			if (a.has(g)) throw new TypeError("Duplicate name '" + g + "'.")
			a.add(g),
				A.push({
					name: g,
					prefix: c(d),
					suffix: '',
					pattern: m || C,
					modifier: o() || '',
				})
		} else {
			var x = f || B('ESCAPED_CHAR')
			if (x) s += x
			else if (B('OPEN')) {
				var S = p(),
					v = B('NAME') || '',
					y = B('PATTERN') || ''
				v || y || !B('ASTERISK') || (y = '.*')
				var R = p()
				h('CLOSE')
				var k = o() || ''
				if (!v && !y && !k) {
					s += S
					continue
				}
				if (!v && !y && !S) continue
				s && (A.push(c(s)), (s = '')),
					A.push({
						name: v || (y ? n++ : ''),
						pattern: v && !y ? C : y,
						prefix: c(S),
						suffix: c(R),
						modifier: k,
					})
			} else s && (A.push(c(s)), (s = '')), h('END')
		}
	}
	return A
}
function r(u) {
	return u.replace(/([.+*?^${}()[\]|/\\])/g, '\\$1')
}
function i(u) {
	return u && u.sensitive ? 'u' : 'ui'
}
function s$1(u, D, t) {
	void 0 === t && (t = {})
	for (
		var e,
			C = t.strict,
			A = void 0 !== C && C,
			E = t.start,
			n = void 0 === E || E,
			s = t.end,
			a = void 0 === s || s,
			B = t.encode,
			o =
				void 0 === B
					? function (u) {
							return u
					  }
					: B,
			h = '[' + r(t.endsWith || '') + ']|$',
			p = '[' + r(t.delimiter || '/#?') + ']',
			c = n ? '^' : '',
			f = F$1(u);
		!(e = f()).done;

	) {
		var l = e.value
		if ('string' == typeof l) c += r(o(l))
		else {
			var m = r(o(l.prefix)),
				d = r(o(l.suffix))
			l.pattern
				? (D && D.push(l),
				  (c +=
						m || d
							? '+' === l.modifier || '*' === l.modifier
								? '(?:' +
								  m +
								  '((?:' +
								  l.pattern +
								  ')(?:' +
								  d +
								  m +
								  '(?:' +
								  l.pattern +
								  '))*)' +
								  d +
								  ')' +
								  ('*' === l.modifier ? '?' : '')
								: '(?:' + m + '(' + l.pattern + ')' + d + ')' + l.modifier
							: '+' === l.modifier || '*' === l.modifier
							? '((?:' + l.pattern + ')' + l.modifier + ')'
							: '(' + l.pattern + ')' + l.modifier))
				: (c += '(?:' + m + d + ')' + l.modifier)
		}
	}
	if (a) A || (c += p + '?'), (c += t.endsWith ? '(?=' + h + ')' : '$')
	else {
		var g = u[u.length - 1],
			x = 'string' == typeof g ? p.indexOf(g[g.length - 1]) > -1 : void 0 === g
		A || (c += '(?:' + p + '(?=' + h + '))?'),
			x || (c += '(?=' + p + '|' + h + ')')
	}
	return new RegExp(c, i(t))
}
function a(u, D, t) {
	return u instanceof RegExp
		? (function (u, D) {
				if (!D) return u
				for (
					var t = /\((?:\?<(.*?)>)?(?!\?)/g, F = 0, e = t.exec(u.source);
					e;

				)
					D.push({
						name: e[1] || F++,
						prefix: '',
						suffix: '',
						modifier: '',
						pattern: '',
					}),
						(e = t.exec(u.source))
				return u
		  })(u, D)
		: Array.isArray(u)
		? (function (u, D, t) {
				var F = u.map(function (u) {
					return a(u, D, t).source
				})
				return new RegExp('(?:' + F.join('|') + ')', i(t))
		  })(u, D, t)
		: (function (u, D, t) {
				return s$1(n(u, t), D, t)
		  })(u, D, t)
}
var B = { delimiter: '', prefixes: '', sensitive: !0, strict: !0 },
	o = { delimiter: '.', prefixes: '', sensitive: !0, strict: !0 },
	h = { delimiter: '/', prefixes: '/', sensitive: !0, strict: !0 }
function p(u, D) {
	return u.startsWith(D) ? u.substring(D.length, u.length) : u
}
function c(u) {
	return !(
		!u ||
		u.length < 2 ||
		('[' !== u[0] && (('\\' !== u[0] && '{' !== u[0]) || '[' !== u[1]))
	)
}
var f$1,
	l = ['ftp', 'file', 'http', 'https', 'ws', 'wss']
function m(u) {
	if (!u) return !0
	for (var D, t = F$1(l); !(D = t()).done; ) if (u.test(D.value)) return !0
	return !1
}
function d(u) {
	switch (u) {
		case 'ws':
		case 'http':
			return '80'
		case 'wws':
		case 'https':
			return '443'
		case 'ftp':
			return '21'
		default:
			return ''
	}
}
function g(u) {
	if ('' === u) return u
	if (/^[-+.A-Za-z0-9]*$/.test(u)) return u.toLowerCase()
	throw new TypeError("Invalid protocol '" + u + "'.")
}
function x(u) {
	if ('' === u) return u
	var D = new URL('https://example.com')
	return (D.username = u), D.username
}
function S$1(u) {
	if ('' === u) return u
	var D = new URL('https://example.com')
	return (D.password = u), D.password
}
function v(u) {
	if ('' === u) return u
	if (/[\t\n\r #%/:<>?@[\]^\\|]/g.test(u))
		throw new TypeError("Invalid hostname '" + u + "'")
	var D = new URL('https://example.com')
	return (D.hostname = u), D.hostname
}
function y(u) {
	if ('' === u) return u
	if (/[^0-9a-fA-F[\]:]/g.test(u))
		throw new TypeError("Invalid IPv6 hostname '" + u + "'")
	return u.toLowerCase()
}
function R(u) {
	if ('' === u) return u
	if (/^[0-9]*$/.test(u) && parseInt(u) <= 65535) return u
	throw new TypeError("Invalid port '" + u + "'.")
}
function k(u) {
	if ('' === u) return u
	var D = new URL('https://example.com')
	return (
		(D.pathname = '/' !== u[0] ? '/-' + u : u),
		'/' !== u[0] ? D.pathname.substring(2, D.pathname.length) : D.pathname
	)
}
function w(u) {
	return '' === u ? u : new URL('data:' + u).pathname
}
function P(u) {
	if ('' === u) return u
	var D = new URL('https://example.com')
	return (D.search = u), D.search.substring(1, D.search.length)
}
function T(u) {
	if ('' === u) return u
	var D = new URL('https://example.com')
	return (D.hash = u), D.hash.substring(1, D.hash.length)
}
!(function (u) {
	;(u[(u.INIT = 0)] = 'INIT'),
		(u[(u.PROTOCOL = 1)] = 'PROTOCOL'),
		(u[(u.AUTHORITY = 2)] = 'AUTHORITY'),
		(u[(u.USERNAME = 3)] = 'USERNAME'),
		(u[(u.PASSWORD = 4)] = 'PASSWORD'),
		(u[(u.HOSTNAME = 5)] = 'HOSTNAME'),
		(u[(u.PORT = 6)] = 'PORT'),
		(u[(u.PATHNAME = 7)] = 'PATHNAME'),
		(u[(u.SEARCH = 8)] = 'SEARCH'),
		(u[(u.HASH = 9)] = 'HASH'),
		(u[(u.DONE = 10)] = 'DONE')
})(f$1 || (f$1 = {}))
var b = (function () {
		function u(u) {
			;(this.input = void 0),
				(this.tokenList = []),
				(this.internalResult = {}),
				(this.tokenIndex = 0),
				(this.tokenIncrement = 1),
				(this.componentStart = 0),
				(this.state = f$1.INIT),
				(this.groupDepth = 0),
				(this.hostnameIPv6BracketDepth = 0),
				(this.shouldTreatAsStandardURL = !1),
				(this.input = u)
		}
		var t = u.prototype
		return (
			(t.parse = function () {
				for (
					this.tokenList = E(this.input, !0);
					this.tokenIndex < this.tokenList.length;
					this.tokenIndex += this.tokenIncrement
				) {
					if (
						((this.tokenIncrement = 1),
						'END' === this.tokenList[this.tokenIndex].type)
					) {
						if (this.state === f$1.INIT) {
							this.rewind(),
								this.isHashPrefix()
									? this.changeState(f$1.HASH, 1)
									: this.isSearchPrefix()
									? (this.changeState(f$1.SEARCH, 1),
									  (this.internalResult.hash = ''))
									: (this.changeState(f$1.PATHNAME, 0),
									  (this.internalResult.search = ''),
									  (this.internalResult.hash = ''))
							continue
						}
						if (this.state === f$1.AUTHORITY) {
							this.rewindAndSetState(f$1.HOSTNAME)
							continue
						}
						this.changeState(f$1.DONE, 0)
						break
					}
					if (this.groupDepth > 0) {
						if (!this.isGroupClose()) continue
						this.groupDepth -= 1
					}
					if (this.isGroupOpen()) this.groupDepth += 1
					else
						switch (this.state) {
							case f$1.INIT:
								this.isProtocolSuffix() &&
									((this.internalResult.username = ''),
									(this.internalResult.password = ''),
									(this.internalResult.hostname = ''),
									(this.internalResult.port = ''),
									(this.internalResult.pathname = ''),
									(this.internalResult.search = ''),
									(this.internalResult.hash = ''),
									this.rewindAndSetState(f$1.PROTOCOL))
								break
							case f$1.PROTOCOL:
								if (this.isProtocolSuffix()) {
									this.computeShouldTreatAsStandardURL()
									var u = f$1.PATHNAME,
										D = 1
									this.shouldTreatAsStandardURL &&
										(this.internalResult.pathname = '/'),
										this.nextIsAuthoritySlashes()
											? ((u = f$1.AUTHORITY), (D = 3))
											: this.shouldTreatAsStandardURL && (u = f$1.AUTHORITY),
										this.changeState(u, D)
								}
								break
							case f$1.AUTHORITY:
								this.isIdentityTerminator()
									? this.rewindAndSetState(f$1.USERNAME)
									: (this.isPathnameStart() ||
											this.isSearchPrefix() ||
											this.isHashPrefix()) &&
									  this.rewindAndSetState(f$1.HOSTNAME)
								break
							case f$1.USERNAME:
								this.isPasswordPrefix()
									? this.changeState(f$1.PASSWORD, 1)
									: this.isIdentityTerminator() &&
									  this.changeState(f$1.HOSTNAME, 1)
								break
							case f$1.PASSWORD:
								this.isIdentityTerminator() && this.changeState(f$1.HOSTNAME, 1)
								break
							case f$1.HOSTNAME:
								this.isIPv6Open()
									? (this.hostnameIPv6BracketDepth += 1)
									: this.isIPv6Close() && (this.hostnameIPv6BracketDepth -= 1),
									this.isPortPrefix() && !this.hostnameIPv6BracketDepth
										? this.changeState(f$1.PORT, 1)
										: this.isPathnameStart()
										? this.changeState(f$1.PATHNAME, 0)
										: this.isSearchPrefix()
										? this.changeState(f$1.SEARCH, 1)
										: this.isHashPrefix() && this.changeState(f$1.HASH, 1)
								break
							case f$1.PORT:
								this.isPathnameStart()
									? this.changeState(f$1.PATHNAME, 0)
									: this.isSearchPrefix()
									? this.changeState(f$1.SEARCH, 1)
									: this.isHashPrefix() && this.changeState(f$1.HASH, 1)
								break
							case f$1.PATHNAME:
								this.isSearchPrefix()
									? this.changeState(f$1.SEARCH, 1)
									: this.isHashPrefix() && this.changeState(f$1.HASH, 1)
								break
							case f$1.SEARCH:
								this.isHashPrefix() && this.changeState(f$1.HASH, 1)
						}
				}
			}),
			(t.changeState = function (u, D) {
				switch (this.state) {
					case f$1.INIT:
						break
					case f$1.PROTOCOL:
						this.internalResult.protocol = this.makeComponentString()
						break
					case f$1.AUTHORITY:
						break
					case f$1.USERNAME:
						this.internalResult.username = this.makeComponentString()
						break
					case f$1.PASSWORD:
						this.internalResult.password = this.makeComponentString()
						break
					case f$1.HOSTNAME:
						this.internalResult.hostname = this.makeComponentString()
						break
					case f$1.PORT:
						this.internalResult.port = this.makeComponentString()
						break
					case f$1.PATHNAME:
						this.internalResult.pathname = this.makeComponentString()
						break
					case f$1.SEARCH:
						this.internalResult.search = this.makeComponentString()
						break
					case f$1.HASH:
						this.internalResult.hash = this.makeComponentString()
				}
				this.changeStateWithoutSettingComponent(u, D)
			}),
			(t.changeStateWithoutSettingComponent = function (u, D) {
				;(this.state = u),
					(this.componentStart = this.tokenIndex + D),
					(this.tokenIndex += D),
					(this.tokenIncrement = 0)
			}),
			(t.rewind = function () {
				;(this.tokenIndex = this.componentStart), (this.tokenIncrement = 0)
			}),
			(t.rewindAndSetState = function (u) {
				this.rewind(), (this.state = u)
			}),
			(t.safeToken = function (u) {
				return (
					u < 0 && (u = this.tokenList.length - u),
					u < this.tokenList.length
						? this.tokenList[u]
						: this.tokenList[this.tokenList.length - 1]
				)
			}),
			(t.isNonSpecialPatternChar = function (u, D) {
				var t = this.safeToken(u)
				return (
					t.value === D &&
					('CHAR' === t.type ||
						'ESCAPED_CHAR' === t.type ||
						'INVALID_CHAR' === t.type)
				)
			}),
			(t.isProtocolSuffix = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, ':')
			}),
			(t.nextIsAuthoritySlashes = function () {
				return (
					this.isNonSpecialPatternChar(this.tokenIndex + 1, '/') &&
					this.isNonSpecialPatternChar(this.tokenIndex + 2, '/')
				)
			}),
			(t.isIdentityTerminator = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, '@')
			}),
			(t.isPasswordPrefix = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, ':')
			}),
			(t.isPortPrefix = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, ':')
			}),
			(t.isPathnameStart = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, '/')
			}),
			(t.isSearchPrefix = function () {
				if (this.isNonSpecialPatternChar(this.tokenIndex, '?')) return !0
				if ('?' !== this.tokenList[this.tokenIndex].value) return !1
				var u = this.safeToken(this.tokenIndex - 1)
				return (
					'NAME' !== u.type &&
					'PATTERN' !== u.type &&
					'CLOSE' !== u.type &&
					'ASTERISK' !== u.type
				)
			}),
			(t.isHashPrefix = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, '#')
			}),
			(t.isGroupOpen = function () {
				return 'OPEN' == this.tokenList[this.tokenIndex].type
			}),
			(t.isGroupClose = function () {
				return 'CLOSE' == this.tokenList[this.tokenIndex].type
			}),
			(t.isIPv6Open = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, '[')
			}),
			(t.isIPv6Close = function () {
				return this.isNonSpecialPatternChar(this.tokenIndex, ']')
			}),
			(t.makeComponentString = function () {
				var u = this.tokenList[this.tokenIndex],
					D = this.safeToken(this.componentStart).index
				return this.input.substring(D, u.index)
			}),
			(t.computeShouldTreatAsStandardURL = function () {
				var u = {}
				Object.assign(u, B), (u.encodePart = g)
				var D = a(this.makeComponentString(), void 0, u)
				this.shouldTreatAsStandardURL = m(D)
			}),
			D(u, [
				{
					key: 'result',
					get: function () {
						return this.internalResult
					},
				},
			]),
			u
		)
	})(),
	I = [
		'protocol',
		'username',
		'password',
		'hostname',
		'port',
		'pathname',
		'search',
		'hash',
	]
function O(u, D) {
	if ('string' != typeof u)
		throw new TypeError("parameter 1 is not of type 'string'.")
	var t = new URL(u, D)
	return {
		protocol: t.protocol.substring(0, t.protocol.length - 1),
		username: t.username,
		password: t.password,
		hostname: t.hostname,
		port: t.port,
		pathname: t.pathname,
		search: '' != t.search ? t.search.substring(1, t.search.length) : void 0,
		hash: '' != t.hash ? t.hash.substring(1, t.hash.length) : void 0,
	}
}
function H(u, D, t) {
	var F
	if ('string' == typeof D.baseURL)
		try {
			;(F = new URL(D.baseURL)),
				(u.protocol = F.protocol
					? F.protocol.substring(0, F.protocol.length - 1)
					: ''),
				(u.username = F.username),
				(u.password = F.password),
				(u.hostname = F.hostname),
				(u.port = F.port),
				(u.pathname = F.pathname),
				(u.search = F.search ? F.search.substring(1, F.search.length) : ''),
				(u.hash = F.hash ? F.hash.substring(1, F.hash.length) : '')
		} catch (u) {
			throw new TypeError("invalid baseURL '" + D.baseURL + "'.")
		}
	if (
		('string' == typeof D.protocol &&
			(u.protocol = (function (u, D) {
				var t
				return (
					(u = (t = u).endsWith(':') ? t.substr(0, t.length - ':'.length) : t),
					D || '' === u ? u : g(u)
				)
			})(D.protocol, t)),
		'string' == typeof D.username &&
			(u.username = (function (u, D) {
				if (D || '' === u) return u
				var t = new URL('https://example.com')
				return (t.username = u), t.username
			})(D.username, t)),
		'string' == typeof D.password &&
			(u.password = (function (u, D) {
				if (D || '' === u) return u
				var t = new URL('https://example.com')
				return (t.password = u), t.password
			})(D.password, t)),
		'string' == typeof D.hostname &&
			(u.hostname = (function (u, D) {
				return D || '' === u ? u : c(u) ? y(u) : v(u)
			})(D.hostname, t)),
		'string' == typeof D.port &&
			(u.port = (function (u, D, t) {
				return d(D) === u && (u = ''), t || '' === u ? u : R(u)
			})(D.port, u.protocol, t)),
		'string' == typeof D.pathname)
	) {
		if (
			((u.pathname = D.pathname),
			F &&
				!(function (u, D) {
					return !(
						!u.length ||
						('/' !== u[0] &&
							(!D ||
								u.length < 2 ||
								('\\' != u[0] && '{' != u[0]) ||
								'/' != u[1]))
					)
				})(u.pathname, t))
		) {
			var e = F.pathname.lastIndexOf('/')
			e >= 0 && (u.pathname = F.pathname.substring(0, e + 1) + u.pathname)
		}
		u.pathname = (function (u, D, t) {
			if (t || '' === u) return u
			if (D && !l.includes(D)) return new URL(D + ':' + u).pathname
			var F = '/' == u[0]
			return (
				(u = new URL(F ? u : '/-' + u, 'https://example.com').pathname),
				F || (u = u.substring(2, u.length)),
				u
			)
		})(u.pathname, u.protocol, t)
	}
	return (
		'string' == typeof D.search &&
			(u.search = (function (u, D) {
				if (((u = p(u, '?')), D || '' === u)) return u
				var t = new URL('https://example.com')
				return (
					(t.search = u), t.search ? t.search.substring(1, t.search.length) : ''
				)
			})(D.search, t)),
		'string' == typeof D.hash &&
			(u.hash = (function (u, D) {
				if (((u = p(u, '#')), D || '' === u)) return u
				var t = new URL('https://example.com')
				return (t.hash = u), t.hash ? t.hash.substring(1, t.hash.length) : ''
			})(D.hash, t)),
		u
	)
}
function N(u) {
	return u.replace(/([+*?:{}()\\])/g, '\\$1')
}
function L(u, D) {
	for (
		var t =
				'[^' +
				(D.delimiter || '/#?').replace(/([.+*?^${}()[\]|/\\])/g, '\\$1') +
				']+?',
			F =
				/(?:[\$0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u07FD\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08C7\u08D3-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u09FE\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D81-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1ABF\u1AC0\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CD0-\u1CD2\u1CD4-\u1CFA\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7BF\uA7C2-\uA7CA\uA7F5-\uA827\uA82C\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD27\uDD30-\uDD39\uDE80-\uDEA9\uDEAB\uDEAC\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF50\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD44-\uDD47\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDC9-\uDDCC\uDDCE-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3B-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC5E-\uDC61\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB8\uDEC0-\uDEC9\uDF00-\uDF1A\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDC00-\uDC3A\uDCA0-\uDCE9\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD35\uDD37\uDD38\uDD3B-\uDD43\uDD50-\uDD59\uDDA0-\uDDA7\uDDAA-\uDDD7\uDDDA-\uDDE1\uDDE3\uDDE4\uDE00-\uDE3E\uDE47\uDE50-\uDE99\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF6\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF4F-\uDF87\uDF8F-\uDF9F\uDFE0\uDFE1\uDFE3\uDFE4\uDFF0\uDFF1]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82C[\uDC00-\uDD1E\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDD00-\uDD2C\uDD30-\uDD3D\uDD40-\uDD49\uDD4E\uDEC0-\uDEF9]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4B\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83E[\uDFF0-\uDFF9]|\uD869[\uDC00-\uDEDD\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]|\uDB40[\uDD00-\uDDEF])/,
			e = '',
			C = 0;
		C < u.length;
		++C
	) {
		var A = u[C],
			E = C > 0 ? u[C - 1] : null,
			n = C < u.length - 1 ? u[C + 1] : null
		if ('string' != typeof A)
			if ('' !== A.pattern) {
				var r = 'number' != typeof A.name,
					i = void 0 !== D.prefixes ? D.prefixes : './',
					s =
						'' !== A.suffix ||
						('' !== A.prefix &&
							(1 !== A.prefix.length || !i.includes(A.prefix)))
				s ||
					!r ||
					A.pattern !== t ||
					'' !== A.modifier ||
					!n ||
					n.prefix ||
					n.suffix ||
					(s =
						'string' == typeof n
							? F.test(n.length > 0 ? n[0] : '')
							: 'number' == typeof n.name),
					!s &&
						'' === A.prefix &&
						E &&
						'string' == typeof E &&
						E.length > 0 &&
						(s = i.includes(E[E.length - 1])),
					s && (e += '{'),
					(e += N(A.prefix)),
					r && (e += ':' + A.name),
					'.*' === A.pattern
						? (e +=
								r ||
								(E &&
									'string' != typeof E &&
									!E.modifier &&
									!s &&
									'' === A.prefix)
									? '(.*)'
									: '*')
						: A.pattern === t
						? r || (e += '(' + t + ')')
						: (e += '(' + A.pattern + ')'),
					A.pattern === t &&
						r &&
						'' !== A.suffix &&
						F.test(A.suffix[0]) &&
						(e += '\\'),
					(e += N(A.suffix)),
					s && (e += '}'),
					(e += A.modifier)
			} else {
				if ('' === A.modifier) {
					e += N(A.prefix)
					continue
				}
				e += '{' + N(A.prefix) + '}' + A.modifier
			}
		else e += N(A)
	}
	return e
}
var U = (function () {
	function u(u, D) {
		void 0 === u && (u = {}),
			(this.pattern = void 0),
			(this.regexp = {}),
			(this.keys = {}),
			(this.component_pattern = {})
		try {
			if ('string' == typeof u) {
				var t = new b(u)
				if ((t.parse(), (u = t.result), D)) {
					if ('string' != typeof D)
						throw new TypeError("'baseURL' parameter is not of type 'string'.")
					u.baseURL = D
				} else if ('string' != typeof u.protocol)
					throw new TypeError(
						'A base URL must be provided for a relative constructor string.'
					)
			} else if (D) throw new TypeError("parameter 1 is not of type 'string'.")
			if (!u || 'object' != typeof u)
				throw new TypeError(
					"parameter 1 is not of type 'string' and cannot convert to dictionary."
				)
			var e
			;(this.pattern = H(
				{
					pathname: '*',
					protocol: '*',
					username: '*',
					password: '*',
					hostname: '*',
					port: '*',
					search: '*',
					hash: '*',
				},
				u,
				!0
			)),
				d(this.pattern.protocol) === this.pattern.port &&
					(this.pattern.port = '')
			for (var C, A = F$1(I); !(C = A()).done; )
				if ((e = C.value) in this.pattern) {
					var E = {},
						r = this.pattern[e]
					switch (((this.keys[e] = []), e)) {
						case 'protocol':
							Object.assign(E, B), (E.encodePart = g)
							break
						case 'username':
							Object.assign(E, B), (E.encodePart = x)
							break
						case 'password':
							Object.assign(E, B), (E.encodePart = S$1)
							break
						case 'hostname':
							Object.assign(E, o), (E.encodePart = c(r) ? y : v)
							break
						case 'port':
							Object.assign(E, B), (E.encodePart = R)
							break
						case 'pathname':
							m(this.regexp.protocol)
								? (Object.assign(E, h), (E.encodePart = k))
								: (Object.assign(E, B), (E.encodePart = w))
							break
						case 'search':
							Object.assign(E, B), (E.encodePart = P)
							break
						case 'hash':
							Object.assign(E, B), (E.encodePart = T)
					}
					try {
						var i = n(r, E)
						;(this.regexp[e] = s$1(i, this.keys[e], E)),
							(this.component_pattern[e] = L(i, E))
					} catch (u) {
						throw new TypeError(
							'invalid ' + e + " pattern '" + this.pattern[e] + "'."
						)
					}
				}
		} catch (u) {
			throw new TypeError("Failed to construct 'URLPattern': " + u.message)
		}
	}
	var t = u.prototype
	return (
		(t.test = function (u, D) {
			void 0 === u && (u = {})
			var t,
				F = {
					pathname: '',
					protocol: '',
					username: '',
					password: '',
					hostname: '',
					port: '',
					search: '',
					hash: '',
				}
			if ('string' != typeof u && D)
				throw new TypeError("parameter 1 is not of type 'string'.")
			if (void 0 === u) return !1
			try {
				F = H(F, 'object' == typeof u ? u : O(u, D), !1)
			} catch (u) {
				return !1
			}
			for (t in this.pattern) if (!this.regexp[t].exec(F[t])) return !1
			return !0
		}),
		(t.exec = function (u, D) {
			void 0 === u && (u = {})
			var t = {
				pathname: '',
				protocol: '',
				username: '',
				password: '',
				hostname: '',
				port: '',
				search: '',
				hash: '',
			}
			if ('string' != typeof u && D)
				throw new TypeError("parameter 1 is not of type 'string'.")
			if (void 0 !== u) {
				try {
					t = H(t, 'object' == typeof u ? u : O(u, D), !1)
				} catch (u) {
					return null
				}
				var e,
					C = {}
				for (e in ((C.inputs = D ? [u, D] : [u]), this.pattern)) {
					var A = this.regexp[e].exec(t[e])
					if (!A) return null
					for (
						var E, n = {}, r = F$1(this.keys[e].entries());
						!(E = r()).done;

					) {
						var i = E.value,
							s = i[1]
						;('string' != typeof s.name && 'number' != typeof s.name) ||
							(n[s.name] = A[i[0] + 1] || '')
					}
					C[e] = { input: t[e] || '', groups: n }
				}
				return C
			}
		}),
		D(u, [
			{
				key: 'protocol',
				get: function () {
					return this.component_pattern.protocol
				},
			},
			{
				key: 'username',
				get: function () {
					return this.component_pattern.username
				},
			},
			{
				key: 'password',
				get: function () {
					return this.component_pattern.password
				},
			},
			{
				key: 'hostname',
				get: function () {
					return this.component_pattern.hostname
				},
			},
			{
				key: 'port',
				get: function () {
					return this.component_pattern.port
				},
			},
			{
				key: 'pathname',
				get: function () {
					return this.component_pattern.pathname
				},
			},
			{
				key: 'search',
				get: function () {
					return this.component_pattern.search
				},
			},
			{
				key: 'hash',
				get: function () {
					return this.component_pattern.hash
				},
			},
		]),
		u
	)
})()

const INTERNAL = { tick: 0, pool: new Map() }
function setTimeout(callback, delay = 0, ...args) {
	const func = __function_bind(callback, globalThis)
	const tick = ++INTERNAL.tick
	const timeout = setTimeout$1(func, delay, ...args)
	INTERNAL.pool.set(tick, timeout)
	return tick
}
function clearTimeout(timeoutId) {
	const timeout = INTERNAL.pool.get(timeoutId)
	if (timeout) {
		clearTimeout$1(timeout)
		INTERNAL.pool.delete(timeoutId)
	}
}

const PRIMITIVE = 0
const ARRAY = 1
const OBJECT = 2
const DATE = 3
const REGEXP = 4
const MAP = 5
const SET = 6
const ERROR = 7
const BIGINT = 8
// export const SYMBOL = 9;

const env = typeof self === 'object' ? self : globalThis

const deserializer = ($, _) => {
	const as = (out, index) => {
		$.set(index, out)
		return out
	}

	const unpair = (index) => {
		if ($.has(index)) return $.get(index)

		const [type, value] = _[index]
		switch (type) {
			case PRIMITIVE:
				return as(value, index)
			case ARRAY: {
				const arr = as([], index)
				for (const index of value) arr.push(unpair(index))
				return arr
			}
			case OBJECT: {
				const object = as({}, index)
				for (const [key, index] of value) object[unpair(key)] = unpair(index)
				return object
			}
			case DATE:
				return as(new Date(value), index)
			case REGEXP: {
				const { source, flags } = value
				return as(new RegExp(source, flags), index)
			}
			case MAP: {
				const map = as(new Map(), index)
				for (const [key, index] of value) map.set(unpair(key), unpair(index))
				return map
			}
			case SET: {
				const set = as(new Set(), index)
				for (const index of value) set.add(unpair(index))
				return set
			}
			case ERROR: {
				const { name, message } = value
				return as(new env[name](message), index)
			}
			case BIGINT:
				return as(BigInt(value), index)
			case 'BigInt':
				return as(Object(BigInt(value)), index)
		}
		return as(new env[type](value), index)
	}

	return unpair
}

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns a deserialized value from a serialized array of Records.
 * @param {Record[]} serialized a previously serialized value.
 * @returns {any}
 */
const deserialize = (serialized) => deserializer(new Map(), serialized)(0)

const EMPTY = ''

const { toString } = {}
const { keys } = Object

const typeOf = (value) => {
	const type = typeof value
	if (type !== 'object' || !value) return [PRIMITIVE, type]

	const asString = toString.call(value).slice(8, -1)
	switch (asString) {
		case 'Array':
			return [ARRAY, EMPTY]
		case 'Object':
			return [OBJECT, EMPTY]
		case 'Date':
			return [DATE, EMPTY]
		case 'RegExp':
			return [REGEXP, EMPTY]
		case 'Map':
			return [MAP, EMPTY]
		case 'Set':
			return [SET, EMPTY]
	}

	if (asString.includes('Array')) return [ARRAY, asString]

	if (asString.includes('Error')) return [ERROR, asString]

	return [OBJECT, asString]
}

const shouldSkip = ([TYPE, type]) =>
	TYPE === PRIMITIVE && (type === 'function' || type === 'symbol')

const serializer = (strict, json, $, _) => {
	const as = (out, value) => {
		const index = _.push(out) - 1
		$.set(value, index)
		return index
	}

	const pair = (value) => {
		if ($.has(value)) return $.get(value)

		let [TYPE, type] = typeOf(value)
		switch (TYPE) {
			case PRIMITIVE: {
				let entry = value
				switch (type) {
					case 'bigint':
						TYPE = BIGINT
						entry = value.toString()
						break
					case 'function':
					case 'symbol':
						if (strict) throw new TypeError('unable to serialize ' + type)
						entry = null
						break
				}
				return as([TYPE, entry], value)
			}
			case ARRAY: {
				if (type) return as([type, [...value]], value)

				const arr = []
				const index = as([TYPE, arr], value)
				for (const entry of value) arr.push(pair(entry))
				return index
			}
			case OBJECT: {
				if (type) {
					switch (type) {
						case 'BigInt':
							return as([type, value.toString()], value)
						case 'Boolean':
						case 'Number':
						case 'String':
							return as([type, value.valueOf()], value)
					}
				}

				if (json && 'toJSON' in value) return pair(value.toJSON())

				const entries = []
				const index = as([TYPE, entries], value)
				for (const key of keys(value)) {
					if (strict || !shouldSkip(typeOf(value[key])))
						entries.push([pair(key), pair(value[key])])
				}
				return index
			}
			case DATE:
				return as([TYPE, value.toISOString()], value)
			case REGEXP: {
				const { source, flags } = value
				return as([TYPE, { source, flags }], value)
			}
			case MAP: {
				const entries = []
				const index = as([TYPE, entries], value)
				for (const [key, entry] of value) {
					if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
						entries.push([pair(key), pair(entry)])
				}
				return index
			}
			case SET: {
				const entries = []
				const index = as([TYPE, entries], value)
				for (const entry of value) {
					if (strict || !shouldSkip(typeOf(entry))) entries.push(pair(entry))
				}
				return index
			}
		}

		const { message } = value
		return as([TYPE, { name: type, message }], value)
	}

	return pair
}

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns an array of serialized Records.
 * @param {any} value a serializable value.
 * @param {{lossy?: boolean}?} options an object with a `lossy` property that,
 *  if `true`, will not throw errors on incompatible types, and behave more
 *  like JSON stringify would behave. Symbol and Function will be discarded.
 * @returns {Record[]}
 */
const serialize = (value, { json, lossy } = {}) => {
	const _ = []
	return serializer(!(json || lossy), !!json, new Map(), _)(value), _
}

var structuredClone = (any, options) => deserialize(serialize(any, options))

class ImageData {
	constructor(arg0, arg1, ...args) {
		if (arguments.length < 2)
			throw new TypeError(
				`Failed to construct 'ImageData': 2 arguments required.`
			)
		/** Whether Uint8ClampedArray data is provided. */
		const hasData = __object_isPrototypeOf(Uint8ClampedArray.prototype, arg0)
		/** Image data, either provided or calculated. */
		const d = hasData
			? arg0
			: new Uint8ClampedArray(
					asNumber(arg0, 'width') * asNumber(arg1, 'height') * 4
			  )
		/** Image width. */
		const w = asNumber(hasData ? arg1 : arg0, 'width')
		/** Image height. */
		const h = d.length / w / 4
		/** Image color space. */
		const c = String(Object(hasData ? args[1] : args[0]).colorSpace || 'srgb')
		// throw if a provided height does not match the calculated height
		if (args.length && asNumber(args[0], 'height') !== h)
			throw new DOMException(
				'height is not equal to (4 * width * height)',
				'IndexSizeError'
			)
		// throw if a provided colorspace does not match a known colorspace
		if (c !== 'srgb' && c !== 'rec2020' && c !== 'display-p3')
			throw new TypeError('colorSpace is not known value')
		Object.defineProperty(this, 'data', {
			configurable: true,
			enumerable: true,
			value: d,
		})
		INTERNALS$3.set(this, { width: w, height: h, colorSpace: c })
	}
	get data() {
		internalsOf(this, 'ImageData', 'data')
		return Object.getOwnPropertyDescriptor(this, 'data').value
	}
	get width() {
		return internalsOf(this, 'ImageData', 'width').width
	}
	get height() {
		return internalsOf(this, 'ImageData', 'height').height
	}
}
allowStringTag(ImageData)
/** Returns a coerced number, optionally throwing if the number is zero-ish. */
const asNumber = (value, axis) => {
	value = Number(value) || 0
	if (value === 0)
		throw new TypeError(`The source ${axis} is zero or not a number.`)
	return value
}

class CanvasRenderingContext2D {
	get canvas() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'canvas').canvas
	}
	get direction() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'direction').direction
	}
	get fillStyle() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'fillStyle').fillStyle
	}
	get filter() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'filter').filter
	}
	get globalAlpha() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'globalAlpha')
			.globalAlpha
	}
	get globalCompositeOperation() {
		return internalsOf(
			this,
			'CanvasRenderingContext2D',
			'globalCompositeOperation'
		).globalCompositeOperation
	}
	get font() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'font').font
	}
	get imageSmoothingEnabled() {
		return internalsOf(
			this,
			'CanvasRenderingContext2D',
			'imageSmoothingEnabled'
		).imageSmoothingEnabled
	}
	get imageSmoothingQuality() {
		return internalsOf(
			this,
			'CanvasRenderingContext2D',
			'imageSmoothingQuality'
		).imageSmoothingQuality
	}
	get lineCap() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'lineCap').lineCap
	}
	get lineDashOffset() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'lineDashOffset')
			.lineDashOffset
	}
	get lineJoin() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'lineJoin').lineJoin
	}
	get lineWidth() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'lineWidth').lineWidth
	}
	get miterLimit() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'miterLimit')
			.miterLimit
	}
	get strokeStyle() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'strokeStyle')
			.strokeStyle
	}
	get shadowOffsetX() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'shadowOffsetX')
			.shadowOffsetX
	}
	get shadowOffsetY() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'shadowOffsetY')
			.shadowOffsetY
	}
	get shadowBlur() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'shadowBlur')
			.shadowBlur
	}
	get shadowColor() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'shadowColor')
			.shadowColor
	}
	get textAlign() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'textAlign').textAlign
	}
	get textBaseline() {
		return internalsOf(this, 'CanvasRenderingContext2D', 'textBaseline')
			.textBaseline
	}
	arc() {}
	arcTo() {}
	beginPath() {}
	bezierCurveTo() {}
	clearRect() {}
	clip() {}
	closePath() {}
	createImageData(arg0, arg1) {
		/** Whether ImageData is provided. */
		const hasData = __object_isPrototypeOf(ImageData.prototype, arg0)
		const w = hasData ? arg0.width : arg0
		const h = hasData ? arg0.height : arg1
		const d = hasData ? arg0.data : new Uint8ClampedArray(w * h * 4)
		return new ImageData(d, w, h)
	}
	createLinearGradient() {}
	createPattern() {}
	createRadialGradient() {}
	drawFocusIfNeeded() {}
	drawImage() {}
	ellipse() {}
	fill() {}
	fillRect() {}
	fillText() {}
	getContextAttributes() {}
	getImageData() {}
	getLineDash() {}
	getTransform() {}
	isPointInPath() {}
	isPointInStroke() {}
	lineTo() {}
	measureText() {}
	moveTo() {}
	putImageData() {}
	quadraticCurveTo() {}
	rect() {}
	resetTransform() {}
	restore() {}
	rotate() {}
	save() {}
	scale() {}
	setLineDash() {}
	setTransform() {}
	stroke() {}
	strokeRect() {}
	strokeText() {}
	transform() {}
	translate() {}
}
allowStringTag(CanvasRenderingContext2D)
const __createCanvasRenderingContext2D = (canvas) => {
	const renderingContext2D = Object.create(CanvasRenderingContext2D.prototype)
	INTERNALS$3.set(renderingContext2D, {
		canvas,
		direction: 'inherit',
		fillStyle: '#000',
		filter: 'none',
		font: '10px sans-serif',
		globalAlpha: 0,
		globalCompositeOperation: 'source-over',
		imageSmoothingEnabled: false,
		imageSmoothingQuality: 'high',
		lineCap: 'butt',
		lineDashOffset: 0.0,
		lineJoin: 'miter',
		lineWidth: 1.0,
		miterLimit: 10.0,
		shadowBlur: 0,
		shadowColor: '#000',
		shadowOffsetX: 0,
		shadowOffsetY: 0,
		strokeStyle: '#000',
		textAlign: 'start',
		textBaseline: 'alphabetic',
	})
	return renderingContext2D
}

class StyleSheet {}
class CSSStyleSheet extends StyleSheet {
	async replace(text) {
		return new CSSStyleSheet()
	}
	replaceSync(text) {
		return new CSSStyleSheet()
	}
	get cssRules() {
		return []
	}
}
allowStringTag(StyleSheet)
allowStringTag(CSSStyleSheet)

class CustomElementRegistry {
	/** Defines a new custom element using the given tag name and HTMLElement constructor. */
	define(name, constructor, options) {
		const internals = internalsOf(this, 'CustomElementRegistry', 'define')
		name = String(name)
		if (/[A-Z]/.test(name))
			throw new SyntaxError(
				'Custom element name cannot contain an uppercase ASCII letter'
			)
		if (!/^[a-z]/.test(name))
			throw new SyntaxError(
				'Custom element name must have a lowercase ASCII letter as its first character'
			)
		if (!/-/.test(name))
			throw new SyntaxError('Custom element name must contain a hyphen')
		internals.constructorByName.set(name, constructor)
		internals.nameByConstructor.set(constructor, name)
	}
	/** Returns the constructor associated with the given tag name. */
	get(name) {
		const internals = internalsOf(this, 'CustomElementRegistry', 'get')
		name = String(name).toLowerCase()
		return internals.constructorByName.get(name)
	}
	getName(constructor) {
		const internals = internalsOf(this, 'CustomElementRegistry', 'getName')
		return internals.nameByConstructor.get(constructor)
	}
}
allowStringTag(CustomElementRegistry)
const initCustomElementRegistry = (target, exclude) => {
	if (exclude.has('customElements')) return
	const CustomElementRegistry =
		target.CustomElementRegistry || globalThis.CustomElementRegistry
	const customElements = (target.customElements = Object.create(
		CustomElementRegistry.prototype
	))
	INTERNALS$3.set(customElements, {
		constructorByName: new Map(),
		nameByConstructor: new Map(),
	})
}

class Element extends Node {
	hasAttribute(name) {
		return false
	}
	getAttribute(name) {
		return null
	}
	setAttribute(name, value) {}
	removeAttribute(name) {}
	attachShadow(init) {
		if (arguments.length < 1)
			throw new TypeError(
				`Failed to execute 'attachShadow' on 'Element': 1 argument required, but only 0 present.`
			)
		if (init !== Object(init))
			throw new TypeError(
				`Failed to execute 'attachShadow' on 'Element': The provided value is not of type 'ShadowRootInit'.`
			)
		if (init.mode !== 'open' && init.mode !== 'closed')
			throw new TypeError(
				`Failed to execute 'attachShadow' on 'Element': Failed to read the 'mode' property from 'ShadowRootInit': The provided value '${init.mode}' is not a valid enum value of type ShadowRootMode.`
			)
		const internals = internalsOf(this, 'Element', 'attachShadow')
		if (internals.shadowRoot) throw new Error('The operation is not supported.')
		internals.shadowInit = internals.shadowInit || {
			mode: init.mode,
			delegatesFocus: Boolean(init.delegatesFocus),
		}
		internals.shadowRoot =
			internals.shadowRoot ||
			(/^open$/.test(internals.shadowInit.mode)
				? Object.setPrototypeOf(new EventTarget(), ShadowRoot.prototype)
				: null)
		return internals.shadowRoot
	}
	get assignedSlot() {
		return null
	}
	get innerHTML() {
		internalsOf(this, 'Element', 'innerHTML')
		return ''
	}
	set innerHTML(value) {
		internalsOf(this, 'Element', 'innerHTML')
	}
	get shadowRoot() {
		const internals = internalsOf(this, 'Element', 'shadowRoot')
		return Object(internals.shadowInit).mode === 'open'
			? internals.shadowRoot
			: null
	}
	get localName() {
		return internalsOf(this, 'Element', 'localName').localName
	}
	get nodeName() {
		return internalsOf(this, 'Element', 'nodeName').localName.toUpperCase()
	}
	get tagName() {
		return internalsOf(this, 'Element', 'tagName').localName.toUpperCase()
	}
}
class HTMLElement extends Element {}
class HTMLBodyElement extends HTMLElement {}
class HTMLDivElement extends HTMLElement {}
class HTMLHeadElement extends HTMLElement {}
class HTMLHtmlElement extends HTMLElement {}
class HTMLSpanElement extends HTMLElement {}
class HTMLStyleElement extends HTMLElement {}
class HTMLTemplateElement extends HTMLElement {}
class HTMLUnknownElement extends HTMLElement {}
allowStringTag(Element)
allowStringTag(HTMLElement)
allowStringTag(HTMLBodyElement)
allowStringTag(HTMLDivElement)
allowStringTag(HTMLHeadElement)
allowStringTag(HTMLHtmlElement)
allowStringTag(HTMLSpanElement)
allowStringTag(HTMLStyleElement)
allowStringTag(HTMLTemplateElement)
allowStringTag(HTMLUnknownElement)

class Document extends Node {
	createElement(name) {
		const internals = internalsOf(this, 'Document', 'createElement')
		const customElementInternals = INTERNALS$3.get(
			internals.target.customElements
		)
		name = String(name).toLowerCase()
		const TypeOfHTMLElement =
			internals.constructorByName.get(name) ||
			(customElementInternals &&
				customElementInternals.constructorByName.get(name)) ||
			HTMLUnknownElement
		const element = Object.setPrototypeOf(
			new EventTarget(),
			TypeOfHTMLElement.prototype
		)
		INTERNALS$3.set(element, {
			attributes: {},
			localName: name,
			ownerDocument: this,
			shadowInit: null,
			shadowRoot: null,
		})
		return element
	}
	createNodeIterator(root, whatToShow = NodeFilter.SHOW_ALL, filter) {
		const target = Object.create(NodeIterator.prototype)
		INTERNALS$3.set(target, {
			filter,
			pointerBeforeReferenceNode: false,
			referenceNode: root,
			root,
			whatToShow,
		})
		return target
	}
	createTextNode(data) {
		return new Text(data)
	}
	createTreeWalker(
		root,
		whatToShow = NodeFilter.SHOW_ALL,
		filter,
		expandEntityReferences
	) {
		const target = Object.create(TreeWalker.prototype)
		INTERNALS$3.set(target, { filter, currentNode: root, root, whatToShow })
		return target
	}
	get adoptedStyleSheets() {
		return []
	}
	get styleSheets() {
		return []
	}
}
class HTMLDocument extends Document {}
allowStringTag(Document)
allowStringTag(HTMLDocument)
const initDocument = (target, exclude) => {
	if (exclude.has('document')) return
	const EventTarget = target.EventTarget || globalThis.EventTarget
	const HTMLDocument = target.HTMLDocument || globalThis.HTMLDocument
	const document = (target.document = Object.setPrototypeOf(
		new EventTarget(),
		HTMLDocument.prototype
	))
	INTERNALS$3.set(document, {
		target,
		constructorByName: new Map([
			['body', target.HTMLBodyElement],
			['canvas', target.HTMLCanvasElement],
			['div', target.HTMLDivElement],
			['head', target.HTMLHeadElement],
			['html', target.HTMLHtmlElement],
			['img', target.HTMLImageElement],
			['span', target.HTMLSpanElement],
			['style', target.HTMLStyleElement],
		]),
		nameByConstructor: new Map(),
	})
	const initElement = (name, Class) => {
		const target = Object.setPrototypeOf(new EventTarget(), Class.prototype)
		INTERNALS$3.set(target, {
			attributes: {},
			localName: name,
			ownerDocument: document,
			shadowRoot: null,
			shadowInit: null,
		})
		return target
	}
	document.body = initElement('body', target.HTMLBodyElement)
	document.head = initElement('head', target.HTMLHeadElement)
	document.documentElement = initElement('html', target.HTMLHtmlElement)
}

class HTMLCanvasElement extends HTMLElement {
	get height() {
		return internalsOf(this, 'HTMLCanvasElement', 'height').height
	}
	set height(value) {
		internalsOf(this, 'HTMLCanvasElement', 'height').height = Number(value) || 0
	}
	get width() {
		return internalsOf(this, 'HTMLCanvasElement', 'width').width
	}
	set width(value) {
		internalsOf(this, 'HTMLCanvasElement', 'width').width = Number(value) || 0
	}
	captureStream() {
		return null
	}
	getContext(contextType) {
		const internals = internalsOf(this, 'HTMLCanvasElement', 'getContext')
		switch (contextType) {
			case '2d':
				if (internals.renderingContext2D) return internals.renderingContext2D
				internals.renderingContext2D = __createCanvasRenderingContext2D(this)
				return internals.renderingContext2D
			default:
				return null
		}
	}
	toBlob() {}
	toDataURL() {}
	transferControlToOffscreen() {}
}
allowStringTag(HTMLCanvasElement)

class HTMLImageElement extends HTMLElement {
	get src() {
		return internalsOf(this, 'HTMLImageElement', 'src').src
	}
	set src(value) {
		const internals = internalsOf(this, 'HTMLImageElement', 'src')
		internals.src = String(value)
	}
}
allowStringTag(HTMLImageElement)

function Image() {
	// @ts-ignore
	INTERNALS$3.set(this, {
		attributes: {},
		localName: 'img',
		innerHTML: '',
		shadowRoot: null,
		shadowInit: null,
	})
}
Image.prototype = HTMLImageElement.prototype

class IntersectionObserver {
	disconnect() {}
	observe() {}
	takeRecords() {
		return []
	}
	unobserve() {}
}
class MutationObserver {
	disconnect() {}
	observe() {}
	takeRecords() {
		return []
	}
	unobserve() {}
}
class ResizeObserver {
	disconnect() {}
	observe() {}
	takeRecords() {
		return []
	}
	unobserve() {}
}
allowStringTag(MutationObserver)
allowStringTag(IntersectionObserver)
allowStringTag(ResizeObserver)

class MediaQueryList extends EventTarget {
	get matches() {
		return internalsOf(this, 'MediaQueryList', 'matches').matches
	}
	get media() {
		return internalsOf(this, 'MediaQueryList', 'media').media
	}
}
allowStringTag(MediaQueryList)
const initMediaQueryList = (target, exclude) => {
	if (exclude.has('MediaQueryList') || exclude.has('matchMedia')) return
	const EventTarget = target.EventTarget || globalThis.EventTarget
	const MediaQueryList = target.MediaQueryList || globalThis.MediaQueryList
	target.matchMedia = function matchMedia(media) {
		const mql = Object.setPrototypeOf(
			new EventTarget(),
			MediaQueryList.prototype
		)
		INTERNALS$3.set(mql, {
			matches: false,
			media,
		})
		return mql
	}
}

class OffscreenCanvas extends EventTarget {
	constructor(width, height) {
		super()
		if (arguments.length < 2)
			throw new TypeError(
				`Failed to construct 'OffscreenCanvas': 2 arguments required.`
			)
		width = Number(width) || 0
		height = Number(height) || 0
		INTERNALS$3.set(this, { width, height })
	}
	get height() {
		return internalsOf(this, 'OffscreenCanvas', 'height').height
	}
	set height(value) {
		internalsOf(this, 'OffscreenCanvas', 'height').height = Number(value) || 0
	}
	get width() {
		return internalsOf(this, 'OffscreenCanvas', 'width').width
	}
	set width(value) {
		internalsOf(this, 'OffscreenCanvas', 'width').width = Number(value) || 0
	}
	getContext(contextType) {
		const internals = internalsOf(this, 'HTMLCanvasElement', 'getContext')
		switch (contextType) {
			case '2d':
				if (internals.renderingContext2D) return internals.renderingContext2D
				internals.renderingContext2D = __createCanvasRenderingContext2D(this)
				return internals.renderingContext2D
			default:
				return null
		}
	}
	convertToBlob(options) {
		options = Object(options)
		Number(options.quality) || 0
		const type = getImageType(String(options.type).trim().toLowerCase())
		return Promise.resolve(new Blob([], { type }))
	}
}
allowStringTag(OffscreenCanvas)
const getImageType = (type) =>
	type === 'image/avif' ||
	type === 'image/jpeg' ||
	type === 'image/png' ||
	type === 'image/webp'
		? type
		: 'image/png'

class Storage {
	clear() {
		internalsOf(this, 'Storage', 'clear').storage.clear()
	}
	getItem(key) {
		return getStringOrNull(
			internalsOf(this, 'Storage', 'getItem').storage.get(String(key))
		)
	}
	key(index) {
		return getStringOrNull(
			[...internalsOf(this, 'Storage', 'key').storage.keys()][
				Number(index) || 0
			]
		)
	}
	removeItem(key) {
		internalsOf(this, 'Storage', 'getItem').storage.delete(String(key))
	}
	setItem(key, value) {
		internalsOf(this, 'Storage', 'getItem').storage.set(
			String(key),
			String(value)
		)
	}
	get length() {
		return internalsOf(this, 'Storage', 'size').storage.size
	}
}
const getStringOrNull = (value) => (typeof value === 'string' ? value : null)
const initStorage = (target, exclude) => {
	if (exclude.has('Storage') || exclude.has('localStorage')) return
	target.localStorage = Object.create(Storage.prototype)
	const storageInternals = new Map()
	INTERNALS$3.set(target.localStorage, {
		storage: storageInternals,
	})
}

class Window extends EventTarget {
	get self() {
		return this
	}
	get top() {
		return this
	}
	get window() {
		return this
	}
	get innerHeight() {
		return 0
	}
	get innerWidth() {
		return 0
	}
	get scrollX() {
		return 0
	}
	get scrollY() {
		return 0
	}
}
allowStringTag(Window)
const initWindow = (target, exclude) => {
	if (exclude.has('Window') || exclude.has('window')) return
	target.window = target
}

function alert(...messages) {
	console.log(...messages)
}

const hasOwn = {
	hasOwn(instance, property) {
		return __object_hasOwnProperty(instance, property)
	},
}.hasOwn
const initObject = (target, exclude) => {
	if (exclude.has('Object') || exclude.has('object') || exclude.has('hasOwn'))
		return
	const Class = target.Object || globalThis.Object
	Object.defineProperty(Class, 'hasOwn', {
		value: hasOwn,
		writable: true,
		enumerable: false,
		configurable: true,
	})
}

const any = {
	async any(iterable) {
		return Promise.all(
			[...iterable].map((promise) => {
				return new Promise((resolve, reject) =>
					Promise.resolve(promise).then(reject, resolve)
				)
			})
		).then(
			(errors) => Promise.reject(errors),
			(value) => Promise.resolve(value)
		)
	},
}.any
const initPromise = (target, exclude) => {
	if (exclude.has('Promise') || exclude.has('any')) return
	const Class = target.Promise || globalThis.Promise
	if (!Class.any)
		Object.defineProperty(Class, 'any', {
			value: any,
			writable: true,
			enumerable: false,
			configurable: true,
		})
}

const at = {
	at(index) {
		index = Math.trunc(index) || 0
		if (index < 0) index += this.length
		if (index < 0 || index >= this.length) return undefined
		return this[index]
	},
}.at
const initRelativeIndexingMethod = (target, exclude) => {
	if (exclude.has('at')) return
	const Classes = []
	if (!exclude.has('TypedArray'))
		Classes.push(
			Object.getPrototypeOf(target.Int8Array || globalThis.Int8Array)
		)
	if (!exclude.has('Array')) Classes.push(target.Array || globalThis.Array)
	if (!exclude.has('String')) Classes.push(target.String || globalThis.String)
	for (const Class of Classes) {
		if (!Class.prototype.at)
			Object.defineProperty(Class.prototype, 'at', {
				value: at,
				writable: true,
				enumerable: false,
				configurable: true,
			})
	}
}

const replaceAll = {
	replaceAll(searchValue, replaceValue) {
		return __object_isPrototypeOf(RegExp.prototype, searchValue)
			? this.replace(searchValue, replaceValue)
			: this.replace(
					new RegExp(__string_escapeRegExp(searchValue), 'g'),
					replaceValue
			  )
	},
}.replaceAll
const initString = (target, exclude) => {
	if (exclude.has('String') || exclude.has('replaceAll')) return
	const Class = target.String || globalThis.String
	if (!Class.prototype.replaceAll)
		Object.defineProperty(Class.prototype, 'replaceAll', {
			value: replaceAll,
			writable: true,
			enumerable: false,
			configurable: true,
		})
}

const exclusionsForHTMLElement = [
	'CustomElementsRegistry',
	'HTMLElement',
	'HTMLBodyElement',
	'HTMLCanvasElement',
	'HTMLDivElement',
	'HTMLHeadElement',
	'HTMLHtmlElement',
	'HTMLImageElement',
	'HTMLStyleElement',
	'HTMLTemplateElement',
	'HTMLUnknownElement',
	'Image',
]
const exclusionsForElement = ['Element', ...exclusionsForHTMLElement]
const exclusionsForDocument = [
	'CustomElementsRegistry',
	'Document',
	'HTMLDocument',
	'document',
	'customElements',
]
const exclusionsForNode = [
	'Node',
	'DocumentFragment',
	'ShadowRoot',
	...exclusionsForDocument,
	...exclusionsForElement,
]
const exclusionsForEventTarget = [
	'AbortSignal',
	'Event',
	'CustomEvent',
	'EventTarget',
	'OffscreenCanvas',
	'MediaQueryList',
	'Window',
	...exclusionsForNode,
]
const exclusionsForEvent = [
	'AbortSignal',
	'Event',
	'CustomEvent',
	'EventTarget',
	'MediaQueryList',
	'OffscreenCanvas',
	'Window',
	...exclusionsForNode,
]
const exclusions = {
	'Blob+': ['Blob', 'File'],
	'Document+': exclusionsForDocument,
	'Element+': exclusionsForElement,
	'Event+': exclusionsForEvent,
	'EventTarget+': exclusionsForEventTarget,
	'HTMLElement+': exclusionsForHTMLElement,
	'Node+': exclusionsForNode,
	'StyleSheet+': ['StyleSheet', 'CSSStyleSheet'],
}

const inheritence = {
	CSSStyleSheet: 'StyleSheet',
	CustomEvent: 'Event',
	DOMException: 'Error',
	Document: 'Node',
	DocumentFragment: 'Node',
	Element: 'Node',
	File: 'Blob',
	HTMLDocument: 'Document',
	HTMLElement: 'Element',
	HTMLBodyElement: 'HTMLElement',
	HTMLCanvasElement: 'HTMLElement',
	HTMLDivElement: 'HTMLElement',
	HTMLHeadElement: 'HTMLElement',
	HTMLHtmlElement: 'HTMLElement',
	HTMLImageElement: 'HTMLElement',
	HTMLSpanElement: 'HTMLElement',
	HTMLStyleElement: 'HTMLElement',
	HTMLTemplateElement: 'HTMLElement',
	HTMLUnknownElement: 'HTMLElement',
	Image: 'HTMLElement',
	MediaQueryList: 'EventTarget',
	Node: 'EventTarget',
	OffscreenCanvas: 'EventTarget',
	ShadowRoot: 'DocumentFragment',
	Window: 'EventTarget',
}

const polyfill = (target, options) => {
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
		NodeFilter: NodeFilter$1,
		NodeIterator: NodeIterator$1,
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
		URLPattern: U,
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
					(array, entry) =>
						array.splice(
							array.length,
							0,
							...(typeof entry === 'string' ? entry.trim().split(/\s+/) : [])
						) && array,
					[]
			  )
			: []
	)
	// expand exclude options using exclusion shorthands
	for (const excludeOption of excludeOptions) {
		if (excludeOption in exclusions) {
			for (const exclusion of exclusions[excludeOption]) {
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
		Object.defineProperty(target, name, {
			configurable: true,
			enumerable: true,
			writable: true,
			value: webAPIs[name],
		})
	}
	// ensure WebAPIs correctly inherit other WebAPIs
	for (const name of Object.keys(webAPIs)) {
		// skip WebAPIs that are excluded
		if (excludeOptions.has(name)) continue
		// skip WebAPIs that do not extend other WebAPIs
		if (!Object.hasOwnProperty.call(inheritence, name)) continue
		const Class = target[name]
		const Super = target[inheritence[name]]
		// skip WebAPIs that are not available
		if (!Class || !Super) continue
		// skip WebAPIs that are already inherited correctly
		if (Object.getPrototypeOf(Class.prototype) === Super.prototype) continue
		// define WebAPIs inheritence
		Object.setPrototypeOf(Class.prototype, Super.prototype)
	}
	if (
		!excludeOptions.has('HTMLDocument') &&
		!excludeOptions.has('HTMLElement')
	) {
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
polyfill.internals = (target, name) => {
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
	init[name](target, new Set())
	return target
}

let s = 0
const S = {
	START_BOUNDARY: s++,
	HEADER_FIELD_START: s++,
	HEADER_FIELD: s++,
	HEADER_VALUE_START: s++,
	HEADER_VALUE: s++,
	HEADER_VALUE_ALMOST_DONE: s++,
	HEADERS_ALMOST_DONE: s++,
	PART_DATA_START: s++,
	PART_DATA: s++,
	END: s++,
}

let f = 1
const F = {
	PART_BOUNDARY: f,
	LAST_BOUNDARY: (f *= 2),
}

const LF = 10
const CR = 13
const SPACE = 32
const HYPHEN = 45
const COLON = 58
const A = 97
const Z = 122

const lower = (c) => c | 0x20

const noop = () => {}

class MultipartParser {
	/**
	 * @param {string} boundary
	 */
	constructor(boundary) {
		this.index = 0
		this.flags = 0

		this.onHeaderEnd = noop
		this.onHeaderField = noop
		this.onHeadersEnd = noop
		this.onHeaderValue = noop
		this.onPartBegin = noop
		this.onPartData = noop
		this.onPartEnd = noop

		this.boundaryChars = {}

		boundary = '\r\n--' + boundary
		const ui8a = new Uint8Array(boundary.length)
		for (let i = 0; i < boundary.length; i++) {
			ui8a[i] = boundary.charCodeAt(i)
			this.boundaryChars[ui8a[i]] = true
		}

		this.boundary = ui8a
		this.lookbehind = new Uint8Array(this.boundary.length + 8)
		this.state = S.START_BOUNDARY
	}

	/**
	 * @param {Uint8Array} data
	 */
	write(data) {
		let i = 0
		const length_ = data.length
		let previousIndex = this.index
		let { lookbehind, boundary, boundaryChars, index, state, flags } = this
		const boundaryLength = this.boundary.length
		const boundaryEnd = boundaryLength - 1
		const bufferLength = data.length
		let c
		let cl

		const mark = (name) => {
			this[name + 'Mark'] = i
		}

		const clear = (name) => {
			delete this[name + 'Mark']
		}

		const callback = (callbackSymbol, start, end, ui8a) => {
			if (start === undefined || start !== end) {
				this[callbackSymbol](ui8a && ui8a.subarray(start, end))
			}
		}

		const dataCallback = (name, clear) => {
			const markSymbol = name + 'Mark'
			if (!(markSymbol in this)) {
				return
			}

			if (clear) {
				callback(name, this[markSymbol], i, data)
				delete this[markSymbol]
			} else {
				callback(name, this[markSymbol], data.length, data)
				this[markSymbol] = 0
			}
		}

		for (i = 0; i < length_; i++) {
			c = data[i]

			switch (state) {
				case S.START_BOUNDARY:
					if (index === boundary.length - 2) {
						if (c === HYPHEN) {
							flags |= F.LAST_BOUNDARY
						} else if (c !== CR) {
							return
						}

						index++
						break
					} else if (index - 1 === boundary.length - 2) {
						if (flags & F.LAST_BOUNDARY && c === HYPHEN) {
							state = S.END
							flags = 0
						} else if (!(flags & F.LAST_BOUNDARY) && c === LF) {
							index = 0
							callback('onPartBegin')
							state = S.HEADER_FIELD_START
						} else {
							return
						}

						break
					}

					if (c !== boundary[index + 2]) {
						index = -2
					}

					if (c === boundary[index + 2]) {
						index++
					}

					break
				case S.HEADER_FIELD_START:
					state = S.HEADER_FIELD
					mark('onHeaderField')
					index = 0
				// falls through
				case S.HEADER_FIELD:
					if (c === CR) {
						clear('onHeaderField')
						state = S.HEADERS_ALMOST_DONE
						break
					}

					index++
					if (c === HYPHEN) {
						break
					}

					if (c === COLON) {
						if (index === 1) {
							// empty header field
							return
						}

						dataCallback('onHeaderField', true)
						state = S.HEADER_VALUE_START
						break
					}

					cl = lower(c)
					if (cl < A || cl > Z) {
						return
					}

					break
				case S.HEADER_VALUE_START:
					if (c === SPACE) {
						break
					}

					mark('onHeaderValue')
					state = S.HEADER_VALUE
				// falls through
				case S.HEADER_VALUE:
					if (c === CR) {
						dataCallback('onHeaderValue', true)
						callback('onHeaderEnd')
						state = S.HEADER_VALUE_ALMOST_DONE
					}

					break
				case S.HEADER_VALUE_ALMOST_DONE:
					if (c !== LF) {
						return
					}

					state = S.HEADER_FIELD_START
					break
				case S.HEADERS_ALMOST_DONE:
					if (c !== LF) {
						return
					}

					callback('onHeadersEnd')
					state = S.PART_DATA_START
					break
				case S.PART_DATA_START:
					state = S.PART_DATA
					mark('onPartData')
				// falls through
				case S.PART_DATA:
					previousIndex = index

					if (index === 0) {
						// boyer-moore derrived algorithm to safely skip non-boundary data
						i += boundaryEnd
						while (i < bufferLength && !(data[i] in boundaryChars)) {
							i += boundaryLength
						}

						i -= boundaryEnd
						c = data[i]
					}

					if (index < boundary.length) {
						if (boundary[index] === c) {
							if (index === 0) {
								dataCallback('onPartData', true)
							}

							index++
						} else {
							index = 0
						}
					} else if (index === boundary.length) {
						index++
						if (c === CR) {
							// CR = part boundary
							flags |= F.PART_BOUNDARY
						} else if (c === HYPHEN) {
							// HYPHEN = end boundary
							flags |= F.LAST_BOUNDARY
						} else {
							index = 0
						}
					} else if (index - 1 === boundary.length) {
						if (flags & F.PART_BOUNDARY) {
							index = 0
							if (c === LF) {
								// unset the PART_BOUNDARY flag
								flags &= ~F.PART_BOUNDARY
								callback('onPartEnd')
								callback('onPartBegin')
								state = S.HEADER_FIELD_START
								break
							}
						} else if (flags & F.LAST_BOUNDARY) {
							if (c === HYPHEN) {
								callback('onPartEnd')
								state = S.END
								flags = 0
							} else {
								index = 0
							}
						} else {
							index = 0
						}
					}

					if (index > 0) {
						// when matching a possible boundary, keep a lookbehind reference
						// in case it turns out to be a false lead
						lookbehind[index - 1] = c
					} else if (previousIndex > 0) {
						// if our boundary turned out to be rubbish, the captured lookbehind
						// belongs to partData
						const _lookbehind = new Uint8Array(
							lookbehind.buffer,
							lookbehind.byteOffset,
							lookbehind.byteLength
						)
						callback('onPartData', 0, previousIndex, _lookbehind)
						previousIndex = 0
						mark('onPartData')

						// reconsider the current character even so it interrupted the sequence
						// it could be the beginning of a new sequence
						i--
					}

					break
				case S.END:
					break
				default:
					throw new Error(`Unexpected state entered: ${state}`)
			}
		}

		dataCallback('onHeaderField')
		dataCallback('onHeaderValue')
		dataCallback('onPartData')

		// Update properties for the next call
		this.index = index
		this.state = state
		this.flags = flags
	}

	end() {
		if (
			(this.state === S.HEADER_FIELD_START && this.index === 0) ||
			(this.state === S.PART_DATA && this.index === this.boundary.length)
		) {
			this.onPartEnd()
		} else if (this.state !== S.END) {
			throw new Error('MultipartParser.end(): stream ended unexpectedly')
		}
	}
}

function _fileName(headerValue) {
	// matches either a quoted-string or a token (RFC 2616 section 19.5.1)
	const m = headerValue.match(
		/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i
	)
	if (!m) {
		return
	}

	const match = m[2] || m[3] || ''
	let filename = match.slice(match.lastIndexOf('\\') + 1)
	filename = filename.replace(/%22/g, '"')
	filename = filename.replace(/&#(\d{4});/g, (m, code) => {
		return String.fromCharCode(code)
	})
	return filename
}

async function toFormData(Body, ct) {
	if (!/multipart/i.test(ct)) {
		throw new TypeError('Failed to fetch')
	}

	const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i)

	if (!m) {
		throw new TypeError('no or bad content-type header, no multipart boundary')
	}

	const parser = new MultipartParser(m[1] || m[2])

	let headerField
	let headerValue
	let entryValue
	let entryName
	let contentType
	let filename
	const entryChunks = []
	const formData = new FormData()

	const onPartData = (ui8a) => {
		entryValue += decoder.decode(ui8a, { stream: true })
	}

	const appendToFile = (ui8a) => {
		entryChunks.push(ui8a)
	}

	const appendFileToFormData = () => {
		const file = new File(entryChunks, filename, { type: contentType })
		formData.append(entryName, file)
	}

	const appendEntryToFormData = () => {
		formData.append(entryName, entryValue)
	}

	const decoder = new TextDecoder('utf-8')
	decoder.decode()

	parser.onPartBegin = function () {
		parser.onPartData = onPartData
		parser.onPartEnd = appendEntryToFormData

		headerField = ''
		headerValue = ''
		entryValue = ''
		entryName = ''
		contentType = ''
		filename = null
		entryChunks.length = 0
	}

	parser.onHeaderField = function (ui8a) {
		headerField += decoder.decode(ui8a, { stream: true })
	}

	parser.onHeaderValue = function (ui8a) {
		headerValue += decoder.decode(ui8a, { stream: true })
	}

	parser.onHeaderEnd = function () {
		headerValue += decoder.decode()
		headerField = headerField.toLowerCase()

		if (headerField === 'content-disposition') {
			// matches either a quoted-string or a token (RFC 2616 section 19.5.1)
			const m = headerValue.match(
				/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i
			)

			if (m) {
				entryName = m[2] || m[3] || ''
			}

			filename = _fileName(headerValue)

			if (filename) {
				parser.onPartData = appendToFile
				parser.onPartEnd = appendFileToFormData
			}
		} else if (headerField === 'content-type') {
			contentType = headerValue
		}

		headerValue = ''
		headerField = ''
	}

	for await (const chunk of Body) {
		parser.write(chunk)
	}

	parser.end()

	return formData
}

var multipartParser = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	toFormData: toFormData,
})

export {
	AbortController,
	AbortSignal,
	Blob,
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
	NodeFilter$1 as NodeFilter,
	NodeIterator$1 as NodeIterator,
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
	U as URLPattern,
	Window,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
	alert,
	atob,
	btoa,
	cancelAnimationFrame,
	cancelIdleCallback,
	clearTimeout,
	fetch,
	pathToPosix,
	polyfill,
	requestAnimationFrame,
	requestIdleCallback,
	setTimeout,
	structuredClone,
}
//# sourceMappingURL=mod.js.map
