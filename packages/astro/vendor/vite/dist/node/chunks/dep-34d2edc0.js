'use strict';

var build = require('./dep-35df7f96.js');
var require$$1 = require('crypto');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    var e = m[i];
    for (var k in e) {
      if (k !== 'default' && !(k in n)) {
        n[k] = e[k];
      }
    }
  }
  return n;
}

var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);

var selfsigned = {};

/**
 * Node.js module for Forge.
 *
 * @author Dave Longley
 *
 * Copyright 2011-2016 Digital Bazaar, Inc.
 */

var forge$F = {
  // default options
  options: {
    usePureJavaScript: false
  }
};

/**
 * Base-N/Base-X encoding/decoding functions.
 *
 * Original implementation from base-x:
 * https://github.com/cryptocoinjs/base-x
 *
 * Which is MIT licensed:
 *
 * The MIT License (MIT)
 *
 * Copyright base-x contributors (c) 2016
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var api = {};
var baseN$1 = api;

// baseN alphabet indexes
var _reverseAlphabets = {};

/**
 * BaseN-encodes a Uint8Array using the given alphabet.
 *
 * @param input the Uint8Array to encode.
 * @param maxline the maximum number of encoded characters per line to use,
 *          defaults to none.
 *
 * @return the baseN-encoded output string.
 */
api.encode = function(input, alphabet, maxline) {
  if(typeof alphabet !== 'string') {
    throw new TypeError('"alphabet" must be a string.');
  }
  if(maxline !== undefined && typeof maxline !== 'number') {
    throw new TypeError('"maxline" must be a number.');
  }

  var output = '';

  if(!(input instanceof Uint8Array)) {
    // assume forge byte buffer
    output = _encodeWithByteBuffer(input, alphabet);
  } else {
    var i = 0;
    var base = alphabet.length;
    var first = alphabet.charAt(0);
    var digits = [0];
    for(i = 0; i < input.length; ++i) {
      for(var j = 0, carry = input[i]; j < digits.length; ++j) {
        carry += digits[j] << 8;
        digits[j] = carry % base;
        carry = (carry / base) | 0;
      }

      while(carry > 0) {
        digits.push(carry % base);
        carry = (carry / base) | 0;
      }
    }

    // deal with leading zeros
    for(i = 0; input[i] === 0 && i < input.length - 1; ++i) {
      output += first;
    }
    // convert digits to a string
    for(i = digits.length - 1; i >= 0; --i) {
      output += alphabet[digits[i]];
    }
  }

  if(maxline) {
    var regex = new RegExp('.{1,' + maxline + '}', 'g');
    output = output.match(regex).join('\r\n');
  }

  return output;
};

/**
 * Decodes a baseN-encoded (using the given alphabet) string to a
 * Uint8Array.
 *
 * @param input the baseN-encoded input string.
 *
 * @return the Uint8Array.
 */
api.decode = function(input, alphabet) {
  if(typeof input !== 'string') {
    throw new TypeError('"input" must be a string.');
  }
  if(typeof alphabet !== 'string') {
    throw new TypeError('"alphabet" must be a string.');
  }

  var table = _reverseAlphabets[alphabet];
  if(!table) {
    // compute reverse alphabet
    table = _reverseAlphabets[alphabet] = [];
    for(var i = 0; i < alphabet.length; ++i) {
      table[alphabet.charCodeAt(i)] = i;
    }
  }

  // remove whitespace characters
  input = input.replace(/\s/g, '');

  var base = alphabet.length;
  var first = alphabet.charAt(0);
  var bytes = [0];
  for(var i = 0; i < input.length; i++) {
    var value = table[input.charCodeAt(i)];
    if(value === undefined) {
      return;
    }

    for(var j = 0, carry = value; j < bytes.length; ++j) {
      carry += bytes[j] * base;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }

    while(carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // deal with leading zeros
  for(var k = 0; input[k] === first && k < input.length - 1; ++k) {
    bytes.push(0);
  }

  if(typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.reverse());
  }

  return new Uint8Array(bytes.reverse());
};

function _encodeWithByteBuffer(input, alphabet) {
  var i = 0;
  var base = alphabet.length;
  var first = alphabet.charAt(0);
  var digits = [0];
  for(i = 0; i < input.length(); ++i) {
    for(var j = 0, carry = input.at(i); j < digits.length; ++j) {
      carry += digits[j] << 8;
      digits[j] = carry % base;
      carry = (carry / base) | 0;
    }

    while(carry > 0) {
      digits.push(carry % base);
      carry = (carry / base) | 0;
    }
  }

  var output = '';

  // deal with leading zeros
  for(i = 0; input.at(i) === 0 && i < input.length() - 1; ++i) {
    output += first;
  }
  // convert digits to a string
  for(i = digits.length - 1; i >= 0; --i) {
    output += alphabet[digits[i]];
  }

  return output;
}

/**
 * Utility functions for web applications.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2018 Digital Bazaar, Inc.
 */

var forge$E = forge$F;
var baseN = baseN$1;

/* Utilities API */
var util$1 = forge$E.util = forge$E.util || {};

// define setImmediate and nextTick
(function() {
  // use native nextTick (unless we're in webpack)
  // webpack (or better node-libs-browser polyfill) sets process.browser.
  // this way we can detect webpack properly
  if(typeof process !== 'undefined' && process.nextTick && !process.browser) {
    util$1.nextTick = process.nextTick;
    if(typeof setImmediate === 'function') {
      util$1.setImmediate = setImmediate;
    } else {
      // polyfill setImmediate with nextTick, older versions of node
      // (those w/o setImmediate) won't totally starve IO
      util$1.setImmediate = util$1.nextTick;
    }
    return;
  }

  // polyfill nextTick with native setImmediate
  if(typeof setImmediate === 'function') {
    util$1.setImmediate = function() { return setImmediate.apply(undefined, arguments); };
    util$1.nextTick = function(callback) {
      return setImmediate(callback);
    };
    return;
  }

  /* Note: A polyfill upgrade pattern is used here to allow combining
  polyfills. For example, MutationObserver is fast, but blocks UI updates,
  so it needs to allow UI updates periodically, so it falls back on
  postMessage or setTimeout. */

  // polyfill with setTimeout
  util$1.setImmediate = function(callback) {
    setTimeout(callback, 0);
  };

  // upgrade polyfill to use postMessage
  if(typeof window !== 'undefined' &&
    typeof window.postMessage === 'function') {
    var msg = 'forge.setImmediate';
    var callbacks = [];
    util$1.setImmediate = function(callback) {
      callbacks.push(callback);
      // only send message when one hasn't been sent in
      // the current turn of the event loop
      if(callbacks.length === 1) {
        window.postMessage(msg, '*');
      }
    };
    function handler(event) {
      if(event.source === window && event.data === msg) {
        event.stopPropagation();
        var copy = callbacks.slice();
        callbacks.length = 0;
        copy.forEach(function(callback) {
          callback();
        });
      }
    }
    window.addEventListener('message', handler, true);
  }

  // upgrade polyfill to use MutationObserver
  if(typeof MutationObserver !== 'undefined') {
    // polyfill with MutationObserver
    var now = Date.now();
    var attr = true;
    var div = document.createElement('div');
    var callbacks = [];
    new MutationObserver(function() {
      var copy = callbacks.slice();
      callbacks.length = 0;
      copy.forEach(function(callback) {
        callback();
      });
    }).observe(div, {attributes: true});
    var oldSetImmediate = util$1.setImmediate;
    util$1.setImmediate = function(callback) {
      if(Date.now() - now > 15) {
        now = Date.now();
        oldSetImmediate(callback);
      } else {
        callbacks.push(callback);
        // only trigger observer when it hasn't been triggered in
        // the current turn of the event loop
        if(callbacks.length === 1) {
          div.setAttribute('a', attr = !attr);
        }
      }
    };
  }

  util$1.nextTick = util$1.setImmediate;
})();

// check if running under Node.js
util$1.isNodejs =
  typeof process !== 'undefined' && process.versions && process.versions.node;


// 'self' will also work in Web Workers (instance of WorkerGlobalScope) while
// it will point to `window` in the main thread.
// To remain compatible with older browsers, we fall back to 'window' if 'self'
// is not available.
util$1.globalScope = (function() {
  if(util$1.isNodejs) {
    return build.commonjsGlobal;
  }

  return typeof self === 'undefined' ? window : self;
})();

// define isArray
util$1.isArray = Array.isArray || function(x) {
  return Object.prototype.toString.call(x) === '[object Array]';
};

// define isArrayBuffer
util$1.isArrayBuffer = function(x) {
  return typeof ArrayBuffer !== 'undefined' && x instanceof ArrayBuffer;
};

// define isArrayBufferView
util$1.isArrayBufferView = function(x) {
  return x && util$1.isArrayBuffer(x.buffer) && x.byteLength !== undefined;
};

/**
 * Ensure a bits param is 8, 16, 24, or 32. Used to validate input for
 * algorithms where bit manipulation, JavaScript limitations, and/or algorithm
 * design only allow for byte operations of a limited size.
 *
 * @param n number of bits.
 *
 * Throw Error if n invalid.
 */
function _checkBitsParam(n) {
  if(!(n === 8 || n === 16 || n === 24 || n === 32)) {
    throw new Error('Only 8, 16, 24, or 32 bits supported: ' + n);
  }
}

// TODO: set ByteBuffer to best available backing
util$1.ByteBuffer = ByteStringBuffer;

/** Buffer w/BinaryString backing */

/**
 * Constructor for a binary string backed byte buffer.
 *
 * @param [b] the bytes to wrap (either encoded as string, one byte per
 *          character, or as an ArrayBuffer or Typed Array).
 */
function ByteStringBuffer(b) {
  // TODO: update to match DataBuffer API

  // the data in this buffer
  this.data = '';
  // the pointer for reading from this buffer
  this.read = 0;

  if(typeof b === 'string') {
    this.data = b;
  } else if(util$1.isArrayBuffer(b) || util$1.isArrayBufferView(b)) {
    if(typeof Buffer !== 'undefined' && b instanceof Buffer) {
      this.data = b.toString('binary');
    } else {
      // convert native buffer to forge buffer
      // FIXME: support native buffers internally instead
      var arr = new Uint8Array(b);
      try {
        this.data = String.fromCharCode.apply(null, arr);
      } catch(e) {
        for(var i = 0; i < arr.length; ++i) {
          this.putByte(arr[i]);
        }
      }
    }
  } else if(b instanceof ByteStringBuffer ||
    (typeof b === 'object' && typeof b.data === 'string' &&
    typeof b.read === 'number')) {
    // copy existing buffer
    this.data = b.data;
    this.read = b.read;
  }

  // used for v8 optimization
  this._constructedStringLength = 0;
}
util$1.ByteStringBuffer = ByteStringBuffer;

/* Note: This is an optimization for V8-based browsers. When V8 concatenates
  a string, the strings are only joined logically using a "cons string" or
  "constructed/concatenated string". These containers keep references to one
  another and can result in very large memory usage. For example, if a 2MB
  string is constructed by concatenating 4 bytes together at a time, the
  memory usage will be ~44MB; so ~22x increase. The strings are only joined
  together when an operation requiring their joining takes place, such as
  substr(). This function is called when adding data to this buffer to ensure
  these types of strings are periodically joined to reduce the memory
  footprint. */
var _MAX_CONSTRUCTED_STRING_LENGTH = 4096;
util$1.ByteStringBuffer.prototype._optimizeConstructedString = function(x) {
  this._constructedStringLength += x;
  if(this._constructedStringLength > _MAX_CONSTRUCTED_STRING_LENGTH) {
    // this substr() should cause the constructed string to join
    this.data.substr(0, 1);
    this._constructedStringLength = 0;
  }
};

/**
 * Gets the number of bytes in this buffer.
 *
 * @return the number of bytes in this buffer.
 */
util$1.ByteStringBuffer.prototype.length = function() {
  return this.data.length - this.read;
};

/**
 * Gets whether or not this buffer is empty.
 *
 * @return true if this buffer is empty, false if not.
 */
util$1.ByteStringBuffer.prototype.isEmpty = function() {
  return this.length() <= 0;
};

/**
 * Puts a byte in this buffer.
 *
 * @param b the byte to put.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putByte = function(b) {
  return this.putBytes(String.fromCharCode(b));
};

/**
 * Puts a byte in this buffer N times.
 *
 * @param b the byte to put.
 * @param n the number of bytes of value b to put.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.fillWithByte = function(b, n) {
  b = String.fromCharCode(b);
  var d = this.data;
  while(n > 0) {
    if(n & 1) {
      d += b;
    }
    n >>>= 1;
    if(n > 0) {
      b += b;
    }
  }
  this.data = d;
  this._optimizeConstructedString(n);
  return this;
};

/**
 * Puts bytes in this buffer.
 *
 * @param bytes the bytes (as a binary encoded string) to put.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putBytes = function(bytes) {
  this.data += bytes;
  this._optimizeConstructedString(bytes.length);
  return this;
};

/**
 * Puts a UTF-16 encoded string into this buffer.
 *
 * @param str the string to put.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putString = function(str) {
  return this.putBytes(util$1.encodeUtf8(str));
};

/**
 * Puts a 16-bit integer in this buffer in big-endian order.
 *
 * @param i the 16-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt16 = function(i) {
  return this.putBytes(
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF));
};

/**
 * Puts a 24-bit integer in this buffer in big-endian order.
 *
 * @param i the 24-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt24 = function(i) {
  return this.putBytes(
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF));
};

/**
 * Puts a 32-bit integer in this buffer in big-endian order.
 *
 * @param i the 32-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt32 = function(i) {
  return this.putBytes(
    String.fromCharCode(i >> 24 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF));
};

/**
 * Puts a 16-bit integer in this buffer in little-endian order.
 *
 * @param i the 16-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt16Le = function(i) {
  return this.putBytes(
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF));
};

/**
 * Puts a 24-bit integer in this buffer in little-endian order.
 *
 * @param i the 24-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt24Le = function(i) {
  return this.putBytes(
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF));
};

/**
 * Puts a 32-bit integer in this buffer in little-endian order.
 *
 * @param i the 32-bit integer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt32Le = function(i) {
  return this.putBytes(
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 24 & 0xFF));
};

/**
 * Puts an n-bit integer in this buffer in big-endian order.
 *
 * @param i the n-bit integer.
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putInt = function(i, n) {
  _checkBitsParam(n);
  var bytes = '';
  do {
    n -= 8;
    bytes += String.fromCharCode((i >> n) & 0xFF);
  } while(n > 0);
  return this.putBytes(bytes);
};

/**
 * Puts a signed n-bit integer in this buffer in big-endian order. Two's
 * complement representation is used.
 *
 * @param i the n-bit integer.
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putSignedInt = function(i, n) {
  // putInt checks n
  if(i < 0) {
    i += 2 << (n - 1);
  }
  return this.putInt(i, n);
};

/**
 * Puts the given buffer into this buffer.
 *
 * @param buffer the buffer to put into this one.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.putBuffer = function(buffer) {
  return this.putBytes(buffer.getBytes());
};

/**
 * Gets a byte from this buffer and advances the read pointer by 1.
 *
 * @return the byte.
 */
util$1.ByteStringBuffer.prototype.getByte = function() {
  return this.data.charCodeAt(this.read++);
};

/**
 * Gets a uint16 from this buffer in big-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util$1.ByteStringBuffer.prototype.getInt16 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 8 ^
    this.data.charCodeAt(this.read + 1));
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in big-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util$1.ByteStringBuffer.prototype.getInt24 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 16 ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2));
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in big-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util$1.ByteStringBuffer.prototype.getInt32 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 24 ^
    this.data.charCodeAt(this.read + 1) << 16 ^
    this.data.charCodeAt(this.read + 2) << 8 ^
    this.data.charCodeAt(this.read + 3));
  this.read += 4;
  return rval;
};

/**
 * Gets a uint16 from this buffer in little-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util$1.ByteStringBuffer.prototype.getInt16Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8);
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in little-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util$1.ByteStringBuffer.prototype.getInt24Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2) << 16);
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in little-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util$1.ByteStringBuffer.prototype.getInt32Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2) << 16 ^
    this.data.charCodeAt(this.read + 3) << 24);
  this.read += 4;
  return rval;
};

/**
 * Gets an n-bit integer from this buffer in big-endian order and advances the
 * read pointer by ceil(n/8).
 *
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return the integer.
 */
util$1.ByteStringBuffer.prototype.getInt = function(n) {
  _checkBitsParam(n);
  var rval = 0;
  do {
    // TODO: Use (rval * 0x100) if adding support for 33 to 53 bits.
    rval = (rval << 8) + this.data.charCodeAt(this.read++);
    n -= 8;
  } while(n > 0);
  return rval;
};

/**
 * Gets a signed n-bit integer from this buffer in big-endian order, using
 * two's complement, and advances the read pointer by n/8.
 *
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return the integer.
 */
util$1.ByteStringBuffer.prototype.getSignedInt = function(n) {
  // getInt checks n
  var x = this.getInt(n);
  var max = 2 << (n - 2);
  if(x >= max) {
    x -= max << 1;
  }
  return x;
};

/**
 * Reads bytes out as a binary encoded string and clears them from the
 * buffer. Note that the resulting string is binary encoded (in node.js this
 * encoding is referred to as `binary`, it is *not* `utf8`).
 *
 * @param count the number of bytes to read, undefined or null for all.
 *
 * @return a binary encoded string of bytes.
 */
util$1.ByteStringBuffer.prototype.getBytes = function(count) {
  var rval;
  if(count) {
    // read count bytes
    count = Math.min(this.length(), count);
    rval = this.data.slice(this.read, this.read + count);
    this.read += count;
  } else if(count === 0) {
    rval = '';
  } else {
    // read all bytes, optimize to only copy when needed
    rval = (this.read === 0) ? this.data : this.data.slice(this.read);
    this.clear();
  }
  return rval;
};

/**
 * Gets a binary encoded string of the bytes from this buffer without
 * modifying the read pointer.
 *
 * @param count the number of bytes to get, omit to get all.
 *
 * @return a string full of binary encoded characters.
 */
util$1.ByteStringBuffer.prototype.bytes = function(count) {
  return (typeof(count) === 'undefined' ?
    this.data.slice(this.read) :
    this.data.slice(this.read, this.read + count));
};

/**
 * Gets a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 *
 * @return the byte.
 */
util$1.ByteStringBuffer.prototype.at = function(i) {
  return this.data.charCodeAt(this.read + i);
};

/**
 * Puts a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 * @param b the byte to put.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.setAt = function(i, b) {
  this.data = this.data.substr(0, this.read + i) +
    String.fromCharCode(b) +
    this.data.substr(this.read + i + 1);
  return this;
};

/**
 * Gets the last byte without modifying the read pointer.
 *
 * @return the last byte.
 */
util$1.ByteStringBuffer.prototype.last = function() {
  return this.data.charCodeAt(this.data.length - 1);
};

/**
 * Creates a copy of this buffer.
 *
 * @return the copy.
 */
util$1.ByteStringBuffer.prototype.copy = function() {
  var c = util$1.createBuffer(this.data);
  c.read = this.read;
  return c;
};

/**
 * Compacts this buffer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.compact = function() {
  if(this.read > 0) {
    this.data = this.data.slice(this.read);
    this.read = 0;
  }
  return this;
};

/**
 * Clears this buffer.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.clear = function() {
  this.data = '';
  this.read = 0;
  return this;
};

/**
 * Shortens this buffer by triming bytes off of the end of this buffer.
 *
 * @param count the number of bytes to trim off.
 *
 * @return this buffer.
 */
util$1.ByteStringBuffer.prototype.truncate = function(count) {
  var len = Math.max(0, this.length() - count);
  this.data = this.data.substr(this.read, len);
  this.read = 0;
  return this;
};

/**
 * Converts this buffer to a hexadecimal string.
 *
 * @return a hexadecimal string.
 */
util$1.ByteStringBuffer.prototype.toHex = function() {
  var rval = '';
  for(var i = this.read; i < this.data.length; ++i) {
    var b = this.data.charCodeAt(i);
    if(b < 16) {
      rval += '0';
    }
    rval += b.toString(16);
  }
  return rval;
};

/**
 * Converts this buffer to a UTF-16 string (standard JavaScript string).
 *
 * @return a UTF-16 string.
 */
util$1.ByteStringBuffer.prototype.toString = function() {
  return util$1.decodeUtf8(this.bytes());
};

/** End Buffer w/BinaryString backing */

/** Buffer w/UInt8Array backing */

/**
 * FIXME: Experimental. Do not use yet.
 *
 * Constructor for an ArrayBuffer-backed byte buffer.
 *
 * The buffer may be constructed from a string, an ArrayBuffer, DataView, or a
 * TypedArray.
 *
 * If a string is given, its encoding should be provided as an option,
 * otherwise it will default to 'binary'. A 'binary' string is encoded such
 * that each character is one byte in length and size.
 *
 * If an ArrayBuffer, DataView, or TypedArray is given, it will be used
 * *directly* without any copying. Note that, if a write to the buffer requires
 * more space, the buffer will allocate a new backing ArrayBuffer to
 * accommodate. The starting read and write offsets for the buffer may be
 * given as options.
 *
 * @param [b] the initial bytes for this buffer.
 * @param options the options to use:
 *          [readOffset] the starting read offset to use (default: 0).
 *          [writeOffset] the starting write offset to use (default: the
 *            length of the first parameter).
 *          [growSize] the minimum amount, in bytes, to grow the buffer by to
 *            accommodate writes (default: 1024).
 *          [encoding] the encoding ('binary', 'utf8', 'utf16', 'hex') for the
 *            first parameter, if it is a string (default: 'binary').
 */
function DataBuffer(b, options) {
  // default options
  options = options || {};

  // pointers for read from/write to buffer
  this.read = options.readOffset || 0;
  this.growSize = options.growSize || 1024;

  var isArrayBuffer = util$1.isArrayBuffer(b);
  var isArrayBufferView = util$1.isArrayBufferView(b);
  if(isArrayBuffer || isArrayBufferView) {
    // use ArrayBuffer directly
    if(isArrayBuffer) {
      this.data = new DataView(b);
    } else {
      // TODO: adjust read/write offset based on the type of view
      // or specify that this must be done in the options ... that the
      // offsets are byte-based
      this.data = new DataView(b.buffer, b.byteOffset, b.byteLength);
    }
    this.write = ('writeOffset' in options ?
      options.writeOffset : this.data.byteLength);
    return;
  }

  // initialize to empty array buffer and add any given bytes using putBytes
  this.data = new DataView(new ArrayBuffer(0));
  this.write = 0;

  if(b !== null && b !== undefined) {
    this.putBytes(b);
  }

  if('writeOffset' in options) {
    this.write = options.writeOffset;
  }
}
util$1.DataBuffer = DataBuffer;

/**
 * Gets the number of bytes in this buffer.
 *
 * @return the number of bytes in this buffer.
 */
util$1.DataBuffer.prototype.length = function() {
  return this.write - this.read;
};

/**
 * Gets whether or not this buffer is empty.
 *
 * @return true if this buffer is empty, false if not.
 */
util$1.DataBuffer.prototype.isEmpty = function() {
  return this.length() <= 0;
};

/**
 * Ensures this buffer has enough empty space to accommodate the given number
 * of bytes. An optional parameter may be given that indicates a minimum
 * amount to grow the buffer if necessary. If the parameter is not given,
 * the buffer will be grown by some previously-specified default amount
 * or heuristic.
 *
 * @param amount the number of bytes to accommodate.
 * @param [growSize] the minimum amount, in bytes, to grow the buffer by if
 *          necessary.
 */
util$1.DataBuffer.prototype.accommodate = function(amount, growSize) {
  if(this.length() >= amount) {
    return this;
  }
  growSize = Math.max(growSize || this.growSize, amount);

  // grow buffer
  var src = new Uint8Array(
    this.data.buffer, this.data.byteOffset, this.data.byteLength);
  var dst = new Uint8Array(this.length() + growSize);
  dst.set(src);
  this.data = new DataView(dst.buffer);

  return this;
};

/**
 * Puts a byte in this buffer.
 *
 * @param b the byte to put.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putByte = function(b) {
  this.accommodate(1);
  this.data.setUint8(this.write++, b);
  return this;
};

/**
 * Puts a byte in this buffer N times.
 *
 * @param b the byte to put.
 * @param n the number of bytes of value b to put.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.fillWithByte = function(b, n) {
  this.accommodate(n);
  for(var i = 0; i < n; ++i) {
    this.data.setUint8(b);
  }
  return this;
};

/**
 * Puts bytes in this buffer. The bytes may be given as a string, an
 * ArrayBuffer, a DataView, or a TypedArray.
 *
 * @param bytes the bytes to put.
 * @param [encoding] the encoding for the first parameter ('binary', 'utf8',
 *          'utf16', 'hex'), if it is a string (default: 'binary').
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putBytes = function(bytes, encoding) {
  if(util$1.isArrayBufferView(bytes)) {
    var src = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var len = src.byteLength - src.byteOffset;
    this.accommodate(len);
    var dst = new Uint8Array(this.data.buffer, this.write);
    dst.set(src);
    this.write += len;
    return this;
  }

  if(util$1.isArrayBuffer(bytes)) {
    var src = new Uint8Array(bytes);
    this.accommodate(src.byteLength);
    var dst = new Uint8Array(this.data.buffer);
    dst.set(src, this.write);
    this.write += src.byteLength;
    return this;
  }

  // bytes is a util.DataBuffer or equivalent
  if(bytes instanceof util$1.DataBuffer ||
    (typeof bytes === 'object' &&
    typeof bytes.read === 'number' && typeof bytes.write === 'number' &&
    util$1.isArrayBufferView(bytes.data))) {
    var src = new Uint8Array(bytes.data.byteLength, bytes.read, bytes.length());
    this.accommodate(src.byteLength);
    var dst = new Uint8Array(bytes.data.byteLength, this.write);
    dst.set(src);
    this.write += src.byteLength;
    return this;
  }

  if(bytes instanceof util$1.ByteStringBuffer) {
    // copy binary string and process as the same as a string parameter below
    bytes = bytes.data;
    encoding = 'binary';
  }

  // string conversion
  encoding = encoding || 'binary';
  if(typeof bytes === 'string') {
    var view;

    // decode from string
    if(encoding === 'hex') {
      this.accommodate(Math.ceil(bytes.length / 2));
      view = new Uint8Array(this.data.buffer, this.write);
      this.write += util$1.binary.hex.decode(bytes, view, this.write);
      return this;
    }
    if(encoding === 'base64') {
      this.accommodate(Math.ceil(bytes.length / 4) * 3);
      view = new Uint8Array(this.data.buffer, this.write);
      this.write += util$1.binary.base64.decode(bytes, view, this.write);
      return this;
    }

    // encode text as UTF-8 bytes
    if(encoding === 'utf8') {
      // encode as UTF-8 then decode string as raw binary
      bytes = util$1.encodeUtf8(bytes);
      encoding = 'binary';
    }

    // decode string as raw binary
    if(encoding === 'binary' || encoding === 'raw') {
      // one byte per character
      this.accommodate(bytes.length);
      view = new Uint8Array(this.data.buffer, this.write);
      this.write += util$1.binary.raw.decode(view);
      return this;
    }

    // encode text as UTF-16 bytes
    if(encoding === 'utf16') {
      // two bytes per character
      this.accommodate(bytes.length * 2);
      view = new Uint16Array(this.data.buffer, this.write);
      this.write += util$1.text.utf16.encode(view);
      return this;
    }

    throw new Error('Invalid encoding: ' + encoding);
  }

  throw Error('Invalid parameter: ' + bytes);
};

/**
 * Puts the given buffer into this buffer.
 *
 * @param buffer the buffer to put into this one.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putBuffer = function(buffer) {
  this.putBytes(buffer);
  buffer.clear();
  return this;
};

/**
 * Puts a string into this buffer.
 *
 * @param str the string to put.
 * @param [encoding] the encoding for the string (default: 'utf16').
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putString = function(str) {
  return this.putBytes(str, 'utf16');
};

/**
 * Puts a 16-bit integer in this buffer in big-endian order.
 *
 * @param i the 16-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt16 = function(i) {
  this.accommodate(2);
  this.data.setInt16(this.write, i);
  this.write += 2;
  return this;
};

/**
 * Puts a 24-bit integer in this buffer in big-endian order.
 *
 * @param i the 24-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt24 = function(i) {
  this.accommodate(3);
  this.data.setInt16(this.write, i >> 8 & 0xFFFF);
  this.data.setInt8(this.write, i >> 16 & 0xFF);
  this.write += 3;
  return this;
};

/**
 * Puts a 32-bit integer in this buffer in big-endian order.
 *
 * @param i the 32-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt32 = function(i) {
  this.accommodate(4);
  this.data.setInt32(this.write, i);
  this.write += 4;
  return this;
};

/**
 * Puts a 16-bit integer in this buffer in little-endian order.
 *
 * @param i the 16-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt16Le = function(i) {
  this.accommodate(2);
  this.data.setInt16(this.write, i, true);
  this.write += 2;
  return this;
};

/**
 * Puts a 24-bit integer in this buffer in little-endian order.
 *
 * @param i the 24-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt24Le = function(i) {
  this.accommodate(3);
  this.data.setInt8(this.write, i >> 16 & 0xFF);
  this.data.setInt16(this.write, i >> 8 & 0xFFFF, true);
  this.write += 3;
  return this;
};

/**
 * Puts a 32-bit integer in this buffer in little-endian order.
 *
 * @param i the 32-bit integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt32Le = function(i) {
  this.accommodate(4);
  this.data.setInt32(this.write, i, true);
  this.write += 4;
  return this;
};

/**
 * Puts an n-bit integer in this buffer in big-endian order.
 *
 * @param i the n-bit integer.
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putInt = function(i, n) {
  _checkBitsParam(n);
  this.accommodate(n / 8);
  do {
    n -= 8;
    this.data.setInt8(this.write++, (i >> n) & 0xFF);
  } while(n > 0);
  return this;
};

/**
 * Puts a signed n-bit integer in this buffer in big-endian order. Two's
 * complement representation is used.
 *
 * @param i the n-bit integer.
 * @param n the number of bits in the integer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.putSignedInt = function(i, n) {
  _checkBitsParam(n);
  this.accommodate(n / 8);
  if(i < 0) {
    i += 2 << (n - 1);
  }
  return this.putInt(i, n);
};

/**
 * Gets a byte from this buffer and advances the read pointer by 1.
 *
 * @return the byte.
 */
util$1.DataBuffer.prototype.getByte = function() {
  return this.data.getInt8(this.read++);
};

/**
 * Gets a uint16 from this buffer in big-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util$1.DataBuffer.prototype.getInt16 = function() {
  var rval = this.data.getInt16(this.read);
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in big-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util$1.DataBuffer.prototype.getInt24 = function() {
  var rval = (
    this.data.getInt16(this.read) << 8 ^
    this.data.getInt8(this.read + 2));
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in big-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util$1.DataBuffer.prototype.getInt32 = function() {
  var rval = this.data.getInt32(this.read);
  this.read += 4;
  return rval;
};

/**
 * Gets a uint16 from this buffer in little-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util$1.DataBuffer.prototype.getInt16Le = function() {
  var rval = this.data.getInt16(this.read, true);
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in little-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util$1.DataBuffer.prototype.getInt24Le = function() {
  var rval = (
    this.data.getInt8(this.read) ^
    this.data.getInt16(this.read + 1, true) << 8);
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in little-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util$1.DataBuffer.prototype.getInt32Le = function() {
  var rval = this.data.getInt32(this.read, true);
  this.read += 4;
  return rval;
};

/**
 * Gets an n-bit integer from this buffer in big-endian order and advances the
 * read pointer by n/8.
 *
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return the integer.
 */
util$1.DataBuffer.prototype.getInt = function(n) {
  _checkBitsParam(n);
  var rval = 0;
  do {
    // TODO: Use (rval * 0x100) if adding support for 33 to 53 bits.
    rval = (rval << 8) + this.data.getInt8(this.read++);
    n -= 8;
  } while(n > 0);
  return rval;
};

/**
 * Gets a signed n-bit integer from this buffer in big-endian order, using
 * two's complement, and advances the read pointer by n/8.
 *
 * @param n the number of bits in the integer (8, 16, 24, or 32).
 *
 * @return the integer.
 */
util$1.DataBuffer.prototype.getSignedInt = function(n) {
  // getInt checks n
  var x = this.getInt(n);
  var max = 2 << (n - 2);
  if(x >= max) {
    x -= max << 1;
  }
  return x;
};

/**
 * Reads bytes out as a binary encoded string and clears them from the
 * buffer.
 *
 * @param count the number of bytes to read, undefined or null for all.
 *
 * @return a binary encoded string of bytes.
 */
util$1.DataBuffer.prototype.getBytes = function(count) {
  // TODO: deprecate this method, it is poorly named and
  // this.toString('binary') replaces it
  // add a toTypedArray()/toArrayBuffer() function
  var rval;
  if(count) {
    // read count bytes
    count = Math.min(this.length(), count);
    rval = this.data.slice(this.read, this.read + count);
    this.read += count;
  } else if(count === 0) {
    rval = '';
  } else {
    // read all bytes, optimize to only copy when needed
    rval = (this.read === 0) ? this.data : this.data.slice(this.read);
    this.clear();
  }
  return rval;
};

/**
 * Gets a binary encoded string of the bytes from this buffer without
 * modifying the read pointer.
 *
 * @param count the number of bytes to get, omit to get all.
 *
 * @return a string full of binary encoded characters.
 */
util$1.DataBuffer.prototype.bytes = function(count) {
  // TODO: deprecate this method, it is poorly named, add "getString()"
  return (typeof(count) === 'undefined' ?
    this.data.slice(this.read) :
    this.data.slice(this.read, this.read + count));
};

/**
 * Gets a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 *
 * @return the byte.
 */
util$1.DataBuffer.prototype.at = function(i) {
  return this.data.getUint8(this.read + i);
};

/**
 * Puts a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 * @param b the byte to put.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.setAt = function(i, b) {
  this.data.setUint8(i, b);
  return this;
};

/**
 * Gets the last byte without modifying the read pointer.
 *
 * @return the last byte.
 */
util$1.DataBuffer.prototype.last = function() {
  return this.data.getUint8(this.write - 1);
};

/**
 * Creates a copy of this buffer.
 *
 * @return the copy.
 */
util$1.DataBuffer.prototype.copy = function() {
  return new util$1.DataBuffer(this);
};

/**
 * Compacts this buffer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.compact = function() {
  if(this.read > 0) {
    var src = new Uint8Array(this.data.buffer, this.read);
    var dst = new Uint8Array(src.byteLength);
    dst.set(src);
    this.data = new DataView(dst);
    this.write -= this.read;
    this.read = 0;
  }
  return this;
};

/**
 * Clears this buffer.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.clear = function() {
  this.data = new DataView(new ArrayBuffer(0));
  this.read = this.write = 0;
  return this;
};

/**
 * Shortens this buffer by triming bytes off of the end of this buffer.
 *
 * @param count the number of bytes to trim off.
 *
 * @return this buffer.
 */
util$1.DataBuffer.prototype.truncate = function(count) {
  this.write = Math.max(0, this.length() - count);
  this.read = Math.min(this.read, this.write);
  return this;
};

/**
 * Converts this buffer to a hexadecimal string.
 *
 * @return a hexadecimal string.
 */
util$1.DataBuffer.prototype.toHex = function() {
  var rval = '';
  for(var i = this.read; i < this.data.byteLength; ++i) {
    var b = this.data.getUint8(i);
    if(b < 16) {
      rval += '0';
    }
    rval += b.toString(16);
  }
  return rval;
};

/**
 * Converts this buffer to a string, using the given encoding. If no
 * encoding is given, 'utf8' (UTF-8) is used.
 *
 * @param [encoding] the encoding to use: 'binary', 'utf8', 'utf16', 'hex',
 *          'base64' (default: 'utf8').
 *
 * @return a string representation of the bytes in this buffer.
 */
util$1.DataBuffer.prototype.toString = function(encoding) {
  var view = new Uint8Array(this.data, this.read, this.length());
  encoding = encoding || 'utf8';

  // encode to string
  if(encoding === 'binary' || encoding === 'raw') {
    return util$1.binary.raw.encode(view);
  }
  if(encoding === 'hex') {
    return util$1.binary.hex.encode(view);
  }
  if(encoding === 'base64') {
    return util$1.binary.base64.encode(view);
  }

  // decode to text
  if(encoding === 'utf8') {
    return util$1.text.utf8.decode(view);
  }
  if(encoding === 'utf16') {
    return util$1.text.utf16.decode(view);
  }

  throw new Error('Invalid encoding: ' + encoding);
};

/** End Buffer w/UInt8Array backing */

/**
 * Creates a buffer that stores bytes. A value may be given to populate the
 * buffer with data. This value can either be string of encoded bytes or a
 * regular string of characters. When passing a string of binary encoded
 * bytes, the encoding `raw` should be given. This is also the default. When
 * passing a string of characters, the encoding `utf8` should be given.
 *
 * @param [input] a string with encoded bytes to store in the buffer.
 * @param [encoding] (default: 'raw', other: 'utf8').
 */
util$1.createBuffer = function(input, encoding) {
  // TODO: deprecate, use new ByteBuffer() instead
  encoding = encoding || 'raw';
  if(input !== undefined && encoding === 'utf8') {
    input = util$1.encodeUtf8(input);
  }
  return new util$1.ByteBuffer(input);
};

/**
 * Fills a string with a particular value. If you want the string to be a byte
 * string, pass in String.fromCharCode(theByte).
 *
 * @param c the character to fill the string with, use String.fromCharCode
 *          to fill the string with a byte value.
 * @param n the number of characters of value c to fill with.
 *
 * @return the filled string.
 */
util$1.fillString = function(c, n) {
  var s = '';
  while(n > 0) {
    if(n & 1) {
      s += c;
    }
    n >>>= 1;
    if(n > 0) {
      c += c;
    }
  }
  return s;
};

/**
 * Performs a per byte XOR between two byte strings and returns the result as a
 * string of bytes.
 *
 * @param s1 first string of bytes.
 * @param s2 second string of bytes.
 * @param n the number of bytes to XOR.
 *
 * @return the XOR'd result.
 */
util$1.xorBytes = function(s1, s2, n) {
  var s3 = '';
  var b = '';
  var t = '';
  var i = 0;
  var c = 0;
  for(; n > 0; --n, ++i) {
    b = s1.charCodeAt(i) ^ s2.charCodeAt(i);
    if(c >= 10) {
      s3 += t;
      t = '';
      c = 0;
    }
    t += String.fromCharCode(b);
    ++c;
  }
  s3 += t;
  return s3;
};

/**
 * Converts a hex string into a 'binary' encoded string of bytes.
 *
 * @param hex the hexadecimal string to convert.
 *
 * @return the binary-encoded string of bytes.
 */
util$1.hexToBytes = function(hex) {
  // TODO: deprecate: "Deprecated. Use util.binary.hex.decode instead."
  var rval = '';
  var i = 0;
  if(hex.length & 1 == 1) {
    // odd number of characters, convert first character alone
    i = 1;
    rval += String.fromCharCode(parseInt(hex[0], 16));
  }
  // convert 2 characters (1 byte) at a time
  for(; i < hex.length; i += 2) {
    rval += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return rval;
};

/**
 * Converts a 'binary' encoded string of bytes to hex.
 *
 * @param bytes the byte string to convert.
 *
 * @return the string of hexadecimal characters.
 */
util$1.bytesToHex = function(bytes) {
  // TODO: deprecate: "Deprecated. Use util.binary.hex.encode instead."
  return util$1.createBuffer(bytes).toHex();
};

/**
 * Converts an 32-bit integer to 4-big-endian byte string.
 *
 * @param i the integer.
 *
 * @return the byte string.
 */
util$1.int32ToBytes = function(i) {
  return (
    String.fromCharCode(i >> 24 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF));
};

// base64 characters, reverse mapping
var _base64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var _base64Idx = [
/*43 -43 = 0*/
/*'+',  1,  2,  3,'/' */
   62, -1, -1, -1, 63,

/*'0','1','2','3','4','5','6','7','8','9' */
   52, 53, 54, 55, 56, 57, 58, 59, 60, 61,

/*15, 16, 17,'=', 19, 20, 21 */
  -1, -1, -1, 64, -1, -1, -1,

/*65 - 43 = 22*/
/*'A','B','C','D','E','F','G','H','I','J','K','L','M', */
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12,

/*'N','O','P','Q','R','S','T','U','V','W','X','Y','Z' */
   13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,

/*91 - 43 = 48 */
/*48, 49, 50, 51, 52, 53 */
  -1, -1, -1, -1, -1, -1,

/*97 - 43 = 54*/
/*'a','b','c','d','e','f','g','h','i','j','k','l','m' */
   26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,

/*'n','o','p','q','r','s','t','u','v','w','x','y','z' */
   39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];

// base58 characters (Bitcoin alphabet)
var _base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Base64 encodes a 'binary' encoded string of bytes.
 *
 * @param input the binary encoded string of bytes to base64-encode.
 * @param maxline the maximum number of encoded characters per line to use,
 *          defaults to none.
 *
 * @return the base64-encoded output.
 */
util$1.encode64 = function(input, maxline) {
  // TODO: deprecate: "Deprecated. Use util.binary.base64.encode instead."
  var line = '';
  var output = '';
  var chr1, chr2, chr3;
  var i = 0;
  while(i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    // encode 4 character group
    line += _base64.charAt(chr1 >> 2);
    line += _base64.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
    if(isNaN(chr2)) {
      line += '==';
    } else {
      line += _base64.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
      line += isNaN(chr3) ? '=' : _base64.charAt(chr3 & 63);
    }

    if(maxline && line.length > maxline) {
      output += line.substr(0, maxline) + '\r\n';
      line = line.substr(maxline);
    }
  }
  output += line;
  return output;
};

/**
 * Base64 decodes a string into a 'binary' encoded string of bytes.
 *
 * @param input the base64-encoded input.
 *
 * @return the binary encoded string.
 */
util$1.decode64 = function(input) {
  // TODO: deprecate: "Deprecated. Use util.binary.base64.decode instead."

  // remove all non-base64 characters
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  var output = '';
  var enc1, enc2, enc3, enc4;
  var i = 0;

  while(i < input.length) {
    enc1 = _base64Idx[input.charCodeAt(i++) - 43];
    enc2 = _base64Idx[input.charCodeAt(i++) - 43];
    enc3 = _base64Idx[input.charCodeAt(i++) - 43];
    enc4 = _base64Idx[input.charCodeAt(i++) - 43];

    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if(enc3 !== 64) {
      // decoded at least 2 bytes
      output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if(enc4 !== 64) {
        // decoded 3 bytes
        output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
      }
    }
  }

  return output;
};

/**
 * Encodes the given string of characters (a standard JavaScript
 * string) as a binary encoded string where the bytes represent
 * a UTF-8 encoded string of characters. Non-ASCII characters will be
 * encoded as multiple bytes according to UTF-8.
 *
 * @param str a standard string of characters to encode.
 *
 * @return the binary encoded string.
 */
util$1.encodeUtf8 = function(str) {
  return unescape(encodeURIComponent(str));
};

/**
 * Decodes a binary encoded string that contains bytes that
 * represent a UTF-8 encoded string of characters -- into a
 * string of characters (a standard JavaScript string).
 *
 * @param str the binary encoded string to decode.
 *
 * @return the resulting standard string of characters.
 */
util$1.decodeUtf8 = function(str) {
  return decodeURIComponent(escape(str));
};

// binary encoding/decoding tools
// FIXME: Experimental. Do not use yet.
util$1.binary = {
  raw: {},
  hex: {},
  base64: {},
  base58: {},
  baseN : {
    encode: baseN.encode,
    decode: baseN.decode
  }
};

/**
 * Encodes a Uint8Array as a binary-encoded string. This encoding uses
 * a value between 0 and 255 for each character.
 *
 * @param bytes the Uint8Array to encode.
 *
 * @return the binary-encoded string.
 */
util$1.binary.raw.encode = function(bytes) {
  return String.fromCharCode.apply(null, bytes);
};

/**
 * Decodes a binary-encoded string to a Uint8Array. This encoding uses
 * a value between 0 and 255 for each character.
 *
 * @param str the binary-encoded string to decode.
 * @param [output] an optional Uint8Array to write the output to; if it
 *          is too small, an exception will be thrown.
 * @param [offset] the start offset for writing to the output (default: 0).
 *
 * @return the Uint8Array or the number of bytes written if output was given.
 */
util$1.binary.raw.decode = function(str, output, offset) {
  var out = output;
  if(!out) {
    out = new Uint8Array(str.length);
  }
  offset = offset || 0;
  var j = offset;
  for(var i = 0; i < str.length; ++i) {
    out[j++] = str.charCodeAt(i);
  }
  return output ? (j - offset) : out;
};

/**
 * Encodes a 'binary' string, ArrayBuffer, DataView, TypedArray, or
 * ByteBuffer as a string of hexadecimal characters.
 *
 * @param bytes the bytes to convert.
 *
 * @return the string of hexadecimal characters.
 */
util$1.binary.hex.encode = util$1.bytesToHex;

/**
 * Decodes a hex-encoded string to a Uint8Array.
 *
 * @param hex the hexadecimal string to convert.
 * @param [output] an optional Uint8Array to write the output to; if it
 *          is too small, an exception will be thrown.
 * @param [offset] the start offset for writing to the output (default: 0).
 *
 * @return the Uint8Array or the number of bytes written if output was given.
 */
util$1.binary.hex.decode = function(hex, output, offset) {
  var out = output;
  if(!out) {
    out = new Uint8Array(Math.ceil(hex.length / 2));
  }
  offset = offset || 0;
  var i = 0, j = offset;
  if(hex.length & 1) {
    // odd number of characters, convert first character alone
    i = 1;
    out[j++] = parseInt(hex[0], 16);
  }
  // convert 2 characters (1 byte) at a time
  for(; i < hex.length; i += 2) {
    out[j++] = parseInt(hex.substr(i, 2), 16);
  }
  return output ? (j - offset) : out;
};

/**
 * Base64-encodes a Uint8Array.
 *
 * @param input the Uint8Array to encode.
 * @param maxline the maximum number of encoded characters per line to use,
 *          defaults to none.
 *
 * @return the base64-encoded output string.
 */
util$1.binary.base64.encode = function(input, maxline) {
  var line = '';
  var output = '';
  var chr1, chr2, chr3;
  var i = 0;
  while(i < input.byteLength) {
    chr1 = input[i++];
    chr2 = input[i++];
    chr3 = input[i++];

    // encode 4 character group
    line += _base64.charAt(chr1 >> 2);
    line += _base64.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
    if(isNaN(chr2)) {
      line += '==';
    } else {
      line += _base64.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
      line += isNaN(chr3) ? '=' : _base64.charAt(chr3 & 63);
    }

    if(maxline && line.length > maxline) {
      output += line.substr(0, maxline) + '\r\n';
      line = line.substr(maxline);
    }
  }
  output += line;
  return output;
};

/**
 * Decodes a base64-encoded string to a Uint8Array.
 *
 * @param input the base64-encoded input string.
 * @param [output] an optional Uint8Array to write the output to; if it
 *          is too small, an exception will be thrown.
 * @param [offset] the start offset for writing to the output (default: 0).
 *
 * @return the Uint8Array or the number of bytes written if output was given.
 */
util$1.binary.base64.decode = function(input, output, offset) {
  var out = output;
  if(!out) {
    out = new Uint8Array(Math.ceil(input.length / 4) * 3);
  }

  // remove all non-base64 characters
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  offset = offset || 0;
  var enc1, enc2, enc3, enc4;
  var i = 0, j = offset;

  while(i < input.length) {
    enc1 = _base64Idx[input.charCodeAt(i++) - 43];
    enc2 = _base64Idx[input.charCodeAt(i++) - 43];
    enc3 = _base64Idx[input.charCodeAt(i++) - 43];
    enc4 = _base64Idx[input.charCodeAt(i++) - 43];

    out[j++] = (enc1 << 2) | (enc2 >> 4);
    if(enc3 !== 64) {
      // decoded at least 2 bytes
      out[j++] = ((enc2 & 15) << 4) | (enc3 >> 2);
      if(enc4 !== 64) {
        // decoded 3 bytes
        out[j++] = ((enc3 & 3) << 6) | enc4;
      }
    }
  }

  // make sure result is the exact decoded length
  return output ? (j - offset) : out.subarray(0, j);
};

// add support for base58 encoding/decoding with Bitcoin alphabet
util$1.binary.base58.encode = function(input, maxline) {
  return util$1.binary.baseN.encode(input, _base58, maxline);
};
util$1.binary.base58.decode = function(input, maxline) {
  return util$1.binary.baseN.decode(input, _base58, maxline);
};

// text encoding/decoding tools
// FIXME: Experimental. Do not use yet.
util$1.text = {
  utf8: {},
  utf16: {}
};

/**
 * Encodes the given string as UTF-8 in a Uint8Array.
 *
 * @param str the string to encode.
 * @param [output] an optional Uint8Array to write the output to; if it
 *          is too small, an exception will be thrown.
 * @param [offset] the start offset for writing to the output (default: 0).
 *
 * @return the Uint8Array or the number of bytes written if output was given.
 */
util$1.text.utf8.encode = function(str, output, offset) {
  str = util$1.encodeUtf8(str);
  var out = output;
  if(!out) {
    out = new Uint8Array(str.length);
  }
  offset = offset || 0;
  var j = offset;
  for(var i = 0; i < str.length; ++i) {
    out[j++] = str.charCodeAt(i);
  }
  return output ? (j - offset) : out;
};

/**
 * Decodes the UTF-8 contents from a Uint8Array.
 *
 * @param bytes the Uint8Array to decode.
 *
 * @return the resulting string.
 */
util$1.text.utf8.decode = function(bytes) {
  return util$1.decodeUtf8(String.fromCharCode.apply(null, bytes));
};

/**
 * Encodes the given string as UTF-16 in a Uint8Array.
 *
 * @param str the string to encode.
 * @param [output] an optional Uint8Array to write the output to; if it
 *          is too small, an exception will be thrown.
 * @param [offset] the start offset for writing to the output (default: 0).
 *
 * @return the Uint8Array or the number of bytes written if output was given.
 */
util$1.text.utf16.encode = function(str, output, offset) {
  var out = output;
  if(!out) {
    out = new Uint8Array(str.length * 2);
  }
  var view = new Uint16Array(out.buffer);
  offset = offset || 0;
  var j = offset;
  var k = offset;
  for(var i = 0; i < str.length; ++i) {
    view[k++] = str.charCodeAt(i);
    j += 2;
  }
  return output ? (j - offset) : out;
};

/**
 * Decodes the UTF-16 contents from a Uint8Array.
 *
 * @param bytes the Uint8Array to decode.
 *
 * @return the resulting string.
 */
util$1.text.utf16.decode = function(bytes) {
  return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer));
};

/**
 * Deflates the given data using a flash interface.
 *
 * @param api the flash interface.
 * @param bytes the data.
 * @param raw true to return only raw deflate data, false to include zlib
 *          header and trailer.
 *
 * @return the deflated data as a string.
 */
util$1.deflate = function(api, bytes, raw) {
  bytes = util$1.decode64(api.deflate(util$1.encode64(bytes)).rval);

  // strip zlib header and trailer if necessary
  if(raw) {
    // zlib header is 2 bytes (CMF,FLG) where FLG indicates that
    // there is a 4-byte DICT (alder-32) block before the data if
    // its 5th bit is set
    var start = 2;
    var flg = bytes.charCodeAt(1);
    if(flg & 0x20) {
      start = 6;
    }
    // zlib trailer is 4 bytes of adler-32
    bytes = bytes.substring(start, bytes.length - 4);
  }

  return bytes;
};

/**
 * Inflates the given data using a flash interface.
 *
 * @param api the flash interface.
 * @param bytes the data.
 * @param raw true if the incoming data has no zlib header or trailer and is
 *          raw DEFLATE data.
 *
 * @return the inflated data as a string, null on error.
 */
util$1.inflate = function(api, bytes, raw) {
  // TODO: add zlib header and trailer if necessary/possible
  var rval = api.inflate(util$1.encode64(bytes)).rval;
  return (rval === null) ? null : util$1.decode64(rval);
};

/**
 * Sets a storage object.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 * @param obj the storage object, null to remove.
 */
var _setStorageObject = function(api, id, obj) {
  if(!api) {
    throw new Error('WebStorage not available.');
  }

  var rval;
  if(obj === null) {
    rval = api.removeItem(id);
  } else {
    // json-encode and base64-encode object
    obj = util$1.encode64(JSON.stringify(obj));
    rval = api.setItem(id, obj);
  }

  // handle potential flash error
  if(typeof(rval) !== 'undefined' && rval.rval !== true) {
    var error = new Error(rval.error.message);
    error.id = rval.error.id;
    error.name = rval.error.name;
    throw error;
  }
};

/**
 * Gets a storage object.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 *
 * @return the storage object entry or null if none exists.
 */
var _getStorageObject = function(api, id) {
  if(!api) {
    throw new Error('WebStorage not available.');
  }

  // get the existing entry
  var rval = api.getItem(id);

  /* Note: We check api.init because we can't do (api == localStorage)
    on IE because of "Class doesn't support Automation" exception. Only
    the flash api has an init method so this works too, but we need a
    better solution in the future. */

  // flash returns item wrapped in an object, handle special case
  if(api.init) {
    if(rval.rval === null) {
      if(rval.error) {
        var error = new Error(rval.error.message);
        error.id = rval.error.id;
        error.name = rval.error.name;
        throw error;
      }
      // no error, but also no item
      rval = null;
    } else {
      rval = rval.rval;
    }
  }

  // handle decoding
  if(rval !== null) {
    // base64-decode and json-decode data
    rval = JSON.parse(util$1.decode64(rval));
  }

  return rval;
};

/**
 * Stores an item in local storage.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 * @param key the key for the item.
 * @param data the data for the item (any javascript object/primitive).
 */
var _setItem = function(api, id, key, data) {
  // get storage object
  var obj = _getStorageObject(api, id);
  if(obj === null) {
    // create a new storage object
    obj = {};
  }
  // update key
  obj[key] = data;

  // set storage object
  _setStorageObject(api, id, obj);
};

/**
 * Gets an item from local storage.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 * @param key the key for the item.
 *
 * @return the item.
 */
var _getItem = function(api, id, key) {
  // get storage object
  var rval = _getStorageObject(api, id);
  if(rval !== null) {
    // return data at key
    rval = (key in rval) ? rval[key] : null;
  }

  return rval;
};

/**
 * Removes an item from local storage.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 * @param key the key for the item.
 */
var _removeItem = function(api, id, key) {
  // get storage object
  var obj = _getStorageObject(api, id);
  if(obj !== null && key in obj) {
    // remove key
    delete obj[key];

    // see if entry has no keys remaining
    var empty = true;
    for(var prop in obj) {
      empty = false;
      break;
    }
    if(empty) {
      // remove entry entirely if no keys are left
      obj = null;
    }

    // set storage object
    _setStorageObject(api, id, obj);
  }
};

/**
 * Clears the local disk storage identified by the given ID.
 *
 * @param api the storage interface.
 * @param id the storage ID to use.
 */
var _clearItems = function(api, id) {
  _setStorageObject(api, id, null);
};

/**
 * Calls a storage function.
 *
 * @param func the function to call.
 * @param args the arguments for the function.
 * @param location the location argument.
 *
 * @return the return value from the function.
 */
var _callStorageFunction = function(func, args, location) {
  var rval = null;

  // default storage types
  if(typeof(location) === 'undefined') {
    location = ['web', 'flash'];
  }

  // apply storage types in order of preference
  var type;
  var done = false;
  var exception = null;
  for(var idx in location) {
    type = location[idx];
    try {
      if(type === 'flash' || type === 'both') {
        if(args[0] === null) {
          throw new Error('Flash local storage not available.');
        }
        rval = func.apply(this, args);
        done = (type === 'flash');
      }
      if(type === 'web' || type === 'both') {
        args[0] = localStorage;
        rval = func.apply(this, args);
        done = true;
      }
    } catch(ex) {
      exception = ex;
    }
    if(done) {
      break;
    }
  }

  if(!done) {
    throw exception;
  }

  return rval;
};

/**
 * Stores an item on local disk.
 *
 * The available types of local storage include 'flash', 'web', and 'both'.
 *
 * The type 'flash' refers to flash local storage (SharedObject). In order
 * to use flash local storage, the 'api' parameter must be valid. The type
 * 'web' refers to WebStorage, if supported by the browser. The type 'both'
 * refers to storing using both 'flash' and 'web', not just one or the
 * other.
 *
 * The location array should list the storage types to use in order of
 * preference:
 *
 * ['flash']: flash only storage
 * ['web']: web only storage
 * ['both']: try to store in both
 * ['flash','web']: store in flash first, but if not available, 'web'
 * ['web','flash']: store in web first, but if not available, 'flash'
 *
 * The location array defaults to: ['web', 'flash']
 *
 * @param api the flash interface, null to use only WebStorage.
 * @param id the storage ID to use.
 * @param key the key for the item.
 * @param data the data for the item (any javascript object/primitive).
 * @param location an array with the preferred types of storage to use.
 */
util$1.setItem = function(api, id, key, data, location) {
  _callStorageFunction(_setItem, arguments, location);
};

/**
 * Gets an item on local disk.
 *
 * Set setItem() for details on storage types.
 *
 * @param api the flash interface, null to use only WebStorage.
 * @param id the storage ID to use.
 * @param key the key for the item.
 * @param location an array with the preferred types of storage to use.
 *
 * @return the item.
 */
util$1.getItem = function(api, id, key, location) {
  return _callStorageFunction(_getItem, arguments, location);
};

/**
 * Removes an item on local disk.
 *
 * Set setItem() for details on storage types.
 *
 * @param api the flash interface.
 * @param id the storage ID to use.
 * @param key the key for the item.
 * @param location an array with the preferred types of storage to use.
 */
util$1.removeItem = function(api, id, key, location) {
  _callStorageFunction(_removeItem, arguments, location);
};

/**
 * Clears the local disk storage identified by the given ID.
 *
 * Set setItem() for details on storage types.
 *
 * @param api the flash interface if flash is available.
 * @param id the storage ID to use.
 * @param location an array with the preferred types of storage to use.
 */
util$1.clearItems = function(api, id, location) {
  _callStorageFunction(_clearItems, arguments, location);
};

/**
 * Parses the scheme, host, and port from an http(s) url.
 *
 * @param str the url string.
 *
 * @return the parsed url object or null if the url is invalid.
 */
util$1.parseUrl = function(str) {
  // FIXME: this regex looks a bit broken
  var regex = /^(https?):\/\/([^:&^\/]*):?(\d*)(.*)$/g;
  regex.lastIndex = 0;
  var m = regex.exec(str);
  var url = (m === null) ? null : {
    full: str,
    scheme: m[1],
    host: m[2],
    port: m[3],
    path: m[4]
  };
  if(url) {
    url.fullHost = url.host;
    if(url.port) {
      if(url.port !== 80 && url.scheme === 'http') {
        url.fullHost += ':' + url.port;
      } else if(url.port !== 443 && url.scheme === 'https') {
        url.fullHost += ':' + url.port;
      }
    } else if(url.scheme === 'http') {
      url.port = 80;
    } else if(url.scheme === 'https') {
      url.port = 443;
    }
    url.full = url.scheme + '://' + url.fullHost;
  }
  return url;
};

/* Storage for query variables */
var _queryVariables = null;

/**
 * Returns the window location query variables. Query is parsed on the first
 * call and the same object is returned on subsequent calls. The mapping
 * is from keys to an array of values. Parameters without values will have
 * an object key set but no value added to the value array. Values are
 * unescaped.
 *
 * ...?k1=v1&k2=v2:
 * {
 *   "k1": ["v1"],
 *   "k2": ["v2"]
 * }
 *
 * ...?k1=v1&k1=v2:
 * {
 *   "k1": ["v1", "v2"]
 * }
 *
 * ...?k1=v1&k2:
 * {
 *   "k1": ["v1"],
 *   "k2": []
 * }
 *
 * ...?k1=v1&k1:
 * {
 *   "k1": ["v1"]
 * }
 *
 * ...?k1&k1:
 * {
 *   "k1": []
 * }
 *
 * @param query the query string to parse (optional, default to cached
 *          results from parsing window location search query).
 *
 * @return object mapping keys to variables.
 */
util$1.getQueryVariables = function(query) {
  var parse = function(q) {
    var rval = {};
    var kvpairs = q.split('&');
    for(var i = 0; i < kvpairs.length; i++) {
      var pos = kvpairs[i].indexOf('=');
      var key;
      var val;
      if(pos > 0) {
        key = kvpairs[i].substring(0, pos);
        val = kvpairs[i].substring(pos + 1);
      } else {
        key = kvpairs[i];
        val = null;
      }
      if(!(key in rval)) {
        rval[key] = [];
      }
      // disallow overriding object prototype keys
      if(!(key in Object.prototype) && val !== null) {
        rval[key].push(unescape(val));
      }
    }
    return rval;
  };

   var rval;
   if(typeof(query) === 'undefined') {
     // set cached variables if needed
     if(_queryVariables === null) {
       if(typeof(window) !== 'undefined' && window.location && window.location.search) {
          // parse window search query
          _queryVariables = parse(window.location.search.substring(1));
       } else {
          // no query variables available
          _queryVariables = {};
       }
     }
     rval = _queryVariables;
   } else {
     // parse given query
     rval = parse(query);
   }
   return rval;
};

/**
 * Parses a fragment into a path and query. This method will take a URI
 * fragment and break it up as if it were the main URI. For example:
 *    /bar/baz?a=1&b=2
 * results in:
 *    {
 *       path: ["bar", "baz"],
 *       query: {"k1": ["v1"], "k2": ["v2"]}
 *    }
 *
 * @return object with a path array and query object.
 */
util$1.parseFragment = function(fragment) {
  // default to whole fragment
  var fp = fragment;
  var fq = '';
  // split into path and query if possible at the first '?'
  var pos = fragment.indexOf('?');
  if(pos > 0) {
    fp = fragment.substring(0, pos);
    fq = fragment.substring(pos + 1);
  }
  // split path based on '/' and ignore first element if empty
  var path = fp.split('/');
  if(path.length > 0 && path[0] === '') {
    path.shift();
  }
  // convert query into object
  var query = (fq === '') ? {} : util$1.getQueryVariables(fq);

  return {
    pathString: fp,
    queryString: fq,
    path: path,
    query: query
  };
};

/**
 * Makes a request out of a URI-like request string. This is intended to
 * be used where a fragment id (after a URI '#') is parsed as a URI with
 * path and query parts. The string should have a path beginning and
 * delimited by '/' and optional query parameters following a '?'. The
 * query should be a standard URL set of key value pairs delimited by
 * '&'. For backwards compatibility the initial '/' on the path is not
 * required. The request object has the following API, (fully described
 * in the method code):
 *    {
 *       path: <the path string part>.
 *       query: <the query string part>,
 *       getPath(i): get part or all of the split path array,
 *       getQuery(k, i): get part or all of a query key array,
 *       getQueryLast(k, _default): get last element of a query key array.
 *    }
 *
 * @return object with request parameters.
 */
util$1.makeRequest = function(reqString) {
  var frag = util$1.parseFragment(reqString);
  var req = {
    // full path string
    path: frag.pathString,
    // full query string
    query: frag.queryString,
    /**
     * Get path or element in path.
     *
     * @param i optional path index.
     *
     * @return path or part of path if i provided.
     */
    getPath: function(i) {
      return (typeof(i) === 'undefined') ? frag.path : frag.path[i];
    },
    /**
     * Get query, values for a key, or value for a key index.
     *
     * @param k optional query key.
     * @param i optional query key index.
     *
     * @return query, values for a key, or value for a key index.
     */
    getQuery: function(k, i) {
      var rval;
      if(typeof(k) === 'undefined') {
        rval = frag.query;
      } else {
        rval = frag.query[k];
        if(rval && typeof(i) !== 'undefined') {
           rval = rval[i];
        }
      }
      return rval;
    },
    getQueryLast: function(k, _default) {
      var rval;
      var vals = req.getQuery(k);
      if(vals) {
        rval = vals[vals.length - 1];
      } else {
        rval = _default;
      }
      return rval;
    }
  };
  return req;
};

/**
 * Makes a URI out of a path, an object with query parameters, and a
 * fragment. Uses jQuery.param() internally for query string creation.
 * If the path is an array, it will be joined with '/'.
 *
 * @param path string path or array of strings.
 * @param query object with query parameters. (optional)
 * @param fragment fragment string. (optional)
 *
 * @return string object with request parameters.
 */
util$1.makeLink = function(path, query, fragment) {
  // join path parts if needed
  path = jQuery.isArray(path) ? path.join('/') : path;

  var qstr = jQuery.param(query || {});
  fragment = fragment || '';
  return path +
    ((qstr.length > 0) ? ('?' + qstr) : '') +
    ((fragment.length > 0) ? ('#' + fragment) : '');
};

/**
 * Check if an object is empty.
 *
 * Taken from:
 * http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object-from-json/679937#679937
 *
 * @param object the object to check.
 */
util$1.isEmpty = function(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};

/**
 * Format with simple printf-style interpolation.
 *
 * %%: literal '%'
 * %s,%o: convert next argument into a string.
 *
 * @param format the string to format.
 * @param ... arguments to interpolate into the format string.
 */
util$1.format = function(format) {
  var re = /%./g;
  // current match
  var match;
  // current part
  var part;
  // current arg index
  var argi = 0;
  // collected parts to recombine later
  var parts = [];
  // last index found
  var last = 0;
  // loop while matches remain
  while((match = re.exec(format))) {
    part = format.substring(last, re.lastIndex - 2);
    // don't add empty strings (ie, parts between %s%s)
    if(part.length > 0) {
      parts.push(part);
    }
    last = re.lastIndex;
    // switch on % code
    var code = match[0][1];
    switch(code) {
    case 's':
    case 'o':
      // check if enough arguments were given
      if(argi < arguments.length) {
        parts.push(arguments[argi++ + 1]);
      } else {
        parts.push('<?>');
      }
      break;
    // FIXME: do proper formating for numbers, etc
    //case 'f':
    //case 'd':
    case '%':
      parts.push('%');
      break;
    default:
      parts.push('<%' + code + '?>');
    }
  }
  // add trailing part of format string
  parts.push(format.substring(last));
  return parts.join('');
};

/**
 * Formats a number.
 *
 * http://snipplr.com/view/5945/javascript-numberformat--ported-from-php/
 */
util$1.formatNumber = function(number, decimals, dec_point, thousands_sep) {
  // http://kevin.vanzonneveld.net
  // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +     bugfix by: Michael White (http://crestidg.com)
  // +     bugfix by: Benjamin Lupton
  // +     bugfix by: Allan Jensen (http://www.winternet.no)
  // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // *     example 1: number_format(1234.5678, 2, '.', '');
  // *     returns 1: 1234.57

  var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
  var d = dec_point === undefined ? ',' : dec_point;
  var t = thousands_sep === undefined ?
   '.' : thousands_sep, s = n < 0 ? '-' : '';
  var i = parseInt((n = Math.abs(+n || 0).toFixed(c)), 10) + '';
  var j = (i.length > 3) ? i.length % 3 : 0;
  return s + (j ? i.substr(0, j) + t : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
    (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
};

/**
 * Formats a byte size.
 *
 * http://snipplr.com/view/5949/format-humanize-file-byte-size-presentation-in-javascript/
 */
util$1.formatSize = function(size) {
  if(size >= 1073741824) {
    size = util$1.formatNumber(size / 1073741824, 2, '.', '') + ' GiB';
  } else if(size >= 1048576) {
    size = util$1.formatNumber(size / 1048576, 2, '.', '') + ' MiB';
  } else if(size >= 1024) {
    size = util$1.formatNumber(size / 1024, 0) + ' KiB';
  } else {
    size = util$1.formatNumber(size, 0) + ' bytes';
  }
  return size;
};

/**
 * Converts an IPv4 or IPv6 string representation into bytes (in network order).
 *
 * @param ip the IPv4 or IPv6 address to convert.
 *
 * @return the 4-byte IPv6 or 16-byte IPv6 address or null if the address can't
 *         be parsed.
 */
util$1.bytesFromIP = function(ip) {
  if(ip.indexOf('.') !== -1) {
    return util$1.bytesFromIPv4(ip);
  }
  if(ip.indexOf(':') !== -1) {
    return util$1.bytesFromIPv6(ip);
  }
  return null;
};

/**
 * Converts an IPv4 string representation into bytes (in network order).
 *
 * @param ip the IPv4 address to convert.
 *
 * @return the 4-byte address or null if the address can't be parsed.
 */
util$1.bytesFromIPv4 = function(ip) {
  ip = ip.split('.');
  if(ip.length !== 4) {
    return null;
  }
  var b = util$1.createBuffer();
  for(var i = 0; i < ip.length; ++i) {
    var num = parseInt(ip[i], 10);
    if(isNaN(num)) {
      return null;
    }
    b.putByte(num);
  }
  return b.getBytes();
};

/**
 * Converts an IPv6 string representation into bytes (in network order).
 *
 * @param ip the IPv6 address to convert.
 *
 * @return the 16-byte address or null if the address can't be parsed.
 */
util$1.bytesFromIPv6 = function(ip) {
  var blanks = 0;
  ip = ip.split(':').filter(function(e) {
    if(e.length === 0) ++blanks;
    return true;
  });
  var zeros = (8 - ip.length + blanks) * 2;
  var b = util$1.createBuffer();
  for(var i = 0; i < 8; ++i) {
    if(!ip[i] || ip[i].length === 0) {
      b.fillWithByte(0, zeros);
      zeros = 0;
      continue;
    }
    var bytes = util$1.hexToBytes(ip[i]);
    if(bytes.length < 2) {
      b.putByte(0);
    }
    b.putBytes(bytes);
  }
  return b.getBytes();
};

/**
 * Converts 4-bytes into an IPv4 string representation or 16-bytes into
 * an IPv6 string representation. The bytes must be in network order.
 *
 * @param bytes the bytes to convert.
 *
 * @return the IPv4 or IPv6 string representation if 4 or 16 bytes,
 *         respectively, are given, otherwise null.
 */
util$1.bytesToIP = function(bytes) {
  if(bytes.length === 4) {
    return util$1.bytesToIPv4(bytes);
  }
  if(bytes.length === 16) {
    return util$1.bytesToIPv6(bytes);
  }
  return null;
};

/**
 * Converts 4-bytes into an IPv4 string representation. The bytes must be
 * in network order.
 *
 * @param bytes the bytes to convert.
 *
 * @return the IPv4 string representation or null for an invalid # of bytes.
 */
util$1.bytesToIPv4 = function(bytes) {
  if(bytes.length !== 4) {
    return null;
  }
  var ip = [];
  for(var i = 0; i < bytes.length; ++i) {
    ip.push(bytes.charCodeAt(i));
  }
  return ip.join('.');
};

/**
 * Converts 16-bytes into an IPv16 string representation. The bytes must be
 * in network order.
 *
 * @param bytes the bytes to convert.
 *
 * @return the IPv16 string representation or null for an invalid # of bytes.
 */
util$1.bytesToIPv6 = function(bytes) {
  if(bytes.length !== 16) {
    return null;
  }
  var ip = [];
  var zeroGroups = [];
  var zeroMaxGroup = 0;
  for(var i = 0; i < bytes.length; i += 2) {
    var hex = util$1.bytesToHex(bytes[i] + bytes[i + 1]);
    // canonicalize zero representation
    while(hex[0] === '0' && hex !== '0') {
      hex = hex.substr(1);
    }
    if(hex === '0') {
      var last = zeroGroups[zeroGroups.length - 1];
      var idx = ip.length;
      if(!last || idx !== last.end + 1) {
        zeroGroups.push({start: idx, end: idx});
      } else {
        last.end = idx;
        if((last.end - last.start) >
          (zeroGroups[zeroMaxGroup].end - zeroGroups[zeroMaxGroup].start)) {
          zeroMaxGroup = zeroGroups.length - 1;
        }
      }
    }
    ip.push(hex);
  }
  if(zeroGroups.length > 0) {
    var group = zeroGroups[zeroMaxGroup];
    // only shorten group of length > 0
    if(group.end - group.start > 0) {
      ip.splice(group.start, group.end - group.start + 1, '');
      if(group.start === 0) {
        ip.unshift('');
      }
      if(group.end === 7) {
        ip.push('');
      }
    }
  }
  return ip.join(':');
};

/**
 * Estimates the number of processes that can be run concurrently. If
 * creating Web Workers, keep in mind that the main JavaScript process needs
 * its own core.
 *
 * @param options the options to use:
 *          update true to force an update (not use the cached value).
 * @param callback(err, max) called once the operation completes.
 */
util$1.estimateCores = function(options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  if('cores' in util$1 && !options.update) {
    return callback(null, util$1.cores);
  }
  if(typeof navigator !== 'undefined' &&
    'hardwareConcurrency' in navigator &&
    navigator.hardwareConcurrency > 0) {
    util$1.cores = navigator.hardwareConcurrency;
    return callback(null, util$1.cores);
  }
  if(typeof Worker === 'undefined') {
    // workers not available
    util$1.cores = 1;
    return callback(null, util$1.cores);
  }
  if(typeof Blob === 'undefined') {
    // can't estimate, default to 2
    util$1.cores = 2;
    return callback(null, util$1.cores);
  }

  // create worker concurrency estimation code as blob
  var blobUrl = URL.createObjectURL(new Blob(['(',
    function() {
      self.addEventListener('message', function(e) {
        // run worker for 4 ms
        var st = Date.now();
        var et = st + 4;
        self.postMessage({st: st, et: et});
      });
    }.toString(),
  ')()'], {type: 'application/javascript'}));

  // take 5 samples using 16 workers
  sample([], 5, 16);

  function sample(max, samples, numWorkers) {
    if(samples === 0) {
      // get overlap average
      var avg = Math.floor(max.reduce(function(avg, x) {
        return avg + x;
      }, 0) / max.length);
      util$1.cores = Math.max(1, avg);
      URL.revokeObjectURL(blobUrl);
      return callback(null, util$1.cores);
    }
    map(numWorkers, function(err, results) {
      max.push(reduce(numWorkers, results));
      sample(max, samples - 1, numWorkers);
    });
  }

  function map(numWorkers, callback) {
    var workers = [];
    var results = [];
    for(var i = 0; i < numWorkers; ++i) {
      var worker = new Worker(blobUrl);
      worker.addEventListener('message', function(e) {
        results.push(e.data);
        if(results.length === numWorkers) {
          for(var i = 0; i < numWorkers; ++i) {
            workers[i].terminate();
          }
          callback(null, results);
        }
      });
      workers.push(worker);
    }
    for(var i = 0; i < numWorkers; ++i) {
      workers[i].postMessage(i);
    }
  }

  function reduce(numWorkers, results) {
    // find overlapping time windows
    var overlaps = [];
    for(var n = 0; n < numWorkers; ++n) {
      var r1 = results[n];
      var overlap = overlaps[n] = [];
      for(var i = 0; i < numWorkers; ++i) {
        if(n === i) {
          continue;
        }
        var r2 = results[i];
        if((r1.st > r2.st && r1.st < r2.et) ||
          (r2.st > r1.st && r2.st < r1.et)) {
          overlap.push(i);
        }
      }
    }
    // get maximum overlaps ... don't include overlapping worker itself
    // as the main JS process was also being scheduled during the work and
    // would have to be subtracted from the estimate anyway
    return overlaps.reduce(function(max, overlap) {
      return Math.max(max, overlap.length);
    }, 0);
  }
};

/**
 * Cipher base API.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */

var forge$D = forge$F;


forge$D.cipher = forge$D.cipher || {};

// registered algorithms
forge$D.cipher.algorithms = forge$D.cipher.algorithms || {};

/**
 * Creates a cipher object that can be used to encrypt data using the given
 * algorithm and key. The algorithm may be provided as a string value for a
 * previously registered algorithm or it may be given as a cipher algorithm
 * API object.
 *
 * @param algorithm the algorithm to use, either a string or an algorithm API
 *          object.
 * @param key the key to use, as a binary-encoded string of bytes or a
 *          byte buffer.
 *
 * @return the cipher.
 */
forge$D.cipher.createCipher = function(algorithm, key) {
  var api = algorithm;
  if(typeof api === 'string') {
    api = forge$D.cipher.getAlgorithm(api);
    if(api) {
      api = api();
    }
  }
  if(!api) {
    throw new Error('Unsupported algorithm: ' + algorithm);
  }

  // assume block cipher
  return new forge$D.cipher.BlockCipher({
    algorithm: api,
    key: key,
    decrypt: false
  });
};

/**
 * Creates a decipher object that can be used to decrypt data using the given
 * algorithm and key. The algorithm may be provided as a string value for a
 * previously registered algorithm or it may be given as a cipher algorithm
 * API object.
 *
 * @param algorithm the algorithm to use, either a string or an algorithm API
 *          object.
 * @param key the key to use, as a binary-encoded string of bytes or a
 *          byte buffer.
 *
 * @return the cipher.
 */
forge$D.cipher.createDecipher = function(algorithm, key) {
  var api = algorithm;
  if(typeof api === 'string') {
    api = forge$D.cipher.getAlgorithm(api);
    if(api) {
      api = api();
    }
  }
  if(!api) {
    throw new Error('Unsupported algorithm: ' + algorithm);
  }

  // assume block cipher
  return new forge$D.cipher.BlockCipher({
    algorithm: api,
    key: key,
    decrypt: true
  });
};

/**
 * Registers an algorithm by name. If the name was already registered, the
 * algorithm API object will be overwritten.
 *
 * @param name the name of the algorithm.
 * @param algorithm the algorithm API object.
 */
forge$D.cipher.registerAlgorithm = function(name, algorithm) {
  name = name.toUpperCase();
  forge$D.cipher.algorithms[name] = algorithm;
};

/**
 * Gets a registered algorithm by name.
 *
 * @param name the name of the algorithm.
 *
 * @return the algorithm, if found, null if not.
 */
forge$D.cipher.getAlgorithm = function(name) {
  name = name.toUpperCase();
  if(name in forge$D.cipher.algorithms) {
    return forge$D.cipher.algorithms[name];
  }
  return null;
};

var BlockCipher = forge$D.cipher.BlockCipher = function(options) {
  this.algorithm = options.algorithm;
  this.mode = this.algorithm.mode;
  this.blockSize = this.mode.blockSize;
  this._finish = false;
  this._input = null;
  this.output = null;
  this._op = options.decrypt ? this.mode.decrypt : this.mode.encrypt;
  this._decrypt = options.decrypt;
  this.algorithm.initialize(options);
};

/**
 * Starts or restarts the encryption or decryption process, whichever
 * was previously configured.
 *
 * For non-GCM mode, the IV may be a binary-encoded string of bytes, an array
 * of bytes, a byte buffer, or an array of 32-bit integers. If the IV is in
 * bytes, then it must be Nb (16) bytes in length. If the IV is given in as
 * 32-bit integers, then it must be 4 integers long.
 *
 * Note: an IV is not required or used in ECB mode.
 *
 * For GCM-mode, the IV must be given as a binary-encoded string of bytes or
 * a byte buffer. The number of bytes should be 12 (96 bits) as recommended
 * by NIST SP-800-38D but another length may be given.
 *
 * @param options the options to use:
 *          iv the initialization vector to use as a binary-encoded string of
 *            bytes, null to reuse the last ciphered block from a previous
 *            update() (this "residue" method is for legacy support only).
 *          additionalData additional authentication data as a binary-encoded
 *            string of bytes, for 'GCM' mode, (default: none).
 *          tagLength desired length of authentication tag, in bits, for
 *            'GCM' mode (0-128, default: 128).
 *          tag the authentication tag to check if decrypting, as a
 *             binary-encoded string of bytes.
 *          output the output the buffer to write to, null to create one.
 */
BlockCipher.prototype.start = function(options) {
  options = options || {};
  var opts = {};
  for(var key in options) {
    opts[key] = options[key];
  }
  opts.decrypt = this._decrypt;
  this._finish = false;
  this._input = forge$D.util.createBuffer();
  this.output = options.output || forge$D.util.createBuffer();
  this.mode.start(opts);
};

/**
 * Updates the next block according to the cipher mode.
 *
 * @param input the buffer to read from.
 */
BlockCipher.prototype.update = function(input) {
  if(input) {
    // input given, so empty it into the input buffer
    this._input.putBuffer(input);
  }

  // do cipher operation until it needs more input and not finished
  while(!this._op.call(this.mode, this._input, this.output, this._finish) &&
    !this._finish) {}

  // free consumed memory from input buffer
  this._input.compact();
};

/**
 * Finishes encrypting or decrypting.
 *
 * @param pad a padding function to use in CBC mode, null for default,
 *          signature(blockSize, buffer, decrypt).
 *
 * @return true if successful, false on error.
 */
BlockCipher.prototype.finish = function(pad) {
  // backwards-compatibility w/deprecated padding API
  // Note: will overwrite padding functions even after another start() call
  if(pad && (this.mode.name === 'ECB' || this.mode.name === 'CBC')) {
    this.mode.pad = function(input) {
      return pad(this.blockSize, input, false);
    };
    this.mode.unpad = function(output) {
      return pad(this.blockSize, output, true);
    };
  }

  // build options for padding and afterFinish functions
  var options = {};
  options.decrypt = this._decrypt;

  // get # of bytes that won't fill a block
  options.overflow = this._input.length() % this.blockSize;

  if(!this._decrypt && this.mode.pad) {
    if(!this.mode.pad(this._input, options)) {
      return false;
    }
  }

  // do final update
  this._finish = true;
  this.update();

  if(this._decrypt && this.mode.unpad) {
    if(!this.mode.unpad(this.output, options)) {
      return false;
    }
  }

  if(this.mode.afterFinish) {
    if(!this.mode.afterFinish(this.output, options)) {
      return false;
    }
  }

  return true;
};

/**
 * Supported cipher modes.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */

var forge$C = forge$F;


forge$C.cipher = forge$C.cipher || {};

// supported cipher modes
var modes = forge$C.cipher.modes = forge$C.cipher.modes || {};

/** Electronic codebook (ECB) (Don't use this; it's not secure) **/

modes.ecb = function(options) {
  options = options || {};
  this.name = 'ECB';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = new Array(this._ints);
  this._outBlock = new Array(this._ints);
};

modes.ecb.prototype.start = function(options) {};

modes.ecb.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  if(input.length() < this.blockSize && !(finish && input.length() > 0)) {
    return true;
  }

  // get next block
  for(var i = 0; i < this._ints; ++i) {
    this._inBlock[i] = input.getInt32();
  }

  // encrypt block
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // write output
  for(var i = 0; i < this._ints; ++i) {
    output.putInt32(this._outBlock[i]);
  }
};

modes.ecb.prototype.decrypt = function(input, output, finish) {
  // not enough input to decrypt
  if(input.length() < this.blockSize && !(finish && input.length() > 0)) {
    return true;
  }

  // get next block
  for(var i = 0; i < this._ints; ++i) {
    this._inBlock[i] = input.getInt32();
  }

  // decrypt block
  this.cipher.decrypt(this._inBlock, this._outBlock);

  // write output
  for(var i = 0; i < this._ints; ++i) {
    output.putInt32(this._outBlock[i]);
  }
};

modes.ecb.prototype.pad = function(input, options) {
  // add PKCS#7 padding to block (each pad byte is the
  // value of the number of pad bytes)
  var padding = (input.length() === this.blockSize ?
    this.blockSize : (this.blockSize - input.length()));
  input.fillWithByte(padding, padding);
  return true;
};

modes.ecb.prototype.unpad = function(output, options) {
  // check for error: input data not a multiple of blockSize
  if(options.overflow > 0) {
    return false;
  }

  // ensure padding byte count is valid
  var len = output.length();
  var count = output.at(len - 1);
  if(count > (this.blockSize << 2)) {
    return false;
  }

  // trim off padding bytes
  output.truncate(count);
  return true;
};

/** Cipher-block Chaining (CBC) **/

modes.cbc = function(options) {
  options = options || {};
  this.name = 'CBC';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = new Array(this._ints);
  this._outBlock = new Array(this._ints);
};

modes.cbc.prototype.start = function(options) {
  // Note: legacy support for using IV residue (has security flaws)
  // if IV is null, reuse block from previous processing
  if(options.iv === null) {
    // must have a previous block
    if(!this._prev) {
      throw new Error('Invalid IV parameter.');
    }
    this._iv = this._prev.slice(0);
  } else if(!('iv' in options)) {
    throw new Error('Invalid IV parameter.');
  } else {
    // save IV as "previous" block
    this._iv = transformIV(options.iv, this.blockSize);
    this._prev = this._iv.slice(0);
  }
};

modes.cbc.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  if(input.length() < this.blockSize && !(finish && input.length() > 0)) {
    return true;
  }

  // get next block
  // CBC XOR's IV (or previous block) with plaintext
  for(var i = 0; i < this._ints; ++i) {
    this._inBlock[i] = this._prev[i] ^ input.getInt32();
  }

  // encrypt block
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // write output, save previous block
  for(var i = 0; i < this._ints; ++i) {
    output.putInt32(this._outBlock[i]);
  }
  this._prev = this._outBlock;
};

modes.cbc.prototype.decrypt = function(input, output, finish) {
  // not enough input to decrypt
  if(input.length() < this.blockSize && !(finish && input.length() > 0)) {
    return true;
  }

  // get next block
  for(var i = 0; i < this._ints; ++i) {
    this._inBlock[i] = input.getInt32();
  }

  // decrypt block
  this.cipher.decrypt(this._inBlock, this._outBlock);

  // write output, save previous ciphered block
  // CBC XOR's IV (or previous block) with ciphertext
  for(var i = 0; i < this._ints; ++i) {
    output.putInt32(this._prev[i] ^ this._outBlock[i]);
  }
  this._prev = this._inBlock.slice(0);
};

modes.cbc.prototype.pad = function(input, options) {
  // add PKCS#7 padding to block (each pad byte is the
  // value of the number of pad bytes)
  var padding = (input.length() === this.blockSize ?
    this.blockSize : (this.blockSize - input.length()));
  input.fillWithByte(padding, padding);
  return true;
};

modes.cbc.prototype.unpad = function(output, options) {
  // check for error: input data not a multiple of blockSize
  if(options.overflow > 0) {
    return false;
  }

  // ensure padding byte count is valid
  var len = output.length();
  var count = output.at(len - 1);
  if(count > (this.blockSize << 2)) {
    return false;
  }

  // trim off padding bytes
  output.truncate(count);
  return true;
};

/** Cipher feedback (CFB) **/

modes.cfb = function(options) {
  options = options || {};
  this.name = 'CFB';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = null;
  this._outBlock = new Array(this._ints);
  this._partialBlock = new Array(this._ints);
  this._partialOutput = forge$C.util.createBuffer();
  this._partialBytes = 0;
};

modes.cfb.prototype.start = function(options) {
  if(!('iv' in options)) {
    throw new Error('Invalid IV parameter.');
  }
  // use IV as first input
  this._iv = transformIV(options.iv, this.blockSize);
  this._inBlock = this._iv.slice(0);
  this._partialBytes = 0;
};

modes.cfb.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  var inputLength = input.length();
  if(inputLength === 0) {
    return true;
  }

  // encrypt block
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // handle full block
  if(this._partialBytes === 0 && inputLength >= this.blockSize) {
    // XOR input with output, write input as output
    for(var i = 0; i < this._ints; ++i) {
      this._inBlock[i] = input.getInt32() ^ this._outBlock[i];
      output.putInt32(this._inBlock[i]);
    }
    return;
  }

  // handle partial block
  var partialBytes = (this.blockSize - inputLength) % this.blockSize;
  if(partialBytes > 0) {
    partialBytes = this.blockSize - partialBytes;
  }

  // XOR input with output, write input as partial output
  this._partialOutput.clear();
  for(var i = 0; i < this._ints; ++i) {
    this._partialBlock[i] = input.getInt32() ^ this._outBlock[i];
    this._partialOutput.putInt32(this._partialBlock[i]);
  }

  if(partialBytes > 0) {
    // block still incomplete, restore input buffer
    input.read -= this.blockSize;
  } else {
    // block complete, update input block
    for(var i = 0; i < this._ints; ++i) {
      this._inBlock[i] = this._partialBlock[i];
    }
  }

  // skip any previous partial bytes
  if(this._partialBytes > 0) {
    this._partialOutput.getBytes(this._partialBytes);
  }

  if(partialBytes > 0 && !finish) {
    output.putBytes(this._partialOutput.getBytes(
      partialBytes - this._partialBytes));
    this._partialBytes = partialBytes;
    return true;
  }

  output.putBytes(this._partialOutput.getBytes(
    inputLength - this._partialBytes));
  this._partialBytes = 0;
};

modes.cfb.prototype.decrypt = function(input, output, finish) {
  // not enough input to decrypt
  var inputLength = input.length();
  if(inputLength === 0) {
    return true;
  }

  // encrypt block (CFB always uses encryption mode)
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // handle full block
  if(this._partialBytes === 0 && inputLength >= this.blockSize) {
    // XOR input with output, write input as output
    for(var i = 0; i < this._ints; ++i) {
      this._inBlock[i] = input.getInt32();
      output.putInt32(this._inBlock[i] ^ this._outBlock[i]);
    }
    return;
  }

  // handle partial block
  var partialBytes = (this.blockSize - inputLength) % this.blockSize;
  if(partialBytes > 0) {
    partialBytes = this.blockSize - partialBytes;
  }

  // XOR input with output, write input as partial output
  this._partialOutput.clear();
  for(var i = 0; i < this._ints; ++i) {
    this._partialBlock[i] = input.getInt32();
    this._partialOutput.putInt32(this._partialBlock[i] ^ this._outBlock[i]);
  }

  if(partialBytes > 0) {
    // block still incomplete, restore input buffer
    input.read -= this.blockSize;
  } else {
    // block complete, update input block
    for(var i = 0; i < this._ints; ++i) {
      this._inBlock[i] = this._partialBlock[i];
    }
  }

  // skip any previous partial bytes
  if(this._partialBytes > 0) {
    this._partialOutput.getBytes(this._partialBytes);
  }

  if(partialBytes > 0 && !finish) {
    output.putBytes(this._partialOutput.getBytes(
      partialBytes - this._partialBytes));
    this._partialBytes = partialBytes;
    return true;
  }

  output.putBytes(this._partialOutput.getBytes(
    inputLength - this._partialBytes));
  this._partialBytes = 0;
};

/** Output feedback (OFB) **/

modes.ofb = function(options) {
  options = options || {};
  this.name = 'OFB';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = null;
  this._outBlock = new Array(this._ints);
  this._partialOutput = forge$C.util.createBuffer();
  this._partialBytes = 0;
};

modes.ofb.prototype.start = function(options) {
  if(!('iv' in options)) {
    throw new Error('Invalid IV parameter.');
  }
  // use IV as first input
  this._iv = transformIV(options.iv, this.blockSize);
  this._inBlock = this._iv.slice(0);
  this._partialBytes = 0;
};

modes.ofb.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  var inputLength = input.length();
  if(input.length() === 0) {
    return true;
  }

  // encrypt block (OFB always uses encryption mode)
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // handle full block
  if(this._partialBytes === 0 && inputLength >= this.blockSize) {
    // XOR input with output and update next input
    for(var i = 0; i < this._ints; ++i) {
      output.putInt32(input.getInt32() ^ this._outBlock[i]);
      this._inBlock[i] = this._outBlock[i];
    }
    return;
  }

  // handle partial block
  var partialBytes = (this.blockSize - inputLength) % this.blockSize;
  if(partialBytes > 0) {
    partialBytes = this.blockSize - partialBytes;
  }

  // XOR input with output
  this._partialOutput.clear();
  for(var i = 0; i < this._ints; ++i) {
    this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i]);
  }

  if(partialBytes > 0) {
    // block still incomplete, restore input buffer
    input.read -= this.blockSize;
  } else {
    // block complete, update input block
    for(var i = 0; i < this._ints; ++i) {
      this._inBlock[i] = this._outBlock[i];
    }
  }

  // skip any previous partial bytes
  if(this._partialBytes > 0) {
    this._partialOutput.getBytes(this._partialBytes);
  }

  if(partialBytes > 0 && !finish) {
    output.putBytes(this._partialOutput.getBytes(
      partialBytes - this._partialBytes));
    this._partialBytes = partialBytes;
    return true;
  }

  output.putBytes(this._partialOutput.getBytes(
    inputLength - this._partialBytes));
  this._partialBytes = 0;
};

modes.ofb.prototype.decrypt = modes.ofb.prototype.encrypt;

/** Counter (CTR) **/

modes.ctr = function(options) {
  options = options || {};
  this.name = 'CTR';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = null;
  this._outBlock = new Array(this._ints);
  this._partialOutput = forge$C.util.createBuffer();
  this._partialBytes = 0;
};

modes.ctr.prototype.start = function(options) {
  if(!('iv' in options)) {
    throw new Error('Invalid IV parameter.');
  }
  // use IV as first input
  this._iv = transformIV(options.iv, this.blockSize);
  this._inBlock = this._iv.slice(0);
  this._partialBytes = 0;
};

modes.ctr.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  var inputLength = input.length();
  if(inputLength === 0) {
    return true;
  }

  // encrypt block (CTR always uses encryption mode)
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // handle full block
  if(this._partialBytes === 0 && inputLength >= this.blockSize) {
    // XOR input with output
    for(var i = 0; i < this._ints; ++i) {
      output.putInt32(input.getInt32() ^ this._outBlock[i]);
    }
  } else {
    // handle partial block
    var partialBytes = (this.blockSize - inputLength) % this.blockSize;
    if(partialBytes > 0) {
      partialBytes = this.blockSize - partialBytes;
    }

    // XOR input with output
    this._partialOutput.clear();
    for(var i = 0; i < this._ints; ++i) {
      this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i]);
    }

    if(partialBytes > 0) {
      // block still incomplete, restore input buffer
      input.read -= this.blockSize;
    }

    // skip any previous partial bytes
    if(this._partialBytes > 0) {
      this._partialOutput.getBytes(this._partialBytes);
    }

    if(partialBytes > 0 && !finish) {
      output.putBytes(this._partialOutput.getBytes(
        partialBytes - this._partialBytes));
      this._partialBytes = partialBytes;
      return true;
    }

    output.putBytes(this._partialOutput.getBytes(
      inputLength - this._partialBytes));
    this._partialBytes = 0;
  }

  // block complete, increment counter (input block)
  inc32(this._inBlock);
};

modes.ctr.prototype.decrypt = modes.ctr.prototype.encrypt;

/** Galois/Counter Mode (GCM) **/

modes.gcm = function(options) {
  options = options || {};
  this.name = 'GCM';
  this.cipher = options.cipher;
  this.blockSize = options.blockSize || 16;
  this._ints = this.blockSize / 4;
  this._inBlock = new Array(this._ints);
  this._outBlock = new Array(this._ints);
  this._partialOutput = forge$C.util.createBuffer();
  this._partialBytes = 0;

  // R is actually this value concatenated with 120 more zero bits, but
  // we only XOR against R so the other zeros have no effect -- we just
  // apply this value to the first integer in a block
  this._R = 0xE1000000;
};

modes.gcm.prototype.start = function(options) {
  if(!('iv' in options)) {
    throw new Error('Invalid IV parameter.');
  }
  // ensure IV is a byte buffer
  var iv = forge$C.util.createBuffer(options.iv);

  // no ciphered data processed yet
  this._cipherLength = 0;

  // default additional data is none
  var additionalData;
  if('additionalData' in options) {
    additionalData = forge$C.util.createBuffer(options.additionalData);
  } else {
    additionalData = forge$C.util.createBuffer();
  }

  // default tag length is 128 bits
  if('tagLength' in options) {
    this._tagLength = options.tagLength;
  } else {
    this._tagLength = 128;
  }

  // if tag is given, ensure tag matches tag length
  this._tag = null;
  if(options.decrypt) {
    // save tag to check later
    this._tag = forge$C.util.createBuffer(options.tag).getBytes();
    if(this._tag.length !== (this._tagLength / 8)) {
      throw new Error('Authentication tag does not match tag length.');
    }
  }

  // create tmp storage for hash calculation
  this._hashBlock = new Array(this._ints);

  // no tag generated yet
  this.tag = null;

  // generate hash subkey
  // (apply block cipher to "zero" block)
  this._hashSubkey = new Array(this._ints);
  this.cipher.encrypt([0, 0, 0, 0], this._hashSubkey);

  // generate table M
  // use 4-bit tables (32 component decomposition of a 16 byte value)
  // 8-bit tables take more space and are known to have security
  // vulnerabilities (in native implementations)
  this.componentBits = 4;
  this._m = this.generateHashTable(this._hashSubkey, this.componentBits);

  // Note: support IV length different from 96 bits? (only supporting
  // 96 bits is recommended by NIST SP-800-38D)
  // generate J_0
  var ivLength = iv.length();
  if(ivLength === 12) {
    // 96-bit IV
    this._j0 = [iv.getInt32(), iv.getInt32(), iv.getInt32(), 1];
  } else {
    // IV is NOT 96-bits
    this._j0 = [0, 0, 0, 0];
    while(iv.length() > 0) {
      this._j0 = this.ghash(
        this._hashSubkey, this._j0,
        [iv.getInt32(), iv.getInt32(), iv.getInt32(), iv.getInt32()]);
    }
    this._j0 = this.ghash(
      this._hashSubkey, this._j0, [0, 0].concat(from64To32(ivLength * 8)));
  }

  // generate ICB (initial counter block)
  this._inBlock = this._j0.slice(0);
  inc32(this._inBlock);
  this._partialBytes = 0;

  // consume authentication data
  additionalData = forge$C.util.createBuffer(additionalData);
  // save additional data length as a BE 64-bit number
  this._aDataLength = from64To32(additionalData.length() * 8);
  // pad additional data to 128 bit (16 byte) block size
  var overflow = additionalData.length() % this.blockSize;
  if(overflow) {
    additionalData.fillWithByte(0, this.blockSize - overflow);
  }
  this._s = [0, 0, 0, 0];
  while(additionalData.length() > 0) {
    this._s = this.ghash(this._hashSubkey, this._s, [
      additionalData.getInt32(),
      additionalData.getInt32(),
      additionalData.getInt32(),
      additionalData.getInt32()
    ]);
  }
};

modes.gcm.prototype.encrypt = function(input, output, finish) {
  // not enough input to encrypt
  var inputLength = input.length();
  if(inputLength === 0) {
    return true;
  }

  // encrypt block
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // handle full block
  if(this._partialBytes === 0 && inputLength >= this.blockSize) {
    // XOR input with output
    for(var i = 0; i < this._ints; ++i) {
      output.putInt32(this._outBlock[i] ^= input.getInt32());
    }
    this._cipherLength += this.blockSize;
  } else {
    // handle partial block
    var partialBytes = (this.blockSize - inputLength) % this.blockSize;
    if(partialBytes > 0) {
      partialBytes = this.blockSize - partialBytes;
    }

    // XOR input with output
    this._partialOutput.clear();
    for(var i = 0; i < this._ints; ++i) {
      this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i]);
    }

    if(partialBytes <= 0 || finish) {
      // handle overflow prior to hashing
      if(finish) {
        // get block overflow
        var overflow = inputLength % this.blockSize;
        this._cipherLength += overflow;
        // truncate for hash function
        this._partialOutput.truncate(this.blockSize - overflow);
      } else {
        this._cipherLength += this.blockSize;
      }

      // get output block for hashing
      for(var i = 0; i < this._ints; ++i) {
        this._outBlock[i] = this._partialOutput.getInt32();
      }
      this._partialOutput.read -= this.blockSize;
    }

    // skip any previous partial bytes
    if(this._partialBytes > 0) {
      this._partialOutput.getBytes(this._partialBytes);
    }

    if(partialBytes > 0 && !finish) {
      // block still incomplete, restore input buffer, get partial output,
      // and return early
      input.read -= this.blockSize;
      output.putBytes(this._partialOutput.getBytes(
        partialBytes - this._partialBytes));
      this._partialBytes = partialBytes;
      return true;
    }

    output.putBytes(this._partialOutput.getBytes(
      inputLength - this._partialBytes));
    this._partialBytes = 0;
  }

  // update hash block S
  this._s = this.ghash(this._hashSubkey, this._s, this._outBlock);

  // increment counter (input block)
  inc32(this._inBlock);
};

modes.gcm.prototype.decrypt = function(input, output, finish) {
  // not enough input to decrypt
  var inputLength = input.length();
  if(inputLength < this.blockSize && !(finish && inputLength > 0)) {
    return true;
  }

  // encrypt block (GCM always uses encryption mode)
  this.cipher.encrypt(this._inBlock, this._outBlock);

  // increment counter (input block)
  inc32(this._inBlock);

  // update hash block S
  this._hashBlock[0] = input.getInt32();
  this._hashBlock[1] = input.getInt32();
  this._hashBlock[2] = input.getInt32();
  this._hashBlock[3] = input.getInt32();
  this._s = this.ghash(this._hashSubkey, this._s, this._hashBlock);

  // XOR hash input with output
  for(var i = 0; i < this._ints; ++i) {
    output.putInt32(this._outBlock[i] ^ this._hashBlock[i]);
  }

  // increment cipher data length
  if(inputLength < this.blockSize) {
    this._cipherLength += inputLength % this.blockSize;
  } else {
    this._cipherLength += this.blockSize;
  }
};

modes.gcm.prototype.afterFinish = function(output, options) {
  var rval = true;

  // handle overflow
  if(options.decrypt && options.overflow) {
    output.truncate(this.blockSize - options.overflow);
  }

  // handle authentication tag
  this.tag = forge$C.util.createBuffer();

  // concatenate additional data length with cipher length
  var lengths = this._aDataLength.concat(from64To32(this._cipherLength * 8));

  // include lengths in hash
  this._s = this.ghash(this._hashSubkey, this._s, lengths);

  // do GCTR(J_0, S)
  var tag = [];
  this.cipher.encrypt(this._j0, tag);
  for(var i = 0; i < this._ints; ++i) {
    this.tag.putInt32(this._s[i] ^ tag[i]);
  }

  // trim tag to length
  this.tag.truncate(this.tag.length() % (this._tagLength / 8));

  // check authentication tag
  if(options.decrypt && this.tag.bytes() !== this._tag) {
    rval = false;
  }

  return rval;
};

/**
 * See NIST SP-800-38D 6.3 (Algorithm 1). This function performs Galois
 * field multiplication. The field, GF(2^128), is defined by the polynomial:
 *
 * x^128 + x^7 + x^2 + x + 1
 *
 * Which is represented in little-endian binary form as: 11100001 (0xe1). When
 * the value of a coefficient is 1, a bit is set. The value R, is the
 * concatenation of this value and 120 zero bits, yielding a 128-bit value
 * which matches the block size.
 *
 * This function will multiply two elements (vectors of bytes), X and Y, in
 * the field GF(2^128). The result is initialized to zero. For each bit of
 * X (out of 128), x_i, if x_i is set, then the result is multiplied (XOR'd)
 * by the current value of Y. For each bit, the value of Y will be raised by
 * a power of x (multiplied by the polynomial x). This can be achieved by
 * shifting Y once to the right. If the current value of Y, prior to being
 * multiplied by x, has 0 as its LSB, then it is a 127th degree polynomial.
 * Otherwise, we must divide by R after shifting to find the remainder.
 *
 * @param x the first block to multiply by the second.
 * @param y the second block to multiply by the first.
 *
 * @return the block result of the multiplication.
 */
modes.gcm.prototype.multiply = function(x, y) {
  var z_i = [0, 0, 0, 0];
  var v_i = y.slice(0);

  // calculate Z_128 (block has 128 bits)
  for(var i = 0; i < 128; ++i) {
    // if x_i is 0, Z_{i+1} = Z_i (unchanged)
    // else Z_{i+1} = Z_i ^ V_i
    // get x_i by finding 32-bit int position, then left shift 1 by remainder
    var x_i = x[(i / 32) | 0] & (1 << (31 - i % 32));
    if(x_i) {
      z_i[0] ^= v_i[0];
      z_i[1] ^= v_i[1];
      z_i[2] ^= v_i[2];
      z_i[3] ^= v_i[3];
    }

    // if LSB(V_i) is 1, V_i = V_i >> 1
    // else V_i = (V_i >> 1) ^ R
    this.pow(v_i, v_i);
  }

  return z_i;
};

modes.gcm.prototype.pow = function(x, out) {
  // if LSB(x) is 1, x = x >>> 1
  // else x = (x >>> 1) ^ R
  var lsb = x[3] & 1;

  // always do x >>> 1:
  // starting with the rightmost integer, shift each integer to the right
  // one bit, pulling in the bit from the integer to the left as its top
  // most bit (do this for the last 3 integers)
  for(var i = 3; i > 0; --i) {
    out[i] = (x[i] >>> 1) | ((x[i - 1] & 1) << 31);
  }
  // shift the first integer normally
  out[0] = x[0] >>> 1;

  // if lsb was not set, then polynomial had a degree of 127 and doesn't
  // need to divided; otherwise, XOR with R to find the remainder; we only
  // need to XOR the first integer since R technically ends w/120 zero bits
  if(lsb) {
    out[0] ^= this._R;
  }
};

modes.gcm.prototype.tableMultiply = function(x) {
  // assumes 4-bit tables are used
  var z = [0, 0, 0, 0];
  for(var i = 0; i < 32; ++i) {
    var idx = (i / 8) | 0;
    var x_i = (x[idx] >>> ((7 - (i % 8)) * 4)) & 0xF;
    var ah = this._m[i][x_i];
    z[0] ^= ah[0];
    z[1] ^= ah[1];
    z[2] ^= ah[2];
    z[3] ^= ah[3];
  }
  return z;
};

/**
 * A continuing version of the GHASH algorithm that operates on a single
 * block. The hash block, last hash value (Ym) and the new block to hash
 * are given.
 *
 * @param h the hash block.
 * @param y the previous value for Ym, use [0, 0, 0, 0] for a new hash.
 * @param x the block to hash.
 *
 * @return the hashed value (Ym).
 */
modes.gcm.prototype.ghash = function(h, y, x) {
  y[0] ^= x[0];
  y[1] ^= x[1];
  y[2] ^= x[2];
  y[3] ^= x[3];
  return this.tableMultiply(y);
  //return this.multiply(y, h);
};

/**
 * Precomputes a table for multiplying against the hash subkey. This
 * mechanism provides a substantial speed increase over multiplication
 * performed without a table. The table-based multiplication this table is
 * for solves X * H by multiplying each component of X by H and then
 * composing the results together using XOR.
 *
 * This function can be used to generate tables with different bit sizes
 * for the components, however, this implementation assumes there are
 * 32 components of X (which is a 16 byte vector), therefore each component
 * takes 4-bits (so the table is constructed with bits=4).
 *
 * @param h the hash subkey.
 * @param bits the bit size for a component.
 */
modes.gcm.prototype.generateHashTable = function(h, bits) {
  // TODO: There are further optimizations that would use only the
  // first table M_0 (or some variant) along with a remainder table;
  // this can be explored in the future
  var multiplier = 8 / bits;
  var perInt = 4 * multiplier;
  var size = 16 * multiplier;
  var m = new Array(size);
  for(var i = 0; i < size; ++i) {
    var tmp = [0, 0, 0, 0];
    var idx = (i / perInt) | 0;
    var shft = ((perInt - 1 - (i % perInt)) * bits);
    tmp[idx] = (1 << (bits - 1)) << shft;
    m[i] = this.generateSubHashTable(this.multiply(tmp, h), bits);
  }
  return m;
};

/**
 * Generates a table for multiplying against the hash subkey for one
 * particular component (out of all possible component values).
 *
 * @param mid the pre-multiplied value for the middle key of the table.
 * @param bits the bit size for a component.
 */
modes.gcm.prototype.generateSubHashTable = function(mid, bits) {
  // compute the table quickly by minimizing the number of
  // POW operations -- they only need to be performed for powers of 2,
  // all other entries can be composed from those powers using XOR
  var size = 1 << bits;
  var half = size >>> 1;
  var m = new Array(size);
  m[half] = mid.slice(0);
  var i = half >>> 1;
  while(i > 0) {
    // raise m0[2 * i] and store in m0[i]
    this.pow(m[2 * i], m[i] = []);
    i >>= 1;
  }
  i = 2;
  while(i < half) {
    for(var j = 1; j < i; ++j) {
      var m_i = m[i];
      var m_j = m[j];
      m[i + j] = [
        m_i[0] ^ m_j[0],
        m_i[1] ^ m_j[1],
        m_i[2] ^ m_j[2],
        m_i[3] ^ m_j[3]
      ];
    }
    i *= 2;
  }
  m[0] = [0, 0, 0, 0];
  /* Note: We could avoid storing these by doing composition during multiply
  calculate top half using composition by speed is preferred. */
  for(i = half + 1; i < size; ++i) {
    var c = m[i ^ half];
    m[i] = [mid[0] ^ c[0], mid[1] ^ c[1], mid[2] ^ c[2], mid[3] ^ c[3]];
  }
  return m;
};

/** Utility functions */

function transformIV(iv, blockSize) {
  if(typeof iv === 'string') {
    // convert iv string into byte buffer
    iv = forge$C.util.createBuffer(iv);
  }

  if(forge$C.util.isArray(iv) && iv.length > 4) {
    // convert iv byte array into byte buffer
    var tmp = iv;
    iv = forge$C.util.createBuffer();
    for(var i = 0; i < tmp.length; ++i) {
      iv.putByte(tmp[i]);
    }
  }

  if(iv.length() < blockSize) {
    throw new Error(
      'Invalid IV length; got ' + iv.length() +
      ' bytes and expected ' + blockSize + ' bytes.');
  }

  if(!forge$C.util.isArray(iv)) {
    // convert iv byte buffer into 32-bit integer array
    var ints = [];
    var blocks = blockSize / 4;
    for(var i = 0; i < blocks; ++i) {
      ints.push(iv.getInt32());
    }
    iv = ints;
  }

  return iv;
}

function inc32(block) {
  // increment last 32 bits of block only
  block[block.length - 1] = (block[block.length - 1] + 1) & 0xFFFFFFFF;
}

function from64To32(num) {
  // convert 64-bit number to two BE Int32s
  return [(num / 0x100000000) | 0, num & 0xFFFFFFFF];
}

/**
 * Advanced Encryption Standard (AES) implementation.
 *
 * This implementation is based on the public domain library 'jscrypto' which
 * was written by:
 *
 * Emily Stark (estark@stanford.edu)
 * Mike Hamburg (mhamburg@stanford.edu)
 * Dan Boneh (dabo@cs.stanford.edu)
 *
 * Parts of this code are based on the OpenSSL implementation of AES:
 * http://www.openssl.org
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */

var forge$B = forge$F;




/* AES API */
forge$B.aes = forge$B.aes || {};

/**
 * Deprecated. Instead, use:
 *
 * var cipher = forge.cipher.createCipher('AES-<mode>', key);
 * cipher.start({iv: iv});
 *
 * Creates an AES cipher object to encrypt data using the given symmetric key.
 * The output will be stored in the 'output' member of the returned cipher.
 *
 * The key and iv may be given as a string of bytes, an array of bytes,
 * a byte buffer, or an array of 32-bit words.
 *
 * @param key the symmetric key to use.
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$B.aes.startEncrypting = function(key, iv, output, mode) {
  var cipher = _createCipher$1({
    key: key,
    output: output,
    decrypt: false,
    mode: mode
  });
  cipher.start(iv);
  return cipher;
};

/**
 * Deprecated. Instead, use:
 *
 * var cipher = forge.cipher.createCipher('AES-<mode>', key);
 *
 * Creates an AES cipher object to encrypt data using the given symmetric key.
 *
 * The key may be given as a string of bytes, an array of bytes, a
 * byte buffer, or an array of 32-bit words.
 *
 * @param key the symmetric key to use.
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$B.aes.createEncryptionCipher = function(key, mode) {
  return _createCipher$1({
    key: key,
    output: null,
    decrypt: false,
    mode: mode
  });
};

/**
 * Deprecated. Instead, use:
 *
 * var decipher = forge.cipher.createDecipher('AES-<mode>', key);
 * decipher.start({iv: iv});
 *
 * Creates an AES cipher object to decrypt data using the given symmetric key.
 * The output will be stored in the 'output' member of the returned cipher.
 *
 * The key and iv may be given as a string of bytes, an array of bytes,
 * a byte buffer, or an array of 32-bit words.
 *
 * @param key the symmetric key to use.
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$B.aes.startDecrypting = function(key, iv, output, mode) {
  var cipher = _createCipher$1({
    key: key,
    output: output,
    decrypt: true,
    mode: mode
  });
  cipher.start(iv);
  return cipher;
};

/**
 * Deprecated. Instead, use:
 *
 * var decipher = forge.cipher.createDecipher('AES-<mode>', key);
 *
 * Creates an AES cipher object to decrypt data using the given symmetric key.
 *
 * The key may be given as a string of bytes, an array of bytes, a
 * byte buffer, or an array of 32-bit words.
 *
 * @param key the symmetric key to use.
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$B.aes.createDecryptionCipher = function(key, mode) {
  return _createCipher$1({
    key: key,
    output: null,
    decrypt: true,
    mode: mode
  });
};

/**
 * Creates a new AES cipher algorithm object.
 *
 * @param name the name of the algorithm.
 * @param mode the mode factory function.
 *
 * @return the AES algorithm object.
 */
forge$B.aes.Algorithm = function(name, mode) {
  if(!init) {
    initialize();
  }
  var self = this;
  self.name = name;
  self.mode = new mode({
    blockSize: 16,
    cipher: {
      encrypt: function(inBlock, outBlock) {
        return _updateBlock$1(self._w, inBlock, outBlock, false);
      },
      decrypt: function(inBlock, outBlock) {
        return _updateBlock$1(self._w, inBlock, outBlock, true);
      }
    }
  });
  self._init = false;
};

/**
 * Initializes this AES algorithm by expanding its key.
 *
 * @param options the options to use.
 *          key the key to use with this algorithm.
 *          decrypt true if the algorithm should be initialized for decryption,
 *            false for encryption.
 */
forge$B.aes.Algorithm.prototype.initialize = function(options) {
  if(this._init) {
    return;
  }

  var key = options.key;
  var tmp;

  /* Note: The key may be a string of bytes, an array of bytes, a byte
    buffer, or an array of 32-bit integers. If the key is in bytes, then
    it must be 16, 24, or 32 bytes in length. If it is in 32-bit
    integers, it must be 4, 6, or 8 integers long. */

  if(typeof key === 'string' &&
    (key.length === 16 || key.length === 24 || key.length === 32)) {
    // convert key string into byte buffer
    key = forge$B.util.createBuffer(key);
  } else if(forge$B.util.isArray(key) &&
    (key.length === 16 || key.length === 24 || key.length === 32)) {
    // convert key integer array into byte buffer
    tmp = key;
    key = forge$B.util.createBuffer();
    for(var i = 0; i < tmp.length; ++i) {
      key.putByte(tmp[i]);
    }
  }

  // convert key byte buffer into 32-bit integer array
  if(!forge$B.util.isArray(key)) {
    tmp = key;
    key = [];

    // key lengths of 16, 24, 32 bytes allowed
    var len = tmp.length();
    if(len === 16 || len === 24 || len === 32) {
      len = len >>> 2;
      for(var i = 0; i < len; ++i) {
        key.push(tmp.getInt32());
      }
    }
  }

  // key must be an array of 32-bit integers by now
  if(!forge$B.util.isArray(key) ||
    !(key.length === 4 || key.length === 6 || key.length === 8)) {
    throw new Error('Invalid key parameter.');
  }

  // encryption operation is always used for these modes
  var mode = this.mode.name;
  var encryptOp = (['CFB', 'OFB', 'CTR', 'GCM'].indexOf(mode) !== -1);

  // do key expansion
  this._w = _expandKey(key, options.decrypt && !encryptOp);
  this._init = true;
};

/**
 * Expands a key. Typically only used for testing.
 *
 * @param key the symmetric key to expand, as an array of 32-bit words.
 * @param decrypt true to expand for decryption, false for encryption.
 *
 * @return the expanded key.
 */
forge$B.aes._expandKey = function(key, decrypt) {
  if(!init) {
    initialize();
  }
  return _expandKey(key, decrypt);
};

/**
 * Updates a single block. Typically only used for testing.
 *
 * @param w the expanded key to use.
 * @param input an array of block-size 32-bit words.
 * @param output an array of block-size 32-bit words.
 * @param decrypt true to decrypt, false to encrypt.
 */
forge$B.aes._updateBlock = _updateBlock$1;

/** Register AES algorithms **/

registerAlgorithm$1('AES-ECB', forge$B.cipher.modes.ecb);
registerAlgorithm$1('AES-CBC', forge$B.cipher.modes.cbc);
registerAlgorithm$1('AES-CFB', forge$B.cipher.modes.cfb);
registerAlgorithm$1('AES-OFB', forge$B.cipher.modes.ofb);
registerAlgorithm$1('AES-CTR', forge$B.cipher.modes.ctr);
registerAlgorithm$1('AES-GCM', forge$B.cipher.modes.gcm);

function registerAlgorithm$1(name, mode) {
  var factory = function() {
    return new forge$B.aes.Algorithm(name, mode);
  };
  forge$B.cipher.registerAlgorithm(name, factory);
}

/** AES implementation **/

var init = false; // not yet initialized
var Nb = 4;       // number of words comprising the state (AES = 4)
var sbox;         // non-linear substitution table used in key expansion
var isbox;        // inversion of sbox
var rcon;         // round constant word array
var mix;          // mix-columns table
var imix;         // inverse mix-columns table

/**
 * Performs initialization, ie: precomputes tables to optimize for speed.
 *
 * One way to understand how AES works is to imagine that 'addition' and
 * 'multiplication' are interfaces that require certain mathematical
 * properties to hold true (ie: they are associative) but they might have
 * different implementations and produce different kinds of results ...
 * provided that their mathematical properties remain true. AES defines
 * its own methods of addition and multiplication but keeps some important
 * properties the same, ie: associativity and distributivity. The
 * explanation below tries to shed some light on how AES defines addition
 * and multiplication of bytes and 32-bit words in order to perform its
 * encryption and decryption algorithms.
 *
 * The basics:
 *
 * The AES algorithm views bytes as binary representations of polynomials
 * that have either 1 or 0 as the coefficients. It defines the addition
 * or subtraction of two bytes as the XOR operation. It also defines the
 * multiplication of two bytes as a finite field referred to as GF(2^8)
 * (Note: 'GF' means "Galois Field" which is a field that contains a finite
 * number of elements so GF(2^8) has 256 elements).
 *
 * This means that any two bytes can be represented as binary polynomials;
 * when they multiplied together and modularly reduced by an irreducible
 * polynomial of the 8th degree, the results are the field GF(2^8). The
 * specific irreducible polynomial that AES uses in hexadecimal is 0x11b.
 * This multiplication is associative with 0x01 as the identity:
 *
 * (b * 0x01 = GF(b, 0x01) = b).
 *
 * The operation GF(b, 0x02) can be performed at the byte level by left
 * shifting b once and then XOR'ing it (to perform the modular reduction)
 * with 0x11b if b is >= 128. Repeated application of the multiplication
 * of 0x02 can be used to implement the multiplication of any two bytes.
 *
 * For instance, multiplying 0x57 and 0x13, denoted as GF(0x57, 0x13), can
 * be performed by factoring 0x13 into 0x01, 0x02, and 0x10. Then these
 * factors can each be multiplied by 0x57 and then added together. To do
 * the multiplication, values for 0x57 multiplied by each of these 3 factors
 * can be precomputed and stored in a table. To add them, the values from
 * the table are XOR'd together.
 *
 * AES also defines addition and multiplication of words, that is 4-byte
 * numbers represented as polynomials of 3 degrees where the coefficients
 * are the values of the bytes.
 *
 * The word [a0, a1, a2, a3] is a polynomial a3x^3 + a2x^2 + a1x + a0.
 *
 * Addition is performed by XOR'ing like powers of x. Multiplication
 * is performed in two steps, the first is an algebriac expansion as
 * you would do normally (where addition is XOR). But the result is
 * a polynomial larger than 3 degrees and thus it cannot fit in a word. So
 * next the result is modularly reduced by an AES-specific polynomial of
 * degree 4 which will always produce a polynomial of less than 4 degrees
 * such that it will fit in a word. In AES, this polynomial is x^4 + 1.
 *
 * The modular product of two polynomials 'a' and 'b' is thus:
 *
 * d(x) = d3x^3 + d2x^2 + d1x + d0
 * with
 * d0 = GF(a0, b0) ^ GF(a3, b1) ^ GF(a2, b2) ^ GF(a1, b3)
 * d1 = GF(a1, b0) ^ GF(a0, b1) ^ GF(a3, b2) ^ GF(a2, b3)
 * d2 = GF(a2, b0) ^ GF(a1, b1) ^ GF(a0, b2) ^ GF(a3, b3)
 * d3 = GF(a3, b0) ^ GF(a2, b1) ^ GF(a1, b2) ^ GF(a0, b3)
 *
 * As a matrix:
 *
 * [d0] = [a0 a3 a2 a1][b0]
 * [d1]   [a1 a0 a3 a2][b1]
 * [d2]   [a2 a1 a0 a3][b2]
 * [d3]   [a3 a2 a1 a0][b3]
 *
 * Special polynomials defined by AES (0x02 == {02}):
 * a(x)    = {03}x^3 + {01}x^2 + {01}x + {02}
 * a^-1(x) = {0b}x^3 + {0d}x^2 + {09}x + {0e}.
 *
 * These polynomials are used in the MixColumns() and InverseMixColumns()
 * operations, respectively, to cause each element in the state to affect
 * the output (referred to as diffusing).
 *
 * RotWord() uses: a0 = a1 = a2 = {00} and a3 = {01}, which is the
 * polynomial x3.
 *
 * The ShiftRows() method modifies the last 3 rows in the state (where
 * the state is 4 words with 4 bytes per word) by shifting bytes cyclically.
 * The 1st byte in the second row is moved to the end of the row. The 1st
 * and 2nd bytes in the third row are moved to the end of the row. The 1st,
 * 2nd, and 3rd bytes are moved in the fourth row.
 *
 * More details on how AES arithmetic works:
 *
 * In the polynomial representation of binary numbers, XOR performs addition
 * and subtraction and multiplication in GF(2^8) denoted as GF(a, b)
 * corresponds with the multiplication of polynomials modulo an irreducible
 * polynomial of degree 8. In other words, for AES, GF(a, b) will multiply
 * polynomial 'a' with polynomial 'b' and then do a modular reduction by
 * an AES-specific irreducible polynomial of degree 8.
 *
 * A polynomial is irreducible if its only divisors are one and itself. For
 * the AES algorithm, this irreducible polynomial is:
 *
 * m(x) = x^8 + x^4 + x^3 + x + 1,
 *
 * or {01}{1b} in hexadecimal notation, where each coefficient is a bit:
 * 100011011 = 283 = 0x11b.
 *
 * For example, GF(0x57, 0x83) = 0xc1 because
 *
 * 0x57 = 87  = 01010111 = x^6 + x^4 + x^2 + x + 1
 * 0x85 = 131 = 10000101 = x^7 + x + 1
 *
 * (x^6 + x^4 + x^2 + x + 1) * (x^7 + x + 1)
 * =  x^13 + x^11 + x^9 + x^8 + x^7 +
 *    x^7 + x^5 + x^3 + x^2 + x +
 *    x^6 + x^4 + x^2 + x + 1
 * =  x^13 + x^11 + x^9 + x^8 + x^6 + x^5 + x^4 + x^3 + 1 = y
 *    y modulo (x^8 + x^4 + x^3 + x + 1)
 * =  x^7 + x^6 + 1.
 *
 * The modular reduction by m(x) guarantees the result will be a binary
 * polynomial of less than degree 8, so that it can fit in a byte.
 *
 * The operation to multiply a binary polynomial b with x (the polynomial
 * x in binary representation is 00000010) is:
 *
 * b_7x^8 + b_6x^7 + b_5x^6 + b_4x^5 + b_3x^4 + b_2x^3 + b_1x^2 + b_0x^1
 *
 * To get GF(b, x) we must reduce that by m(x). If b_7 is 0 (that is the
 * most significant bit is 0 in b) then the result is already reduced. If
 * it is 1, then we can reduce it by subtracting m(x) via an XOR.
 *
 * It follows that multiplication by x (00000010 or 0x02) can be implemented
 * by performing a left shift followed by a conditional bitwise XOR with
 * 0x1b. This operation on bytes is denoted by xtime(). Multiplication by
 * higher powers of x can be implemented by repeated application of xtime().
 *
 * By adding intermediate results, multiplication by any constant can be
 * implemented. For instance:
 *
 * GF(0x57, 0x13) = 0xfe because:
 *
 * xtime(b) = (b & 128) ? (b << 1 ^ 0x11b) : (b << 1)
 *
 * Note: We XOR with 0x11b instead of 0x1b because in javascript our
 * datatype for b can be larger than 1 byte, so a left shift will not
 * automatically eliminate bits that overflow a byte ... by XOR'ing the
 * overflow bit with 1 (the extra one from 0x11b) we zero it out.
 *
 * GF(0x57, 0x02) = xtime(0x57) = 0xae
 * GF(0x57, 0x04) = xtime(0xae) = 0x47
 * GF(0x57, 0x08) = xtime(0x47) = 0x8e
 * GF(0x57, 0x10) = xtime(0x8e) = 0x07
 *
 * GF(0x57, 0x13) = GF(0x57, (0x01 ^ 0x02 ^ 0x10))
 *
 * And by the distributive property (since XOR is addition and GF() is
 * multiplication):
 *
 * = GF(0x57, 0x01) ^ GF(0x57, 0x02) ^ GF(0x57, 0x10)
 * = 0x57 ^ 0xae ^ 0x07
 * = 0xfe.
 */
function initialize() {
  init = true;

  /* Populate the Rcon table. These are the values given by
    [x^(i-1),{00},{00},{00}] where x^(i-1) are powers of x (and x = 0x02)
    in the field of GF(2^8), where i starts at 1.

    rcon[0] = [0x00, 0x00, 0x00, 0x00]
    rcon[1] = [0x01, 0x00, 0x00, 0x00] 2^(1-1) = 2^0 = 1
    rcon[2] = [0x02, 0x00, 0x00, 0x00] 2^(2-1) = 2^1 = 2
    ...
    rcon[9]  = [0x1B, 0x00, 0x00, 0x00] 2^(9-1)  = 2^8 = 0x1B
    rcon[10] = [0x36, 0x00, 0x00, 0x00] 2^(10-1) = 2^9 = 0x36

    We only store the first byte because it is the only one used.
  */
  rcon = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36];

  // compute xtime table which maps i onto GF(i, 0x02)
  var xtime = new Array(256);
  for(var i = 0; i < 128; ++i) {
    xtime[i] = i << 1;
    xtime[i + 128] = (i + 128) << 1 ^ 0x11B;
  }

  // compute all other tables
  sbox = new Array(256);
  isbox = new Array(256);
  mix = new Array(4);
  imix = new Array(4);
  for(var i = 0; i < 4; ++i) {
    mix[i] = new Array(256);
    imix[i] = new Array(256);
  }
  var e = 0, ei = 0, e2, e4, e8, sx, sx2, me, ime;
  for(var i = 0; i < 256; ++i) {
    /* We need to generate the SubBytes() sbox and isbox tables so that
      we can perform byte substitutions. This requires us to traverse
      all of the elements in GF, find their multiplicative inverses,
      and apply to each the following affine transformation:

      bi' = bi ^ b(i + 4) mod 8 ^ b(i + 5) mod 8 ^ b(i + 6) mod 8 ^
            b(i + 7) mod 8 ^ ci
      for 0 <= i < 8, where bi is the ith bit of the byte, and ci is the
      ith bit of a byte c with the value {63} or {01100011}.

      It is possible to traverse every possible value in a Galois field
      using what is referred to as a 'generator'. There are many
      generators (128 out of 256): 3,5,6,9,11,82 to name a few. To fully
      traverse GF we iterate 255 times, multiplying by our generator
      each time.

      On each iteration we can determine the multiplicative inverse for
      the current element.

      Suppose there is an element in GF 'e'. For a given generator 'g',
      e = g^x. The multiplicative inverse of e is g^(255 - x). It turns
      out that if use the inverse of a generator as another generator
      it will produce all of the corresponding multiplicative inverses
      at the same time. For this reason, we choose 5 as our inverse
      generator because it only requires 2 multiplies and 1 add and its
      inverse, 82, requires relatively few operations as well.

      In order to apply the affine transformation, the multiplicative
      inverse 'ei' of 'e' can be repeatedly XOR'd (4 times) with a
      bit-cycling of 'ei'. To do this 'ei' is first stored in 's' and
      'x'. Then 's' is left shifted and the high bit of 's' is made the
      low bit. The resulting value is stored in 's'. Then 'x' is XOR'd
      with 's' and stored in 'x'. On each subsequent iteration the same
      operation is performed. When 4 iterations are complete, 'x' is
      XOR'd with 'c' (0x63) and the transformed value is stored in 'x'.
      For example:

      s = 01000001
      x = 01000001

      iteration 1: s = 10000010, x ^= s
      iteration 2: s = 00000101, x ^= s
      iteration 3: s = 00001010, x ^= s
      iteration 4: s = 00010100, x ^= s
      x ^= 0x63

      This can be done with a loop where s = (s << 1) | (s >> 7). However,
      it can also be done by using a single 16-bit (in this case 32-bit)
      number 'sx'. Since XOR is an associative operation, we can set 'sx'
      to 'ei' and then XOR it with 'sx' left-shifted 1,2,3, and 4 times.
      The most significant bits will flow into the high 8 bit positions
      and be correctly XOR'd with one another. All that remains will be
      to cycle the high 8 bits by XOR'ing them all with the lower 8 bits
      afterwards.

      At the same time we're populating sbox and isbox we can precompute
      the multiplication we'll need to do to do MixColumns() later.
    */

    // apply affine transformation
    sx = ei ^ (ei << 1) ^ (ei << 2) ^ (ei << 3) ^ (ei << 4);
    sx = (sx >> 8) ^ (sx & 255) ^ 0x63;

    // update tables
    sbox[e] = sx;
    isbox[sx] = e;

    /* Mixing columns is done using matrix multiplication. The columns
      that are to be mixed are each a single word in the current state.
      The state has Nb columns (4 columns). Therefore each column is a
      4 byte word. So to mix the columns in a single column 'c' where
      its rows are r0, r1, r2, and r3, we use the following matrix
      multiplication:

      [2 3 1 1]*[r0,c]=[r'0,c]
      [1 2 3 1] [r1,c] [r'1,c]
      [1 1 2 3] [r2,c] [r'2,c]
      [3 1 1 2] [r3,c] [r'3,c]

      r0, r1, r2, and r3 are each 1 byte of one of the words in the
      state (a column). To do matrix multiplication for each mixed
      column c' we multiply the corresponding row from the left matrix
      with the corresponding column from the right matrix. In total, we
      get 4 equations:

      r0,c' = 2*r0,c + 3*r1,c + 1*r2,c + 1*r3,c
      r1,c' = 1*r0,c + 2*r1,c + 3*r2,c + 1*r3,c
      r2,c' = 1*r0,c + 1*r1,c + 2*r2,c + 3*r3,c
      r3,c' = 3*r0,c + 1*r1,c + 1*r2,c + 2*r3,c

      As usual, the multiplication is as previously defined and the
      addition is XOR. In order to optimize mixing columns we can store
      the multiplication results in tables. If you think of the whole
      column as a word (it might help to visualize by mentally rotating
      the equations above by counterclockwise 90 degrees) then you can
      see that it would be useful to map the multiplications performed on
      each byte (r0, r1, r2, r3) onto a word as well. For instance, we
      could map 2*r0,1*r0,1*r0,3*r0 onto a word by storing 2*r0 in the
      highest 8 bits and 3*r0 in the lowest 8 bits (with the other two
      respectively in the middle). This means that a table can be
      constructed that uses r0 as an index to the word. We can do the
      same with r1, r2, and r3, creating a total of 4 tables.

      To construct a full c', we can just look up each byte of c in
      their respective tables and XOR the results together.

      Also, to build each table we only have to calculate the word
      for 2,1,1,3 for every byte ... which we can do on each iteration
      of this loop since we will iterate over every byte. After we have
      calculated 2,1,1,3 we can get the results for the other tables
      by cycling the byte at the end to the beginning. For instance
      we can take the result of table 2,1,1,3 and produce table 3,2,1,1
      by moving the right most byte to the left most position just like
      how you can imagine the 3 moved out of 2,1,1,3 and to the front
      to produce 3,2,1,1.

      There is another optimization in that the same multiples of
      the current element we need in order to advance our generator
      to the next iteration can be reused in performing the 2,1,1,3
      calculation. We also calculate the inverse mix column tables,
      with e,9,d,b being the inverse of 2,1,1,3.

      When we're done, and we need to actually mix columns, the first
      byte of each state word should be put through mix[0] (2,1,1,3),
      the second through mix[1] (3,2,1,1) and so forth. Then they should
      be XOR'd together to produce the fully mixed column.
    */

    // calculate mix and imix table values
    sx2 = xtime[sx];
    e2 = xtime[e];
    e4 = xtime[e2];
    e8 = xtime[e4];
    me =
      (sx2 << 24) ^  // 2
      (sx << 16) ^   // 1
      (sx << 8) ^    // 1
      (sx ^ sx2);    // 3
    ime =
      (e2 ^ e4 ^ e8) << 24 ^  // E (14)
      (e ^ e8) << 16 ^        // 9
      (e ^ e4 ^ e8) << 8 ^    // D (13)
      (e ^ e2 ^ e8);          // B (11)
    // produce each of the mix tables by rotating the 2,1,1,3 value
    for(var n = 0; n < 4; ++n) {
      mix[n][e] = me;
      imix[n][sx] = ime;
      // cycle the right most byte to the left most position
      // ie: 2,1,1,3 becomes 3,2,1,1
      me = me << 24 | me >>> 8;
      ime = ime << 24 | ime >>> 8;
    }

    // get next element and inverse
    if(e === 0) {
      // 1 is the inverse of 1
      e = ei = 1;
    } else {
      // e = 2e + 2*2*2*(10e)) = multiply e by 82 (chosen generator)
      // ei = ei + 2*2*ei = multiply ei by 5 (inverse generator)
      e = e2 ^ xtime[xtime[xtime[e2 ^ e8]]];
      ei ^= xtime[xtime[ei]];
    }
  }
}

/**
 * Generates a key schedule using the AES key expansion algorithm.
 *
 * The AES algorithm takes the Cipher Key, K, and performs a Key Expansion
 * routine to generate a key schedule. The Key Expansion generates a total
 * of Nb*(Nr + 1) words: the algorithm requires an initial set of Nb words,
 * and each of the Nr rounds requires Nb words of key data. The resulting
 * key schedule consists of a linear array of 4-byte words, denoted [wi ],
 * with i in the range 0 <= i < Nb(Nr + 1).
 *
 * KeyExpansion(byte key[4*Nk], word w[Nb*(Nr+1)], Nk)
 * AES-128 (Nb=4, Nk=4, Nr=10)
 * AES-192 (Nb=4, Nk=6, Nr=12)
 * AES-256 (Nb=4, Nk=8, Nr=14)
 * Note: Nr=Nk+6.
 *
 * Nb is the number of columns (32-bit words) comprising the State (or
 * number of bytes in a block). For AES, Nb=4.
 *
 * @param key the key to schedule (as an array of 32-bit words).
 * @param decrypt true to modify the key schedule to decrypt, false not to.
 *
 * @return the generated key schedule.
 */
function _expandKey(key, decrypt) {
  // copy the key's words to initialize the key schedule
  var w = key.slice(0);

  /* RotWord() will rotate a word, moving the first byte to the last
    byte's position (shifting the other bytes left).

    We will be getting the value of Rcon at i / Nk. 'i' will iterate
    from Nk to (Nb * Nr+1). Nk = 4 (4 byte key), Nb = 4 (4 words in
    a block), Nr = Nk + 6 (10). Therefore 'i' will iterate from
    4 to 44 (exclusive). Each time we iterate 4 times, i / Nk will
    increase by 1. We use a counter iNk to keep track of this.
   */

  // go through the rounds expanding the key
  var temp, iNk = 1;
  var Nk = w.length;
  var Nr1 = Nk + 6 + 1;
  var end = Nb * Nr1;
  for(var i = Nk; i < end; ++i) {
    temp = w[i - 1];
    if(i % Nk === 0) {
      // temp = SubWord(RotWord(temp)) ^ Rcon[i / Nk]
      temp =
        sbox[temp >>> 16 & 255] << 24 ^
        sbox[temp >>> 8 & 255] << 16 ^
        sbox[temp & 255] << 8 ^
        sbox[temp >>> 24] ^ (rcon[iNk] << 24);
      iNk++;
    } else if(Nk > 6 && (i % Nk === 4)) {
      // temp = SubWord(temp)
      temp =
        sbox[temp >>> 24] << 24 ^
        sbox[temp >>> 16 & 255] << 16 ^
        sbox[temp >>> 8 & 255] << 8 ^
        sbox[temp & 255];
    }
    w[i] = w[i - Nk] ^ temp;
  }

  /* When we are updating a cipher block we always use the code path for
     encryption whether we are decrypting or not (to shorten code and
     simplify the generation of look up tables). However, because there
     are differences in the decryption algorithm, other than just swapping
     in different look up tables, we must transform our key schedule to
     account for these changes:

     1. The decryption algorithm gets its key rounds in reverse order.
     2. The decryption algorithm adds the round key before mixing columns
       instead of afterwards.

     We don't need to modify our key schedule to handle the first case,
     we can just traverse the key schedule in reverse order when decrypting.

     The second case requires a little work.

     The tables we built for performing rounds will take an input and then
     perform SubBytes() and MixColumns() or, for the decrypt version,
     InvSubBytes() and InvMixColumns(). But the decrypt algorithm requires
     us to AddRoundKey() before InvMixColumns(). This means we'll need to
     apply some transformations to the round key to inverse-mix its columns
     so they'll be correct for moving AddRoundKey() to after the state has
     had its columns inverse-mixed.

     To inverse-mix the columns of the state when we're decrypting we use a
     lookup table that will apply InvSubBytes() and InvMixColumns() at the
     same time. However, the round key's bytes are not inverse-substituted
     in the decryption algorithm. To get around this problem, we can first
     substitute the bytes in the round key so that when we apply the
     transformation via the InvSubBytes()+InvMixColumns() table, it will
     undo our substitution leaving us with the original value that we
     want -- and then inverse-mix that value.

     This change will correctly alter our key schedule so that we can XOR
     each round key with our already transformed decryption state. This
     allows us to use the same code path as the encryption algorithm.

     We make one more change to the decryption key. Since the decryption
     algorithm runs in reverse from the encryption algorithm, we reverse
     the order of the round keys to avoid having to iterate over the key
     schedule backwards when running the encryption algorithm later in
     decryption mode. In addition to reversing the order of the round keys,
     we also swap each round key's 2nd and 4th rows. See the comments
     section where rounds are performed for more details about why this is
     done. These changes are done inline with the other substitution
     described above.
  */
  if(decrypt) {
    var tmp;
    var m0 = imix[0];
    var m1 = imix[1];
    var m2 = imix[2];
    var m3 = imix[3];
    var wnew = w.slice(0);
    end = w.length;
    for(var i = 0, wi = end - Nb; i < end; i += Nb, wi -= Nb) {
      // do not sub the first or last round key (round keys are Nb
      // words) as no column mixing is performed before they are added,
      // but do change the key order
      if(i === 0 || i === (end - Nb)) {
        wnew[i] = w[wi];
        wnew[i + 1] = w[wi + 3];
        wnew[i + 2] = w[wi + 2];
        wnew[i + 3] = w[wi + 1];
      } else {
        // substitute each round key byte because the inverse-mix
        // table will inverse-substitute it (effectively cancel the
        // substitution because round key bytes aren't sub'd in
        // decryption mode) and swap indexes 3 and 1
        for(var n = 0; n < Nb; ++n) {
          tmp = w[wi + n];
          wnew[i + (3&-n)] =
            m0[sbox[tmp >>> 24]] ^
            m1[sbox[tmp >>> 16 & 255]] ^
            m2[sbox[tmp >>> 8 & 255]] ^
            m3[sbox[tmp & 255]];
        }
      }
    }
    w = wnew;
  }

  return w;
}

/**
 * Updates a single block (16 bytes) using AES. The update will either
 * encrypt or decrypt the block.
 *
 * @param w the key schedule.
 * @param input the input block (an array of 32-bit words).
 * @param output the updated output block.
 * @param decrypt true to decrypt the block, false to encrypt it.
 */
function _updateBlock$1(w, input, output, decrypt) {
  /*
  Cipher(byte in[4*Nb], byte out[4*Nb], word w[Nb*(Nr+1)])
  begin
    byte state[4,Nb]
    state = in
    AddRoundKey(state, w[0, Nb-1])
    for round = 1 step 1 to Nr-1
      SubBytes(state)
      ShiftRows(state)
      MixColumns(state)
      AddRoundKey(state, w[round*Nb, (round+1)*Nb-1])
    end for
    SubBytes(state)
    ShiftRows(state)
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
    out = state
  end

  InvCipher(byte in[4*Nb], byte out[4*Nb], word w[Nb*(Nr+1)])
  begin
    byte state[4,Nb]
    state = in
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
    for round = Nr-1 step -1 downto 1
      InvShiftRows(state)
      InvSubBytes(state)
      AddRoundKey(state, w[round*Nb, (round+1)*Nb-1])
      InvMixColumns(state)
    end for
    InvShiftRows(state)
    InvSubBytes(state)
    AddRoundKey(state, w[0, Nb-1])
    out = state
  end
  */

  // Encrypt: AddRoundKey(state, w[0, Nb-1])
  // Decrypt: AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
  var Nr = w.length / 4 - 1;
  var m0, m1, m2, m3, sub;
  if(decrypt) {
    m0 = imix[0];
    m1 = imix[1];
    m2 = imix[2];
    m3 = imix[3];
    sub = isbox;
  } else {
    m0 = mix[0];
    m1 = mix[1];
    m2 = mix[2];
    m3 = mix[3];
    sub = sbox;
  }
  var a, b, c, d, a2, b2, c2;
  a = input[0] ^ w[0];
  b = input[decrypt ? 3 : 1] ^ w[1];
  c = input[2] ^ w[2];
  d = input[decrypt ? 1 : 3] ^ w[3];
  var i = 3;

  /* In order to share code we follow the encryption algorithm when both
    encrypting and decrypting. To account for the changes required in the
    decryption algorithm, we use different lookup tables when decrypting
    and use a modified key schedule to account for the difference in the
    order of transformations applied when performing rounds. We also get
    key rounds in reverse order (relative to encryption). */
  for(var round = 1; round < Nr; ++round) {
    /* As described above, we'll be using table lookups to perform the
      column mixing. Each column is stored as a word in the state (the
      array 'input' has one column as a word at each index). In order to
      mix a column, we perform these transformations on each row in c,
      which is 1 byte in each word. The new column for c0 is c'0:

               m0      m1      m2      m3
      r0,c'0 = 2*r0,c0 + 3*r1,c0 + 1*r2,c0 + 1*r3,c0
      r1,c'0 = 1*r0,c0 + 2*r1,c0 + 3*r2,c0 + 1*r3,c0
      r2,c'0 = 1*r0,c0 + 1*r1,c0 + 2*r2,c0 + 3*r3,c0
      r3,c'0 = 3*r0,c0 + 1*r1,c0 + 1*r2,c0 + 2*r3,c0

      So using mix tables where c0 is a word with r0 being its upper
      8 bits and r3 being its lower 8 bits:

      m0[c0 >> 24] will yield this word: [2*r0,1*r0,1*r0,3*r0]
      ...
      m3[c0 & 255] will yield this word: [1*r3,1*r3,3*r3,2*r3]

      Therefore to mix the columns in each word in the state we
      do the following (& 255 omitted for brevity):
      c'0,r0 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r1 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r2 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r3 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]

      However, before mixing, the algorithm requires us to perform
      ShiftRows(). The ShiftRows() transformation cyclically shifts the
      last 3 rows of the state over different offsets. The first row
      (r = 0) is not shifted.

      s'_r,c = s_r,(c + shift(r, Nb) mod Nb
      for 0 < r < 4 and 0 <= c < Nb and
      shift(1, 4) = 1
      shift(2, 4) = 2
      shift(3, 4) = 3.

      This causes the first byte in r = 1 to be moved to the end of
      the row, the first 2 bytes in r = 2 to be moved to the end of
      the row, the first 3 bytes in r = 3 to be moved to the end of
      the row:

      r1: [c0 c1 c2 c3] => [c1 c2 c3 c0]
      r2: [c0 c1 c2 c3]    [c2 c3 c0 c1]
      r3: [c0 c1 c2 c3]    [c3 c0 c1 c2]

      We can make these substitutions inline with our column mixing to
      generate an updated set of equations to produce each word in the
      state (note the columns have changed positions):

      c0 c1 c2 c3 => c0 c1 c2 c3
      c0 c1 c2 c3    c1 c2 c3 c0  (cycled 1 byte)
      c0 c1 c2 c3    c2 c3 c0 c1  (cycled 2 bytes)
      c0 c1 c2 c3    c3 c0 c1 c2  (cycled 3 bytes)

      Therefore:

      c'0 = 2*r0,c0 + 3*r1,c1 + 1*r2,c2 + 1*r3,c3
      c'0 = 1*r0,c0 + 2*r1,c1 + 3*r2,c2 + 1*r3,c3
      c'0 = 1*r0,c0 + 1*r1,c1 + 2*r2,c2 + 3*r3,c3
      c'0 = 3*r0,c0 + 1*r1,c1 + 1*r2,c2 + 2*r3,c3

      c'1 = 2*r0,c1 + 3*r1,c2 + 1*r2,c3 + 1*r3,c0
      c'1 = 1*r0,c1 + 2*r1,c2 + 3*r2,c3 + 1*r3,c0
      c'1 = 1*r0,c1 + 1*r1,c2 + 2*r2,c3 + 3*r3,c0
      c'1 = 3*r0,c1 + 1*r1,c2 + 1*r2,c3 + 2*r3,c0

      ... and so forth for c'2 and c'3. The important distinction is
      that the columns are cycling, with c0 being used with the m0
      map when calculating c0, but c1 being used with the m0 map when
      calculating c1 ... and so forth.

      When performing the inverse we transform the mirror image and
      skip the bottom row, instead of the top one, and move upwards:

      c3 c2 c1 c0 => c0 c3 c2 c1  (cycled 3 bytes) *same as encryption
      c3 c2 c1 c0    c1 c0 c3 c2  (cycled 2 bytes)
      c3 c2 c1 c0    c2 c1 c0 c3  (cycled 1 byte)  *same as encryption
      c3 c2 c1 c0    c3 c2 c1 c0

      If you compare the resulting matrices for ShiftRows()+MixColumns()
      and for InvShiftRows()+InvMixColumns() the 2nd and 4th columns are
      different (in encrypt mode vs. decrypt mode). So in order to use
      the same code to handle both encryption and decryption, we will
      need to do some mapping.

      If in encryption mode we let a=c0, b=c1, c=c2, d=c3, and r<N> be
      a row number in the state, then the resulting matrix in encryption
      mode for applying the above transformations would be:

      r1: a b c d
      r2: b c d a
      r3: c d a b
      r4: d a b c

      If we did the same in decryption mode we would get:

      r1: a d c b
      r2: b a d c
      r3: c b a d
      r4: d c b a

      If instead we swap d and b (set b=c3 and d=c1), then we get:

      r1: a b c d
      r2: d a b c
      r3: c d a b
      r4: b c d a

      Now the 1st and 3rd rows are the same as the encryption matrix. All
      we need to do then to make the mapping exactly the same is to swap
      the 2nd and 4th rows when in decryption mode. To do this without
      having to do it on each iteration, we swapped the 2nd and 4th rows
      in the decryption key schedule. We also have to do the swap above
      when we first pull in the input and when we set the final output. */
    a2 =
      m0[a >>> 24] ^
      m1[b >>> 16 & 255] ^
      m2[c >>> 8 & 255] ^
      m3[d & 255] ^ w[++i];
    b2 =
      m0[b >>> 24] ^
      m1[c >>> 16 & 255] ^
      m2[d >>> 8 & 255] ^
      m3[a & 255] ^ w[++i];
    c2 =
      m0[c >>> 24] ^
      m1[d >>> 16 & 255] ^
      m2[a >>> 8 & 255] ^
      m3[b & 255] ^ w[++i];
    d =
      m0[d >>> 24] ^
      m1[a >>> 16 & 255] ^
      m2[b >>> 8 & 255] ^
      m3[c & 255] ^ w[++i];
    a = a2;
    b = b2;
    c = c2;
  }

  /*
    Encrypt:
    SubBytes(state)
    ShiftRows(state)
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])

    Decrypt:
    InvShiftRows(state)
    InvSubBytes(state)
    AddRoundKey(state, w[0, Nb-1])
   */
  // Note: rows are shifted inline
  output[0] =
    (sub[a >>> 24] << 24) ^
    (sub[b >>> 16 & 255] << 16) ^
    (sub[c >>> 8 & 255] << 8) ^
    (sub[d & 255]) ^ w[++i];
  output[decrypt ? 3 : 1] =
    (sub[b >>> 24] << 24) ^
    (sub[c >>> 16 & 255] << 16) ^
    (sub[d >>> 8 & 255] << 8) ^
    (sub[a & 255]) ^ w[++i];
  output[2] =
    (sub[c >>> 24] << 24) ^
    (sub[d >>> 16 & 255] << 16) ^
    (sub[a >>> 8 & 255] << 8) ^
    (sub[b & 255]) ^ w[++i];
  output[decrypt ? 1 : 3] =
    (sub[d >>> 24] << 24) ^
    (sub[a >>> 16 & 255] << 16) ^
    (sub[b >>> 8 & 255] << 8) ^
    (sub[c & 255]) ^ w[++i];
}

/**
 * Deprecated. Instead, use:
 *
 * forge.cipher.createCipher('AES-<mode>', key);
 * forge.cipher.createDecipher('AES-<mode>', key);
 *
 * Creates a deprecated AES cipher object. This object's mode will default to
 * CBC (cipher-block-chaining).
 *
 * The key and iv may be given as a string of bytes, an array of bytes, a
 * byte buffer, or an array of 32-bit words.
 *
 * @param options the options to use.
 *          key the symmetric key to use.
 *          output the buffer to write to.
 *          decrypt true for decryption, false for encryption.
 *          mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
function _createCipher$1(options) {
  options = options || {};
  var mode = (options.mode || 'CBC').toUpperCase();
  var algorithm = 'AES-' + mode;

  var cipher;
  if(options.decrypt) {
    cipher = forge$B.cipher.createDecipher(algorithm, options.key);
  } else {
    cipher = forge$B.cipher.createCipher(algorithm, options.key);
  }

  // backwards compatible start API
  var start = cipher.start;
  cipher.start = function(iv, options) {
    // backwards compatibility: support second arg as output buffer
    var output = null;
    if(options instanceof forge$B.util.ByteBuffer) {
      output = options;
      options = {};
    }
    options = options || {};
    options.output = output;
    options.iv = iv;
    start.call(cipher, options);
  };

  return cipher;
}

/**
 * Object IDs for ASN.1.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 */

var forge$A = forge$F;

forge$A.pki = forge$A.pki || {};
var oids$2 = forge$A.pki.oids = forge$A.oids = forge$A.oids || {};

// set id to name mapping and name to id mapping
function _IN(id, name) {
  oids$2[id] = name;
  oids$2[name] = id;
}
// set id to name mapping only
function _I_(id, name) {
  oids$2[id] = name;
}

// algorithm OIDs
_IN('1.2.840.113549.1.1.1', 'rsaEncryption');
// Note: md2 & md4 not implemented
//_IN('1.2.840.113549.1.1.2', 'md2WithRSAEncryption');
//_IN('1.2.840.113549.1.1.3', 'md4WithRSAEncryption');
_IN('1.2.840.113549.1.1.4', 'md5WithRSAEncryption');
_IN('1.2.840.113549.1.1.5', 'sha1WithRSAEncryption');
_IN('1.2.840.113549.1.1.7', 'RSAES-OAEP');
_IN('1.2.840.113549.1.1.8', 'mgf1');
_IN('1.2.840.113549.1.1.9', 'pSpecified');
_IN('1.2.840.113549.1.1.10', 'RSASSA-PSS');
_IN('1.2.840.113549.1.1.11', 'sha256WithRSAEncryption');
_IN('1.2.840.113549.1.1.12', 'sha384WithRSAEncryption');
_IN('1.2.840.113549.1.1.13', 'sha512WithRSAEncryption');
// Edwards-curve Digital Signature Algorithm (EdDSA) Ed25519
_IN('1.3.101.112', 'EdDSA25519');

_IN('1.2.840.10040.4.3', 'dsa-with-sha1');

_IN('1.3.14.3.2.7', 'desCBC');

_IN('1.3.14.3.2.26', 'sha1');
_IN('2.16.840.1.101.3.4.2.1', 'sha256');
_IN('2.16.840.1.101.3.4.2.2', 'sha384');
_IN('2.16.840.1.101.3.4.2.3', 'sha512');
_IN('1.2.840.113549.2.5', 'md5');

// pkcs#7 content types
_IN('1.2.840.113549.1.7.1', 'data');
_IN('1.2.840.113549.1.7.2', 'signedData');
_IN('1.2.840.113549.1.7.3', 'envelopedData');
_IN('1.2.840.113549.1.7.4', 'signedAndEnvelopedData');
_IN('1.2.840.113549.1.7.5', 'digestedData');
_IN('1.2.840.113549.1.7.6', 'encryptedData');

// pkcs#9 oids
_IN('1.2.840.113549.1.9.1', 'emailAddress');
_IN('1.2.840.113549.1.9.2', 'unstructuredName');
_IN('1.2.840.113549.1.9.3', 'contentType');
_IN('1.2.840.113549.1.9.4', 'messageDigest');
_IN('1.2.840.113549.1.9.5', 'signingTime');
_IN('1.2.840.113549.1.9.6', 'counterSignature');
_IN('1.2.840.113549.1.9.7', 'challengePassword');
_IN('1.2.840.113549.1.9.8', 'unstructuredAddress');
_IN('1.2.840.113549.1.9.14', 'extensionRequest');

_IN('1.2.840.113549.1.9.20', 'friendlyName');
_IN('1.2.840.113549.1.9.21', 'localKeyId');
_IN('1.2.840.113549.1.9.22.1', 'x509Certificate');

// pkcs#12 safe bags
_IN('1.2.840.113549.1.12.10.1.1', 'keyBag');
_IN('1.2.840.113549.1.12.10.1.2', 'pkcs8ShroudedKeyBag');
_IN('1.2.840.113549.1.12.10.1.3', 'certBag');
_IN('1.2.840.113549.1.12.10.1.4', 'crlBag');
_IN('1.2.840.113549.1.12.10.1.5', 'secretBag');
_IN('1.2.840.113549.1.12.10.1.6', 'safeContentsBag');

// password-based-encryption for pkcs#12
_IN('1.2.840.113549.1.5.13', 'pkcs5PBES2');
_IN('1.2.840.113549.1.5.12', 'pkcs5PBKDF2');

_IN('1.2.840.113549.1.12.1.1', 'pbeWithSHAAnd128BitRC4');
_IN('1.2.840.113549.1.12.1.2', 'pbeWithSHAAnd40BitRC4');
_IN('1.2.840.113549.1.12.1.3', 'pbeWithSHAAnd3-KeyTripleDES-CBC');
_IN('1.2.840.113549.1.12.1.4', 'pbeWithSHAAnd2-KeyTripleDES-CBC');
_IN('1.2.840.113549.1.12.1.5', 'pbeWithSHAAnd128BitRC2-CBC');
_IN('1.2.840.113549.1.12.1.6', 'pbewithSHAAnd40BitRC2-CBC');

// hmac OIDs
_IN('1.2.840.113549.2.7', 'hmacWithSHA1');
_IN('1.2.840.113549.2.8', 'hmacWithSHA224');
_IN('1.2.840.113549.2.9', 'hmacWithSHA256');
_IN('1.2.840.113549.2.10', 'hmacWithSHA384');
_IN('1.2.840.113549.2.11', 'hmacWithSHA512');

// symmetric key algorithm oids
_IN('1.2.840.113549.3.7', 'des-EDE3-CBC');
_IN('2.16.840.1.101.3.4.1.2', 'aes128-CBC');
_IN('2.16.840.1.101.3.4.1.22', 'aes192-CBC');
_IN('2.16.840.1.101.3.4.1.42', 'aes256-CBC');

// certificate issuer/subject OIDs
_IN('2.5.4.3', 'commonName');
_IN('2.5.4.5', 'serialName');
_IN('2.5.4.6', 'countryName');
_IN('2.5.4.7', 'localityName');
_IN('2.5.4.8', 'stateOrProvinceName');
_IN('2.5.4.9', 'streetAddress');
_IN('2.5.4.10', 'organizationName');
_IN('2.5.4.11', 'organizationalUnitName');
_IN('2.5.4.13', 'description');
_IN('2.5.4.15', 'businessCategory');
_IN('2.5.4.17', 'postalCode');
_IN('1.3.6.1.4.1.311.60.2.1.2', 'jurisdictionOfIncorporationStateOrProvinceName');
_IN('1.3.6.1.4.1.311.60.2.1.3', 'jurisdictionOfIncorporationCountryName');

// X.509 extension OIDs
_IN('2.16.840.1.113730.1.1', 'nsCertType');
_IN('2.16.840.1.113730.1.13', 'nsComment'); // deprecated in theory; still widely used
_I_('2.5.29.1', 'authorityKeyIdentifier'); // deprecated, use .35
_I_('2.5.29.2', 'keyAttributes'); // obsolete use .37 or .15
_I_('2.5.29.3', 'certificatePolicies'); // deprecated, use .32
_I_('2.5.29.4', 'keyUsageRestriction'); // obsolete use .37 or .15
_I_('2.5.29.5', 'policyMapping'); // deprecated use .33
_I_('2.5.29.6', 'subtreesConstraint'); // obsolete use .30
_I_('2.5.29.7', 'subjectAltName'); // deprecated use .17
_I_('2.5.29.8', 'issuerAltName'); // deprecated use .18
_I_('2.5.29.9', 'subjectDirectoryAttributes');
_I_('2.5.29.10', 'basicConstraints'); // deprecated use .19
_I_('2.5.29.11', 'nameConstraints'); // deprecated use .30
_I_('2.5.29.12', 'policyConstraints'); // deprecated use .36
_I_('2.5.29.13', 'basicConstraints'); // deprecated use .19
_IN('2.5.29.14', 'subjectKeyIdentifier');
_IN('2.5.29.15', 'keyUsage');
_I_('2.5.29.16', 'privateKeyUsagePeriod');
_IN('2.5.29.17', 'subjectAltName');
_IN('2.5.29.18', 'issuerAltName');
_IN('2.5.29.19', 'basicConstraints');
_I_('2.5.29.20', 'cRLNumber');
_I_('2.5.29.21', 'cRLReason');
_I_('2.5.29.22', 'expirationDate');
_I_('2.5.29.23', 'instructionCode');
_I_('2.5.29.24', 'invalidityDate');
_I_('2.5.29.25', 'cRLDistributionPoints'); // deprecated use .31
_I_('2.5.29.26', 'issuingDistributionPoint'); // deprecated use .28
_I_('2.5.29.27', 'deltaCRLIndicator');
_I_('2.5.29.28', 'issuingDistributionPoint');
_I_('2.5.29.29', 'certificateIssuer');
_I_('2.5.29.30', 'nameConstraints');
_IN('2.5.29.31', 'cRLDistributionPoints');
_IN('2.5.29.32', 'certificatePolicies');
_I_('2.5.29.33', 'policyMappings');
_I_('2.5.29.34', 'policyConstraints'); // deprecated use .36
_IN('2.5.29.35', 'authorityKeyIdentifier');
_I_('2.5.29.36', 'policyConstraints');
_IN('2.5.29.37', 'extKeyUsage');
_I_('2.5.29.46', 'freshestCRL');
_I_('2.5.29.54', 'inhibitAnyPolicy');

// extKeyUsage purposes
_IN('1.3.6.1.4.1.11129.2.4.2', 'timestampList');
_IN('1.3.6.1.5.5.7.1.1', 'authorityInfoAccess');
_IN('1.3.6.1.5.5.7.3.1', 'serverAuth');
_IN('1.3.6.1.5.5.7.3.2', 'clientAuth');
_IN('1.3.6.1.5.5.7.3.3', 'codeSigning');
_IN('1.3.6.1.5.5.7.3.4', 'emailProtection');
_IN('1.3.6.1.5.5.7.3.8', 'timeStamping');

/**
 * Javascript implementation of Abstract Syntax Notation Number One.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2015 Digital Bazaar, Inc.
 *
 * An API for storing data using the Abstract Syntax Notation Number One
 * format using DER (Distinguished Encoding Rules) encoding. This encoding is
 * commonly used to store data for PKI, i.e. X.509 Certificates, and this
 * implementation exists for that purpose.
 *
 * Abstract Syntax Notation Number One (ASN.1) is used to define the abstract
 * syntax of information without restricting the way the information is encoded
 * for transmission. It provides a standard that allows for open systems
 * communication. ASN.1 defines the syntax of information data and a number of
 * simple data types as well as a notation for describing them and specifying
 * values for them.
 *
 * The RSA algorithm creates public and private keys that are often stored in
 * X.509 or PKCS#X formats -- which use ASN.1 (encoded in DER format). This
 * class provides the most basic functionality required to store and load DSA
 * keys that are encoded according to ASN.1.
 *
 * The most common binary encodings for ASN.1 are BER (Basic Encoding Rules)
 * and DER (Distinguished Encoding Rules). DER is just a subset of BER that
 * has stricter requirements for how data must be encoded.
 *
 * Each ASN.1 structure has a tag (a byte identifying the ASN.1 structure type)
 * and a byte array for the value of this ASN1 structure which may be data or a
 * list of ASN.1 structures.
 *
 * Each ASN.1 structure using BER is (Tag-Length-Value):
 *
 * | byte 0 | bytes X | bytes Y |
 * |--------|---------|----------
 * |  tag   | length  |  value  |
 *
 * ASN.1 allows for tags to be of "High-tag-number form" which allows a tag to
 * be two or more octets, but that is not supported by this class. A tag is
 * only 1 byte. Bits 1-5 give the tag number (ie the data type within a
 * particular 'class'), 6 indicates whether or not the ASN.1 value is
 * constructed from other ASN.1 values, and bits 7 and 8 give the 'class'. If
 * bits 7 and 8 are both zero, the class is UNIVERSAL. If only bit 7 is set,
 * then the class is APPLICATION. If only bit 8 is set, then the class is
 * CONTEXT_SPECIFIC. If both bits 7 and 8 are set, then the class is PRIVATE.
 * The tag numbers for the data types for the class UNIVERSAL are listed below:
 *
 * UNIVERSAL 0 Reserved for use by the encoding rules
 * UNIVERSAL 1 Boolean type
 * UNIVERSAL 2 Integer type
 * UNIVERSAL 3 Bitstring type
 * UNIVERSAL 4 Octetstring type
 * UNIVERSAL 5 Null type
 * UNIVERSAL 6 Object identifier type
 * UNIVERSAL 7 Object descriptor type
 * UNIVERSAL 8 External type and Instance-of type
 * UNIVERSAL 9 Real type
 * UNIVERSAL 10 Enumerated type
 * UNIVERSAL 11 Embedded-pdv type
 * UNIVERSAL 12 UTF8String type
 * UNIVERSAL 13 Relative object identifier type
 * UNIVERSAL 14-15 Reserved for future editions
 * UNIVERSAL 16 Sequence and Sequence-of types
 * UNIVERSAL 17 Set and Set-of types
 * UNIVERSAL 18-22, 25-30 Character string types
 * UNIVERSAL 23-24 Time types
 *
 * The length of an ASN.1 structure is specified after the tag identifier.
 * There is a definite form and an indefinite form. The indefinite form may
 * be used if the encoding is constructed and not all immediately available.
 * The indefinite form is encoded using a length byte with only the 8th bit
 * set. The end of the constructed object is marked using end-of-contents
 * octets (two zero bytes).
 *
 * The definite form looks like this:
 *
 * The length may take up 1 or more bytes, it depends on the length of the
 * value of the ASN.1 structure. DER encoding requires that if the ASN.1
 * structure has a value that has a length greater than 127, more than 1 byte
 * will be used to store its length, otherwise just one byte will be used.
 * This is strict.
 *
 * In the case that the length of the ASN.1 value is less than 127, 1 octet
 * (byte) is used to store the "short form" length. The 8th bit has a value of
 * 0 indicating the length is "short form" and not "long form" and bits 7-1
 * give the length of the data. (The 8th bit is the left-most, most significant
 * bit: also known as big endian or network format).
 *
 * In the case that the length of the ASN.1 value is greater than 127, 2 to
 * 127 octets (bytes) are used to store the "long form" length. The first
 * byte's 8th bit is set to 1 to indicate the length is "long form." Bits 7-1
 * give the number of additional octets. All following octets are in base 256
 * with the most significant digit first (typical big-endian binary unsigned
 * integer storage). So, for instance, if the length of a value was 257, the
 * first byte would be set to:
 *
 * 10000010 = 130 = 0x82.
 *
 * This indicates there are 2 octets (base 256) for the length. The second and
 * third bytes (the octets just mentioned) would store the length in base 256:
 *
 * octet 2: 00000001 = 1 * 256^1 = 256
 * octet 3: 00000001 = 1 * 256^0 = 1
 * total = 257
 *
 * The algorithm for converting a js integer value of 257 to base-256 is:
 *
 * var value = 257;
 * var bytes = [];
 * bytes[0] = (value >>> 8) & 0xFF; // most significant byte first
 * bytes[1] = value & 0xFF;        // least significant byte last
 *
 * On the ASN.1 UNIVERSAL Object Identifier (OID) type:
 *
 * An OID can be written like: "value1.value2.value3...valueN"
 *
 * The DER encoding rules:
 *
 * The first byte has the value 40 * value1 + value2.
 * The following bytes, if any, encode the remaining values. Each value is
 * encoded in base 128, most significant digit first (big endian), with as
 * few digits as possible, and the most significant bit of each byte set
 * to 1 except the last in each value's encoding. For example: Given the
 * OID "1.2.840.113549", its DER encoding is (remember each byte except the
 * last one in each encoding is OR'd with 0x80):
 *
 * byte 1: 40 * 1 + 2 = 42 = 0x2A.
 * bytes 2-3: 128 * 6 + 72 = 840 = 6 72 = 6 72 = 0x0648 = 0x8648
 * bytes 4-6: 16384 * 6 + 128 * 119 + 13 = 6 119 13 = 0x06770D = 0x86F70D
 *
 * The final value is: 0x2A864886F70D.
 * The full OID (including ASN.1 tag and length of 6 bytes) is:
 * 0x06062A864886F70D
 */

var forge$z = forge$F;



/* ASN.1 API */
var asn1$8 = forge$z.asn1 = forge$z.asn1 || {};

/**
 * ASN.1 classes.
 */
asn1$8.Class = {
  UNIVERSAL:        0x00,
  APPLICATION:      0x40,
  CONTEXT_SPECIFIC: 0x80,
  PRIVATE:          0xC0
};

/**
 * ASN.1 types. Not all types are supported by this implementation, only
 * those necessary to implement a simple PKI are implemented.
 */
asn1$8.Type = {
  NONE:             0,
  BOOLEAN:          1,
  INTEGER:          2,
  BITSTRING:        3,
  OCTETSTRING:      4,
  NULL:             5,
  OID:              6,
  ODESC:            7,
  EXTERNAL:         8,
  REAL:             9,
  ENUMERATED:      10,
  EMBEDDED:        11,
  UTF8:            12,
  ROID:            13,
  SEQUENCE:        16,
  SET:             17,
  PRINTABLESTRING: 19,
  IA5STRING:       22,
  UTCTIME:         23,
  GENERALIZEDTIME: 24,
  BMPSTRING:       30
};

/**
 * Creates a new asn1 object.
 *
 * @param tagClass the tag class for the object.
 * @param type the data type (tag number) for the object.
 * @param constructed true if the asn1 object is in constructed form.
 * @param value the value for the object, if it is not constructed.
 * @param [options] the options to use:
 *          [bitStringContents] the plain BIT STRING content including padding
 *            byte.
 *
 * @return the asn1 object.
 */
asn1$8.create = function(tagClass, type, constructed, value, options) {
  /* An asn1 object has a tagClass, a type, a constructed flag, and a
    value. The value's type depends on the constructed flag. If
    constructed, it will contain a list of other asn1 objects. If not,
    it will contain the ASN.1 value as an array of bytes formatted
    according to the ASN.1 data type. */

  // remove undefined values
  if(forge$z.util.isArray(value)) {
    var tmp = [];
    for(var i = 0; i < value.length; ++i) {
      if(value[i] !== undefined) {
        tmp.push(value[i]);
      }
    }
    value = tmp;
  }

  var obj = {
    tagClass: tagClass,
    type: type,
    constructed: constructed,
    composed: constructed || forge$z.util.isArray(value),
    value: value
  };
  if(options && 'bitStringContents' in options) {
    // TODO: copy byte buffer if it's a buffer not a string
    obj.bitStringContents = options.bitStringContents;
    // TODO: add readonly flag to avoid this overhead
    // save copy to detect changes
    obj.original = asn1$8.copy(obj);
  }
  return obj;
};

/**
 * Copies an asn1 object.
 *
 * @param obj the asn1 object.
 * @param [options] copy options:
 *          [excludeBitStringContents] true to not copy bitStringContents
 *
 * @return the a copy of the asn1 object.
 */
asn1$8.copy = function(obj, options) {
  var copy;

  if(forge$z.util.isArray(obj)) {
    copy = [];
    for(var i = 0; i < obj.length; ++i) {
      copy.push(asn1$8.copy(obj[i], options));
    }
    return copy;
  }

  if(typeof obj === 'string') {
    // TODO: copy byte buffer if it's a buffer not a string
    return obj;
  }

  copy = {
    tagClass: obj.tagClass,
    type: obj.type,
    constructed: obj.constructed,
    composed: obj.composed,
    value: asn1$8.copy(obj.value, options)
  };
  if(options && !options.excludeBitStringContents) {
    // TODO: copy byte buffer if it's a buffer not a string
    copy.bitStringContents = obj.bitStringContents;
  }
  return copy;
};

/**
 * Compares asn1 objects for equality.
 *
 * Note this function does not run in constant time.
 *
 * @param obj1 the first asn1 object.
 * @param obj2 the second asn1 object.
 * @param [options] compare options:
 *          [includeBitStringContents] true to compare bitStringContents
 *
 * @return true if the asn1 objects are equal.
 */
asn1$8.equals = function(obj1, obj2, options) {
  if(forge$z.util.isArray(obj1)) {
    if(!forge$z.util.isArray(obj2)) {
      return false;
    }
    if(obj1.length !== obj2.length) {
      return false;
    }
    for(var i = 0; i < obj1.length; ++i) {
      if(!asn1$8.equals(obj1[i], obj2[i])) {
        return false;
      }
    }
    return true;
  }

  if(typeof obj1 !== typeof obj2) {
    return false;
  }

  if(typeof obj1 === 'string') {
    return obj1 === obj2;
  }

  var equal = obj1.tagClass === obj2.tagClass &&
    obj1.type === obj2.type &&
    obj1.constructed === obj2.constructed &&
    obj1.composed === obj2.composed &&
    asn1$8.equals(obj1.value, obj2.value);
  if(options && options.includeBitStringContents) {
    equal = equal && (obj1.bitStringContents === obj2.bitStringContents);
  }

  return equal;
};

/**
 * Gets the length of a BER-encoded ASN.1 value.
 *
 * In case the length is not specified, undefined is returned.
 *
 * @param b the BER-encoded ASN.1 byte buffer, starting with the first
 *          length byte.
 *
 * @return the length of the BER-encoded ASN.1 value or undefined.
 */
asn1$8.getBerValueLength = function(b) {
  // TODO: move this function and related DER/BER functions to a der.js
  // file; better abstract ASN.1 away from der/ber.
  var b2 = b.getByte();
  if(b2 === 0x80) {
    return undefined;
  }

  // see if the length is "short form" or "long form" (bit 8 set)
  var length;
  var longForm = b2 & 0x80;
  if(!longForm) {
    // length is just the first byte
    length = b2;
  } else {
    // the number of bytes the length is specified in bits 7 through 1
    // and each length byte is in big-endian base-256
    length = b.getInt((b2 & 0x7F) << 3);
  }
  return length;
};

/**
 * Check if the byte buffer has enough bytes. Throws an Error if not.
 *
 * @param bytes the byte buffer to parse from.
 * @param remaining the bytes remaining in the current parsing state.
 * @param n the number of bytes the buffer must have.
 */
function _checkBufferLength(bytes, remaining, n) {
  if(n > remaining) {
    var error = new Error('Too few bytes to parse DER.');
    error.available = bytes.length();
    error.remaining = remaining;
    error.requested = n;
    throw error;
  }
}

/**
 * Gets the length of a BER-encoded ASN.1 value.
 *
 * In case the length is not specified, undefined is returned.
 *
 * @param bytes the byte buffer to parse from.
 * @param remaining the bytes remaining in the current parsing state.
 *
 * @return the length of the BER-encoded ASN.1 value or undefined.
 */
var _getValueLength = function(bytes, remaining) {
  // TODO: move this function and related DER/BER functions to a der.js
  // file; better abstract ASN.1 away from der/ber.
  // fromDer already checked that this byte exists
  var b2 = bytes.getByte();
  remaining--;
  if(b2 === 0x80) {
    return undefined;
  }

  // see if the length is "short form" or "long form" (bit 8 set)
  var length;
  var longForm = b2 & 0x80;
  if(!longForm) {
    // length is just the first byte
    length = b2;
  } else {
    // the number of bytes the length is specified in bits 7 through 1
    // and each length byte is in big-endian base-256
    var longFormBytes = b2 & 0x7F;
    _checkBufferLength(bytes, remaining, longFormBytes);
    length = bytes.getInt(longFormBytes << 3);
  }
  // FIXME: this will only happen for 32 bit getInt with high bit set
  if(length < 0) {
    throw new Error('Negative length: ' + length);
  }
  return length;
};

/**
 * Parses an asn1 object from a byte buffer in DER format.
 *
 * @param bytes the byte buffer to parse from.
 * @param [strict] true to be strict when checking value lengths, false to
 *          allow truncated values (default: true).
 * @param [options] object with options or boolean strict flag
 *          [strict] true to be strict when checking value lengths, false to
 *            allow truncated values (default: true).
 *          [decodeBitStrings] true to attempt to decode the content of
 *            BIT STRINGs (not OCTET STRINGs) using strict mode. Note that
 *            without schema support to understand the data context this can
 *            erroneously decode values that happen to be valid ASN.1. This
 *            flag will be deprecated or removed as soon as schema support is
 *            available. (default: true)
 *
 * @return the parsed asn1 object.
 */
asn1$8.fromDer = function(bytes, options) {
  if(options === undefined) {
    options = {
      strict: true,
      decodeBitStrings: true
    };
  }
  if(typeof options === 'boolean') {
    options = {
      strict: options,
      decodeBitStrings: true
    };
  }
  if(!('strict' in options)) {
    options.strict = true;
  }
  if(!('decodeBitStrings' in options)) {
    options.decodeBitStrings = true;
  }

  // wrap in buffer if needed
  if(typeof bytes === 'string') {
    bytes = forge$z.util.createBuffer(bytes);
  }

  return _fromDer(bytes, bytes.length(), 0, options);
};

/**
 * Internal function to parse an asn1 object from a byte buffer in DER format.
 *
 * @param bytes the byte buffer to parse from.
 * @param remaining the number of bytes remaining for this chunk.
 * @param depth the current parsing depth.
 * @param options object with same options as fromDer().
 *
 * @return the parsed asn1 object.
 */
function _fromDer(bytes, remaining, depth, options) {
  // temporary storage for consumption calculations
  var start;

  // minimum length for ASN.1 DER structure is 2
  _checkBufferLength(bytes, remaining, 2);

  // get the first byte
  var b1 = bytes.getByte();
  // consumed one byte
  remaining--;

  // get the tag class
  var tagClass = (b1 & 0xC0);

  // get the type (bits 1-5)
  var type = b1 & 0x1F;

  // get the variable value length and adjust remaining bytes
  start = bytes.length();
  var length = _getValueLength(bytes, remaining);
  remaining -= start - bytes.length();

  // ensure there are enough bytes to get the value
  if(length !== undefined && length > remaining) {
    if(options.strict) {
      var error = new Error('Too few bytes to read ASN.1 value.');
      error.available = bytes.length();
      error.remaining = remaining;
      error.requested = length;
      throw error;
    }
    // Note: be lenient with truncated values and use remaining state bytes
    length = remaining;
  }

  // value storage
  var value;
  // possible BIT STRING contents storage
  var bitStringContents;

  // constructed flag is bit 6 (32 = 0x20) of the first byte
  var constructed = ((b1 & 0x20) === 0x20);
  if(constructed) {
    // parse child asn1 objects from the value
    value = [];
    if(length === undefined) {
      // asn1 object of indefinite length, read until end tag
      for(;;) {
        _checkBufferLength(bytes, remaining, 2);
        if(bytes.bytes(2) === String.fromCharCode(0, 0)) {
          bytes.getBytes(2);
          remaining -= 2;
          break;
        }
        start = bytes.length();
        value.push(_fromDer(bytes, remaining, depth + 1, options));
        remaining -= start - bytes.length();
      }
    } else {
      // parsing asn1 object of definite length
      while(length > 0) {
        start = bytes.length();
        value.push(_fromDer(bytes, length, depth + 1, options));
        remaining -= start - bytes.length();
        length -= start - bytes.length();
      }
    }
  }

  // if a BIT STRING, save the contents including padding
  if(value === undefined && tagClass === asn1$8.Class.UNIVERSAL &&
    type === asn1$8.Type.BITSTRING) {
    bitStringContents = bytes.bytes(length);
  }

  // determine if a non-constructed value should be decoded as a composed
  // value that contains other ASN.1 objects. BIT STRINGs (and OCTET STRINGs)
  // can be used this way.
  if(value === undefined && options.decodeBitStrings &&
    tagClass === asn1$8.Class.UNIVERSAL &&
    // FIXME: OCTET STRINGs not yet supported here
    // .. other parts of forge expect to decode OCTET STRINGs manually
    (type === asn1$8.Type.BITSTRING /*|| type === asn1.Type.OCTETSTRING*/) &&
    length > 1) {
    // save read position
    var savedRead = bytes.read;
    var savedRemaining = remaining;
    var unused = 0;
    if(type === asn1$8.Type.BITSTRING) {
      /* The first octet gives the number of bits by which the length of the
        bit string is less than the next multiple of eight (this is called
        the "number of unused bits").

        The second and following octets give the value of the bit string
        converted to an octet string. */
      _checkBufferLength(bytes, remaining, 1);
      unused = bytes.getByte();
      remaining--;
    }
    // if all bits are used, maybe the BIT/OCTET STRING holds ASN.1 objs
    if(unused === 0) {
      try {
        // attempt to parse child asn1 object from the value
        // (stored in array to signal composed value)
        start = bytes.length();
        var subOptions = {
          // enforce strict mode to avoid parsing ASN.1 from plain data
          verbose: options.verbose,
          strict: true,
          decodeBitStrings: true
        };
        var composed = _fromDer(bytes, remaining, depth + 1, subOptions);
        var used = start - bytes.length();
        remaining -= used;
        if(type == asn1$8.Type.BITSTRING) {
          used++;
        }

        // if the data all decoded and the class indicates UNIVERSAL or
        // CONTEXT_SPECIFIC then assume we've got an encapsulated ASN.1 object
        var tc = composed.tagClass;
        if(used === length &&
          (tc === asn1$8.Class.UNIVERSAL || tc === asn1$8.Class.CONTEXT_SPECIFIC)) {
          value = [composed];
        }
      } catch(ex) {
      }
    }
    if(value === undefined) {
      // restore read position
      bytes.read = savedRead;
      remaining = savedRemaining;
    }
  }

  if(value === undefined) {
    // asn1 not constructed or composed, get raw value
    // TODO: do DER to OID conversion and vice-versa in .toDer?

    if(length === undefined) {
      if(options.strict) {
        throw new Error('Non-constructed ASN.1 object of indefinite length.');
      }
      // be lenient and use remaining state bytes
      length = remaining;
    }

    if(type === asn1$8.Type.BMPSTRING) {
      value = '';
      for(; length > 0; length -= 2) {
        _checkBufferLength(bytes, remaining, 2);
        value += String.fromCharCode(bytes.getInt16());
        remaining -= 2;
      }
    } else {
      value = bytes.getBytes(length);
    }
  }

  // add BIT STRING contents if available
  var asn1Options = bitStringContents === undefined ? null : {
    bitStringContents: bitStringContents
  };

  // create and return asn1 object
  return asn1$8.create(tagClass, type, constructed, value, asn1Options);
}

/**
 * Converts the given asn1 object to a buffer of bytes in DER format.
 *
 * @param asn1 the asn1 object to convert to bytes.
 *
 * @return the buffer of bytes.
 */
asn1$8.toDer = function(obj) {
  var bytes = forge$z.util.createBuffer();

  // build the first byte
  var b1 = obj.tagClass | obj.type;

  // for storing the ASN.1 value
  var value = forge$z.util.createBuffer();

  // use BIT STRING contents if available and data not changed
  var useBitStringContents = false;
  if('bitStringContents' in obj) {
    useBitStringContents = true;
    if(obj.original) {
      useBitStringContents = asn1$8.equals(obj, obj.original);
    }
  }

  if(useBitStringContents) {
    value.putBytes(obj.bitStringContents);
  } else if(obj.composed) {
    // if composed, use each child asn1 object's DER bytes as value
    // turn on 6th bit (0x20 = 32) to indicate asn1 is constructed
    // from other asn1 objects
    if(obj.constructed) {
      b1 |= 0x20;
    } else {
      // type is a bit string, add unused bits of 0x00
      value.putByte(0x00);
    }

    // add all of the child DER bytes together
    for(var i = 0; i < obj.value.length; ++i) {
      if(obj.value[i] !== undefined) {
        value.putBuffer(asn1$8.toDer(obj.value[i]));
      }
    }
  } else {
    // use asn1.value directly
    if(obj.type === asn1$8.Type.BMPSTRING) {
      for(var i = 0; i < obj.value.length; ++i) {
        value.putInt16(obj.value.charCodeAt(i));
      }
    } else {
      // ensure integer is minimally-encoded
      // TODO: should all leading bytes be stripped vs just one?
      // .. ex '00 00 01' => '01'?
      if(obj.type === asn1$8.Type.INTEGER &&
        obj.value.length > 1 &&
        // leading 0x00 for positive integer
        ((obj.value.charCodeAt(0) === 0 &&
        (obj.value.charCodeAt(1) & 0x80) === 0) ||
        // leading 0xFF for negative integer
        (obj.value.charCodeAt(0) === 0xFF &&
        (obj.value.charCodeAt(1) & 0x80) === 0x80))) {
        value.putBytes(obj.value.substr(1));
      } else {
        value.putBytes(obj.value);
      }
    }
  }

  // add tag byte
  bytes.putByte(b1);

  // use "short form" encoding
  if(value.length() <= 127) {
    // one byte describes the length
    // bit 8 = 0 and bits 7-1 = length
    bytes.putByte(value.length() & 0x7F);
  } else {
    // use "long form" encoding
    // 2 to 127 bytes describe the length
    // first byte: bit 8 = 1 and bits 7-1 = # of additional bytes
    // other bytes: length in base 256, big-endian
    var len = value.length();
    var lenBytes = '';
    do {
      lenBytes += String.fromCharCode(len & 0xFF);
      len = len >>> 8;
    } while(len > 0);

    // set first byte to # bytes used to store the length and turn on
    // bit 8 to indicate long-form length is used
    bytes.putByte(lenBytes.length | 0x80);

    // concatenate length bytes in reverse since they were generated
    // little endian and we need big endian
    for(var i = lenBytes.length - 1; i >= 0; --i) {
      bytes.putByte(lenBytes.charCodeAt(i));
    }
  }

  // concatenate value bytes
  bytes.putBuffer(value);
  return bytes;
};

/**
 * Converts an OID dot-separated string to a byte buffer. The byte buffer
 * contains only the DER-encoded value, not any tag or length bytes.
 *
 * @param oid the OID dot-separated string.
 *
 * @return the byte buffer.
 */
asn1$8.oidToDer = function(oid) {
  // split OID into individual values
  var values = oid.split('.');
  var bytes = forge$z.util.createBuffer();

  // first byte is 40 * value1 + value2
  bytes.putByte(40 * parseInt(values[0], 10) + parseInt(values[1], 10));
  // other bytes are each value in base 128 with 8th bit set except for
  // the last byte for each value
  var last, valueBytes, value, b;
  for(var i = 2; i < values.length; ++i) {
    // produce value bytes in reverse because we don't know how many
    // bytes it will take to store the value
    last = true;
    valueBytes = [];
    value = parseInt(values[i], 10);
    do {
      b = value & 0x7F;
      value = value >>> 7;
      // if value is not last, then turn on 8th bit
      if(!last) {
        b |= 0x80;
      }
      valueBytes.push(b);
      last = false;
    } while(value > 0);

    // add value bytes in reverse (needs to be in big endian)
    for(var n = valueBytes.length - 1; n >= 0; --n) {
      bytes.putByte(valueBytes[n]);
    }
  }

  return bytes;
};

/**
 * Converts a DER-encoded byte buffer to an OID dot-separated string. The
 * byte buffer should contain only the DER-encoded value, not any tag or
 * length bytes.
 *
 * @param bytes the byte buffer.
 *
 * @return the OID dot-separated string.
 */
asn1$8.derToOid = function(bytes) {
  var oid;

  // wrap in buffer if needed
  if(typeof bytes === 'string') {
    bytes = forge$z.util.createBuffer(bytes);
  }

  // first byte is 40 * value1 + value2
  var b = bytes.getByte();
  oid = Math.floor(b / 40) + '.' + (b % 40);

  // other bytes are each value in base 128 with 8th bit set except for
  // the last byte for each value
  var value = 0;
  while(bytes.length() > 0) {
    b = bytes.getByte();
    value = value << 7;
    // not the last byte for the value
    if(b & 0x80) {
      value += b & 0x7F;
    } else {
      // last byte
      oid += '.' + (value + b);
      value = 0;
    }
  }

  return oid;
};

/**
 * Converts a UTCTime value to a date.
 *
 * Note: GeneralizedTime has 4 digits for the year and is used for X.509
 * dates past 2049. Parsing that structure hasn't been implemented yet.
 *
 * @param utc the UTCTime value to convert.
 *
 * @return the date.
 */
asn1$8.utcTimeToDate = function(utc) {
  /* The following formats can be used:

    YYMMDDhhmmZ
    YYMMDDhhmm+hh'mm'
    YYMMDDhhmm-hh'mm'
    YYMMDDhhmmssZ
    YYMMDDhhmmss+hh'mm'
    YYMMDDhhmmss-hh'mm'

    Where:

    YY is the least significant two digits of the year
    MM is the month (01 to 12)
    DD is the day (01 to 31)
    hh is the hour (00 to 23)
    mm are the minutes (00 to 59)
    ss are the seconds (00 to 59)
    Z indicates that local time is GMT, + indicates that local time is
    later than GMT, and - indicates that local time is earlier than GMT
    hh' is the absolute value of the offset from GMT in hours
    mm' is the absolute value of the offset from GMT in minutes */
  var date = new Date();

  // if YY >= 50 use 19xx, if YY < 50 use 20xx
  var year = parseInt(utc.substr(0, 2), 10);
  year = (year >= 50) ? 1900 + year : 2000 + year;
  var MM = parseInt(utc.substr(2, 2), 10) - 1; // use 0-11 for month
  var DD = parseInt(utc.substr(4, 2), 10);
  var hh = parseInt(utc.substr(6, 2), 10);
  var mm = parseInt(utc.substr(8, 2), 10);
  var ss = 0;

  // not just YYMMDDhhmmZ
  if(utc.length > 11) {
    // get character after minutes
    var c = utc.charAt(10);
    var end = 10;

    // see if seconds are present
    if(c !== '+' && c !== '-') {
      // get seconds
      ss = parseInt(utc.substr(10, 2), 10);
      end += 2;
    }
  }

  // update date
  date.setUTCFullYear(year, MM, DD);
  date.setUTCHours(hh, mm, ss, 0);

  if(end) {
    // get +/- after end of time
    c = utc.charAt(end);
    if(c === '+' || c === '-') {
      // get hours+minutes offset
      var hhoffset = parseInt(utc.substr(end + 1, 2), 10);
      var mmoffset = parseInt(utc.substr(end + 4, 2), 10);

      // calculate offset in milliseconds
      var offset = hhoffset * 60 + mmoffset;
      offset *= 60000;

      // apply offset
      if(c === '+') {
        date.setTime(+date - offset);
      } else {
        date.setTime(+date + offset);
      }
    }
  }

  return date;
};

/**
 * Converts a GeneralizedTime value to a date.
 *
 * @param gentime the GeneralizedTime value to convert.
 *
 * @return the date.
 */
asn1$8.generalizedTimeToDate = function(gentime) {
  /* The following formats can be used:

    YYYYMMDDHHMMSS
    YYYYMMDDHHMMSS.fff
    YYYYMMDDHHMMSSZ
    YYYYMMDDHHMMSS.fffZ
    YYYYMMDDHHMMSS+hh'mm'
    YYYYMMDDHHMMSS.fff+hh'mm'
    YYYYMMDDHHMMSS-hh'mm'
    YYYYMMDDHHMMSS.fff-hh'mm'

    Where:

    YYYY is the year
    MM is the month (01 to 12)
    DD is the day (01 to 31)
    hh is the hour (00 to 23)
    mm are the minutes (00 to 59)
    ss are the seconds (00 to 59)
    .fff is the second fraction, accurate to three decimal places
    Z indicates that local time is GMT, + indicates that local time is
    later than GMT, and - indicates that local time is earlier than GMT
    hh' is the absolute value of the offset from GMT in hours
    mm' is the absolute value of the offset from GMT in minutes */
  var date = new Date();

  var YYYY = parseInt(gentime.substr(0, 4), 10);
  var MM = parseInt(gentime.substr(4, 2), 10) - 1; // use 0-11 for month
  var DD = parseInt(gentime.substr(6, 2), 10);
  var hh = parseInt(gentime.substr(8, 2), 10);
  var mm = parseInt(gentime.substr(10, 2), 10);
  var ss = parseInt(gentime.substr(12, 2), 10);
  var fff = 0;
  var offset = 0;
  var isUTC = false;

  if(gentime.charAt(gentime.length - 1) === 'Z') {
    isUTC = true;
  }

  var end = gentime.length - 5, c = gentime.charAt(end);
  if(c === '+' || c === '-') {
    // get hours+minutes offset
    var hhoffset = parseInt(gentime.substr(end + 1, 2), 10);
    var mmoffset = parseInt(gentime.substr(end + 4, 2), 10);

    // calculate offset in milliseconds
    offset = hhoffset * 60 + mmoffset;
    offset *= 60000;

    // apply offset
    if(c === '+') {
      offset *= -1;
    }

    isUTC = true;
  }

  // check for second fraction
  if(gentime.charAt(14) === '.') {
    fff = parseFloat(gentime.substr(14), 10) * 1000;
  }

  if(isUTC) {
    date.setUTCFullYear(YYYY, MM, DD);
    date.setUTCHours(hh, mm, ss, fff);

    // apply offset
    date.setTime(+date + offset);
  } else {
    date.setFullYear(YYYY, MM, DD);
    date.setHours(hh, mm, ss, fff);
  }

  return date;
};

/**
 * Converts a date to a UTCTime value.
 *
 * Note: GeneralizedTime has 4 digits for the year and is used for X.509
 * dates past 2049. Converting to a GeneralizedTime hasn't been
 * implemented yet.
 *
 * @param date the date to convert.
 *
 * @return the UTCTime value.
 */
asn1$8.dateToUtcTime = function(date) {
  // TODO: validate; currently assumes proper format
  if(typeof date === 'string') {
    return date;
  }

  var rval = '';

  // create format YYMMDDhhmmssZ
  var format = [];
  format.push(('' + date.getUTCFullYear()).substr(2));
  format.push('' + (date.getUTCMonth() + 1));
  format.push('' + date.getUTCDate());
  format.push('' + date.getUTCHours());
  format.push('' + date.getUTCMinutes());
  format.push('' + date.getUTCSeconds());

  // ensure 2 digits are used for each format entry
  for(var i = 0; i < format.length; ++i) {
    if(format[i].length < 2) {
      rval += '0';
    }
    rval += format[i];
  }
  rval += 'Z';

  return rval;
};

/**
 * Converts a date to a GeneralizedTime value.
 *
 * @param date the date to convert.
 *
 * @return the GeneralizedTime value as a string.
 */
asn1$8.dateToGeneralizedTime = function(date) {
  // TODO: validate; currently assumes proper format
  if(typeof date === 'string') {
    return date;
  }

  var rval = '';

  // create format YYYYMMDDHHMMSSZ
  var format = [];
  format.push('' + date.getUTCFullYear());
  format.push('' + (date.getUTCMonth() + 1));
  format.push('' + date.getUTCDate());
  format.push('' + date.getUTCHours());
  format.push('' + date.getUTCMinutes());
  format.push('' + date.getUTCSeconds());

  // ensure 2 digits are used for each format entry
  for(var i = 0; i < format.length; ++i) {
    if(format[i].length < 2) {
      rval += '0';
    }
    rval += format[i];
  }
  rval += 'Z';

  return rval;
};

/**
 * Converts a javascript integer to a DER-encoded byte buffer to be used
 * as the value for an INTEGER type.
 *
 * @param x the integer.
 *
 * @return the byte buffer.
 */
asn1$8.integerToDer = function(x) {
  var rval = forge$z.util.createBuffer();
  if(x >= -0x80 && x < 0x80) {
    return rval.putSignedInt(x, 8);
  }
  if(x >= -0x8000 && x < 0x8000) {
    return rval.putSignedInt(x, 16);
  }
  if(x >= -0x800000 && x < 0x800000) {
    return rval.putSignedInt(x, 24);
  }
  if(x >= -0x80000000 && x < 0x80000000) {
    return rval.putSignedInt(x, 32);
  }
  var error = new Error('Integer too large; max is 32-bits.');
  error.integer = x;
  throw error;
};

/**
 * Converts a DER-encoded byte buffer to a javascript integer. This is
 * typically used to decode the value of an INTEGER type.
 *
 * @param bytes the byte buffer.
 *
 * @return the integer.
 */
asn1$8.derToInteger = function(bytes) {
  // wrap in buffer if needed
  if(typeof bytes === 'string') {
    bytes = forge$z.util.createBuffer(bytes);
  }

  var n = bytes.length() * 8;
  if(n > 32) {
    throw new Error('Integer too large; max is 32-bits.');
  }
  return bytes.getSignedInt(n);
};

/**
 * Validates that the given ASN.1 object is at least a super set of the
 * given ASN.1 structure. Only tag classes and types are checked. An
 * optional map may also be provided to capture ASN.1 values while the
 * structure is checked.
 *
 * To capture an ASN.1 value, set an object in the validator's 'capture'
 * parameter to the key to use in the capture map. To capture the full
 * ASN.1 object, specify 'captureAsn1'. To capture BIT STRING bytes, including
 * the leading unused bits counter byte, specify 'captureBitStringContents'.
 * To capture BIT STRING bytes, without the leading unused bits counter byte,
 * specify 'captureBitStringValue'.
 *
 * Objects in the validator may set a field 'optional' to true to indicate
 * that it isn't necessary to pass validation.
 *
 * @param obj the ASN.1 object to validate.
 * @param v the ASN.1 structure validator.
 * @param capture an optional map to capture values in.
 * @param errors an optional array for storing validation errors.
 *
 * @return true on success, false on failure.
 */
asn1$8.validate = function(obj, v, capture, errors) {
  var rval = false;

  // ensure tag class and type are the same if specified
  if((obj.tagClass === v.tagClass || typeof(v.tagClass) === 'undefined') &&
    (obj.type === v.type || typeof(v.type) === 'undefined')) {
    // ensure constructed flag is the same if specified
    if(obj.constructed === v.constructed ||
      typeof(v.constructed) === 'undefined') {
      rval = true;

      // handle sub values
      if(v.value && forge$z.util.isArray(v.value)) {
        var j = 0;
        for(var i = 0; rval && i < v.value.length; ++i) {
          rval = v.value[i].optional || false;
          if(obj.value[j]) {
            rval = asn1$8.validate(obj.value[j], v.value[i], capture, errors);
            if(rval) {
              ++j;
            } else if(v.value[i].optional) {
              rval = true;
            }
          }
          if(!rval && errors) {
            errors.push(
              '[' + v.name + '] ' +
              'Tag class "' + v.tagClass + '", type "' +
              v.type + '" expected value length "' +
              v.value.length + '", got "' +
              obj.value.length + '"');
          }
        }
      }

      if(rval && capture) {
        if(v.capture) {
          capture[v.capture] = obj.value;
        }
        if(v.captureAsn1) {
          capture[v.captureAsn1] = obj;
        }
        if(v.captureBitStringContents && 'bitStringContents' in obj) {
          capture[v.captureBitStringContents] = obj.bitStringContents;
        }
        if(v.captureBitStringValue && 'bitStringContents' in obj) {
          if(obj.bitStringContents.length < 2) {
            capture[v.captureBitStringValue] = '';
          } else {
            // FIXME: support unused bits with data shifting
            var unused = obj.bitStringContents.charCodeAt(0);
            if(unused !== 0) {
              throw new Error(
                'captureBitStringValue only supported for zero unused bits');
            }
            capture[v.captureBitStringValue] = obj.bitStringContents.slice(1);
          }
        }
      }
    } else if(errors) {
      errors.push(
        '[' + v.name + '] ' +
        'Expected constructed "' + v.constructed + '", got "' +
        obj.constructed + '"');
    }
  } else if(errors) {
    if(obj.tagClass !== v.tagClass) {
      errors.push(
        '[' + v.name + '] ' +
        'Expected tag class "' + v.tagClass + '", got "' +
        obj.tagClass + '"');
    }
    if(obj.type !== v.type) {
      errors.push(
        '[' + v.name + '] ' +
        'Expected type "' + v.type + '", got "' + obj.type + '"');
    }
  }
  return rval;
};

// regex for testing for non-latin characters
var _nonLatinRegex = /[^\\u0000-\\u00ff]/;

/**
 * Pretty prints an ASN.1 object to a string.
 *
 * @param obj the object to write out.
 * @param level the level in the tree.
 * @param indentation the indentation to use.
 *
 * @return the string.
 */
asn1$8.prettyPrint = function(obj, level, indentation) {
  var rval = '';

  // set default level and indentation
  level = level || 0;
  indentation = indentation || 2;

  // start new line for deep levels
  if(level > 0) {
    rval += '\n';
  }

  // create indent
  var indent = '';
  for(var i = 0; i < level * indentation; ++i) {
    indent += ' ';
  }

  // print class:type
  rval += indent + 'Tag: ';
  switch(obj.tagClass) {
  case asn1$8.Class.UNIVERSAL:
    rval += 'Universal:';
    break;
  case asn1$8.Class.APPLICATION:
    rval += 'Application:';
    break;
  case asn1$8.Class.CONTEXT_SPECIFIC:
    rval += 'Context-Specific:';
    break;
  case asn1$8.Class.PRIVATE:
    rval += 'Private:';
    break;
  }

  if(obj.tagClass === asn1$8.Class.UNIVERSAL) {
    rval += obj.type;

    // known types
    switch(obj.type) {
    case asn1$8.Type.NONE:
      rval += ' (None)';
      break;
    case asn1$8.Type.BOOLEAN:
      rval += ' (Boolean)';
      break;
    case asn1$8.Type.INTEGER:
      rval += ' (Integer)';
      break;
    case asn1$8.Type.BITSTRING:
      rval += ' (Bit string)';
      break;
    case asn1$8.Type.OCTETSTRING:
      rval += ' (Octet string)';
      break;
    case asn1$8.Type.NULL:
      rval += ' (Null)';
      break;
    case asn1$8.Type.OID:
      rval += ' (Object Identifier)';
      break;
    case asn1$8.Type.ODESC:
      rval += ' (Object Descriptor)';
      break;
    case asn1$8.Type.EXTERNAL:
      rval += ' (External or Instance of)';
      break;
    case asn1$8.Type.REAL:
      rval += ' (Real)';
      break;
    case asn1$8.Type.ENUMERATED:
      rval += ' (Enumerated)';
      break;
    case asn1$8.Type.EMBEDDED:
      rval += ' (Embedded PDV)';
      break;
    case asn1$8.Type.UTF8:
      rval += ' (UTF8)';
      break;
    case asn1$8.Type.ROID:
      rval += ' (Relative Object Identifier)';
      break;
    case asn1$8.Type.SEQUENCE:
      rval += ' (Sequence)';
      break;
    case asn1$8.Type.SET:
      rval += ' (Set)';
      break;
    case asn1$8.Type.PRINTABLESTRING:
      rval += ' (Printable String)';
      break;
    case asn1$8.Type.IA5String:
      rval += ' (IA5String (ASCII))';
      break;
    case asn1$8.Type.UTCTIME:
      rval += ' (UTC time)';
      break;
    case asn1$8.Type.GENERALIZEDTIME:
      rval += ' (Generalized time)';
      break;
    case asn1$8.Type.BMPSTRING:
      rval += ' (BMP String)';
      break;
    }
  } else {
    rval += obj.type;
  }

  rval += '\n';
  rval += indent + 'Constructed: ' + obj.constructed + '\n';

  if(obj.composed) {
    var subvalues = 0;
    var sub = '';
    for(var i = 0; i < obj.value.length; ++i) {
      if(obj.value[i] !== undefined) {
        subvalues += 1;
        sub += asn1$8.prettyPrint(obj.value[i], level + 1, indentation);
        if((i + 1) < obj.value.length) {
          sub += ',';
        }
      }
    }
    rval += indent + 'Sub values: ' + subvalues + sub;
  } else {
    rval += indent + 'Value: ';
    if(obj.type === asn1$8.Type.OID) {
      var oid = asn1$8.derToOid(obj.value);
      rval += oid;
      if(forge$z.pki && forge$z.pki.oids) {
        if(oid in forge$z.pki.oids) {
          rval += ' (' + forge$z.pki.oids[oid] + ') ';
        }
      }
    }
    if(obj.type === asn1$8.Type.INTEGER) {
      try {
        rval += asn1$8.derToInteger(obj.value);
      } catch(ex) {
        rval += '0x' + forge$z.util.bytesToHex(obj.value);
      }
    } else if(obj.type === asn1$8.Type.BITSTRING) {
      // TODO: shift bits as needed to display without padding
      if(obj.value.length > 1) {
        // remove unused bits field
        rval += '0x' + forge$z.util.bytesToHex(obj.value.slice(1));
      } else {
        rval += '(none)';
      }
      // show unused bit count
      if(obj.value.length > 0) {
        var unused = obj.value.charCodeAt(0);
        if(unused == 1) {
          rval += ' (1 unused bit shown)';
        } else if(unused > 1) {
          rval += ' (' + unused + ' unused bits shown)';
        }
      }
    } else if(obj.type === asn1$8.Type.OCTETSTRING) {
      if(!_nonLatinRegex.test(obj.value)) {
        rval += '(' + obj.value + ') ';
      }
      rval += '0x' + forge$z.util.bytesToHex(obj.value);
    } else if(obj.type === asn1$8.Type.UTF8) {
      rval += forge$z.util.decodeUtf8(obj.value);
    } else if(obj.type === asn1$8.Type.PRINTABLESTRING ||
      obj.type === asn1$8.Type.IA5String) {
      rval += obj.value;
    } else if(_nonLatinRegex.test(obj.value)) {
      rval += '0x' + forge$z.util.bytesToHex(obj.value);
    } else if(obj.value.length === 0) {
      rval += '[null]';
    } else {
      rval += obj.value;
    }
  }

  return rval;
};

/**
 * Node.js module for Forge message digests.
 *
 * @author Dave Longley
 *
 * Copyright 2011-2017 Digital Bazaar, Inc.
 */

var forge$y = forge$F;

forge$y.md = forge$y.md || {};
forge$y.md.algorithms = forge$y.md.algorithms || {};

/**
 * Hash-based Message Authentication Code implementation. Requires a message
 * digest object that can be obtained, for example, from forge.md.sha1 or
 * forge.md.md5.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2012 Digital Bazaar, Inc. All rights reserved.
 */

var forge$x = forge$F;



/* HMAC API */
var hmac = forge$x.hmac = forge$x.hmac || {};

/**
 * Creates an HMAC object that uses the given message digest object.
 *
 * @return an HMAC object.
 */
hmac.create = function() {
  // the hmac key to use
  var _key = null;

  // the message digest to use
  var _md = null;

  // the inner padding
  var _ipadding = null;

  // the outer padding
  var _opadding = null;

  // hmac context
  var ctx = {};

  /**
   * Starts or restarts the HMAC with the given key and message digest.
   *
   * @param md the message digest to use, null to reuse the previous one,
   *           a string to use builtin 'sha1', 'md5', 'sha256'.
   * @param key the key to use as a string, array of bytes, byte buffer,
   *           or null to reuse the previous key.
   */
  ctx.start = function(md, key) {
    if(md !== null) {
      if(typeof md === 'string') {
        // create builtin message digest
        md = md.toLowerCase();
        if(md in forge$x.md.algorithms) {
          _md = forge$x.md.algorithms[md].create();
        } else {
          throw new Error('Unknown hash algorithm "' + md + '"');
        }
      } else {
        // store message digest
        _md = md;
      }
    }

    if(key === null) {
      // reuse previous key
      key = _key;
    } else {
      if(typeof key === 'string') {
        // convert string into byte buffer
        key = forge$x.util.createBuffer(key);
      } else if(forge$x.util.isArray(key)) {
        // convert byte array into byte buffer
        var tmp = key;
        key = forge$x.util.createBuffer();
        for(var i = 0; i < tmp.length; ++i) {
          key.putByte(tmp[i]);
        }
      }

      // if key is longer than blocksize, hash it
      var keylen = key.length();
      if(keylen > _md.blockLength) {
        _md.start();
        _md.update(key.bytes());
        key = _md.digest();
      }

      // mix key into inner and outer padding
      // ipadding = [0x36 * blocksize] ^ key
      // opadding = [0x5C * blocksize] ^ key
      _ipadding = forge$x.util.createBuffer();
      _opadding = forge$x.util.createBuffer();
      keylen = key.length();
      for(var i = 0; i < keylen; ++i) {
        var tmp = key.at(i);
        _ipadding.putByte(0x36 ^ tmp);
        _opadding.putByte(0x5C ^ tmp);
      }

      // if key is shorter than blocksize, add additional padding
      if(keylen < _md.blockLength) {
        var tmp = _md.blockLength - keylen;
        for(var i = 0; i < tmp; ++i) {
          _ipadding.putByte(0x36);
          _opadding.putByte(0x5C);
        }
      }
      _key = key;
      _ipadding = _ipadding.bytes();
      _opadding = _opadding.bytes();
    }

    // digest is done like so: hash(opadding | hash(ipadding | message))

    // prepare to do inner hash
    // hash(ipadding | message)
    _md.start();
    _md.update(_ipadding);
  };

  /**
   * Updates the HMAC with the given message bytes.
   *
   * @param bytes the bytes to update with.
   */
  ctx.update = function(bytes) {
    _md.update(bytes);
  };

  /**
   * Produces the Message Authentication Code (MAC).
   *
   * @return a byte buffer containing the digest value.
   */
  ctx.getMac = function() {
    // digest is done like so: hash(opadding | hash(ipadding | message))
    // here we do the outer hashing
    var inner = _md.digest().bytes();
    _md.start();
    _md.update(_opadding);
    _md.update(inner);
    return _md.digest();
  };
  // alias for getMac
  ctx.digest = ctx.getMac;

  return ctx;
};

/**
 * Message Digest Algorithm 5 with 128-bit digest (MD5) implementation.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */

var forge$w = forge$F;



var md5 = forge$w.md5 = forge$w.md5 || {};
forge$w.md.md5 = forge$w.md.algorithms.md5 = md5;

/**
 * Creates an MD5 message digest object.
 *
 * @return a message digest object.
 */
md5.create = function() {
  // do initialization as necessary
  if(!_initialized$3) {
    _init$3();
  }

  // MD5 state contains four 32-bit integers
  var _state = null;

  // input buffer
  var _input = forge$w.util.createBuffer();

  // used for word storage
  var _w = new Array(16);

  // message digest object
  var md = {
    algorithm: 'md5',
    blockLength: 64,
    digestLength: 16,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 8
  };

  /**
   * Starts the digest.
   *
   * @return this digest object.
   */
  md.start = function() {
    // up to 56-bit message length for convenience
    md.messageLength = 0;

    // full message length (set md.messageLength64 for backwards-compatibility)
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for(var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge$w.util.createBuffer();
    _state = {
      h0: 0x67452301,
      h1: 0xEFCDAB89,
      h2: 0x98BADCFE,
      h3: 0x10325476
    };
    return md;
  };
  // start digest automatically for first time
  md.start();

  /**
   * Updates the digest with the given message input. The given input can
   * treated as raw input (no encoding will be applied) or an encoding of
   * 'utf8' maybe given to encode the input using UTF-8.
   *
   * @param msg the message input to update with.
   * @param encoding the encoding to use (default: 'raw', other: 'utf8').
   *
   * @return this digest object.
   */
  md.update = function(msg, encoding) {
    if(encoding === 'utf8') {
      msg = forge$w.util.encodeUtf8(msg);
    }

    // update message length
    var len = msg.length;
    md.messageLength += len;
    len = [(len / 0x100000000) >>> 0, len >>> 0];
    for(var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + ((md.fullMessageLength[i] / 0x100000000) >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = (len[1] / 0x100000000) >>> 0;
    }

    // add bytes to input buffer
    _input.putBytes(msg);

    // process bytes
    _update$3(_state, _w, _input);

    // compact input buffer every 2K or if empty
    if(_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }

    return md;
  };

  /**
   * Produces the digest.
   *
   * @return a byte buffer containing the digest value.
   */
  md.digest = function() {
    /* Note: Here we copy the remaining bytes in the input buffer and
    add the appropriate MD5 padding. Then we do the final update
    on a copy of the state so that if the user wants to get
    intermediate digests they can do so. */

    /* Determine the number of bytes that must be added to the message
    to ensure its length is congruent to 448 mod 512. In other words,
    the data to be digested must be a multiple of 512 bits (or 128 bytes).
    This data includes the message, some padding, and the length of the
    message. Since the length of the message will be encoded as 8 bytes (64
    bits), that means that the last segment of the data must have 56 bytes
    (448 bits) of message and padding. Therefore, the length of the message
    plus the padding must be congruent to 448 mod 512 because
    512 - 128 = 448.

    In order to fill up the message length it must be filled with
    padding that begins with 1 bit followed by all 0 bits. Padding
    must *always* be present, so if the message length is already
    congruent to 448 mod 512, then 512 padding bits must be added. */

    var finalBlock = forge$w.util.createBuffer();
    finalBlock.putBytes(_input.bytes());

    // compute remaining size to be digested (include message length size)
    var remaining = (
      md.fullMessageLength[md.fullMessageLength.length - 1] +
      md.messageLengthSize);

    // add padding for overflow blockSize - overflow
    // _padding starts with 1 byte with first bit is set (byte value 128), then
    // there may be up to (blockSize - 1) other pad bytes
    var overflow = remaining & (md.blockLength - 1);
    finalBlock.putBytes(_padding$3.substr(0, md.blockLength - overflow));

    // serialize message length in bits in little-endian order; since length
    // is stored in bytes we multiply by 8 and add carry
    var bits, carry = 0;
    for(var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      bits = md.fullMessageLength[i] * 8 + carry;
      carry = (bits / 0x100000000) >>> 0;
      finalBlock.putInt32Le(bits >>> 0);
    }

    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3
    };
    _update$3(s2, _w, finalBlock);
    var rval = forge$w.util.createBuffer();
    rval.putInt32Le(s2.h0);
    rval.putInt32Le(s2.h1);
    rval.putInt32Le(s2.h2);
    rval.putInt32Le(s2.h3);
    return rval;
  };

  return md;
};

// padding, constant tables for calculating md5
var _padding$3 = null;
var _g = null;
var _r = null;
var _k$2 = null;
var _initialized$3 = false;

/**
 * Initializes the constant tables.
 */
function _init$3() {
  // create padding
  _padding$3 = String.fromCharCode(128);
  _padding$3 += forge$w.util.fillString(String.fromCharCode(0x00), 64);

  // g values
  _g = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12,
    5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2,
    0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9];

  // rounds table
  _r = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21];

  // get the result of abs(sin(i + 1)) as a 32-bit integer
  _k$2 = new Array(64);
  for(var i = 0; i < 64; ++i) {
    _k$2[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
  }

  // now initialized
  _initialized$3 = true;
}

/**
 * Updates an MD5 state with the given byte buffer.
 *
 * @param s the MD5 state to update.
 * @param w the array to use to store words.
 * @param bytes the byte buffer to update with.
 */
function _update$3(s, w, bytes) {
  // consume 512 bit (64 byte) chunks
  var t, a, b, c, d, f, r, i;
  var len = bytes.length();
  while(len >= 64) {
    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;

    // round 1
    for(i = 0; i < 16; ++i) {
      w[i] = bytes.getInt32Le();
      f = d ^ (b & (c ^ d));
      t = (a + f + _k$2[i] + w[i]);
      r = _r[i];
      a = d;
      d = c;
      c = b;
      b += (t << r) | (t >>> (32 - r));
    }
    // round 2
    for(; i < 32; ++i) {
      f = c ^ (d & (b ^ c));
      t = (a + f + _k$2[i] + w[_g[i]]);
      r = _r[i];
      a = d;
      d = c;
      c = b;
      b += (t << r) | (t >>> (32 - r));
    }
    // round 3
    for(; i < 48; ++i) {
      f = b ^ c ^ d;
      t = (a + f + _k$2[i] + w[_g[i]]);
      r = _r[i];
      a = d;
      d = c;
      c = b;
      b += (t << r) | (t >>> (32 - r));
    }
    // round 4
    for(; i < 64; ++i) {
      f = c ^ (b | ~d);
      t = (a + f + _k$2[i] + w[_g[i]]);
      r = _r[i];
      a = d;
      d = c;
      c = b;
      b += (t << r) | (t >>> (32 - r));
    }

    // update hash state
    s.h0 = (s.h0 + a) | 0;
    s.h1 = (s.h1 + b) | 0;
    s.h2 = (s.h2 + c) | 0;
    s.h3 = (s.h3 + d) | 0;

    len -= 64;
  }
}

/**
 * Javascript implementation of basic PEM (Privacy Enhanced Mail) algorithms.
 *
 * See: RFC 1421.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2013-2014 Digital Bazaar, Inc.
 *
 * A Forge PEM object has the following fields:
 *
 * type: identifies the type of message (eg: "RSA PRIVATE KEY").
 *
 * procType: identifies the type of processing performed on the message,
 *   it has two subfields: version and type, eg: 4,ENCRYPTED.
 *
 * contentDomain: identifies the type of content in the message, typically
 *   only uses the value: "RFC822".
 *
 * dekInfo: identifies the message encryption algorithm and mode and includes
 *   any parameters for the algorithm, it has two subfields: algorithm and
 *   parameters, eg: DES-CBC,F8143EDE5960C597.
 *
 * headers: contains all other PEM encapsulated headers -- where order is
 *   significant (for pairing data like recipient ID + key info).
 *
 * body: the binary-encoded body.
 */

var forge$v = forge$F;


// shortcut for pem API
var pem = forge$v.pem = forge$v.pem || {};

/**
 * Encodes (serializes) the given PEM object.
 *
 * @param msg the PEM message object to encode.
 * @param options the options to use:
 *          maxline the maximum characters per line for the body, (default: 64).
 *
 * @return the PEM-formatted string.
 */
pem.encode = function(msg, options) {
  options = options || {};
  var rval = '-----BEGIN ' + msg.type + '-----\r\n';

  // encode special headers
  var header;
  if(msg.procType) {
    header = {
      name: 'Proc-Type',
      values: [String(msg.procType.version), msg.procType.type]
    };
    rval += foldHeader(header);
  }
  if(msg.contentDomain) {
    header = {name: 'Content-Domain', values: [msg.contentDomain]};
    rval += foldHeader(header);
  }
  if(msg.dekInfo) {
    header = {name: 'DEK-Info', values: [msg.dekInfo.algorithm]};
    if(msg.dekInfo.parameters) {
      header.values.push(msg.dekInfo.parameters);
    }
    rval += foldHeader(header);
  }

  if(msg.headers) {
    // encode all other headers
    for(var i = 0; i < msg.headers.length; ++i) {
      rval += foldHeader(msg.headers[i]);
    }
  }

  // terminate header
  if(msg.procType) {
    rval += '\r\n';
  }

  // add body
  rval += forge$v.util.encode64(msg.body, options.maxline || 64) + '\r\n';

  rval += '-----END ' + msg.type + '-----\r\n';
  return rval;
};

/**
 * Decodes (deserializes) all PEM messages found in the given string.
 *
 * @param str the PEM-formatted string to decode.
 *
 * @return the PEM message objects in an array.
 */
pem.decode = function(str) {
  var rval = [];

  // split string into PEM messages (be lenient w/EOF on BEGIN line)
  var rMessage = /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g;
  var rHeader = /([\x21-\x7e]+):\s*([\x21-\x7e\s^:]+)/;
  var rCRLF = /\r?\n/;
  var match;
  while(true) {
    match = rMessage.exec(str);
    if(!match) {
      break;
    }

    var msg = {
      type: match[1],
      procType: null,
      contentDomain: null,
      dekInfo: null,
      headers: [],
      body: forge$v.util.decode64(match[3])
    };
    rval.push(msg);

    // no headers
    if(!match[2]) {
      continue;
    }

    // parse headers
    var lines = match[2].split(rCRLF);
    var li = 0;
    while(match && li < lines.length) {
      // get line, trim any rhs whitespace
      var line = lines[li].replace(/\s+$/, '');

      // RFC2822 unfold any following folded lines
      for(var nl = li + 1; nl < lines.length; ++nl) {
        var next = lines[nl];
        if(!/\s/.test(next[0])) {
          break;
        }
        line += next;
        li = nl;
      }

      // parse header
      match = line.match(rHeader);
      if(match) {
        var header = {name: match[1], values: []};
        var values = match[2].split(',');
        for(var vi = 0; vi < values.length; ++vi) {
          header.values.push(ltrim(values[vi]));
        }

        // Proc-Type must be the first header
        if(!msg.procType) {
          if(header.name !== 'Proc-Type') {
            throw new Error('Invalid PEM formatted message. The first ' +
              'encapsulated header must be "Proc-Type".');
          } else if(header.values.length !== 2) {
            throw new Error('Invalid PEM formatted message. The "Proc-Type" ' +
              'header must have two subfields.');
          }
          msg.procType = {version: values[0], type: values[1]};
        } else if(!msg.contentDomain && header.name === 'Content-Domain') {
          // special-case Content-Domain
          msg.contentDomain = values[0] || '';
        } else if(!msg.dekInfo && header.name === 'DEK-Info') {
          // special-case DEK-Info
          if(header.values.length === 0) {
            throw new Error('Invalid PEM formatted message. The "DEK-Info" ' +
              'header must have at least one subfield.');
          }
          msg.dekInfo = {algorithm: values[0], parameters: values[1] || null};
        } else {
          msg.headers.push(header);
        }
      }

      ++li;
    }

    if(msg.procType === 'ENCRYPTED' && !msg.dekInfo) {
      throw new Error('Invalid PEM formatted message. The "DEK-Info" ' +
        'header must be present if "Proc-Type" is "ENCRYPTED".');
    }
  }

  if(rval.length === 0) {
    throw new Error('Invalid PEM formatted message.');
  }

  return rval;
};

function foldHeader(header) {
  var rval = header.name + ': ';

  // ensure values with CRLF are folded
  var values = [];
  var insertSpace = function(match, $1) {
    return ' ' + $1;
  };
  for(var i = 0; i < header.values.length; ++i) {
    values.push(header.values[i].replace(/^(\S+\r\n)/, insertSpace));
  }
  rval += values.join(',') + '\r\n';

  // do folding
  var length = 0;
  var candidate = -1;
  for(var i = 0; i < rval.length; ++i, ++length) {
    if(length > 65 && candidate !== -1) {
      var insert = rval[candidate];
      if(insert === ',') {
        ++candidate;
        rval = rval.substr(0, candidate) + '\r\n ' + rval.substr(candidate);
      } else {
        rval = rval.substr(0, candidate) +
          '\r\n' + insert + rval.substr(candidate + 1);
      }
      length = (i - candidate - 1);
      candidate = -1;
      ++i;
    } else if(rval[i] === ' ' || rval[i] === '\t' || rval[i] === ',') {
      candidate = i;
    }
  }

  return rval;
}

function ltrim(str) {
  return str.replace(/^\s+/, '');
}

/**
 * DES (Data Encryption Standard) implementation.
 *
 * This implementation supports DES as well as 3DES-EDE in ECB and CBC mode.
 * It is based on the BSD-licensed implementation by Paul Tero:
 *
 * Paul Tero, July 2001
 * http://www.tero.co.uk/des/
 *
 * Optimised for performance with large blocks by
 * Michael Hayworth, November 2001
 * http://www.netdealing.com
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * @author Stefan Siegl
 * @author Dave Longley
 *
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 * Copyright (c) 2012-2014 Digital Bazaar, Inc.
 */

var forge$u = forge$F;




/* DES API */
forge$u.des = forge$u.des || {};

/**
 * Deprecated. Instead, use:
 *
 * var cipher = forge.cipher.createCipher('DES-<mode>', key);
 * cipher.start({iv: iv});
 *
 * Creates an DES cipher object to encrypt data using the given symmetric key.
 * The output will be stored in the 'output' member of the returned cipher.
 *
 * The key and iv may be given as binary-encoded strings of bytes or
 * byte buffers.
 *
 * @param key the symmetric key to use (64 or 192 bits).
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 * @param mode the cipher mode to use (default: 'CBC' if IV is
 *          given, 'ECB' if null).
 *
 * @return the cipher.
 */
forge$u.des.startEncrypting = function(key, iv, output, mode) {
  var cipher = _createCipher({
    key: key,
    output: output,
    decrypt: false,
    mode: mode || (iv === null ? 'ECB' : 'CBC')
  });
  cipher.start(iv);
  return cipher;
};

/**
 * Deprecated. Instead, use:
 *
 * var cipher = forge.cipher.createCipher('DES-<mode>', key);
 *
 * Creates an DES cipher object to encrypt data using the given symmetric key.
 *
 * The key may be given as a binary-encoded string of bytes or a byte buffer.
 *
 * @param key the symmetric key to use (64 or 192 bits).
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$u.des.createEncryptionCipher = function(key, mode) {
  return _createCipher({
    key: key,
    output: null,
    decrypt: false,
    mode: mode
  });
};

/**
 * Deprecated. Instead, use:
 *
 * var decipher = forge.cipher.createDecipher('DES-<mode>', key);
 * decipher.start({iv: iv});
 *
 * Creates an DES cipher object to decrypt data using the given symmetric key.
 * The output will be stored in the 'output' member of the returned cipher.
 *
 * The key and iv may be given as binary-encoded strings of bytes or
 * byte buffers.
 *
 * @param key the symmetric key to use (64 or 192 bits).
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 * @param mode the cipher mode to use (default: 'CBC' if IV is
 *          given, 'ECB' if null).
 *
 * @return the cipher.
 */
forge$u.des.startDecrypting = function(key, iv, output, mode) {
  var cipher = _createCipher({
    key: key,
    output: output,
    decrypt: true,
    mode: mode || (iv === null ? 'ECB' : 'CBC')
  });
  cipher.start(iv);
  return cipher;
};

/**
 * Deprecated. Instead, use:
 *
 * var decipher = forge.cipher.createDecipher('DES-<mode>', key);
 *
 * Creates an DES cipher object to decrypt data using the given symmetric key.
 *
 * The key may be given as a binary-encoded string of bytes or a byte buffer.
 *
 * @param key the symmetric key to use (64 or 192 bits).
 * @param mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
forge$u.des.createDecryptionCipher = function(key, mode) {
  return _createCipher({
    key: key,
    output: null,
    decrypt: true,
    mode: mode
  });
};

/**
 * Creates a new DES cipher algorithm object.
 *
 * @param name the name of the algorithm.
 * @param mode the mode factory function.
 *
 * @return the DES algorithm object.
 */
forge$u.des.Algorithm = function(name, mode) {
  var self = this;
  self.name = name;
  self.mode = new mode({
    blockSize: 8,
    cipher: {
      encrypt: function(inBlock, outBlock) {
        return _updateBlock(self._keys, inBlock, outBlock, false);
      },
      decrypt: function(inBlock, outBlock) {
        return _updateBlock(self._keys, inBlock, outBlock, true);
      }
    }
  });
  self._init = false;
};

/**
 * Initializes this DES algorithm by expanding its key.
 *
 * @param options the options to use.
 *          key the key to use with this algorithm.
 *          decrypt true if the algorithm should be initialized for decryption,
 *            false for encryption.
 */
forge$u.des.Algorithm.prototype.initialize = function(options) {
  if(this._init) {
    return;
  }

  var key = forge$u.util.createBuffer(options.key);
  if(this.name.indexOf('3DES') === 0) {
    if(key.length() !== 24) {
      throw new Error('Invalid Triple-DES key size: ' + key.length() * 8);
    }
  }

  // do key expansion to 16 or 48 subkeys (single or triple DES)
  this._keys = _createKeys(key);
  this._init = true;
};

/** Register DES algorithms **/

registerAlgorithm('DES-ECB', forge$u.cipher.modes.ecb);
registerAlgorithm('DES-CBC', forge$u.cipher.modes.cbc);
registerAlgorithm('DES-CFB', forge$u.cipher.modes.cfb);
registerAlgorithm('DES-OFB', forge$u.cipher.modes.ofb);
registerAlgorithm('DES-CTR', forge$u.cipher.modes.ctr);

registerAlgorithm('3DES-ECB', forge$u.cipher.modes.ecb);
registerAlgorithm('3DES-CBC', forge$u.cipher.modes.cbc);
registerAlgorithm('3DES-CFB', forge$u.cipher.modes.cfb);
registerAlgorithm('3DES-OFB', forge$u.cipher.modes.ofb);
registerAlgorithm('3DES-CTR', forge$u.cipher.modes.ctr);

function registerAlgorithm(name, mode) {
  var factory = function() {
    return new forge$u.des.Algorithm(name, mode);
  };
  forge$u.cipher.registerAlgorithm(name, factory);
}

/** DES implementation **/

var spfunction1 = [0x1010400,0,0x10000,0x1010404,0x1010004,0x10404,0x4,0x10000,0x400,0x1010400,0x1010404,0x400,0x1000404,0x1010004,0x1000000,0x4,0x404,0x1000400,0x1000400,0x10400,0x10400,0x1010000,0x1010000,0x1000404,0x10004,0x1000004,0x1000004,0x10004,0,0x404,0x10404,0x1000000,0x10000,0x1010404,0x4,0x1010000,0x1010400,0x1000000,0x1000000,0x400,0x1010004,0x10000,0x10400,0x1000004,0x400,0x4,0x1000404,0x10404,0x1010404,0x10004,0x1010000,0x1000404,0x1000004,0x404,0x10404,0x1010400,0x404,0x1000400,0x1000400,0,0x10004,0x10400,0,0x1010004];
var spfunction2 = [-0x7fef7fe0,-0x7fff8000,0x8000,0x108020,0x100000,0x20,-0x7fefffe0,-0x7fff7fe0,-0x7fffffe0,-0x7fef7fe0,-0x7fef8000,-0x80000000,-0x7fff8000,0x100000,0x20,-0x7fefffe0,0x108000,0x100020,-0x7fff7fe0,0,-0x80000000,0x8000,0x108020,-0x7ff00000,0x100020,-0x7fffffe0,0,0x108000,0x8020,-0x7fef8000,-0x7ff00000,0x8020,0,0x108020,-0x7fefffe0,0x100000,-0x7fff7fe0,-0x7ff00000,-0x7fef8000,0x8000,-0x7ff00000,-0x7fff8000,0x20,-0x7fef7fe0,0x108020,0x20,0x8000,-0x80000000,0x8020,-0x7fef8000,0x100000,-0x7fffffe0,0x100020,-0x7fff7fe0,-0x7fffffe0,0x100020,0x108000,0,-0x7fff8000,0x8020,-0x80000000,-0x7fefffe0,-0x7fef7fe0,0x108000];
var spfunction3 = [0x208,0x8020200,0,0x8020008,0x8000200,0,0x20208,0x8000200,0x20008,0x8000008,0x8000008,0x20000,0x8020208,0x20008,0x8020000,0x208,0x8000000,0x8,0x8020200,0x200,0x20200,0x8020000,0x8020008,0x20208,0x8000208,0x20200,0x20000,0x8000208,0x8,0x8020208,0x200,0x8000000,0x8020200,0x8000000,0x20008,0x208,0x20000,0x8020200,0x8000200,0,0x200,0x20008,0x8020208,0x8000200,0x8000008,0x200,0,0x8020008,0x8000208,0x20000,0x8000000,0x8020208,0x8,0x20208,0x20200,0x8000008,0x8020000,0x8000208,0x208,0x8020000,0x20208,0x8,0x8020008,0x20200];
var spfunction4 = [0x802001,0x2081,0x2081,0x80,0x802080,0x800081,0x800001,0x2001,0,0x802000,0x802000,0x802081,0x81,0,0x800080,0x800001,0x1,0x2000,0x800000,0x802001,0x80,0x800000,0x2001,0x2080,0x800081,0x1,0x2080,0x800080,0x2000,0x802080,0x802081,0x81,0x800080,0x800001,0x802000,0x802081,0x81,0,0,0x802000,0x2080,0x800080,0x800081,0x1,0x802001,0x2081,0x2081,0x80,0x802081,0x81,0x1,0x2000,0x800001,0x2001,0x802080,0x800081,0x2001,0x2080,0x800000,0x802001,0x80,0x800000,0x2000,0x802080];
var spfunction5 = [0x100,0x2080100,0x2080000,0x42000100,0x80000,0x100,0x40000000,0x2080000,0x40080100,0x80000,0x2000100,0x40080100,0x42000100,0x42080000,0x80100,0x40000000,0x2000000,0x40080000,0x40080000,0,0x40000100,0x42080100,0x42080100,0x2000100,0x42080000,0x40000100,0,0x42000000,0x2080100,0x2000000,0x42000000,0x80100,0x80000,0x42000100,0x100,0x2000000,0x40000000,0x2080000,0x42000100,0x40080100,0x2000100,0x40000000,0x42080000,0x2080100,0x40080100,0x100,0x2000000,0x42080000,0x42080100,0x80100,0x42000000,0x42080100,0x2080000,0,0x40080000,0x42000000,0x80100,0x2000100,0x40000100,0x80000,0,0x40080000,0x2080100,0x40000100];
var spfunction6 = [0x20000010,0x20400000,0x4000,0x20404010,0x20400000,0x10,0x20404010,0x400000,0x20004000,0x404010,0x400000,0x20000010,0x400010,0x20004000,0x20000000,0x4010,0,0x400010,0x20004010,0x4000,0x404000,0x20004010,0x10,0x20400010,0x20400010,0,0x404010,0x20404000,0x4010,0x404000,0x20404000,0x20000000,0x20004000,0x10,0x20400010,0x404000,0x20404010,0x400000,0x4010,0x20000010,0x400000,0x20004000,0x20000000,0x4010,0x20000010,0x20404010,0x404000,0x20400000,0x404010,0x20404000,0,0x20400010,0x10,0x4000,0x20400000,0x404010,0x4000,0x400010,0x20004010,0,0x20404000,0x20000000,0x400010,0x20004010];
var spfunction7 = [0x200000,0x4200002,0x4000802,0,0x800,0x4000802,0x200802,0x4200800,0x4200802,0x200000,0,0x4000002,0x2,0x4000000,0x4200002,0x802,0x4000800,0x200802,0x200002,0x4000800,0x4000002,0x4200000,0x4200800,0x200002,0x4200000,0x800,0x802,0x4200802,0x200800,0x2,0x4000000,0x200800,0x4000000,0x200800,0x200000,0x4000802,0x4000802,0x4200002,0x4200002,0x2,0x200002,0x4000000,0x4000800,0x200000,0x4200800,0x802,0x200802,0x4200800,0x802,0x4000002,0x4200802,0x4200000,0x200800,0,0x2,0x4200802,0,0x200802,0x4200000,0x800,0x4000002,0x4000800,0x800,0x200002];
var spfunction8 = [0x10001040,0x1000,0x40000,0x10041040,0x10000000,0x10001040,0x40,0x10000000,0x40040,0x10040000,0x10041040,0x41000,0x10041000,0x41040,0x1000,0x40,0x10040000,0x10000040,0x10001000,0x1040,0x41000,0x40040,0x10040040,0x10041000,0x1040,0,0,0x10040040,0x10000040,0x10001000,0x41040,0x40000,0x41040,0x40000,0x10041000,0x1000,0x40,0x10040040,0x1000,0x41040,0x10001000,0x40,0x10000040,0x10040000,0x10040040,0x10000000,0x40000,0x10001040,0,0x10041040,0x40040,0x10000040,0x10040000,0x10001000,0x10001040,0,0x10041040,0x41000,0x41000,0x1040,0x1040,0x40040,0x10000000,0x10041000];

/**
 * Create necessary sub keys.
 *
 * @param key the 64-bit or 192-bit key.
 *
 * @return the expanded keys.
 */
function _createKeys(key) {
  var pc2bytes0  = [0,0x4,0x20000000,0x20000004,0x10000,0x10004,0x20010000,0x20010004,0x200,0x204,0x20000200,0x20000204,0x10200,0x10204,0x20010200,0x20010204],
      pc2bytes1  = [0,0x1,0x100000,0x100001,0x4000000,0x4000001,0x4100000,0x4100001,0x100,0x101,0x100100,0x100101,0x4000100,0x4000101,0x4100100,0x4100101],
      pc2bytes2  = [0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808,0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808],
      pc2bytes3  = [0,0x200000,0x8000000,0x8200000,0x2000,0x202000,0x8002000,0x8202000,0x20000,0x220000,0x8020000,0x8220000,0x22000,0x222000,0x8022000,0x8222000],
      pc2bytes4  = [0,0x40000,0x10,0x40010,0,0x40000,0x10,0x40010,0x1000,0x41000,0x1010,0x41010,0x1000,0x41000,0x1010,0x41010],
      pc2bytes5  = [0,0x400,0x20,0x420,0,0x400,0x20,0x420,0x2000000,0x2000400,0x2000020,0x2000420,0x2000000,0x2000400,0x2000020,0x2000420],
      pc2bytes6  = [0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002,0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002],
      pc2bytes7  = [0,0x10000,0x800,0x10800,0x20000000,0x20010000,0x20000800,0x20010800,0x20000,0x30000,0x20800,0x30800,0x20020000,0x20030000,0x20020800,0x20030800],
      pc2bytes8  = [0,0x40000,0,0x40000,0x2,0x40002,0x2,0x40002,0x2000000,0x2040000,0x2000000,0x2040000,0x2000002,0x2040002,0x2000002,0x2040002],
      pc2bytes9  = [0,0x10000000,0x8,0x10000008,0,0x10000000,0x8,0x10000008,0x400,0x10000400,0x408,0x10000408,0x400,0x10000400,0x408,0x10000408],
      pc2bytes10 = [0,0x20,0,0x20,0x100000,0x100020,0x100000,0x100020,0x2000,0x2020,0x2000,0x2020,0x102000,0x102020,0x102000,0x102020],
      pc2bytes11 = [0,0x1000000,0x200,0x1000200,0x200000,0x1200000,0x200200,0x1200200,0x4000000,0x5000000,0x4000200,0x5000200,0x4200000,0x5200000,0x4200200,0x5200200],
      pc2bytes12 = [0,0x1000,0x8000000,0x8001000,0x80000,0x81000,0x8080000,0x8081000,0x10,0x1010,0x8000010,0x8001010,0x80010,0x81010,0x8080010,0x8081010],
      pc2bytes13 = [0,0x4,0x100,0x104,0,0x4,0x100,0x104,0x1,0x5,0x101,0x105,0x1,0x5,0x101,0x105];

  // how many iterations (1 for des, 3 for triple des)
  // changed by Paul 16/6/2007 to use Triple DES for 9+ byte keys
  var iterations = key.length() > 8 ? 3 : 1;

  // stores the return keys
  var keys = [];

  // now define the left shifts which need to be done
  var shifts = [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0];

  var n = 0, tmp;
  for(var j = 0; j < iterations; j++) {
    var left = key.getInt32();
    var right = key.getInt32();

    tmp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
    right ^= tmp;
    left ^= (tmp << 4);

    tmp = ((right >>> -16) ^ left) & 0x0000ffff;
    left ^= tmp;
    right ^= (tmp << -16);

    tmp = ((left >>> 2) ^ right) & 0x33333333;
    right ^= tmp;
    left ^= (tmp << 2);

    tmp = ((right >>> -16) ^ left) & 0x0000ffff;
    left ^= tmp;
    right ^= (tmp << -16);

    tmp = ((left >>> 1) ^ right) & 0x55555555;
    right ^= tmp;
    left ^= (tmp << 1);

    tmp = ((right >>> 8) ^ left) & 0x00ff00ff;
    left ^= tmp;
    right ^= (tmp << 8);

    tmp = ((left >>> 1) ^ right) & 0x55555555;
    right ^= tmp;
    left ^= (tmp << 1);

    // right needs to be shifted and OR'd with last four bits of left
    tmp = (left << 8) | ((right >>> 20) & 0x000000f0);

    // left needs to be put upside down
    left = ((right << 24) | ((right << 8) & 0xff0000) |
      ((right >>> 8) & 0xff00) | ((right >>> 24) & 0xf0));
    right = tmp;

    // now go through and perform these shifts on the left and right keys
    for(var i = 0; i < shifts.length; ++i) {
      //shift the keys either one or two bits to the left
      if(shifts[i]) {
        left = (left << 2) | (left >>> 26);
        right = (right << 2) | (right >>> 26);
      } else {
        left = (left << 1) | (left >>> 27);
        right = (right << 1) | (right >>> 27);
      }
      left &= -0xf;
      right &= -0xf;

      // now apply PC-2, in such a way that E is easier when encrypting or
      // decrypting this conversion will look like PC-2 except only the last 6
      // bits of each byte are used rather than 48 consecutive bits and the
      // order of lines will be according to how the S selection functions will
      // be applied: S2, S4, S6, S8, S1, S3, S5, S7
      var lefttmp = (
        pc2bytes0[left >>> 28] | pc2bytes1[(left >>> 24) & 0xf] |
        pc2bytes2[(left >>> 20) & 0xf] | pc2bytes3[(left >>> 16) & 0xf] |
        pc2bytes4[(left >>> 12) & 0xf] | pc2bytes5[(left >>> 8) & 0xf] |
        pc2bytes6[(left >>> 4) & 0xf]);
      var righttmp = (
        pc2bytes7[right >>> 28] | pc2bytes8[(right >>> 24) & 0xf] |
        pc2bytes9[(right >>> 20) & 0xf] | pc2bytes10[(right >>> 16) & 0xf] |
        pc2bytes11[(right >>> 12) & 0xf] | pc2bytes12[(right >>> 8) & 0xf] |
        pc2bytes13[(right >>> 4) & 0xf]);
      tmp = ((righttmp >>> 16) ^ lefttmp) & 0x0000ffff;
      keys[n++] = lefttmp ^ tmp;
      keys[n++] = righttmp ^ (tmp << 16);
    }
  }

  return keys;
}

/**
 * Updates a single block (1 byte) using DES. The update will either
 * encrypt or decrypt the block.
 *
 * @param keys the expanded keys.
 * @param input the input block (an array of 32-bit words).
 * @param output the updated output block.
 * @param decrypt true to decrypt the block, false to encrypt it.
 */
function _updateBlock(keys, input, output, decrypt) {
  // set up loops for single or triple DES
  var iterations = keys.length === 32 ? 3 : 9;
  var looping;
  if(iterations === 3) {
    looping = decrypt ? [30, -2, -2] : [0, 32, 2];
  } else {
    looping = (decrypt ?
      [94, 62, -2, 32, 64, 2, 30, -2, -2] :
      [0, 32, 2, 62, 30, -2, 64, 96, 2]);
  }

  var tmp;

  var left = input[0];
  var right = input[1];

  // first each 64 bit chunk of the message must be permuted according to IP
  tmp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
  right ^= tmp;
  left ^= (tmp << 4);

  tmp = ((left >>> 16) ^ right) & 0x0000ffff;
  right ^= tmp;
  left ^= (tmp << 16);

  tmp = ((right >>> 2) ^ left) & 0x33333333;
  left ^= tmp;
  right ^= (tmp << 2);

  tmp = ((right >>> 8) ^ left) & 0x00ff00ff;
  left ^= tmp;
  right ^= (tmp << 8);

  tmp = ((left >>> 1) ^ right) & 0x55555555;
  right ^= tmp;
  left ^= (tmp << 1);

  // rotate left 1 bit
  left = ((left << 1) | (left >>> 31));
  right = ((right << 1) | (right >>> 31));

  for(var j = 0; j < iterations; j += 3) {
    var endloop = looping[j + 1];
    var loopinc = looping[j + 2];

    // now go through and perform the encryption or decryption
    for(var i = looping[j]; i != endloop; i += loopinc) {
      var right1 = right ^ keys[i];
      var right2 = ((right >>> 4) | (right << 28)) ^ keys[i + 1];

      // passing these bytes through the S selection functions
      tmp = left;
      left = right;
      right = tmp ^ (
        spfunction2[(right1 >>> 24) & 0x3f] |
        spfunction4[(right1 >>> 16) & 0x3f] |
        spfunction6[(right1 >>>  8) & 0x3f] |
        spfunction8[right1 & 0x3f] |
        spfunction1[(right2 >>> 24) & 0x3f] |
        spfunction3[(right2 >>> 16) & 0x3f] |
        spfunction5[(right2 >>>  8) & 0x3f] |
        spfunction7[right2 & 0x3f]);
    }
    // unreverse left and right
    tmp = left;
    left = right;
    right = tmp;
  }

  // rotate right 1 bit
  left = ((left >>> 1) | (left << 31));
  right = ((right >>> 1) | (right << 31));

  // now perform IP-1, which is IP in the opposite direction
  tmp = ((left >>> 1) ^ right) & 0x55555555;
  right ^= tmp;
  left ^= (tmp << 1);

  tmp = ((right >>> 8) ^ left) & 0x00ff00ff;
  left ^= tmp;
  right ^= (tmp << 8);

  tmp = ((right >>> 2) ^ left) & 0x33333333;
  left ^= tmp;
  right ^= (tmp << 2);

  tmp = ((left >>> 16) ^ right) & 0x0000ffff;
  right ^= tmp;
  left ^= (tmp << 16);

  tmp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
  right ^= tmp;
  left ^= (tmp << 4);

  output[0] = left;
  output[1] = right;
}

/**
 * Deprecated. Instead, use:
 *
 * forge.cipher.createCipher('DES-<mode>', key);
 * forge.cipher.createDecipher('DES-<mode>', key);
 *
 * Creates a deprecated DES cipher object. This object's mode will default to
 * CBC (cipher-block-chaining).
 *
 * The key may be given as a binary-encoded string of bytes or a byte buffer.
 *
 * @param options the options to use.
 *          key the symmetric key to use (64 or 192 bits).
 *          output the buffer to write to.
 *          decrypt true for decryption, false for encryption.
 *          mode the cipher mode to use (default: 'CBC').
 *
 * @return the cipher.
 */
function _createCipher(options) {
  options = options || {};
  var mode = (options.mode || 'CBC').toUpperCase();
  var algorithm = 'DES-' + mode;

  var cipher;
  if(options.decrypt) {
    cipher = forge$u.cipher.createDecipher(algorithm, options.key);
  } else {
    cipher = forge$u.cipher.createCipher(algorithm, options.key);
  }

  // backwards compatible start API
  var start = cipher.start;
  cipher.start = function(iv, options) {
    // backwards compatibility: support second arg as output buffer
    var output = null;
    if(options instanceof forge$u.util.ByteBuffer) {
      output = options;
      options = {};
    }
    options = options || {};
    options.output = output;
    options.iv = iv;
    start.call(cipher, options);
  };

  return cipher;
}

/**
 * Password-Based Key-Derivation Function #2 implementation.
 *
 * See RFC 2898 for details.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 */

var forge$t = forge$F;




var pkcs5 = forge$t.pkcs5 = forge$t.pkcs5 || {};

var crypto;
if(forge$t.util.isNodejs && !forge$t.options.usePureJavaScript) {
  crypto = require$$1__default;
}

/**
 * Derives a key from a password.
 *
 * @param p the password as a binary-encoded string of bytes.
 * @param s the salt as a binary-encoded string of bytes.
 * @param c the iteration count, a positive integer.
 * @param dkLen the intended length, in bytes, of the derived key,
 *          (max: 2^32 - 1) * hash length of the PRF.
 * @param [md] the message digest (or algorithm identifier as a string) to use
 *          in the PRF, defaults to SHA-1.
 * @param [callback(err, key)] presence triggers asynchronous version, called
 *          once the operation completes.
 *
 * @return the derived key, as a binary-encoded string of bytes, for the
 *           synchronous version (if no callback is specified).
 */
forge$t.pbkdf2 = pkcs5.pbkdf2 = function(
  p, s, c, dkLen, md, callback) {
  if(typeof md === 'function') {
    callback = md;
    md = null;
  }

  // use native implementation if possible and not disabled, note that
  // some node versions only support SHA-1, others allow digest to be changed
  if(forge$t.util.isNodejs && !forge$t.options.usePureJavaScript &&
    crypto.pbkdf2 && (md === null || typeof md !== 'object') &&
    (crypto.pbkdf2Sync.length > 4 || (!md || md === 'sha1'))) {
    if(typeof md !== 'string') {
      // default prf to SHA-1
      md = 'sha1';
    }
    p = Buffer.from(p, 'binary');
    s = Buffer.from(s, 'binary');
    if(!callback) {
      if(crypto.pbkdf2Sync.length === 4) {
        return crypto.pbkdf2Sync(p, s, c, dkLen).toString('binary');
      }
      return crypto.pbkdf2Sync(p, s, c, dkLen, md).toString('binary');
    }
    if(crypto.pbkdf2Sync.length === 4) {
      return crypto.pbkdf2(p, s, c, dkLen, function(err, key) {
        if(err) {
          return callback(err);
        }
        callback(null, key.toString('binary'));
      });
    }
    return crypto.pbkdf2(p, s, c, dkLen, md, function(err, key) {
      if(err) {
        return callback(err);
      }
      callback(null, key.toString('binary'));
    });
  }

  if(typeof md === 'undefined' || md === null) {
    // default prf to SHA-1
    md = 'sha1';
  }
  if(typeof md === 'string') {
    if(!(md in forge$t.md.algorithms)) {
      throw new Error('Unknown hash algorithm: ' + md);
    }
    md = forge$t.md[md].create();
  }

  var hLen = md.digestLength;

  /* 1. If dkLen > (2^32 - 1) * hLen, output "derived key too long" and
    stop. */
  if(dkLen > (0xFFFFFFFF * hLen)) {
    var err = new Error('Derived key is too long.');
    if(callback) {
      return callback(err);
    }
    throw err;
  }

  /* 2. Let len be the number of hLen-octet blocks in the derived key,
    rounding up, and let r be the number of octets in the last
    block:

    len = CEIL(dkLen / hLen),
    r = dkLen - (len - 1) * hLen. */
  var len = Math.ceil(dkLen / hLen);
  var r = dkLen - (len - 1) * hLen;

  /* 3. For each block of the derived key apply the function F defined
    below to the password P, the salt S, the iteration count c, and
    the block index to compute the block:

    T_1 = F(P, S, c, 1),
    T_2 = F(P, S, c, 2),
    ...
    T_len = F(P, S, c, len),

    where the function F is defined as the exclusive-or sum of the
    first c iterates of the underlying pseudorandom function PRF
    applied to the password P and the concatenation of the salt S
    and the block index i:

    F(P, S, c, i) = u_1 XOR u_2 XOR ... XOR u_c

    where

    u_1 = PRF(P, S || INT(i)),
    u_2 = PRF(P, u_1),
    ...
    u_c = PRF(P, u_{c-1}).

    Here, INT(i) is a four-octet encoding of the integer i, most
    significant octet first. */
  var prf = forge$t.hmac.create();
  prf.start(md, p);
  var dk = '';
  var xor, u_c, u_c1;

  // sync version
  if(!callback) {
    for(var i = 1; i <= len; ++i) {
      // PRF(P, S || INT(i)) (first iteration)
      prf.start(null, null);
      prf.update(s);
      prf.update(forge$t.util.int32ToBytes(i));
      xor = u_c1 = prf.digest().getBytes();

      // PRF(P, u_{c-1}) (other iterations)
      for(var j = 2; j <= c; ++j) {
        prf.start(null, null);
        prf.update(u_c1);
        u_c = prf.digest().getBytes();
        // F(p, s, c, i)
        xor = forge$t.util.xorBytes(xor, u_c, hLen);
        u_c1 = u_c;
      }

      /* 4. Concatenate the blocks and extract the first dkLen octets to
        produce a derived key DK:

        DK = T_1 || T_2 ||  ...  || T_len<0..r-1> */
      dk += (i < len) ? xor : xor.substr(0, r);
    }
    /* 5. Output the derived key DK. */
    return dk;
  }

  // async version
  var i = 1, j;
  function outer() {
    if(i > len) {
      // done
      return callback(null, dk);
    }

    // PRF(P, S || INT(i)) (first iteration)
    prf.start(null, null);
    prf.update(s);
    prf.update(forge$t.util.int32ToBytes(i));
    xor = u_c1 = prf.digest().getBytes();

    // PRF(P, u_{c-1}) (other iterations)
    j = 2;
    inner();
  }

  function inner() {
    if(j <= c) {
      prf.start(null, null);
      prf.update(u_c1);
      u_c = prf.digest().getBytes();
      // F(p, s, c, i)
      xor = forge$t.util.xorBytes(xor, u_c, hLen);
      u_c1 = u_c;
      ++j;
      return forge$t.util.setImmediate(inner);
    }

    /* 4. Concatenate the blocks and extract the first dkLen octets to
      produce a derived key DK:

      DK = T_1 || T_2 ||  ...  || T_len<0..r-1> */
    dk += (i < len) ? xor : xor.substr(0, r);

    ++i;
    outer();
  }

  outer();
};

/**
 * Secure Hash Algorithm with 256-bit digest (SHA-256) implementation.
 *
 * See FIPS 180-2 for details.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2015 Digital Bazaar, Inc.
 */

var forge$s = forge$F;



var sha256 = forge$s.sha256 = forge$s.sha256 || {};
forge$s.md.sha256 = forge$s.md.algorithms.sha256 = sha256;

/**
 * Creates a SHA-256 message digest object.
 *
 * @return a message digest object.
 */
sha256.create = function() {
  // do initialization as necessary
  if(!_initialized$2) {
    _init$2();
  }

  // SHA-256 state contains eight 32-bit integers
  var _state = null;

  // input buffer
  var _input = forge$s.util.createBuffer();

  // used for word storage
  var _w = new Array(64);

  // message digest object
  var md = {
    algorithm: 'sha256',
    blockLength: 64,
    digestLength: 32,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 8
  };

  /**
   * Starts the digest.
   *
   * @return this digest object.
   */
  md.start = function() {
    // up to 56-bit message length for convenience
    md.messageLength = 0;

    // full message length (set md.messageLength64 for backwards-compatibility)
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for(var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge$s.util.createBuffer();
    _state = {
      h0: 0x6A09E667,
      h1: 0xBB67AE85,
      h2: 0x3C6EF372,
      h3: 0xA54FF53A,
      h4: 0x510E527F,
      h5: 0x9B05688C,
      h6: 0x1F83D9AB,
      h7: 0x5BE0CD19
    };
    return md;
  };
  // start digest automatically for first time
  md.start();

  /**
   * Updates the digest with the given message input. The given input can
   * treated as raw input (no encoding will be applied) or an encoding of
   * 'utf8' maybe given to encode the input using UTF-8.
   *
   * @param msg the message input to update with.
   * @param encoding the encoding to use (default: 'raw', other: 'utf8').
   *
   * @return this digest object.
   */
  md.update = function(msg, encoding) {
    if(encoding === 'utf8') {
      msg = forge$s.util.encodeUtf8(msg);
    }

    // update message length
    var len = msg.length;
    md.messageLength += len;
    len = [(len / 0x100000000) >>> 0, len >>> 0];
    for(var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + ((md.fullMessageLength[i] / 0x100000000) >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = ((len[1] / 0x100000000) >>> 0);
    }

    // add bytes to input buffer
    _input.putBytes(msg);

    // process bytes
    _update$2(_state, _w, _input);

    // compact input buffer every 2K or if empty
    if(_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }

    return md;
  };

  /**
   * Produces the digest.
   *
   * @return a byte buffer containing the digest value.
   */
  md.digest = function() {
    /* Note: Here we copy the remaining bytes in the input buffer and
    add the appropriate SHA-256 padding. Then we do the final update
    on a copy of the state so that if the user wants to get
    intermediate digests they can do so. */

    /* Determine the number of bytes that must be added to the message
    to ensure its length is congruent to 448 mod 512. In other words,
    the data to be digested must be a multiple of 512 bits (or 128 bytes).
    This data includes the message, some padding, and the length of the
    message. Since the length of the message will be encoded as 8 bytes (64
    bits), that means that the last segment of the data must have 56 bytes
    (448 bits) of message and padding. Therefore, the length of the message
    plus the padding must be congruent to 448 mod 512 because
    512 - 128 = 448.

    In order to fill up the message length it must be filled with
    padding that begins with 1 bit followed by all 0 bits. Padding
    must *always* be present, so if the message length is already
    congruent to 448 mod 512, then 512 padding bits must be added. */

    var finalBlock = forge$s.util.createBuffer();
    finalBlock.putBytes(_input.bytes());

    // compute remaining size to be digested (include message length size)
    var remaining = (
      md.fullMessageLength[md.fullMessageLength.length - 1] +
      md.messageLengthSize);

    // add padding for overflow blockSize - overflow
    // _padding starts with 1 byte with first bit is set (byte value 128), then
    // there may be up to (blockSize - 1) other pad bytes
    var overflow = remaining & (md.blockLength - 1);
    finalBlock.putBytes(_padding$2.substr(0, md.blockLength - overflow));

    // serialize message length in bits in big-endian order; since length
    // is stored in bytes we multiply by 8 and add carry from next int
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for(var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = (next / 0x100000000) >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);

    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4,
      h5: _state.h5,
      h6: _state.h6,
      h7: _state.h7
    };
    _update$2(s2, _w, finalBlock);
    var rval = forge$s.util.createBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    rval.putInt32(s2.h5);
    rval.putInt32(s2.h6);
    rval.putInt32(s2.h7);
    return rval;
  };

  return md;
};

// sha-256 padding bytes not initialized yet
var _padding$2 = null;
var _initialized$2 = false;

// table of constants
var _k$1 = null;

/**
 * Initializes the constant tables.
 */
function _init$2() {
  // create padding
  _padding$2 = String.fromCharCode(128);
  _padding$2 += forge$s.util.fillString(String.fromCharCode(0x00), 64);

  // create K table for SHA-256
  _k$1 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  // now initialized
  _initialized$2 = true;
}

/**
 * Updates a SHA-256 state with the given byte buffer.
 *
 * @param s the SHA-256 state to update.
 * @param w the array to use to store words.
 * @param bytes the byte buffer to update with.
 */
function _update$2(s, w, bytes) {
  // consume 512 bit (64 byte) chunks
  var t1, t2, s0, s1, ch, maj, i, a, b, c, d, e, f, g, h;
  var len = bytes.length();
  while(len >= 64) {
    // the w array will be populated with sixteen 32-bit big-endian words
    // and then extended into 64 32-bit words according to SHA-256
    for(i = 0; i < 16; ++i) {
      w[i] = bytes.getInt32();
    }
    for(; i < 64; ++i) {
      // XOR word 2 words ago rot right 17, rot right 19, shft right 10
      t1 = w[i - 2];
      t1 =
        ((t1 >>> 17) | (t1 << 15)) ^
        ((t1 >>> 19) | (t1 << 13)) ^
        (t1 >>> 10);
      // XOR word 15 words ago rot right 7, rot right 18, shft right 3
      t2 = w[i - 15];
      t2 =
        ((t2 >>> 7) | (t2 << 25)) ^
        ((t2 >>> 18) | (t2 << 14)) ^
        (t2 >>> 3);
      // sum(t1, word 7 ago, t2, word 16 ago) modulo 2^32
      w[i] = (t1 + w[i - 7] + t2 + w[i - 16]) | 0;
    }

    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;
    f = s.h5;
    g = s.h6;
    h = s.h7;

    // round function
    for(i = 0; i < 64; ++i) {
      // Sum1(e)
      s1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      // Ch(e, f, g) (optimized the same way as SHA-1)
      ch = g ^ (e & (f ^ g));
      // Sum0(a)
      s0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      // Maj(a, b, c) (optimized the same way as SHA-1)
      maj = (a & b) | (c & (a ^ b));

      // main algorithm
      t1 = h + s1 + ch + _k$1[i] + w[i];
      t2 = s0 + maj;
      h = g;
      g = f;
      f = e;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      // can't truncate with `| 0`
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      // can't truncate with `| 0`
      a = (t1 + t2) >>> 0;
    }

    // update hash state
    s.h0 = (s.h0 + a) | 0;
    s.h1 = (s.h1 + b) | 0;
    s.h2 = (s.h2 + c) | 0;
    s.h3 = (s.h3 + d) | 0;
    s.h4 = (s.h4 + e) | 0;
    s.h5 = (s.h5 + f) | 0;
    s.h6 = (s.h6 + g) | 0;
    s.h7 = (s.h7 + h) | 0;
    len -= 64;
  }
}

/**
 * A javascript implementation of a cryptographically-secure
 * Pseudo Random Number Generator (PRNG). The Fortuna algorithm is followed
 * here though the use of SHA-256 is not enforced; when generating an
 * a PRNG context, the hashing algorithm and block cipher used for
 * the generator are specified via a plugin.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */

var forge$r = forge$F;


var _crypto$1 = null;
if(forge$r.util.isNodejs && !forge$r.options.usePureJavaScript &&
  !process.versions['node-webkit']) {
  _crypto$1 = require$$1__default;
}

/* PRNG API */
var prng = forge$r.prng = forge$r.prng || {};

/**
 * Creates a new PRNG context.
 *
 * A PRNG plugin must be passed in that will provide:
 *
 * 1. A function that initializes the key and seed of a PRNG context. It
 *   will be given a 16 byte key and a 16 byte seed. Any key expansion
 *   or transformation of the seed from a byte string into an array of
 *   integers (or similar) should be performed.
 * 2. The cryptographic function used by the generator. It takes a key and
 *   a seed.
 * 3. A seed increment function. It takes the seed and returns seed + 1.
 * 4. An api to create a message digest.
 *
 * For an example, see random.js.
 *
 * @param plugin the PRNG plugin to use.
 */
prng.create = function(plugin) {
  var ctx = {
    plugin: plugin,
    key: null,
    seed: null,
    time: null,
    // number of reseeds so far
    reseeds: 0,
    // amount of data generated so far
    generated: 0,
    // no initial key bytes
    keyBytes: ''
  };

  // create 32 entropy pools (each is a message digest)
  var md = plugin.md;
  var pools = new Array(32);
  for(var i = 0; i < 32; ++i) {
    pools[i] = md.create();
  }
  ctx.pools = pools;

  // entropy pools are written to cyclically, starting at index 0
  ctx.pool = 0;

  /**
   * Generates random bytes. The bytes may be generated synchronously or
   * asynchronously. Web workers must use the asynchronous interface or
   * else the behavior is undefined.
   *
   * @param count the number of random bytes to generate.
   * @param [callback(err, bytes)] called once the operation completes.
   *
   * @return count random bytes as a string.
   */
  ctx.generate = function(count, callback) {
    // do synchronously
    if(!callback) {
      return ctx.generateSync(count);
    }

    // simple generator using counter-based CBC
    var cipher = ctx.plugin.cipher;
    var increment = ctx.plugin.increment;
    var formatKey = ctx.plugin.formatKey;
    var formatSeed = ctx.plugin.formatSeed;
    var b = forge$r.util.createBuffer();

    // paranoid deviation from Fortuna:
    // reset key for every request to protect previously
    // generated random bytes should the key be discovered;
    // there is no 100ms based reseeding because of this
    // forced reseed for every `generate` call
    ctx.key = null;

    generate();

    function generate(err) {
      if(err) {
        return callback(err);
      }

      // sufficient bytes generated
      if(b.length() >= count) {
        return callback(null, b.getBytes(count));
      }

      // if amount of data generated is greater than 1 MiB, trigger reseed
      if(ctx.generated > 0xfffff) {
        ctx.key = null;
      }

      if(ctx.key === null) {
        // prevent stack overflow
        return forge$r.util.nextTick(function() {
          _reseed(generate);
        });
      }

      // generate the random bytes
      var bytes = cipher(ctx.key, ctx.seed);
      ctx.generated += bytes.length;
      b.putBytes(bytes);

      // generate bytes for a new key and seed
      ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
      ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));

      forge$r.util.setImmediate(generate);
    }
  };

  /**
   * Generates random bytes synchronously.
   *
   * @param count the number of random bytes to generate.
   *
   * @return count random bytes as a string.
   */
  ctx.generateSync = function(count) {
    // simple generator using counter-based CBC
    var cipher = ctx.plugin.cipher;
    var increment = ctx.plugin.increment;
    var formatKey = ctx.plugin.formatKey;
    var formatSeed = ctx.plugin.formatSeed;

    // paranoid deviation from Fortuna:
    // reset key for every request to protect previously
    // generated random bytes should the key be discovered;
    // there is no 100ms based reseeding because of this
    // forced reseed for every `generateSync` call
    ctx.key = null;

    var b = forge$r.util.createBuffer();
    while(b.length() < count) {
      // if amount of data generated is greater than 1 MiB, trigger reseed
      if(ctx.generated > 0xfffff) {
        ctx.key = null;
      }

      if(ctx.key === null) {
        _reseedSync();
      }

      // generate the random bytes
      var bytes = cipher(ctx.key, ctx.seed);
      ctx.generated += bytes.length;
      b.putBytes(bytes);

      // generate bytes for a new key and seed
      ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
      ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
    }

    return b.getBytes(count);
  };

  /**
   * Private function that asynchronously reseeds a generator.
   *
   * @param callback(err) called once the operation completes.
   */
  function _reseed(callback) {
    if(ctx.pools[0].messageLength >= 32) {
      _seed();
      return callback();
    }
    // not enough seed data...
    var needed = (32 - ctx.pools[0].messageLength) << 5;
    ctx.seedFile(needed, function(err, bytes) {
      if(err) {
        return callback(err);
      }
      ctx.collect(bytes);
      _seed();
      callback();
    });
  }

  /**
   * Private function that synchronously reseeds a generator.
   */
  function _reseedSync() {
    if(ctx.pools[0].messageLength >= 32) {
      return _seed();
    }
    // not enough seed data...
    var needed = (32 - ctx.pools[0].messageLength) << 5;
    ctx.collect(ctx.seedFileSync(needed));
    _seed();
  }

  /**
   * Private function that seeds a generator once enough bytes are available.
   */
  function _seed() {
    // update reseed count
    ctx.reseeds = (ctx.reseeds === 0xffffffff) ? 0 : ctx.reseeds + 1;

    // goal is to update `key` via:
    // key = hash(key + s)
    //   where 's' is all collected entropy from selected pools, then...

    // create a plugin-based message digest
    var md = ctx.plugin.md.create();

    // consume current key bytes
    md.update(ctx.keyBytes);

    // digest the entropy of pools whose index k meet the
    // condition 'n mod 2^k == 0' where n is the number of reseeds
    var _2powK = 1;
    for(var k = 0; k < 32; ++k) {
      if(ctx.reseeds % _2powK === 0) {
        md.update(ctx.pools[k].digest().getBytes());
        ctx.pools[k].start();
      }
      _2powK = _2powK << 1;
    }

    // get digest for key bytes
    ctx.keyBytes = md.digest().getBytes();

    // paranoid deviation from Fortuna:
    // update `seed` via `seed = hash(key)`
    // instead of initializing to zero once and only
    // ever incrementing it
    md.start();
    md.update(ctx.keyBytes);
    var seedBytes = md.digest().getBytes();

    // update state
    ctx.key = ctx.plugin.formatKey(ctx.keyBytes);
    ctx.seed = ctx.plugin.formatSeed(seedBytes);
    ctx.generated = 0;
  }

  /**
   * The built-in default seedFile. This seedFile is used when entropy
   * is needed immediately.
   *
   * @param needed the number of bytes that are needed.
   *
   * @return the random bytes.
   */
  function defaultSeedFile(needed) {
    // use window.crypto.getRandomValues strong source of entropy if available
    var getRandomValues = null;
    var globalScope = forge$r.util.globalScope;
    var _crypto = globalScope.crypto || globalScope.msCrypto;
    if(_crypto && _crypto.getRandomValues) {
      getRandomValues = function(arr) {
        return _crypto.getRandomValues(arr);
      };
    }

    var b = forge$r.util.createBuffer();
    if(getRandomValues) {
      while(b.length() < needed) {
        // max byte length is 65536 before QuotaExceededError is thrown
        // http://www.w3.org/TR/WebCryptoAPI/#RandomSource-method-getRandomValues
        var count = Math.max(1, Math.min(needed - b.length(), 65536) / 4);
        var entropy = new Uint32Array(Math.floor(count));
        try {
          getRandomValues(entropy);
          for(var i = 0; i < entropy.length; ++i) {
            b.putInt32(entropy[i]);
          }
        } catch(e) {
          /* only ignore QuotaExceededError */
          if(!(typeof QuotaExceededError !== 'undefined' &&
            e instanceof QuotaExceededError)) {
            throw e;
          }
        }
      }
    }

    // be sad and add some weak random data
    if(b.length() < needed) {
      /* Draws from Park-Miller "minimal standard" 31 bit PRNG,
      implemented with David G. Carta's optimization: with 32 bit math
      and without division (Public Domain). */
      var hi, lo, next;
      var seed = Math.floor(Math.random() * 0x010000);
      while(b.length() < needed) {
        lo = 16807 * (seed & 0xFFFF);
        hi = 16807 * (seed >> 16);
        lo += (hi & 0x7FFF) << 16;
        lo += hi >> 15;
        lo = (lo & 0x7FFFFFFF) + (lo >> 31);
        seed = lo & 0xFFFFFFFF;

        // consume lower 3 bytes of seed
        for(var i = 0; i < 3; ++i) {
          // throw in more pseudo random
          next = seed >>> (i << 3);
          next ^= Math.floor(Math.random() * 0x0100);
          b.putByte(String.fromCharCode(next & 0xFF));
        }
      }
    }

    return b.getBytes(needed);
  }
  // initialize seed file APIs
  if(_crypto$1) {
    // use nodejs async API
    ctx.seedFile = function(needed, callback) {
      _crypto$1.randomBytes(needed, function(err, bytes) {
        if(err) {
          return callback(err);
        }
        callback(null, bytes.toString());
      });
    };
    // use nodejs sync API
    ctx.seedFileSync = function(needed) {
      return _crypto$1.randomBytes(needed).toString();
    };
  } else {
    ctx.seedFile = function(needed, callback) {
      try {
        callback(null, defaultSeedFile(needed));
      } catch(e) {
        callback(e);
      }
    };
    ctx.seedFileSync = defaultSeedFile;
  }

  /**
   * Adds entropy to a prng ctx's accumulator.
   *
   * @param bytes the bytes of entropy as a string.
   */
  ctx.collect = function(bytes) {
    // iterate over pools distributing entropy cyclically
    var count = bytes.length;
    for(var i = 0; i < count; ++i) {
      ctx.pools[ctx.pool].update(bytes.substr(i, 1));
      ctx.pool = (ctx.pool === 31) ? 0 : ctx.pool + 1;
    }
  };

  /**
   * Collects an integer of n bits.
   *
   * @param i the integer entropy.
   * @param n the number of bits in the integer.
   */
  ctx.collectInt = function(i, n) {
    var bytes = '';
    for(var x = 0; x < n; x += 8) {
      bytes += String.fromCharCode((i >> x) & 0xFF);
    }
    ctx.collect(bytes);
  };

  /**
   * Registers a Web Worker to receive immediate entropy from the main thread.
   * This method is required until Web Workers can access the native crypto
   * API. This method should be called twice for each created worker, once in
   * the main thread, and once in the worker itself.
   *
   * @param worker the worker to register.
   */
  ctx.registerWorker = function(worker) {
    // worker receives random bytes
    if(worker === self) {
      ctx.seedFile = function(needed, callback) {
        function listener(e) {
          var data = e.data;
          if(data.forge && data.forge.prng) {
            self.removeEventListener('message', listener);
            callback(data.forge.prng.err, data.forge.prng.bytes);
          }
        }
        self.addEventListener('message', listener);
        self.postMessage({forge: {prng: {needed: needed}}});
      };
    } else {
      // main thread sends random bytes upon request
      var listener = function(e) {
        var data = e.data;
        if(data.forge && data.forge.prng) {
          ctx.seedFile(data.forge.prng.needed, function(err, bytes) {
            worker.postMessage({forge: {prng: {err: err, bytes: bytes}}});
          });
        }
      };
      // TODO: do we need to remove the event listener when the worker dies?
      worker.addEventListener('message', listener);
    }
  };

  return ctx;
};

/**
 * An API for getting cryptographically-secure random bytes. The bytes are
 * generated using the Fortuna algorithm devised by Bruce Schneier and
 * Niels Ferguson.
 *
 * Getting strong random bytes is not yet easy to do in javascript. The only
 * truish random entropy that can be collected is from the mouse, keyboard, or
 * from timing with respect to page loads, etc. This generator makes a poor
 * attempt at providing random bytes when those sources haven't yet provided
 * enough entropy to initially seed or to reseed the PRNG.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2009-2014 Digital Bazaar, Inc.
 */

var forge$q = forge$F;





(function() {

// forge.random already defined
if(forge$q.random && forge$q.random.getBytes) {
  return;
}

(function(jQuery) {

// the default prng plugin, uses AES-128
var prng_aes = {};
var _prng_aes_output = new Array(4);
var _prng_aes_buffer = forge$q.util.createBuffer();
prng_aes.formatKey = function(key) {
  // convert the key into 32-bit integers
  var tmp = forge$q.util.createBuffer(key);
  key = new Array(4);
  key[0] = tmp.getInt32();
  key[1] = tmp.getInt32();
  key[2] = tmp.getInt32();
  key[3] = tmp.getInt32();

  // return the expanded key
  return forge$q.aes._expandKey(key, false);
};
prng_aes.formatSeed = function(seed) {
  // convert seed into 32-bit integers
  var tmp = forge$q.util.createBuffer(seed);
  seed = new Array(4);
  seed[0] = tmp.getInt32();
  seed[1] = tmp.getInt32();
  seed[2] = tmp.getInt32();
  seed[3] = tmp.getInt32();
  return seed;
};
prng_aes.cipher = function(key, seed) {
  forge$q.aes._updateBlock(key, seed, _prng_aes_output, false);
  _prng_aes_buffer.putInt32(_prng_aes_output[0]);
  _prng_aes_buffer.putInt32(_prng_aes_output[1]);
  _prng_aes_buffer.putInt32(_prng_aes_output[2]);
  _prng_aes_buffer.putInt32(_prng_aes_output[3]);
  return _prng_aes_buffer.getBytes();
};
prng_aes.increment = function(seed) {
  // FIXME: do we care about carry or signed issues?
  ++seed[3];
  return seed;
};
prng_aes.md = forge$q.md.sha256;

/**
 * Creates a new PRNG.
 */
function spawnPrng() {
  var ctx = forge$q.prng.create(prng_aes);

  /**
   * Gets random bytes. If a native secure crypto API is unavailable, this
   * method tries to make the bytes more unpredictable by drawing from data that
   * can be collected from the user of the browser, eg: mouse movement.
   *
   * If a callback is given, this method will be called asynchronously.
   *
   * @param count the number of random bytes to get.
   * @param [callback(err, bytes)] called once the operation completes.
   *
   * @return the random bytes in a string.
   */
  ctx.getBytes = function(count, callback) {
    return ctx.generate(count, callback);
  };

  /**
   * Gets random bytes asynchronously. If a native secure crypto API is
   * unavailable, this method tries to make the bytes more unpredictable by
   * drawing from data that can be collected from the user of the browser,
   * eg: mouse movement.
   *
   * @param count the number of random bytes to get.
   *
   * @return the random bytes in a string.
   */
  ctx.getBytesSync = function(count) {
    return ctx.generate(count);
  };

  return ctx;
}

// create default prng context
var _ctx = spawnPrng();

// add other sources of entropy only if window.crypto.getRandomValues is not
// available -- otherwise this source will be automatically used by the prng
var getRandomValues = null;
var globalScope = forge$q.util.globalScope;
var _crypto = globalScope.crypto || globalScope.msCrypto;
if(_crypto && _crypto.getRandomValues) {
  getRandomValues = function(arr) {
    return _crypto.getRandomValues(arr);
  };
}

if((!forge$q.util.isNodejs && !getRandomValues)) {

  // get load time entropy
  _ctx.collectInt(+new Date(), 32);

  // add some entropy from navigator object
  if(typeof(navigator) !== 'undefined') {
    var _navBytes = '';
    for(var key in navigator) {
      try {
        if(typeof(navigator[key]) == 'string') {
          _navBytes += navigator[key];
        }
      } catch(e) {
        /* Some navigator keys might not be accessible, e.g. the geolocation
          attribute throws an exception if touched in Mozilla chrome://
          context.

          Silently ignore this and just don't use this as a source of
          entropy. */
      }
    }
    _ctx.collect(_navBytes);
    _navBytes = null;
  }

  // add mouse and keyboard collectors if jquery is available
  if(jQuery) {
    // set up mouse entropy capture
    jQuery().mousemove(function(e) {
      // add mouse coords
      _ctx.collectInt(e.clientX, 16);
      _ctx.collectInt(e.clientY, 16);
    });

    // set up keyboard entropy capture
    jQuery().keypress(function(e) {
      _ctx.collectInt(e.charCode, 8);
    });
  }
}

/* Random API */
if(!forge$q.random) {
  forge$q.random = _ctx;
} else {
  // extend forge.random with _ctx
  for(var key in _ctx) {
    forge$q.random[key] = _ctx[key];
  }
}

// expose spawn PRNG
forge$q.random.createInstance = spawnPrng;

})(typeof(jQuery) !== 'undefined' ? jQuery : null);

})();

/**
 * RC2 implementation.
 *
 * @author Stefan Siegl
 *
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 *
 * Information on the RC2 cipher is available from RFC #2268,
 * http://www.ietf.org/rfc/rfc2268.txt
 */

var forge$p = forge$F;


var piTable = [
  0xd9, 0x78, 0xf9, 0xc4, 0x19, 0xdd, 0xb5, 0xed, 0x28, 0xe9, 0xfd, 0x79, 0x4a, 0xa0, 0xd8, 0x9d,
  0xc6, 0x7e, 0x37, 0x83, 0x2b, 0x76, 0x53, 0x8e, 0x62, 0x4c, 0x64, 0x88, 0x44, 0x8b, 0xfb, 0xa2,
  0x17, 0x9a, 0x59, 0xf5, 0x87, 0xb3, 0x4f, 0x13, 0x61, 0x45, 0x6d, 0x8d, 0x09, 0x81, 0x7d, 0x32,
  0xbd, 0x8f, 0x40, 0xeb, 0x86, 0xb7, 0x7b, 0x0b, 0xf0, 0x95, 0x21, 0x22, 0x5c, 0x6b, 0x4e, 0x82,
  0x54, 0xd6, 0x65, 0x93, 0xce, 0x60, 0xb2, 0x1c, 0x73, 0x56, 0xc0, 0x14, 0xa7, 0x8c, 0xf1, 0xdc,
  0x12, 0x75, 0xca, 0x1f, 0x3b, 0xbe, 0xe4, 0xd1, 0x42, 0x3d, 0xd4, 0x30, 0xa3, 0x3c, 0xb6, 0x26,
  0x6f, 0xbf, 0x0e, 0xda, 0x46, 0x69, 0x07, 0x57, 0x27, 0xf2, 0x1d, 0x9b, 0xbc, 0x94, 0x43, 0x03,
  0xf8, 0x11, 0xc7, 0xf6, 0x90, 0xef, 0x3e, 0xe7, 0x06, 0xc3, 0xd5, 0x2f, 0xc8, 0x66, 0x1e, 0xd7,
  0x08, 0xe8, 0xea, 0xde, 0x80, 0x52, 0xee, 0xf7, 0x84, 0xaa, 0x72, 0xac, 0x35, 0x4d, 0x6a, 0x2a,
  0x96, 0x1a, 0xd2, 0x71, 0x5a, 0x15, 0x49, 0x74, 0x4b, 0x9f, 0xd0, 0x5e, 0x04, 0x18, 0xa4, 0xec,
  0xc2, 0xe0, 0x41, 0x6e, 0x0f, 0x51, 0xcb, 0xcc, 0x24, 0x91, 0xaf, 0x50, 0xa1, 0xf4, 0x70, 0x39,
  0x99, 0x7c, 0x3a, 0x85, 0x23, 0xb8, 0xb4, 0x7a, 0xfc, 0x02, 0x36, 0x5b, 0x25, 0x55, 0x97, 0x31,
  0x2d, 0x5d, 0xfa, 0x98, 0xe3, 0x8a, 0x92, 0xae, 0x05, 0xdf, 0x29, 0x10, 0x67, 0x6c, 0xba, 0xc9,
  0xd3, 0x00, 0xe6, 0xcf, 0xe1, 0x9e, 0xa8, 0x2c, 0x63, 0x16, 0x01, 0x3f, 0x58, 0xe2, 0x89, 0xa9,
  0x0d, 0x38, 0x34, 0x1b, 0xab, 0x33, 0xff, 0xb0, 0xbb, 0x48, 0x0c, 0x5f, 0xb9, 0xb1, 0xcd, 0x2e,
  0xc5, 0xf3, 0xdb, 0x47, 0xe5, 0xa5, 0x9c, 0x77, 0x0a, 0xa6, 0x20, 0x68, 0xfe, 0x7f, 0xc1, 0xad
];

var s = [1, 2, 3, 5];

/**
 * Rotate a word left by given number of bits.
 *
 * Bits that are shifted out on the left are put back in on the right
 * hand side.
 *
 * @param word The word to shift left.
 * @param bits The number of bits to shift by.
 * @return The rotated word.
 */
var rol = function(word, bits) {
  return ((word << bits) & 0xffff) | ((word & 0xffff) >> (16 - bits));
};

/**
 * Rotate a word right by given number of bits.
 *
 * Bits that are shifted out on the right are put back in on the left
 * hand side.
 *
 * @param word The word to shift right.
 * @param bits The number of bits to shift by.
 * @return The rotated word.
 */
var ror = function(word, bits) {
  return ((word & 0xffff) >> bits) | ((word << (16 - bits)) & 0xffff);
};

/* RC2 API */
forge$p.rc2 = forge$p.rc2 || {};

/**
 * Perform RC2 key expansion as per RFC #2268, section 2.
 *
 * @param key variable-length user key (between 1 and 128 bytes)
 * @param effKeyBits number of effective key bits (default: 128)
 * @return the expanded RC2 key (ByteBuffer of 128 bytes)
 */
forge$p.rc2.expandKey = function(key, effKeyBits) {
  if(typeof key === 'string') {
    key = forge$p.util.createBuffer(key);
  }
  effKeyBits = effKeyBits || 128;

  /* introduce variables that match the names used in RFC #2268 */
  var L = key;
  var T = key.length();
  var T1 = effKeyBits;
  var T8 = Math.ceil(T1 / 8);
  var TM = 0xff >> (T1 & 0x07);
  var i;

  for(i = T; i < 128; i++) {
    L.putByte(piTable[(L.at(i - 1) + L.at(i - T)) & 0xff]);
  }

  L.setAt(128 - T8, piTable[L.at(128 - T8) & TM]);

  for(i = 127 - T8; i >= 0; i--) {
    L.setAt(i, piTable[L.at(i + 1) ^ L.at(i + T8)]);
  }

  return L;
};

/**
 * Creates a RC2 cipher object.
 *
 * @param key the symmetric key to use (as base for key generation).
 * @param bits the number of effective key bits.
 * @param encrypt false for decryption, true for encryption.
 *
 * @return the cipher.
 */
var createCipher = function(key, bits, encrypt) {
  var _finish = false, _input = null, _output = null, _iv = null;
  var mixRound, mashRound;
  var i, j, K = [];

  /* Expand key and fill into K[] Array */
  key = forge$p.rc2.expandKey(key, bits);
  for(i = 0; i < 64; i++) {
    K.push(key.getInt16Le());
  }

  if(encrypt) {
    /**
     * Perform one mixing round "in place".
     *
     * @param R Array of four words to perform mixing on.
     */
    mixRound = function(R) {
      for(i = 0; i < 4; i++) {
        R[i] += K[j] + (R[(i + 3) % 4] & R[(i + 2) % 4]) +
          ((~R[(i + 3) % 4]) & R[(i + 1) % 4]);
        R[i] = rol(R[i], s[i]);
        j++;
      }
    };

    /**
     * Perform one mashing round "in place".
     *
     * @param R Array of four words to perform mashing on.
     */
    mashRound = function(R) {
      for(i = 0; i < 4; i++) {
        R[i] += K[R[(i + 3) % 4] & 63];
      }
    };
  } else {
    /**
     * Perform one r-mixing round "in place".
     *
     * @param R Array of four words to perform mixing on.
     */
    mixRound = function(R) {
      for(i = 3; i >= 0; i--) {
        R[i] = ror(R[i], s[i]);
        R[i] -= K[j] + (R[(i + 3) % 4] & R[(i + 2) % 4]) +
          ((~R[(i + 3) % 4]) & R[(i + 1) % 4]);
        j--;
      }
    };

    /**
     * Perform one r-mashing round "in place".
     *
     * @param R Array of four words to perform mashing on.
     */
    mashRound = function(R) {
      for(i = 3; i >= 0; i--) {
        R[i] -= K[R[(i + 3) % 4] & 63];
      }
    };
  }

  /**
   * Run the specified cipher execution plan.
   *
   * This function takes four words from the input buffer, applies the IV on
   * it (if requested) and runs the provided execution plan.
   *
   * The plan must be put together in form of a array of arrays.  Where the
   * outer one is simply a list of steps to perform and the inner one needs
   * to have two elements: the first one telling how many rounds to perform,
   * the second one telling what to do (i.e. the function to call).
   *
   * @param {Array} plan The plan to execute.
   */
  var runPlan = function(plan) {
    var R = [];

    /* Get data from input buffer and fill the four words into R */
    for(i = 0; i < 4; i++) {
      var val = _input.getInt16Le();

      if(_iv !== null) {
        if(encrypt) {
          /* We're encrypting, apply the IV first. */
          val ^= _iv.getInt16Le();
        } else {
          /* We're decryption, keep cipher text for next block. */
          _iv.putInt16Le(val);
        }
      }

      R.push(val & 0xffff);
    }

    /* Reset global "j" variable as per spec. */
    j = encrypt ? 0 : 63;

    /* Run execution plan. */
    for(var ptr = 0; ptr < plan.length; ptr++) {
      for(var ctr = 0; ctr < plan[ptr][0]; ctr++) {
        plan[ptr][1](R);
      }
    }

    /* Write back result to output buffer. */
    for(i = 0; i < 4; i++) {
      if(_iv !== null) {
        if(encrypt) {
          /* We're encrypting in CBC-mode, feed back encrypted bytes into
             IV buffer to carry it forward to next block. */
          _iv.putInt16Le(R[i]);
        } else {
          R[i] ^= _iv.getInt16Le();
        }
      }

      _output.putInt16Le(R[i]);
    }
  };

  /* Create cipher object */
  var cipher = null;
  cipher = {
    /**
     * Starts or restarts the encryption or decryption process, whichever
     * was previously configured.
     *
     * To use the cipher in CBC mode, iv may be given either as a string
     * of bytes, or as a byte buffer.  For ECB mode, give null as iv.
     *
     * @param iv the initialization vector to use, null for ECB mode.
     * @param output the output the buffer to write to, null to create one.
     */
    start: function(iv, output) {
      if(iv) {
        /* CBC mode */
        if(typeof iv === 'string') {
          iv = forge$p.util.createBuffer(iv);
        }
      }

      _finish = false;
      _input = forge$p.util.createBuffer();
      _output = output || new forge$p.util.createBuffer();
      _iv = iv;

      cipher.output = _output;
    },

    /**
     * Updates the next block.
     *
     * @param input the buffer to read from.
     */
    update: function(input) {
      if(!_finish) {
        // not finishing, so fill the input buffer with more input
        _input.putBuffer(input);
      }

      while(_input.length() >= 8) {
        runPlan([
            [ 5, mixRound ],
            [ 1, mashRound ],
            [ 6, mixRound ],
            [ 1, mashRound ],
            [ 5, mixRound ]
          ]);
      }
    },

    /**
     * Finishes encrypting or decrypting.
     *
     * @param pad a padding function to use, null for PKCS#7 padding,
     *           signature(blockSize, buffer, decrypt).
     *
     * @return true if successful, false on error.
     */
    finish: function(pad) {
      var rval = true;

      if(encrypt) {
        if(pad) {
          rval = pad(8, _input, !encrypt);
        } else {
          // add PKCS#7 padding to block (each pad byte is the
          // value of the number of pad bytes)
          var padding = (_input.length() === 8) ? 8 : (8 - _input.length());
          _input.fillWithByte(padding, padding);
        }
      }

      if(rval) {
        // do final update
        _finish = true;
        cipher.update();
      }

      if(!encrypt) {
        // check for error: input data not a multiple of block size
        rval = (_input.length() === 0);
        if(rval) {
          if(pad) {
            rval = pad(8, _output, !encrypt);
          } else {
            // ensure padding byte count is valid
            var len = _output.length();
            var count = _output.at(len - 1);

            if(count > len) {
              rval = false;
            } else {
              // trim off padding bytes
              _output.truncate(count);
            }
          }
        }
      }

      return rval;
    }
  };

  return cipher;
};

/**
 * Creates an RC2 cipher object to encrypt data in ECB or CBC mode using the
 * given symmetric key. The output will be stored in the 'output' member
 * of the returned cipher.
 *
 * The key and iv may be given as a string of bytes or a byte buffer.
 * The cipher is initialized to use 128 effective key bits.
 *
 * @param key the symmetric key to use.
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 *
 * @return the cipher.
 */
forge$p.rc2.startEncrypting = function(key, iv, output) {
  var cipher = forge$p.rc2.createEncryptionCipher(key, 128);
  cipher.start(iv, output);
  return cipher;
};

/**
 * Creates an RC2 cipher object to encrypt data in ECB or CBC mode using the
 * given symmetric key.
 *
 * The key may be given as a string of bytes or a byte buffer.
 *
 * To start encrypting call start() on the cipher with an iv and optional
 * output buffer.
 *
 * @param key the symmetric key to use.
 *
 * @return the cipher.
 */
forge$p.rc2.createEncryptionCipher = function(key, bits) {
  return createCipher(key, bits, true);
};

/**
 * Creates an RC2 cipher object to decrypt data in ECB or CBC mode using the
 * given symmetric key. The output will be stored in the 'output' member
 * of the returned cipher.
 *
 * The key and iv may be given as a string of bytes or a byte buffer.
 * The cipher is initialized to use 128 effective key bits.
 *
 * @param key the symmetric key to use.
 * @param iv the initialization vector to use.
 * @param output the buffer to write to, null to create one.
 *
 * @return the cipher.
 */
forge$p.rc2.startDecrypting = function(key, iv, output) {
  var cipher = forge$p.rc2.createDecryptionCipher(key, 128);
  cipher.start(iv, output);
  return cipher;
};

/**
 * Creates an RC2 cipher object to decrypt data in ECB or CBC mode using the
 * given symmetric key.
 *
 * The key may be given as a string of bytes or a byte buffer.
 *
 * To start decrypting call start() on the cipher with an iv and optional
 * output buffer.
 *
 * @param key the symmetric key to use.
 *
 * @return the cipher.
 */
forge$p.rc2.createDecryptionCipher = function(key, bits) {
  return createCipher(key, bits, false);
};

// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

/*
Licensing (LICENSE)
-------------------

This software is covered under the following copyright:
*/
/*
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */
/*
Address all questions regarding this license to:

  Tom Wu
  tjw@cs.Stanford.EDU
*/
var forge$o = forge$F;

forge$o.jsbn = forge$o.jsbn || {};

// Bits per digit
var dbits;

// (public) Constructor
function BigInteger$2(a,b,c) {
  this.data = [];
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}
forge$o.jsbn.BigInteger = BigInteger$2;

// return new, unset BigInteger
function nbi() { return new BigInteger$2(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this.data[i++]+w.data[j]+c;
    c = Math.floor(v/0x4000000);
    w.data[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this.data[i]&0x7fff;
    var h = this.data[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w.data[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w.data[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this.data[i]&0x3fff;
    var h = this.data[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w.data[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w.data[j++] = l&0xfffffff;
  }
  return c;
}

// node.js (no browser)
if(typeof(navigator) === 'undefined')
{
   BigInteger$2.prototype.am = am3;
   dbits = 28;
} else if((navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger$2.prototype.am = am2;
  dbits = 30;
} else if((navigator.appName != "Netscape")) {
  BigInteger$2.prototype.am = am1;
  dbits = 26;
} else { // Mozilla/Netscape seems to prefer am3
  BigInteger$2.prototype.am = am3;
  dbits = 28;
}

BigInteger$2.prototype.DB = dbits;
BigInteger$2.prototype.DM = ((1<<dbits)-1);
BigInteger$2.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger$2.prototype.FV = Math.pow(2,BI_FP);
BigInteger$2.prototype.F1 = BI_FP-dbits;
BigInteger$2.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r.data[i] = this.data[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this.data[0] = x;
  else if(x < -1) this.data[0] = x+this.DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this.data[this.t++] = x;
    else if(sh+k > this.DB) {
      this.data[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this.data[this.t++] = (x>>(this.DB-sh));
    } else
      this.data[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this.data[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger$2.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this.data[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this.data[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this.data[i]&((1<<p)-1))<<(k-p);
        d |= this.data[--i]>>(p+=this.DB-k);
      } else {
        d = (this.data[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger$2.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this.data[i]-a.data[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this.data[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r.data[i+n] = this.data[i];
  for(i = n-1; i >= 0; --i) r.data[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r.data[i-n] = this.data[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r.data[i+ds+1] = (this.data[i]>>cbs)|c;
    c = (this.data[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r.data[i] = 0;
  r.data[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r.data[0] = this.data[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r.data[i-ds-1] |= (this.data[i]&bm)<<cbs;
    r.data[i-ds] = this.data[i]>>bs;
  }
  if(bs > 0) r.data[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this.data[i]-a.data[i];
    r.data[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this.data[i];
      r.data[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  } else {
    c += this.s;
    while(i < a.t) {
      c -= a.data[i];
      r.data[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r.data[i++] = this.DV+c;
  else if(c > 0) r.data[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r.data[i] = 0;
  for(i = 0; i < y.t; ++i) r.data[i+x.t] = x.am(0,y.data[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger$2.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r.data[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x.data[i],r,2*i,0,1);
    if((r.data[i+x.t]+=x.am(i+1,2*x.data[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r.data[i+x.t] -= x.DV;
      r.data[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r.data[r.t-1] += x.am(i,x.data[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm.data[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); } else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y.data[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y.data[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r.data[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger$2.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y.data[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r.data[--i]==y0)?this.DM:Math.floor(r.data[i]*d1+(r.data[i-1]+e)*d2);
    if((r.data[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r.data[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger$2.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger$2.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger$2.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this.data[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger$2.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x.data[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x.data[i]*mp mod DV
    var j = x.data[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x.data[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x.data[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x.data[j] >= x.DV) { x.data[j] -= x.DV; x.data[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this.data[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger$2.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger$2.prototype.copyTo = bnpCopyTo;
BigInteger$2.prototype.fromInt = bnpFromInt;
BigInteger$2.prototype.fromString = bnpFromString;
BigInteger$2.prototype.clamp = bnpClamp;
BigInteger$2.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger$2.prototype.drShiftTo = bnpDRShiftTo;
BigInteger$2.prototype.lShiftTo = bnpLShiftTo;
BigInteger$2.prototype.rShiftTo = bnpRShiftTo;
BigInteger$2.prototype.subTo = bnpSubTo;
BigInteger$2.prototype.multiplyTo = bnpMultiplyTo;
BigInteger$2.prototype.squareTo = bnpSquareTo;
BigInteger$2.prototype.divRemTo = bnpDivRemTo;
BigInteger$2.prototype.invDigit = bnpInvDigit;
BigInteger$2.prototype.isEven = bnpIsEven;
BigInteger$2.prototype.exp = bnpExp;

// public
BigInteger$2.prototype.toString = bnToString;
BigInteger$2.prototype.negate = bnNegate;
BigInteger$2.prototype.abs = bnAbs;
BigInteger$2.prototype.compareTo = bnCompareTo;
BigInteger$2.prototype.bitLength = bnBitLength;
BigInteger$2.prototype.mod = bnMod;
BigInteger$2.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger$2.ZERO = nbv(0);
BigInteger$2.ONE = nbv(1);

// jsbn2 lib

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details (See jsbn.js for LICENSE).

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new BigInteger("0", 10) returns "proper" zero

//(public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

//(public) return value as integer
function bnIntValue() {
if(this.s < 0) {
 if(this.t == 1) return this.data[0]-this.DV;
 else if(this.t == 0) return -1;
} else if(this.t == 1) return this.data[0];
else if(this.t == 0) return 0;
// assumes 16 < DB < 32
return ((this.data[1]&((1<<(32-this.DB))-1))<<this.DB)|this.data[0];
}

//(public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this.data[0]<<24)>>24; }

//(public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this.data[0]<<16)>>16; }

//(protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

//(public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
if(this.s < 0) return -1;
else if(this.t <= 0 || (this.t == 1 && this.data[0] <= 0)) return 0;
else return 1;
}

//(protected) convert to radix string
function bnpToRadix(b) {
if(b == null) b = 10;
if(this.signum() == 0 || b < 2 || b > 36) return "0";
var cs = this.chunkSize(b);
var a = Math.pow(b,cs);
var d = nbv(a), y = nbi(), z = nbi(), r = "";
this.divRemTo(d,y,z);
while(y.signum() > 0) {
 r = (a+z.intValue()).toString(b).substr(1) + r;
 y.divRemTo(d,y,z);
}
return z.intValue().toString(b) + r;
}

//(protected) convert from radix string
function bnpFromRadix(s,b) {
this.fromInt(0);
if(b == null) b = 10;
var cs = this.chunkSize(b);
var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
for(var i = 0; i < s.length; ++i) {
 var x = intAt(s,i);
 if(x < 0) {
   if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
   continue;
 }
 w = b*w+x;
 if(++j >= cs) {
   this.dMultiply(d);
   this.dAddOffset(w,0);
   j = 0;
   w = 0;
 }
}
if(j > 0) {
 this.dMultiply(Math.pow(b,j));
 this.dAddOffset(w,0);
}
if(mi) BigInteger$2.ZERO.subTo(this,this);
}

//(protected) alternate constructor
function bnpFromNumber(a,b,c) {
if("number" == typeof b) {
 // new BigInteger(int,int,RNG)
 if(a < 2) this.fromInt(1);
 else {
   this.fromNumber(a,c);
   if(!this.testBit(a-1))  // force MSB set
     this.bitwiseTo(BigInteger$2.ONE.shiftLeft(a-1),op_or,this);
   if(this.isEven()) this.dAddOffset(1,0); // force odd
   while(!this.isProbablePrime(b)) {
     this.dAddOffset(2,0);
     if(this.bitLength() > a) this.subTo(BigInteger$2.ONE.shiftLeft(a-1),this);
   }
 }
} else {
 // new BigInteger(int,RNG)
 var x = new Array(), t = a&7;
 x.length = (a>>3)+1;
 b.nextBytes(x);
 if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
 this.fromString(x,256);
}
}

//(public) convert to bigendian byte array
function bnToByteArray() {
var i = this.t, r = new Array();
r[0] = this.s;
var p = this.DB-(i*this.DB)%8, d, k = 0;
if(i-- > 0) {
 if(p < this.DB && (d = this.data[i]>>p) != (this.s&this.DM)>>p)
   r[k++] = d|(this.s<<(this.DB-p));
 while(i >= 0) {
   if(p < 8) {
     d = (this.data[i]&((1<<p)-1))<<(8-p);
     d |= this.data[--i]>>(p+=this.DB-8);
   } else {
     d = (this.data[i]>>(p-=8))&0xff;
     if(p <= 0) { p += this.DB; --i; }
   }
   if((d&0x80) != 0) d |= -256;
   if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
   if(k > 0 || d != this.s) r[k++] = d;
 }
}
return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return (this.compareTo(a)<0)?this:a; }
function bnMax(a) { return (this.compareTo(a)>0)?this:a; }

//(protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
var i, f, m = Math.min(a.t,this.t);
for(i = 0; i < m; ++i) r.data[i] = op(this.data[i],a.data[i]);
if(a.t < this.t) {
 f = a.s&this.DM;
 for(i = m; i < this.t; ++i) r.data[i] = op(this.data[i],f);
 r.t = this.t;
} else {
 f = this.s&this.DM;
 for(i = m; i < a.t; ++i) r.data[i] = op(f,a.data[i]);
 r.t = a.t;
}
r.s = op(this.s,a.s);
r.clamp();
}

//(public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

//(public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

//(public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

//(public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

//(public) ~this
function bnNot() {
var r = nbi();
for(var i = 0; i < this.t; ++i) r.data[i] = this.DM&~this.data[i];
r.t = this.t;
r.s = ~this.s;
return r;
}

//(public) this << n
function bnShiftLeft(n) {
var r = nbi();
if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
return r;
}

//(public) this >> n
function bnShiftRight(n) {
var r = nbi();
if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
return r;
}

//return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
if(x == 0) return -1;
var r = 0;
if((x&0xffff) == 0) { x >>= 16; r += 16; }
if((x&0xff) == 0) { x >>= 8; r += 8; }
if((x&0xf) == 0) { x >>= 4; r += 4; }
if((x&3) == 0) { x >>= 2; r += 2; }
if((x&1) == 0) ++r;
return r;
}

//(public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
for(var i = 0; i < this.t; ++i)
 if(this.data[i] != 0) return i*this.DB+lbit(this.data[i]);
if(this.s < 0) return this.t*this.DB;
return -1;
}

//return number of 1 bits in x
function cbit(x) {
var r = 0;
while(x != 0) { x &= x-1; ++r; }
return r;
}

//(public) return number of set bits
function bnBitCount() {
var r = 0, x = this.s&this.DM;
for(var i = 0; i < this.t; ++i) r += cbit(this.data[i]^x);
return r;
}

//(public) true iff nth bit is set
function bnTestBit(n) {
var j = Math.floor(n/this.DB);
if(j >= this.t) return(this.s!=0);
return((this.data[j]&(1<<(n%this.DB)))!=0);
}

//(protected) this op (1<<n)
function bnpChangeBit(n,op) {
var r = BigInteger$2.ONE.shiftLeft(n);
this.bitwiseTo(r,op,r);
return r;
}

//(public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

//(public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

//(public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

//(protected) r = this + a
function bnpAddTo(a,r) {
var i = 0, c = 0, m = Math.min(a.t,this.t);
while(i < m) {
 c += this.data[i]+a.data[i];
 r.data[i++] = c&this.DM;
 c >>= this.DB;
}
if(a.t < this.t) {
 c += a.s;
 while(i < this.t) {
   c += this.data[i];
   r.data[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += this.s;
} else {
 c += this.s;
 while(i < a.t) {
   c += a.data[i];
   r.data[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += a.s;
}
r.s = (c<0)?-1:0;
if(c > 0) r.data[i++] = c;
else if(c < -1) r.data[i++] = this.DV+c;
r.t = i;
r.clamp();
}

//(public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

//(public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

//(public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

//(public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

//(public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

//(public) [this/a,this%a]
function bnDivideAndRemainder(a) {
var q = nbi(), r = nbi();
this.divRemTo(a,q,r);
return new Array(q,r);
}

//(protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
this.data[this.t] = this.am(0,n-1,this,0,0,this.t);
++this.t;
this.clamp();
}

//(protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
if(n == 0) return;
while(this.t <= w) this.data[this.t++] = 0;
this.data[w] += n;
while(this.data[w] >= this.DV) {
 this.data[w] -= this.DV;
 if(++w >= this.t) this.data[this.t++] = 0;
 ++this.data[w];
}
}

//A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

//(public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

//(protected) r = lower n words of "this * a", a.t <= n
//"this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
var i = Math.min(this.t+a.t,n);
r.s = 0; // assumes a,this >= 0
r.t = i;
while(i > 0) r.data[--i] = 0;
var j;
for(j = r.t-this.t; i < j; ++i) r.data[i+this.t] = this.am(0,a.data[i],r,i,0,this.t);
for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a.data[i],r,i,0,n-i);
r.clamp();
}

//(protected) r = "this * a" without lower n words, n > 0
//"this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
--n;
var i = r.t = this.t+a.t-n;
r.s = 0; // assumes a,this >= 0
while(--i >= 0) r.data[i] = 0;
for(i = Math.max(n-this.t,0); i < a.t; ++i)
 r.data[this.t+i-n] = this.am(n-i,a.data[i],r,0,0,this.t+i-n);
r.clamp();
r.drShiftTo(1,r);
}

//Barrett modular reduction
function Barrett(m) {
// setup Barrett
this.r2 = nbi();
this.q3 = nbi();
BigInteger$2.ONE.dlShiftTo(2*m.t,this.r2);
this.mu = this.r2.divide(m);
this.m = m;
}

function barrettConvert(x) {
if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
else if(x.compareTo(this.m) < 0) return x;
else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

//x = x mod m (HAC 14.42)
function barrettReduce(x) {
x.drShiftTo(this.m.t-1,this.r2);
if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
x.subTo(this.r2,x);
while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

//r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

//r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

//(public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
var i = e.bitLength(), k, r = nbv(1), z;
if(i <= 0) return r;
else if(i < 18) k = 1;
else if(i < 48) k = 3;
else if(i < 144) k = 4;
else if(i < 768) k = 5;
else k = 6;
if(i < 8)
 z = new Classic(m);
else if(m.isEven())
 z = new Barrett(m);
else
 z = new Montgomery(m);

// precomputation
var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
g[1] = z.convert(this);
if(k > 1) {
 var g2 = nbi();
 z.sqrTo(g[1],g2);
 while(n <= km) {
   g[n] = nbi();
   z.mulTo(g2,g[n-2],g[n]);
   n += 2;
 }
}

var j = e.t-1, w, is1 = true, r2 = nbi(), t;
i = nbits(e.data[j])-1;
while(j >= 0) {
 if(i >= k1) w = (e.data[j]>>(i-k1))&km;
 else {
   w = (e.data[j]&((1<<(i+1))-1))<<(k1-i);
   if(j > 0) w |= e.data[j-1]>>(this.DB+i-k1);
 }

 n = k;
 while((w&1) == 0) { w >>= 1; --n; }
 if((i -= n) < 0) { i += this.DB; --j; }
 if(is1) {  // ret == 1, don't bother squaring or multiplying it
   g[w].copyTo(r);
   is1 = false;
 } else {
   while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
   if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
   z.mulTo(r2,g[w],r);
 }

 while(j >= 0 && (e.data[j]&(1<<i)) == 0) {
   z.sqrTo(r,r2); t = r; r = r2; r2 = t;
   if(--i < 0) { i = this.DB-1; --j; }
 }
}
return z.revert(r);
}

//(public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
var x = (this.s<0)?this.negate():this.clone();
var y = (a.s<0)?a.negate():a.clone();
if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
var i = x.getLowestSetBit(), g = y.getLowestSetBit();
if(g < 0) return x;
if(i < g) g = i;
if(g > 0) {
 x.rShiftTo(g,x);
 y.rShiftTo(g,y);
}
while(x.signum() > 0) {
 if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
 if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
 if(x.compareTo(y) >= 0) {
   x.subTo(y,x);
   x.rShiftTo(1,x);
 } else {
   y.subTo(x,y);
   y.rShiftTo(1,y);
 }
}
if(g > 0) y.lShiftTo(g,y);
return y;
}

//(protected) this % n, n < 2^26
function bnpModInt(n) {
if(n <= 0) return 0;
var d = this.DV%n, r = (this.s<0)?n-1:0;
if(this.t > 0)
 if(d == 0) r = this.data[0]%n;
 else for(var i = this.t-1; i >= 0; --i) r = (d*r+this.data[i])%n;
return r;
}

//(public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
var ac = m.isEven();
if((this.isEven() && ac) || m.signum() == 0) return BigInteger$2.ZERO;
var u = m.clone(), v = this.clone();
var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
while(u.signum() != 0) {
 while(u.isEven()) {
   u.rShiftTo(1,u);
   if(ac) {
     if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
     a.rShiftTo(1,a);
   } else if(!b.isEven()) b.subTo(m,b);
   b.rShiftTo(1,b);
 }
 while(v.isEven()) {
   v.rShiftTo(1,v);
   if(ac) {
     if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
     c.rShiftTo(1,c);
   } else if(!d.isEven()) d.subTo(m,d);
   d.rShiftTo(1,d);
 }
 if(u.compareTo(v) >= 0) {
   u.subTo(v,u);
   if(ac) a.subTo(c,a);
   b.subTo(d,b);
 } else {
   v.subTo(u,v);
   if(ac) c.subTo(a,c);
   d.subTo(b,d);
 }
}
if(v.compareTo(BigInteger$2.ONE) != 0) return BigInteger$2.ZERO;
if(d.compareTo(m) >= 0) return d.subtract(m);
if(d.signum() < 0) d.addTo(m,d); else return d;
if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

//(public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
var i, x = this.abs();
if(x.t == 1 && x.data[0] <= lowprimes[lowprimes.length-1]) {
 for(i = 0; i < lowprimes.length; ++i)
   if(x.data[0] == lowprimes[i]) return true;
 return false;
}
if(x.isEven()) return false;
i = 1;
while(i < lowprimes.length) {
 var m = lowprimes[i], j = i+1;
 while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
 m = x.modInt(m);
 while(i < j) if(m%lowprimes[i++] == 0) return false;
}
return x.millerRabin(t);
}

//(protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
var n1 = this.subtract(BigInteger$2.ONE);
var k = n1.getLowestSetBit();
if(k <= 0) return false;
var r = n1.shiftRight(k);
var prng = bnGetPrng();
var a;
for(var i = 0; i < t; ++i) {
 // select witness 'a' at random from between 1 and n1
 do {
   a = new BigInteger$2(this.bitLength(), prng);
 }
 while(a.compareTo(BigInteger$2.ONE) <= 0 || a.compareTo(n1) >= 0);
 var y = a.modPow(r,this);
 if(y.compareTo(BigInteger$2.ONE) != 0 && y.compareTo(n1) != 0) {
   var j = 1;
   while(j++ < k && y.compareTo(n1) != 0) {
     y = y.modPowInt(2,this);
     if(y.compareTo(BigInteger$2.ONE) == 0) return false;
   }
   if(y.compareTo(n1) != 0) return false;
 }
}
return true;
}

// get pseudo random number generator
function bnGetPrng() {
  // create prng with api that matches BigInteger secure random
  return {
    // x is an array to fill with bytes
    nextBytes: function(x) {
      for(var i = 0; i < x.length; ++i) {
        x[i] = Math.floor(Math.random() * 0x0100);
      }
    }
  };
}

//protected
BigInteger$2.prototype.chunkSize = bnpChunkSize;
BigInteger$2.prototype.toRadix = bnpToRadix;
BigInteger$2.prototype.fromRadix = bnpFromRadix;
BigInteger$2.prototype.fromNumber = bnpFromNumber;
BigInteger$2.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger$2.prototype.changeBit = bnpChangeBit;
BigInteger$2.prototype.addTo = bnpAddTo;
BigInteger$2.prototype.dMultiply = bnpDMultiply;
BigInteger$2.prototype.dAddOffset = bnpDAddOffset;
BigInteger$2.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger$2.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger$2.prototype.modInt = bnpModInt;
BigInteger$2.prototype.millerRabin = bnpMillerRabin;

//public
BigInteger$2.prototype.clone = bnClone;
BigInteger$2.prototype.intValue = bnIntValue;
BigInteger$2.prototype.byteValue = bnByteValue;
BigInteger$2.prototype.shortValue = bnShortValue;
BigInteger$2.prototype.signum = bnSigNum;
BigInteger$2.prototype.toByteArray = bnToByteArray;
BigInteger$2.prototype.equals = bnEquals;
BigInteger$2.prototype.min = bnMin;
BigInteger$2.prototype.max = bnMax;
BigInteger$2.prototype.and = bnAnd;
BigInteger$2.prototype.or = bnOr;
BigInteger$2.prototype.xor = bnXor;
BigInteger$2.prototype.andNot = bnAndNot;
BigInteger$2.prototype.not = bnNot;
BigInteger$2.prototype.shiftLeft = bnShiftLeft;
BigInteger$2.prototype.shiftRight = bnShiftRight;
BigInteger$2.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger$2.prototype.bitCount = bnBitCount;
BigInteger$2.prototype.testBit = bnTestBit;
BigInteger$2.prototype.setBit = bnSetBit;
BigInteger$2.prototype.clearBit = bnClearBit;
BigInteger$2.prototype.flipBit = bnFlipBit;
BigInteger$2.prototype.add = bnAdd;
BigInteger$2.prototype.subtract = bnSubtract;
BigInteger$2.prototype.multiply = bnMultiply;
BigInteger$2.prototype.divide = bnDivide;
BigInteger$2.prototype.remainder = bnRemainder;
BigInteger$2.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger$2.prototype.modPow = bnModPow;
BigInteger$2.prototype.modInverse = bnModInverse;
BigInteger$2.prototype.pow = bnPow;
BigInteger$2.prototype.gcd = bnGCD;
BigInteger$2.prototype.isProbablePrime = bnIsProbablePrime;

/**
 * Secure Hash Algorithm with 160-bit digest (SHA-1) implementation.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2015 Digital Bazaar, Inc.
 */

var forge$n = forge$F;



var sha1 = forge$n.sha1 = forge$n.sha1 || {};
forge$n.md.sha1 = forge$n.md.algorithms.sha1 = sha1;

/**
 * Creates a SHA-1 message digest object.
 *
 * @return a message digest object.
 */
sha1.create = function() {
  // do initialization as necessary
  if(!_initialized$1) {
    _init$1();
  }

  // SHA-1 state contains five 32-bit integers
  var _state = null;

  // input buffer
  var _input = forge$n.util.createBuffer();

  // used for word storage
  var _w = new Array(80);

  // message digest object
  var md = {
    algorithm: 'sha1',
    blockLength: 64,
    digestLength: 20,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 8
  };

  /**
   * Starts the digest.
   *
   * @return this digest object.
   */
  md.start = function() {
    // up to 56-bit message length for convenience
    md.messageLength = 0;

    // full message length (set md.messageLength64 for backwards-compatibility)
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for(var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge$n.util.createBuffer();
    _state = {
      h0: 0x67452301,
      h1: 0xEFCDAB89,
      h2: 0x98BADCFE,
      h3: 0x10325476,
      h4: 0xC3D2E1F0
    };
    return md;
  };
  // start digest automatically for first time
  md.start();

  /**
   * Updates the digest with the given message input. The given input can
   * treated as raw input (no encoding will be applied) or an encoding of
   * 'utf8' maybe given to encode the input using UTF-8.
   *
   * @param msg the message input to update with.
   * @param encoding the encoding to use (default: 'raw', other: 'utf8').
   *
   * @return this digest object.
   */
  md.update = function(msg, encoding) {
    if(encoding === 'utf8') {
      msg = forge$n.util.encodeUtf8(msg);
    }

    // update message length
    var len = msg.length;
    md.messageLength += len;
    len = [(len / 0x100000000) >>> 0, len >>> 0];
    for(var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + ((md.fullMessageLength[i] / 0x100000000) >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = ((len[1] / 0x100000000) >>> 0);
    }

    // add bytes to input buffer
    _input.putBytes(msg);

    // process bytes
    _update$1(_state, _w, _input);

    // compact input buffer every 2K or if empty
    if(_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }

    return md;
  };

  /**
   * Produces the digest.
   *
   * @return a byte buffer containing the digest value.
   */
  md.digest = function() {
    /* Note: Here we copy the remaining bytes in the input buffer and
    add the appropriate SHA-1 padding. Then we do the final update
    on a copy of the state so that if the user wants to get
    intermediate digests they can do so. */

    /* Determine the number of bytes that must be added to the message
    to ensure its length is congruent to 448 mod 512. In other words,
    the data to be digested must be a multiple of 512 bits (or 128 bytes).
    This data includes the message, some padding, and the length of the
    message. Since the length of the message will be encoded as 8 bytes (64
    bits), that means that the last segment of the data must have 56 bytes
    (448 bits) of message and padding. Therefore, the length of the message
    plus the padding must be congruent to 448 mod 512 because
    512 - 128 = 448.

    In order to fill up the message length it must be filled with
    padding that begins with 1 bit followed by all 0 bits. Padding
    must *always* be present, so if the message length is already
    congruent to 448 mod 512, then 512 padding bits must be added. */

    var finalBlock = forge$n.util.createBuffer();
    finalBlock.putBytes(_input.bytes());

    // compute remaining size to be digested (include message length size)
    var remaining = (
      md.fullMessageLength[md.fullMessageLength.length - 1] +
      md.messageLengthSize);

    // add padding for overflow blockSize - overflow
    // _padding starts with 1 byte with first bit is set (byte value 128), then
    // there may be up to (blockSize - 1) other pad bytes
    var overflow = remaining & (md.blockLength - 1);
    finalBlock.putBytes(_padding$1.substr(0, md.blockLength - overflow));

    // serialize message length in bits in big-endian order; since length
    // is stored in bytes we multiply by 8 and add carry from next int
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for(var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = (next / 0x100000000) >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);

    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4
    };
    _update$1(s2, _w, finalBlock);
    var rval = forge$n.util.createBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    return rval;
  };

  return md;
};

// sha-1 padding bytes not initialized yet
var _padding$1 = null;
var _initialized$1 = false;

/**
 * Initializes the constant tables.
 */
function _init$1() {
  // create padding
  _padding$1 = String.fromCharCode(128);
  _padding$1 += forge$n.util.fillString(String.fromCharCode(0x00), 64);

  // now initialized
  _initialized$1 = true;
}

/**
 * Updates a SHA-1 state with the given byte buffer.
 *
 * @param s the SHA-1 state to update.
 * @param w the array to use to store words.
 * @param bytes the byte buffer to update with.
 */
function _update$1(s, w, bytes) {
  // consume 512 bit (64 byte) chunks
  var t, a, b, c, d, e, f, i;
  var len = bytes.length();
  while(len >= 64) {
    // the w array will be populated with sixteen 32-bit big-endian words
    // and then extended into 80 32-bit words according to SHA-1 algorithm
    // and for 32-79 using Max Locktyukhin's optimization

    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;

    // round 1
    for(i = 0; i < 16; ++i) {
      t = bytes.getInt32();
      w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }
    for(; i < 20; ++i) {
      t = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]);
      t = (t << 1) | (t >>> 31);
      w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }
    // round 2
    for(; i < 32; ++i) {
      t = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]);
      t = (t << 1) | (t >>> 31);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }
    for(; i < 40; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }
    // round 3
    for(; i < 60; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = (b & c) | (d & (b ^ c));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x8F1BBCDC + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }
    // round 4
    for(; i < 80; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0xCA62C1D6 + t;
      e = d;
      d = c;
      // `>>> 0` necessary to avoid iOS/Safari 10 optimization bug
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = t;
    }

    // update hash state
    s.h0 = (s.h0 + a) | 0;
    s.h1 = (s.h1 + b) | 0;
    s.h2 = (s.h2 + c) | 0;
    s.h3 = (s.h3 + d) | 0;
    s.h4 = (s.h4 + e) | 0;

    len -= 64;
  }
}

/**
 * Partial implementation of PKCS#1 v2.2: RSA-OEAP
 *
 * Modified but based on the following MIT and BSD licensed code:
 *
 * https://github.com/kjur/jsjws/blob/master/rsa.js:
 *
 * The 'jsjws'(JSON Web Signature JavaScript Library) License
 *
 * Copyright (c) 2012 Kenji Urushima
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * http://webrsa.cvs.sourceforge.net/viewvc/webrsa/Client/RSAES-OAEP.js?content-type=text%2Fplain:
 *
 * RSAES-OAEP.js
 * $Id: RSAES-OAEP.js,v 1.1.1.1 2003/03/19 15:37:20 ellispritchard Exp $
 * JavaScript Implementation of PKCS #1 v2.1 RSA CRYPTOGRAPHY STANDARD (RSA Laboratories, June 14, 2002)
 * Copyright (C) Ellis Pritchard, Guardian Unlimited 2003.
 * Contact: ellis@nukinetics.com
 * Distributed under the BSD License.
 *
 * Official documentation: http://www.rsa.com/rsalabs/node.asp?id=2125
 *
 * @author Evan Jones (http://evanjones.ca/)
 * @author Dave Longley
 *
 * Copyright (c) 2013-2014 Digital Bazaar, Inc.
 */

var forge$m = forge$F;




// shortcut for PKCS#1 API
var pkcs1 = forge$m.pkcs1 = forge$m.pkcs1 || {};

/**
 * Encode the given RSAES-OAEP message (M) using key, with optional label (L)
 * and seed.
 *
 * This method does not perform RSA encryption, it only encodes the message
 * using RSAES-OAEP.
 *
 * @param key the RSA key to use.
 * @param message the message to encode.
 * @param options the options to use:
 *          label an optional label to use.
 *          seed the seed to use.
 *          md the message digest object to use, undefined for SHA-1.
 *          mgf1 optional mgf1 parameters:
 *            md the message digest object to use for MGF1.
 *
 * @return the encoded message bytes.
 */
pkcs1.encode_rsa_oaep = function(key, message, options) {
  // parse arguments
  var label;
  var seed;
  var md;
  var mgf1Md;
  // legacy args (label, seed, md)
  if(typeof options === 'string') {
    label = options;
    seed = arguments[3] || undefined;
    md = arguments[4] || undefined;
  } else if(options) {
    label = options.label || undefined;
    seed = options.seed || undefined;
    md = options.md || undefined;
    if(options.mgf1 && options.mgf1.md) {
      mgf1Md = options.mgf1.md;
    }
  }

  // default OAEP to SHA-1 message digest
  if(!md) {
    md = forge$m.md.sha1.create();
  } else {
    md.start();
  }

  // default MGF-1 to same as OAEP
  if(!mgf1Md) {
    mgf1Md = md;
  }

  // compute length in bytes and check output
  var keyLength = Math.ceil(key.n.bitLength() / 8);
  var maxLength = keyLength - 2 * md.digestLength - 2;
  if(message.length > maxLength) {
    var error = new Error('RSAES-OAEP input message length is too long.');
    error.length = message.length;
    error.maxLength = maxLength;
    throw error;
  }

  if(!label) {
    label = '';
  }
  md.update(label, 'raw');
  var lHash = md.digest();

  var PS = '';
  var PS_length = maxLength - message.length;
  for(var i = 0; i < PS_length; i++) {
    PS += '\x00';
  }

  var DB = lHash.getBytes() + PS + '\x01' + message;

  if(!seed) {
    seed = forge$m.random.getBytes(md.digestLength);
  } else if(seed.length !== md.digestLength) {
    var error = new Error('Invalid RSAES-OAEP seed. The seed length must ' +
      'match the digest length.');
    error.seedLength = seed.length;
    error.digestLength = md.digestLength;
    throw error;
  }

  var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
  var maskedDB = forge$m.util.xorBytes(DB, dbMask, DB.length);

  var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
  var maskedSeed = forge$m.util.xorBytes(seed, seedMask, seed.length);

  // return encoded message
  return '\x00' + maskedSeed + maskedDB;
};

/**
 * Decode the given RSAES-OAEP encoded message (EM) using key, with optional
 * label (L).
 *
 * This method does not perform RSA decryption, it only decodes the message
 * using RSAES-OAEP.
 *
 * @param key the RSA key to use.
 * @param em the encoded message to decode.
 * @param options the options to use:
 *          label an optional label to use.
 *          md the message digest object to use for OAEP, undefined for SHA-1.
 *          mgf1 optional mgf1 parameters:
 *            md the message digest object to use for MGF1.
 *
 * @return the decoded message bytes.
 */
pkcs1.decode_rsa_oaep = function(key, em, options) {
  // parse args
  var label;
  var md;
  var mgf1Md;
  // legacy args
  if(typeof options === 'string') {
    label = options;
    md = arguments[3] || undefined;
  } else if(options) {
    label = options.label || undefined;
    md = options.md || undefined;
    if(options.mgf1 && options.mgf1.md) {
      mgf1Md = options.mgf1.md;
    }
  }

  // compute length in bytes
  var keyLength = Math.ceil(key.n.bitLength() / 8);

  if(em.length !== keyLength) {
    var error = new Error('RSAES-OAEP encoded message length is invalid.');
    error.length = em.length;
    error.expectedLength = keyLength;
    throw error;
  }

  // default OAEP to SHA-1 message digest
  if(md === undefined) {
    md = forge$m.md.sha1.create();
  } else {
    md.start();
  }

  // default MGF-1 to same as OAEP
  if(!mgf1Md) {
    mgf1Md = md;
  }

  if(keyLength < 2 * md.digestLength + 2) {
    throw new Error('RSAES-OAEP key is too short for the hash function.');
  }

  if(!label) {
    label = '';
  }
  md.update(label, 'raw');
  var lHash = md.digest().getBytes();

  // split the message into its parts
  var y = em.charAt(0);
  var maskedSeed = em.substring(1, md.digestLength + 1);
  var maskedDB = em.substring(1 + md.digestLength);

  var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
  var seed = forge$m.util.xorBytes(maskedSeed, seedMask, maskedSeed.length);

  var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
  var db = forge$m.util.xorBytes(maskedDB, dbMask, maskedDB.length);

  var lHashPrime = db.substring(0, md.digestLength);

  // constant time check that all values match what is expected
  var error = (y !== '\x00');

  // constant time check lHash vs lHashPrime
  for(var i = 0; i < md.digestLength; ++i) {
    error |= (lHash.charAt(i) !== lHashPrime.charAt(i));
  }

  // "constant time" find the 0x1 byte separating the padding (zeros) from the
  // message
  // TODO: It must be possible to do this in a better/smarter way?
  var in_ps = 1;
  var index = md.digestLength;
  for(var j = md.digestLength; j < db.length; j++) {
    var code = db.charCodeAt(j);

    var is_0 = (code & 0x1) ^ 0x1;

    // non-zero if not 0 or 1 in the ps section
    var error_mask = in_ps ? 0xfffe : 0x0000;
    error |= (code & error_mask);

    // latch in_ps to zero after we find 0x1
    in_ps = in_ps & is_0;
    index += in_ps;
  }

  if(error || db.charCodeAt(index) !== 0x1) {
    throw new Error('Invalid RSAES-OAEP padding.');
  }

  return db.substring(index + 1);
};

function rsa_mgf1(seed, maskLength, hash) {
  // default to SHA-1 message digest
  if(!hash) {
    hash = forge$m.md.sha1.create();
  }
  var t = '';
  var count = Math.ceil(maskLength / hash.digestLength);
  for(var i = 0; i < count; ++i) {
    var c = String.fromCharCode(
      (i >> 24) & 0xFF, (i >> 16) & 0xFF, (i >> 8) & 0xFF, i & 0xFF);
    hash.start();
    hash.update(seed + c);
    t += hash.digest().getBytes();
  }
  return t.substring(0, maskLength);
}

/**
 * Prime number generation API.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2014 Digital Bazaar, Inc.
 */

var forge$l = forge$F;




(function() {

// forge.prime already defined
if(forge$l.prime) {
  return;
}

/* PRIME API */
var prime = forge$l.prime = forge$l.prime || {};

var BigInteger = forge$l.jsbn.BigInteger;

// primes are 30k+i for i = 1, 7, 11, 13, 17, 19, 23, 29
var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
var THIRTY = new BigInteger(null);
THIRTY.fromInt(30);
var op_or = function(x, y) {return x|y;};

/**
 * Generates a random probable prime with the given number of bits.
 *
 * Alternative algorithms can be specified by name as a string or as an
 * object with custom options like so:
 *
 * {
 *   name: 'PRIMEINC',
 *   options: {
 *     maxBlockTime: <the maximum amount of time to block the main
 *       thread before allowing I/O other JS to run>,
 *     millerRabinTests: <the number of miller-rabin tests to run>,
 *     workerScript: <the worker script URL>,
 *     workers: <the number of web workers (if supported) to use,
 *       -1 to use estimated cores minus one>.
 *     workLoad: the size of the work load, ie: number of possible prime
 *       numbers for each web worker to check per work assignment,
 *       (default: 100).
 *   }
 * }
 *
 * @param bits the number of bits for the prime number.
 * @param options the options to use.
 *          [algorithm] the algorithm to use (default: 'PRIMEINC').
 *          [prng] a custom crypto-secure pseudo-random number generator to use,
 *            that must define "getBytesSync".
 *
 * @return callback(err, num) called once the operation completes.
 */
prime.generateProbablePrime = function(bits, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // default to PRIMEINC algorithm
  var algorithm = options.algorithm || 'PRIMEINC';
  if(typeof algorithm === 'string') {
    algorithm = {name: algorithm};
  }
  algorithm.options = algorithm.options || {};

  // create prng with api that matches BigInteger secure random
  var prng = options.prng || forge$l.random;
  var rng = {
    // x is an array to fill with bytes
    nextBytes: function(x) {
      var b = prng.getBytesSync(x.length);
      for(var i = 0; i < x.length; ++i) {
        x[i] = b.charCodeAt(i);
      }
    }
  };

  if(algorithm.name === 'PRIMEINC') {
    return primeincFindPrime(bits, rng, algorithm.options, callback);
  }

  throw new Error('Invalid prime generation algorithm: ' + algorithm.name);
};

function primeincFindPrime(bits, rng, options, callback) {
  if('workers' in options) {
    return primeincFindPrimeWithWorkers(bits, rng, options, callback);
  }
  return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
}

function primeincFindPrimeWithoutWorkers(bits, rng, options, callback) {
  // initialize random number
  var num = generateRandom(bits, rng);

  /* Note: All primes are of the form 30k+i for i < 30 and gcd(30, i)=1. The
  number we are given is always aligned at 30k + 1. Each time the number is
  determined not to be prime we add to get to the next 'i', eg: if the number
  was at 30k + 1 we add 6. */
  var deltaIdx = 0;

  // get required number of MR tests
  var mrTests = getMillerRabinTests(num.bitLength());
  if('millerRabinTests' in options) {
    mrTests = options.millerRabinTests;
  }

  // find prime nearest to 'num' for maxBlockTime ms
  // 10 ms gives 5ms of leeway for other calculations before dropping
  // below 60fps (1000/60 == 16.67), but in reality, the number will
  // likely be higher due to an 'atomic' big int modPow
  var maxBlockTime = 10;
  if('maxBlockTime' in options) {
    maxBlockTime = options.maxBlockTime;
  }

  _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback);
}

function _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback) {
  var start = +new Date();
  do {
    // overflow, regenerate random number
    if(num.bitLength() > bits) {
      num = generateRandom(bits, rng);
    }
    // do primality test
    if(num.isProbablePrime(mrTests)) {
      return callback(null, num);
    }
    // get next potential prime
    num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
  } while(maxBlockTime < 0 || (+new Date() - start < maxBlockTime));

  // keep trying later
  forge$l.util.setImmediate(function() {
    _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback);
  });
}

// NOTE: This algorithm is indeterminate in nature because workers
// run in parallel looking at different segments of numbers. Even if this
// algorithm is run twice with the same input from a predictable RNG, it
// may produce different outputs.
function primeincFindPrimeWithWorkers(bits, rng, options, callback) {
  // web workers unavailable
  if(typeof Worker === 'undefined') {
    return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
  }

  // initialize random number
  var num = generateRandom(bits, rng);

  // use web workers to generate keys
  var numWorkers = options.workers;
  var workLoad = options.workLoad || 100;
  var range = workLoad * 30 / 8;
  var workerScript = options.workerScript || 'forge/prime.worker.js';
  if(numWorkers === -1) {
    return forge$l.util.estimateCores(function(err, cores) {
      if(err) {
        // default to 2
        cores = 2;
      }
      numWorkers = cores - 1;
      generate();
    });
  }
  generate();

  function generate() {
    // require at least 1 worker
    numWorkers = Math.max(1, numWorkers);

    // TODO: consider optimizing by starting workers outside getPrime() ...
    // note that in order to clean up they will have to be made internally
    // asynchronous which may actually be slower

    // start workers immediately
    var workers = [];
    for(var i = 0; i < numWorkers; ++i) {
      // FIXME: fix path or use blob URLs
      workers[i] = new Worker(workerScript);
    }

    // listen for requests from workers and assign ranges to find prime
    for(var i = 0; i < numWorkers; ++i) {
      workers[i].addEventListener('message', workerMessage);
    }

    /* Note: The distribution of random numbers is unknown. Therefore, each
    web worker is continuously allocated a range of numbers to check for a
    random number until one is found.

    Every 30 numbers will be checked just 8 times, because prime numbers
    have the form:

    30k+i, for i < 30 and gcd(30, i)=1 (there are 8 values of i for this)

    Therefore, if we want a web worker to run N checks before asking for
    a new range of numbers, each range must contain N*30/8 numbers.

    For 100 checks (workLoad), this is a range of 375. */

    var found = false;
    function workerMessage(e) {
      // ignore message, prime already found
      if(found) {
        return;
      }
      var data = e.data;
      if(data.found) {
        // terminate all workers
        for(var i = 0; i < workers.length; ++i) {
          workers[i].terminate();
        }
        found = true;
        return callback(null, new BigInteger(data.prime, 16));
      }

      // overflow, regenerate random number
      if(num.bitLength() > bits) {
        num = generateRandom(bits, rng);
      }

      // assign new range to check
      var hex = num.toString(16);

      // start prime search
      e.target.postMessage({
        hex: hex,
        workLoad: workLoad
      });

      num.dAddOffset(range, 0);
    }
  }
}

/**
 * Generates a random number using the given number of bits and RNG.
 *
 * @param bits the number of bits for the number.
 * @param rng the random number generator to use.
 *
 * @return the random number.
 */
function generateRandom(bits, rng) {
  var num = new BigInteger(bits, rng);
  // force MSB set
  var bits1 = bits - 1;
  if(!num.testBit(bits1)) {
    num.bitwiseTo(BigInteger.ONE.shiftLeft(bits1), op_or, num);
  }
  // align number on 30k+1 boundary
  num.dAddOffset(31 - num.mod(THIRTY).byteValue(), 0);
  return num;
}

/**
 * Returns the required number of Miller-Rabin tests to generate a
 * prime with an error probability of (1/2)^80.
 *
 * See Handbook of Applied Cryptography Chapter 4, Table 4.4.
 *
 * @param bits the bit size.
 *
 * @return the required number of iterations.
 */
function getMillerRabinTests(bits) {
  if(bits <= 100) return 27;
  if(bits <= 150) return 18;
  if(bits <= 200) return 15;
  if(bits <= 250) return 12;
  if(bits <= 300) return 9;
  if(bits <= 350) return 8;
  if(bits <= 400) return 7;
  if(bits <= 500) return 6;
  if(bits <= 600) return 5;
  if(bits <= 800) return 4;
  if(bits <= 1250) return 3;
  return 2;
}

})();

/**
 * Javascript implementation of basic RSA algorithms.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 *
 * The only algorithm currently supported for PKI is RSA.
 *
 * An RSA key is often stored in ASN.1 DER format. The SubjectPublicKeyInfo
 * ASN.1 structure is composed of an algorithm of type AlgorithmIdentifier
 * and a subjectPublicKey of type bit string.
 *
 * The AlgorithmIdentifier contains an Object Identifier (OID) and parameters
 * for the algorithm, if any. In the case of RSA, there aren't any.
 *
 * SubjectPublicKeyInfo ::= SEQUENCE {
 *   algorithm AlgorithmIdentifier,
 *   subjectPublicKey BIT STRING
 * }
 *
 * AlgorithmIdentifer ::= SEQUENCE {
 *   algorithm OBJECT IDENTIFIER,
 *   parameters ANY DEFINED BY algorithm OPTIONAL
 * }
 *
 * For an RSA public key, the subjectPublicKey is:
 *
 * RSAPublicKey ::= SEQUENCE {
 *   modulus            INTEGER,    -- n
 *   publicExponent     INTEGER     -- e
 * }
 *
 * PrivateKeyInfo ::= SEQUENCE {
 *   version                   Version,
 *   privateKeyAlgorithm       PrivateKeyAlgorithmIdentifier,
 *   privateKey                PrivateKey,
 *   attributes           [0]  IMPLICIT Attributes OPTIONAL
 * }
 *
 * Version ::= INTEGER
 * PrivateKeyAlgorithmIdentifier ::= AlgorithmIdentifier
 * PrivateKey ::= OCTET STRING
 * Attributes ::= SET OF Attribute
 *
 * An RSA private key as the following structure:
 *
 * RSAPrivateKey ::= SEQUENCE {
 *   version Version,
 *   modulus INTEGER, -- n
 *   publicExponent INTEGER, -- e
 *   privateExponent INTEGER, -- d
 *   prime1 INTEGER, -- p
 *   prime2 INTEGER, -- q
 *   exponent1 INTEGER, -- d mod (p-1)
 *   exponent2 INTEGER, -- d mod (q-1)
 *   coefficient INTEGER -- (inverse of q) mod p
 * }
 *
 * Version ::= INTEGER
 *
 * The OID for the RSA key algorithm is: 1.2.840.113549.1.1.1
 */

var forge$k = forge$F;








if(typeof BigInteger$1 === 'undefined') {
  var BigInteger$1 = forge$k.jsbn.BigInteger;
}

var _crypto = forge$k.util.isNodejs ? require$$1__default : null;

// shortcut for asn.1 API
var asn1$7 = forge$k.asn1;

// shortcut for util API
var util = forge$k.util;

/*
 * RSA encryption and decryption, see RFC 2313.
 */
forge$k.pki = forge$k.pki || {};
forge$k.pki.rsa = forge$k.rsa = forge$k.rsa || {};
var pki$4 = forge$k.pki;

// for finding primes, which are 30k+i for i = 1, 7, 11, 13, 17, 19, 23, 29
var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];

// validator for a PrivateKeyInfo structure
var privateKeyValidator$1 = {
  // PrivateKeyInfo
  name: 'PrivateKeyInfo',
  tagClass: asn1$7.Class.UNIVERSAL,
  type: asn1$7.Type.SEQUENCE,
  constructed: true,
  value: [{
    // Version (INTEGER)
    name: 'PrivateKeyInfo.version',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyVersion'
  }, {
    // privateKeyAlgorithm
    name: 'PrivateKeyInfo.privateKeyAlgorithm',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'AlgorithmIdentifier.algorithm',
      tagClass: asn1$7.Class.UNIVERSAL,
      type: asn1$7.Type.OID,
      constructed: false,
      capture: 'privateKeyOid'
    }]
  }, {
    // PrivateKey
    name: 'PrivateKeyInfo',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.OCTETSTRING,
    constructed: false,
    capture: 'privateKey'
  }]
};

// validator for an RSA private key
var rsaPrivateKeyValidator = {
  // RSAPrivateKey
  name: 'RSAPrivateKey',
  tagClass: asn1$7.Class.UNIVERSAL,
  type: asn1$7.Type.SEQUENCE,
  constructed: true,
  value: [{
    // Version (INTEGER)
    name: 'RSAPrivateKey.version',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyVersion'
  }, {
    // modulus (n)
    name: 'RSAPrivateKey.modulus',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyModulus'
  }, {
    // publicExponent (e)
    name: 'RSAPrivateKey.publicExponent',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyPublicExponent'
  }, {
    // privateExponent (d)
    name: 'RSAPrivateKey.privateExponent',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyPrivateExponent'
  }, {
    // prime1 (p)
    name: 'RSAPrivateKey.prime1',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyPrime1'
  }, {
    // prime2 (q)
    name: 'RSAPrivateKey.prime2',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyPrime2'
  }, {
    // exponent1 (d mod (p-1))
    name: 'RSAPrivateKey.exponent1',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyExponent1'
  }, {
    // exponent2 (d mod (q-1))
    name: 'RSAPrivateKey.exponent2',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyExponent2'
  }, {
    // coefficient ((inverse of q) mod p)
    name: 'RSAPrivateKey.coefficient',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyCoefficient'
  }]
};

// validator for an RSA public key
var rsaPublicKeyValidator = {
  // RSAPublicKey
  name: 'RSAPublicKey',
  tagClass: asn1$7.Class.UNIVERSAL,
  type: asn1$7.Type.SEQUENCE,
  constructed: true,
  value: [{
    // modulus (n)
    name: 'RSAPublicKey.modulus',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'publicKeyModulus'
  }, {
    // publicExponent (e)
    name: 'RSAPublicKey.exponent',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.INTEGER,
    constructed: false,
    capture: 'publicKeyExponent'
  }]
};

// validator for an SubjectPublicKeyInfo structure
// Note: Currently only works with an RSA public key
var publicKeyValidator$2 = forge$k.pki.rsa.publicKeyValidator = {
  name: 'SubjectPublicKeyInfo',
  tagClass: asn1$7.Class.UNIVERSAL,
  type: asn1$7.Type.SEQUENCE,
  constructed: true,
  captureAsn1: 'subjectPublicKeyInfo',
  value: [{
    name: 'SubjectPublicKeyInfo.AlgorithmIdentifier',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'AlgorithmIdentifier.algorithm',
      tagClass: asn1$7.Class.UNIVERSAL,
      type: asn1$7.Type.OID,
      constructed: false,
      capture: 'publicKeyOid'
    }]
  }, {
    // subjectPublicKey
    name: 'SubjectPublicKeyInfo.subjectPublicKey',
    tagClass: asn1$7.Class.UNIVERSAL,
    type: asn1$7.Type.BITSTRING,
    constructed: false,
    value: [{
      // RSAPublicKey
      name: 'SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey',
      tagClass: asn1$7.Class.UNIVERSAL,
      type: asn1$7.Type.SEQUENCE,
      constructed: true,
      optional: true,
      captureAsn1: 'rsaPublicKey'
    }]
  }]
};

/**
 * Wrap digest in DigestInfo object.
 *
 * This function implements EMSA-PKCS1-v1_5-ENCODE as per RFC 3447.
 *
 * DigestInfo ::= SEQUENCE {
 *   digestAlgorithm DigestAlgorithmIdentifier,
 *   digest Digest
 * }
 *
 * DigestAlgorithmIdentifier ::= AlgorithmIdentifier
 * Digest ::= OCTET STRING
 *
 * @param md the message digest object with the hash to sign.
 *
 * @return the encoded message (ready for RSA encrytion)
 */
var emsaPkcs1v15encode = function(md) {
  // get the oid for the algorithm
  var oid;
  if(md.algorithm in pki$4.oids) {
    oid = pki$4.oids[md.algorithm];
  } else {
    var error = new Error('Unknown message digest algorithm.');
    error.algorithm = md.algorithm;
    throw error;
  }
  var oidBytes = asn1$7.oidToDer(oid).getBytes();

  // create the digest info
  var digestInfo = asn1$7.create(
    asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, []);
  var digestAlgorithm = asn1$7.create(
    asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, []);
  digestAlgorithm.value.push(asn1$7.create(
    asn1$7.Class.UNIVERSAL, asn1$7.Type.OID, false, oidBytes));
  digestAlgorithm.value.push(asn1$7.create(
    asn1$7.Class.UNIVERSAL, asn1$7.Type.NULL, false, ''));
  var digest = asn1$7.create(
    asn1$7.Class.UNIVERSAL, asn1$7.Type.OCTETSTRING,
    false, md.digest().getBytes());
  digestInfo.value.push(digestAlgorithm);
  digestInfo.value.push(digest);

  // encode digest info
  return asn1$7.toDer(digestInfo).getBytes();
};

/**
 * Performs x^c mod n (RSA encryption or decryption operation).
 *
 * @param x the number to raise and mod.
 * @param key the key to use.
 * @param pub true if the key is public, false if private.
 *
 * @return the result of x^c mod n.
 */
var _modPow = function(x, key, pub) {
  if(pub) {
    return x.modPow(key.e, key.n);
  }

  if(!key.p || !key.q) {
    // allow calculation without CRT params (slow)
    return x.modPow(key.d, key.n);
  }

  // pre-compute dP, dQ, and qInv if necessary
  if(!key.dP) {
    key.dP = key.d.mod(key.p.subtract(BigInteger$1.ONE));
  }
  if(!key.dQ) {
    key.dQ = key.d.mod(key.q.subtract(BigInteger$1.ONE));
  }
  if(!key.qInv) {
    key.qInv = key.q.modInverse(key.p);
  }

  /* Chinese remainder theorem (CRT) states:

    Suppose n1, n2, ..., nk are positive integers which are pairwise
    coprime (n1 and n2 have no common factors other than 1). For any
    integers x1, x2, ..., xk there exists an integer x solving the
    system of simultaneous congruences (where ~= means modularly
    congruent so a ~= b mod n means a mod n = b mod n):

    x ~= x1 mod n1
    x ~= x2 mod n2
    ...
    x ~= xk mod nk

    This system of congruences has a single simultaneous solution x
    between 0 and n - 1. Furthermore, each xk solution and x itself
    is congruent modulo the product n = n1*n2*...*nk.
    So x1 mod n = x2 mod n = xk mod n = x mod n.

    The single simultaneous solution x can be solved with the following
    equation:

    x = sum(xi*ri*si) mod n where ri = n/ni and si = ri^-1 mod ni.

    Where x is less than n, xi = x mod ni.

    For RSA we are only concerned with k = 2. The modulus n = pq, where
    p and q are coprime. The RSA decryption algorithm is:

    y = x^d mod n

    Given the above:

    x1 = x^d mod p
    r1 = n/p = q
    s1 = q^-1 mod p
    x2 = x^d mod q
    r2 = n/q = p
    s2 = p^-1 mod q

    So y = (x1r1s1 + x2r2s2) mod n
         = ((x^d mod p)q(q^-1 mod p) + (x^d mod q)p(p^-1 mod q)) mod n

    According to Fermat's Little Theorem, if the modulus P is prime,
    for any integer A not evenly divisible by P, A^(P-1) ~= 1 mod P.
    Since A is not divisible by P it follows that if:
    N ~= M mod (P - 1), then A^N mod P = A^M mod P. Therefore:

    A^N mod P = A^(M mod (P - 1)) mod P. (The latter takes less effort
    to calculate). In order to calculate x^d mod p more quickly the
    exponent d mod (p - 1) is stored in the RSA private key (the same
    is done for x^d mod q). These values are referred to as dP and dQ
    respectively. Therefore we now have:

    y = ((x^dP mod p)q(q^-1 mod p) + (x^dQ mod q)p(p^-1 mod q)) mod n

    Since we'll be reducing x^dP by modulo p (same for q) we can also
    reduce x by p (and q respectively) before hand. Therefore, let

    xp = ((x mod p)^dP mod p), and
    xq = ((x mod q)^dQ mod q), yielding:

    y = (xp*q*(q^-1 mod p) + xq*p*(p^-1 mod q)) mod n

    This can be further reduced to a simple algorithm that only
    requires 1 inverse (the q inverse is used) to be used and stored.
    The algorithm is called Garner's algorithm. If qInv is the
    inverse of q, we simply calculate:

    y = (qInv*(xp - xq) mod p) * q + xq

    However, there are two further complications. First, we need to
    ensure that xp > xq to prevent signed BigIntegers from being used
    so we add p until this is true (since we will be mod'ing with
    p anyway). Then, there is a known timing attack on algorithms
    using the CRT. To mitigate this risk, "cryptographic blinding"
    should be used. This requires simply generating a random number r
    between 0 and n-1 and its inverse and multiplying x by r^e before
    calculating y and then multiplying y by r^-1 afterwards. Note that
    r must be coprime with n (gcd(r, n) === 1) in order to have an
    inverse.
  */

  // cryptographic blinding
  var r;
  do {
    r = new BigInteger$1(
      forge$k.util.bytesToHex(forge$k.random.getBytes(key.n.bitLength() / 8)),
      16);
  } while(r.compareTo(key.n) >= 0 || !r.gcd(key.n).equals(BigInteger$1.ONE));
  x = x.multiply(r.modPow(key.e, key.n)).mod(key.n);

  // calculate xp and xq
  var xp = x.mod(key.p).modPow(key.dP, key.p);
  var xq = x.mod(key.q).modPow(key.dQ, key.q);

  // xp must be larger than xq to avoid signed bit usage
  while(xp.compareTo(xq) < 0) {
    xp = xp.add(key.p);
  }

  // do last step
  var y = xp.subtract(xq)
    .multiply(key.qInv).mod(key.p)
    .multiply(key.q).add(xq);

  // remove effect of random for cryptographic blinding
  y = y.multiply(r.modInverse(key.n)).mod(key.n);

  return y;
};

/**
 * NOTE: THIS METHOD IS DEPRECATED, use 'sign' on a private key object or
 * 'encrypt' on a public key object instead.
 *
 * Performs RSA encryption.
 *
 * The parameter bt controls whether to put padding bytes before the
 * message passed in. Set bt to either true or false to disable padding
 * completely (in order to handle e.g. EMSA-PSS encoding seperately before),
 * signaling whether the encryption operation is a public key operation
 * (i.e. encrypting data) or not, i.e. private key operation (data signing).
 *
 * For PKCS#1 v1.5 padding pass in the block type to use, i.e. either 0x01
 * (for signing) or 0x02 (for encryption). The key operation mode (private
 * or public) is derived from this flag in that case).
 *
 * @param m the message to encrypt as a byte string.
 * @param key the RSA key to use.
 * @param bt for PKCS#1 v1.5 padding, the block type to use
 *   (0x01 for private key, 0x02 for public),
 *   to disable padding: true = public key, false = private key.
 *
 * @return the encrypted bytes as a string.
 */
pki$4.rsa.encrypt = function(m, key, bt) {
  var pub = bt;
  var eb;

  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  if(bt !== false && bt !== true) {
    // legacy, default to PKCS#1 v1.5 padding
    pub = (bt === 0x02);
    eb = _encodePkcs1_v1_5(m, key, bt);
  } else {
    eb = forge$k.util.createBuffer();
    eb.putBytes(m);
  }

  // load encryption block as big integer 'x'
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var x = new BigInteger$1(eb.toHex(), 16);

  // do RSA encryption
  var y = _modPow(x, key, pub);

  // convert y into the encrypted data byte string, if y is shorter in
  // bytes than k, then prepend zero bytes to fill up ed
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var yhex = y.toString(16);
  var ed = forge$k.util.createBuffer();
  var zeros = k - Math.ceil(yhex.length / 2);
  while(zeros > 0) {
    ed.putByte(0x00);
    --zeros;
  }
  ed.putBytes(forge$k.util.hexToBytes(yhex));
  return ed.getBytes();
};

/**
 * NOTE: THIS METHOD IS DEPRECATED, use 'decrypt' on a private key object or
 * 'verify' on a public key object instead.
 *
 * Performs RSA decryption.
 *
 * The parameter ml controls whether to apply PKCS#1 v1.5 padding
 * or not.  Set ml = false to disable padding removal completely
 * (in order to handle e.g. EMSA-PSS later on) and simply pass back
 * the RSA encryption block.
 *
 * @param ed the encrypted data to decrypt in as a byte string.
 * @param key the RSA key to use.
 * @param pub true for a public key operation, false for private.
 * @param ml the message length, if known, false to disable padding.
 *
 * @return the decrypted message as a byte string.
 */
pki$4.rsa.decrypt = function(ed, key, pub, ml) {
  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  // error if the length of the encrypted data ED is not k
  if(ed.length !== k) {
    var error = new Error('Encrypted message length is invalid.');
    error.length = ed.length;
    error.expected = k;
    throw error;
  }

  // convert encrypted data into a big integer
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var y = new BigInteger$1(forge$k.util.createBuffer(ed).toHex(), 16);

  // y must be less than the modulus or it wasn't the result of
  // a previous mod operation (encryption) using that modulus
  if(y.compareTo(key.n) >= 0) {
    throw new Error('Encrypted message is invalid.');
  }

  // do RSA decryption
  var x = _modPow(y, key, pub);

  // create the encryption block, if x is shorter in bytes than k, then
  // prepend zero bytes to fill up eb
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var xhex = x.toString(16);
  var eb = forge$k.util.createBuffer();
  var zeros = k - Math.ceil(xhex.length / 2);
  while(zeros > 0) {
    eb.putByte(0x00);
    --zeros;
  }
  eb.putBytes(forge$k.util.hexToBytes(xhex));

  if(ml !== false) {
    // legacy, default to PKCS#1 v1.5 padding
    return _decodePkcs1_v1_5(eb.getBytes(), key, pub);
  }

  // return message
  return eb.getBytes();
};

/**
 * Creates an RSA key-pair generation state object. It is used to allow
 * key-generation to be performed in steps. It also allows for a UI to
 * display progress updates.
 *
 * @param bits the size for the private key in bits, defaults to 2048.
 * @param e the public exponent to use, defaults to 65537 (0x10001).
 * @param [options] the options to use.
 *          prng a custom crypto-secure pseudo-random number generator to use,
 *            that must define "getBytesSync".
 *          algorithm the algorithm to use (default: 'PRIMEINC').
 *
 * @return the state object to use to generate the key-pair.
 */
pki$4.rsa.createKeyPairGenerationState = function(bits, e, options) {
  // TODO: migrate step-based prime generation code to forge.prime

  // set default bits
  if(typeof(bits) === 'string') {
    bits = parseInt(bits, 10);
  }
  bits = bits || 2048;

  // create prng with api that matches BigInteger secure random
  options = options || {};
  var prng = options.prng || forge$k.random;
  var rng = {
    // x is an array to fill with bytes
    nextBytes: function(x) {
      var b = prng.getBytesSync(x.length);
      for(var i = 0; i < x.length; ++i) {
        x[i] = b.charCodeAt(i);
      }
    }
  };

  var algorithm = options.algorithm || 'PRIMEINC';

  // create PRIMEINC algorithm state
  var rval;
  if(algorithm === 'PRIMEINC') {
    rval = {
      algorithm: algorithm,
      state: 0,
      bits: bits,
      rng: rng,
      eInt: e || 65537,
      e: new BigInteger$1(null),
      p: null,
      q: null,
      qBits: bits >> 1,
      pBits: bits - (bits >> 1),
      pqState: 0,
      num: null,
      keys: null
    };
    rval.e.fromInt(rval.eInt);
  } else {
    throw new Error('Invalid key generation algorithm: ' + algorithm);
  }

  return rval;
};

/**
 * Attempts to runs the key-generation algorithm for at most n seconds
 * (approximately) using the given state. When key-generation has completed,
 * the keys will be stored in state.keys.
 *
 * To use this function to update a UI while generating a key or to prevent
 * causing browser lockups/warnings, set "n" to a value other than 0. A
 * simple pattern for generating a key and showing a progress indicator is:
 *
 * var state = pki.rsa.createKeyPairGenerationState(2048);
 * var step = function() {
 *   // step key-generation, run algorithm for 100 ms, repeat
 *   if(!forge.pki.rsa.stepKeyPairGenerationState(state, 100)) {
 *     setTimeout(step, 1);
 *   } else {
 *     // key-generation complete
 *     // TODO: turn off progress indicator here
 *     // TODO: use the generated key-pair in "state.keys"
 *   }
 * };
 * // TODO: turn on progress indicator here
 * setTimeout(step, 0);
 *
 * @param state the state to use.
 * @param n the maximum number of milliseconds to run the algorithm for, 0
 *          to run the algorithm to completion.
 *
 * @return true if the key-generation completed, false if not.
 */
pki$4.rsa.stepKeyPairGenerationState = function(state, n) {
  // set default algorithm if not set
  if(!('algorithm' in state)) {
    state.algorithm = 'PRIMEINC';
  }

  // TODO: migrate step-based prime generation code to forge.prime
  // TODO: abstract as PRIMEINC algorithm

  // do key generation (based on Tom Wu's rsa.js, see jsbn.js license)
  // with some minor optimizations and designed to run in steps

  // local state vars
  var THIRTY = new BigInteger$1(null);
  THIRTY.fromInt(30);
  var deltaIdx = 0;
  var op_or = function(x, y) {return x | y;};

  // keep stepping until time limit is reached or done
  var t1 = +new Date();
  var t2;
  var total = 0;
  while(state.keys === null && (n <= 0 || total < n)) {
    // generate p or q
    if(state.state === 0) {
      /* Note: All primes are of the form:

        30k+i, for i < 30 and gcd(30, i)=1, where there are 8 values for i

        When we generate a random number, we always align it at 30k + 1. Each
        time the number is determined not to be prime we add to get to the
        next 'i', eg: if the number was at 30k + 1 we add 6. */
      var bits = (state.p === null) ? state.pBits : state.qBits;
      var bits1 = bits - 1;

      // get a random number
      if(state.pqState === 0) {
        state.num = new BigInteger$1(bits, state.rng);
        // force MSB set
        if(!state.num.testBit(bits1)) {
          state.num.bitwiseTo(
            BigInteger$1.ONE.shiftLeft(bits1), op_or, state.num);
        }
        // align number on 30k+1 boundary
        state.num.dAddOffset(31 - state.num.mod(THIRTY).byteValue(), 0);
        deltaIdx = 0;

        ++state.pqState;
      } else if(state.pqState === 1) {
        // try to make the number a prime
        if(state.num.bitLength() > bits) {
          // overflow, try again
          state.pqState = 0;
          // do primality test
        } else if(state.num.isProbablePrime(
          _getMillerRabinTests(state.num.bitLength()))) {
          ++state.pqState;
        } else {
          // get next potential prime
          state.num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
        }
      } else if(state.pqState === 2) {
        // ensure number is coprime with e
        state.pqState =
          (state.num.subtract(BigInteger$1.ONE).gcd(state.e)
            .compareTo(BigInteger$1.ONE) === 0) ? 3 : 0;
      } else if(state.pqState === 3) {
        // store p or q
        state.pqState = 0;
        if(state.p === null) {
          state.p = state.num;
        } else {
          state.q = state.num;
        }

        // advance state if both p and q are ready
        if(state.p !== null && state.q !== null) {
          ++state.state;
        }
        state.num = null;
      }
    } else if(state.state === 1) {
      // ensure p is larger than q (swap them if not)
      if(state.p.compareTo(state.q) < 0) {
        state.num = state.p;
        state.p = state.q;
        state.q = state.num;
      }
      ++state.state;
    } else if(state.state === 2) {
      // compute phi: (p - 1)(q - 1) (Euler's totient function)
      state.p1 = state.p.subtract(BigInteger$1.ONE);
      state.q1 = state.q.subtract(BigInteger$1.ONE);
      state.phi = state.p1.multiply(state.q1);
      ++state.state;
    } else if(state.state === 3) {
      // ensure e and phi are coprime
      if(state.phi.gcd(state.e).compareTo(BigInteger$1.ONE) === 0) {
        // phi and e are coprime, advance
        ++state.state;
      } else {
        // phi and e aren't coprime, so generate a new p and q
        state.p = null;
        state.q = null;
        state.state = 0;
      }
    } else if(state.state === 4) {
      // create n, ensure n is has the right number of bits
      state.n = state.p.multiply(state.q);

      // ensure n is right number of bits
      if(state.n.bitLength() === state.bits) {
        // success, advance
        ++state.state;
      } else {
        // failed, get new q
        state.q = null;
        state.state = 0;
      }
    } else if(state.state === 5) {
      // set keys
      var d = state.e.modInverse(state.phi);
      state.keys = {
        privateKey: pki$4.rsa.setPrivateKey(
          state.n, state.e, d, state.p, state.q,
          d.mod(state.p1), d.mod(state.q1),
          state.q.modInverse(state.p)),
        publicKey: pki$4.rsa.setPublicKey(state.n, state.e)
      };
    }

    // update timing
    t2 = +new Date();
    total += t2 - t1;
    t1 = t2;
  }

  return state.keys !== null;
};

/**
 * Generates an RSA public-private key pair in a single call.
 *
 * To generate a key-pair in steps (to allow for progress updates and to
 * prevent blocking or warnings in slow browsers) then use the key-pair
 * generation state functions.
 *
 * To generate a key-pair asynchronously (either through web-workers, if
 * available, or by breaking up the work on the main thread), pass a
 * callback function.
 *
 * @param [bits] the size for the private key in bits, defaults to 2048.
 * @param [e] the public exponent to use, defaults to 65537.
 * @param [options] options for key-pair generation, if given then 'bits'
 *            and 'e' must *not* be given:
 *          bits the size for the private key in bits, (default: 2048).
 *          e the public exponent to use, (default: 65537 (0x10001)).
 *          workerScript the worker script URL.
 *          workers the number of web workers (if supported) to use,
 *            (default: 2).
 *          workLoad the size of the work load, ie: number of possible prime
 *            numbers for each web worker to check per work assignment,
 *            (default: 100).
 *          prng a custom crypto-secure pseudo-random number generator to use,
 *            that must define "getBytesSync". Disables use of native APIs.
 *          algorithm the algorithm to use (default: 'PRIMEINC').
 * @param [callback(err, keypair)] called once the operation completes.
 *
 * @return an object with privateKey and publicKey properties.
 */
pki$4.rsa.generateKeyPair = function(bits, e, options, callback) {
  // (bits), (options), (callback)
  if(arguments.length === 1) {
    if(typeof bits === 'object') {
      options = bits;
      bits = undefined;
    } else if(typeof bits === 'function') {
      callback = bits;
      bits = undefined;
    }
  } else if(arguments.length === 2) {
    // (bits, e), (bits, options), (bits, callback), (options, callback)
    if(typeof bits === 'number') {
      if(typeof e === 'function') {
        callback = e;
        e = undefined;
      } else if(typeof e !== 'number') {
        options = e;
        e = undefined;
      }
    } else {
      options = bits;
      callback = e;
      bits = undefined;
      e = undefined;
    }
  } else if(arguments.length === 3) {
    // (bits, e, options), (bits, e, callback), (bits, options, callback)
    if(typeof e === 'number') {
      if(typeof options === 'function') {
        callback = options;
        options = undefined;
      }
    } else {
      callback = options;
      options = e;
      e = undefined;
    }
  }
  options = options || {};
  if(bits === undefined) {
    bits = options.bits || 2048;
  }
  if(e === undefined) {
    e = options.e || 0x10001;
  }

  // use native code if permitted, available, and parameters are acceptable
  if(!options.prng &&
    bits >= 256 && bits <= 16384 && (e === 0x10001 || e === 3)) {
    if(callback) {
      // try native async
      if(_detectNodeCrypto('generateKeyPair')) {
        return _crypto.generateKeyPair('rsa', {
          modulusLength: bits,
          publicExponent: e,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        }, function(err, pub, priv) {
          if(err) {
            return callback(err);
          }
          callback(null, {
            privateKey: pki$4.privateKeyFromPem(priv),
            publicKey: pki$4.publicKeyFromPem(pub)
          });
        });
      }
      if(_detectSubtleCrypto('generateKey') &&
        _detectSubtleCrypto('exportKey')) {
        // use standard native generateKey
        return util.globalScope.crypto.subtle.generateKey({
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: bits,
          publicExponent: _intToUint8Array(e),
          hash: {name: 'SHA-256'}
        }, true /* key can be exported*/, ['sign', 'verify'])
        .then(function(pair) {
          return util.globalScope.crypto.subtle.exportKey(
            'pkcs8', pair.privateKey);
        // avoiding catch(function(err) {...}) to support IE <= 8
        }).then(undefined, function(err) {
          callback(err);
        }).then(function(pkcs8) {
          if(pkcs8) {
            var privateKey = pki$4.privateKeyFromAsn1(
              asn1$7.fromDer(forge$k.util.createBuffer(pkcs8)));
            callback(null, {
              privateKey: privateKey,
              publicKey: pki$4.setRsaPublicKey(privateKey.n, privateKey.e)
            });
          }
        });
      }
      if(_detectSubtleMsCrypto('generateKey') &&
        _detectSubtleMsCrypto('exportKey')) {
        var genOp = util.globalScope.msCrypto.subtle.generateKey({
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: bits,
          publicExponent: _intToUint8Array(e),
          hash: {name: 'SHA-256'}
        }, true /* key can be exported*/, ['sign', 'verify']);
        genOp.oncomplete = function(e) {
          var pair = e.target.result;
          var exportOp = util.globalScope.msCrypto.subtle.exportKey(
            'pkcs8', pair.privateKey);
          exportOp.oncomplete = function(e) {
            var pkcs8 = e.target.result;
            var privateKey = pki$4.privateKeyFromAsn1(
              asn1$7.fromDer(forge$k.util.createBuffer(pkcs8)));
            callback(null, {
              privateKey: privateKey,
              publicKey: pki$4.setRsaPublicKey(privateKey.n, privateKey.e)
            });
          };
          exportOp.onerror = function(err) {
            callback(err);
          };
        };
        genOp.onerror = function(err) {
          callback(err);
        };
        return;
      }
    } else {
      // try native sync
      if(_detectNodeCrypto('generateKeyPairSync')) {
        var keypair = _crypto.generateKeyPairSync('rsa', {
          modulusLength: bits,
          publicExponent: e,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        return {
          privateKey: pki$4.privateKeyFromPem(keypair.privateKey),
          publicKey: pki$4.publicKeyFromPem(keypair.publicKey)
        };
      }
    }
  }

  // use JavaScript implementation
  var state = pki$4.rsa.createKeyPairGenerationState(bits, e, options);
  if(!callback) {
    pki$4.rsa.stepKeyPairGenerationState(state, 0);
    return state.keys;
  }
  _generateKeyPair(state, options, callback);
};

/**
 * Sets an RSA public key from BigIntegers modulus and exponent.
 *
 * @param n the modulus.
 * @param e the exponent.
 *
 * @return the public key.
 */
pki$4.setRsaPublicKey = pki$4.rsa.setPublicKey = function(n, e) {
  var key = {
    n: n,
    e: e
  };

  /**
   * Encrypts the given data with this public key. Newer applications
   * should use the 'RSA-OAEP' decryption scheme, 'RSAES-PKCS1-V1_5' is for
   * legacy applications.
   *
   * @param data the byte string to encrypt.
   * @param scheme the encryption scheme to use:
   *          'RSAES-PKCS1-V1_5' (default),
   *          'RSA-OAEP',
   *          'RAW', 'NONE', or null to perform raw RSA encryption,
   *          an object with an 'encode' property set to a function
   *          with the signature 'function(data, key)' that returns
   *          a binary-encoded string representing the encoded data.
   * @param schemeOptions any scheme-specific options.
   *
   * @return the encrypted byte string.
   */
  key.encrypt = function(data, scheme, schemeOptions) {
    if(typeof scheme === 'string') {
      scheme = scheme.toUpperCase();
    } else if(scheme === undefined) {
      scheme = 'RSAES-PKCS1-V1_5';
    }

    if(scheme === 'RSAES-PKCS1-V1_5') {
      scheme = {
        encode: function(m, key, pub) {
          return _encodePkcs1_v1_5(m, key, 0x02).getBytes();
        }
      };
    } else if(scheme === 'RSA-OAEP' || scheme === 'RSAES-OAEP') {
      scheme = {
        encode: function(m, key) {
          return forge$k.pkcs1.encode_rsa_oaep(key, m, schemeOptions);
        }
      };
    } else if(['RAW', 'NONE', 'NULL', null].indexOf(scheme) !== -1) {
      scheme = {encode: function(e) {return e;}};
    } else if(typeof scheme === 'string') {
      throw new Error('Unsupported encryption scheme: "' + scheme + '".');
    }

    // do scheme-based encoding then rsa encryption
    var e = scheme.encode(data, key, true);
    return pki$4.rsa.encrypt(e, key, true);
  };

  /**
   * Verifies the given signature against the given digest.
   *
   * PKCS#1 supports multiple (currently two) signature schemes:
   * RSASSA-PKCS1-V1_5 and RSASSA-PSS.
   *
   * By default this implementation uses the "old scheme", i.e.
   * RSASSA-PKCS1-V1_5, in which case once RSA-decrypted, the
   * signature is an OCTET STRING that holds a DigestInfo.
   *
   * DigestInfo ::= SEQUENCE {
   *   digestAlgorithm DigestAlgorithmIdentifier,
   *   digest Digest
   * }
   * DigestAlgorithmIdentifier ::= AlgorithmIdentifier
   * Digest ::= OCTET STRING
   *
   * To perform PSS signature verification, provide an instance
   * of Forge PSS object as the scheme parameter.
   *
   * @param digest the message digest hash to compare against the signature,
   *          as a binary-encoded string.
   * @param signature the signature to verify, as a binary-encoded string.
   * @param scheme signature verification scheme to use:
   *          'RSASSA-PKCS1-V1_5' or undefined for RSASSA PKCS#1 v1.5,
   *          a Forge PSS object for RSASSA-PSS,
   *          'NONE' or null for none, DigestInfo will not be expected, but
   *            PKCS#1 v1.5 padding will still be used.
   *
   * @return true if the signature was verified, false if not.
   */
  key.verify = function(digest, signature, scheme) {
    if(typeof scheme === 'string') {
      scheme = scheme.toUpperCase();
    } else if(scheme === undefined) {
      scheme = 'RSASSA-PKCS1-V1_5';
    }

    if(scheme === 'RSASSA-PKCS1-V1_5') {
      scheme = {
        verify: function(digest, d) {
          // remove padding
          d = _decodePkcs1_v1_5(d, key, true);
          // d is ASN.1 BER-encoded DigestInfo
          var obj = asn1$7.fromDer(d);
          // compare the given digest to the decrypted one
          return digest === obj.value[1].value;
        }
      };
    } else if(scheme === 'NONE' || scheme === 'NULL' || scheme === null) {
      scheme = {
        verify: function(digest, d) {
          // remove padding
          d = _decodePkcs1_v1_5(d, key, true);
          return digest === d;
        }
      };
    }

    // do rsa decryption w/o any decoding, then verify -- which does decoding
    var d = pki$4.rsa.decrypt(signature, key, true, false);
    return scheme.verify(digest, d, key.n.bitLength());
  };

  return key;
};

/**
 * Sets an RSA private key from BigIntegers modulus, exponent, primes,
 * prime exponents, and modular multiplicative inverse.
 *
 * @param n the modulus.
 * @param e the public exponent.
 * @param d the private exponent ((inverse of e) mod n).
 * @param p the first prime.
 * @param q the second prime.
 * @param dP exponent1 (d mod (p-1)).
 * @param dQ exponent2 (d mod (q-1)).
 * @param qInv ((inverse of q) mod p)
 *
 * @return the private key.
 */
pki$4.setRsaPrivateKey = pki$4.rsa.setPrivateKey = function(
  n, e, d, p, q, dP, dQ, qInv) {
  var key = {
    n: n,
    e: e,
    d: d,
    p: p,
    q: q,
    dP: dP,
    dQ: dQ,
    qInv: qInv
  };

  /**
   * Decrypts the given data with this private key. The decryption scheme
   * must match the one used to encrypt the data.
   *
   * @param data the byte string to decrypt.
   * @param scheme the decryption scheme to use:
   *          'RSAES-PKCS1-V1_5' (default),
   *          'RSA-OAEP',
   *          'RAW', 'NONE', or null to perform raw RSA decryption.
   * @param schemeOptions any scheme-specific options.
   *
   * @return the decrypted byte string.
   */
  key.decrypt = function(data, scheme, schemeOptions) {
    if(typeof scheme === 'string') {
      scheme = scheme.toUpperCase();
    } else if(scheme === undefined) {
      scheme = 'RSAES-PKCS1-V1_5';
    }

    // do rsa decryption w/o any decoding
    var d = pki$4.rsa.decrypt(data, key, false, false);

    if(scheme === 'RSAES-PKCS1-V1_5') {
      scheme = {decode: _decodePkcs1_v1_5};
    } else if(scheme === 'RSA-OAEP' || scheme === 'RSAES-OAEP') {
      scheme = {
        decode: function(d, key) {
          return forge$k.pkcs1.decode_rsa_oaep(key, d, schemeOptions);
        }
      };
    } else if(['RAW', 'NONE', 'NULL', null].indexOf(scheme) !== -1) {
      scheme = {decode: function(d) {return d;}};
    } else {
      throw new Error('Unsupported encryption scheme: "' + scheme + '".');
    }

    // decode according to scheme
    return scheme.decode(d, key, false);
  };

  /**
   * Signs the given digest, producing a signature.
   *
   * PKCS#1 supports multiple (currently two) signature schemes:
   * RSASSA-PKCS1-V1_5 and RSASSA-PSS.
   *
   * By default this implementation uses the "old scheme", i.e.
   * RSASSA-PKCS1-V1_5. In order to generate a PSS signature, provide
   * an instance of Forge PSS object as the scheme parameter.
   *
   * @param md the message digest object with the hash to sign.
   * @param scheme the signature scheme to use:
   *          'RSASSA-PKCS1-V1_5' or undefined for RSASSA PKCS#1 v1.5,
   *          a Forge PSS object for RSASSA-PSS,
   *          'NONE' or null for none, DigestInfo will not be used but
   *            PKCS#1 v1.5 padding will still be used.
   *
   * @return the signature as a byte string.
   */
  key.sign = function(md, scheme) {
    /* Note: The internal implementation of RSA operations is being
      transitioned away from a PKCS#1 v1.5 hard-coded scheme. Some legacy
      code like the use of an encoding block identifier 'bt' will eventually
      be removed. */

    // private key operation
    var bt = false;

    if(typeof scheme === 'string') {
      scheme = scheme.toUpperCase();
    }

    if(scheme === undefined || scheme === 'RSASSA-PKCS1-V1_5') {
      scheme = {encode: emsaPkcs1v15encode};
      bt = 0x01;
    } else if(scheme === 'NONE' || scheme === 'NULL' || scheme === null) {
      scheme = {encode: function() {return md;}};
      bt = 0x01;
    }

    // encode and then encrypt
    var d = scheme.encode(md, key.n.bitLength());
    return pki$4.rsa.encrypt(d, key, bt);
  };

  return key;
};

/**
 * Wraps an RSAPrivateKey ASN.1 object in an ASN.1 PrivateKeyInfo object.
 *
 * @param rsaKey the ASN.1 RSAPrivateKey.
 *
 * @return the ASN.1 PrivateKeyInfo.
 */
pki$4.wrapRsaPrivateKey = function(rsaKey) {
  // PrivateKeyInfo
  return asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
    // version (0)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      asn1$7.integerToDer(0).getBytes()),
    // privateKeyAlgorithm
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
      asn1$7.create(
        asn1$7.Class.UNIVERSAL, asn1$7.Type.OID, false,
        asn1$7.oidToDer(pki$4.oids.rsaEncryption).getBytes()),
      asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.NULL, false, '')
    ]),
    // PrivateKey
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.OCTETSTRING, false,
      asn1$7.toDer(rsaKey).getBytes())
  ]);
};

/**
 * Converts a private key from an ASN.1 object.
 *
 * @param obj the ASN.1 representation of a PrivateKeyInfo containing an
 *          RSAPrivateKey or an RSAPrivateKey.
 *
 * @return the private key.
 */
pki$4.privateKeyFromAsn1 = function(obj) {
  // get PrivateKeyInfo
  var capture = {};
  var errors = [];
  if(asn1$7.validate(obj, privateKeyValidator$1, capture, errors)) {
    obj = asn1$7.fromDer(forge$k.util.createBuffer(capture.privateKey));
  }

  // get RSAPrivateKey
  capture = {};
  errors = [];
  if(!asn1$7.validate(obj, rsaPrivateKeyValidator, capture, errors)) {
    var error = new Error('Cannot read private key. ' +
      'ASN.1 object does not contain an RSAPrivateKey.');
    error.errors = errors;
    throw error;
  }

  // Note: Version is currently ignored.
  // capture.privateKeyVersion
  // FIXME: inefficient, get a BigInteger that uses byte strings
  var n, e, d, p, q, dP, dQ, qInv;
  n = forge$k.util.createBuffer(capture.privateKeyModulus).toHex();
  e = forge$k.util.createBuffer(capture.privateKeyPublicExponent).toHex();
  d = forge$k.util.createBuffer(capture.privateKeyPrivateExponent).toHex();
  p = forge$k.util.createBuffer(capture.privateKeyPrime1).toHex();
  q = forge$k.util.createBuffer(capture.privateKeyPrime2).toHex();
  dP = forge$k.util.createBuffer(capture.privateKeyExponent1).toHex();
  dQ = forge$k.util.createBuffer(capture.privateKeyExponent2).toHex();
  qInv = forge$k.util.createBuffer(capture.privateKeyCoefficient).toHex();

  // set private key
  return pki$4.setRsaPrivateKey(
    new BigInteger$1(n, 16),
    new BigInteger$1(e, 16),
    new BigInteger$1(d, 16),
    new BigInteger$1(p, 16),
    new BigInteger$1(q, 16),
    new BigInteger$1(dP, 16),
    new BigInteger$1(dQ, 16),
    new BigInteger$1(qInv, 16));
};

/**
 * Converts a private key to an ASN.1 RSAPrivateKey.
 *
 * @param key the private key.
 *
 * @return the ASN.1 representation of an RSAPrivateKey.
 */
pki$4.privateKeyToAsn1 = pki$4.privateKeyToRSAPrivateKey = function(key) {
  // RSAPrivateKey
  return asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
    // version (0 = only 2 primes, 1 multiple primes)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      asn1$7.integerToDer(0).getBytes()),
    // modulus (n)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.n)),
    // publicExponent (e)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.e)),
    // privateExponent (d)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.d)),
    // privateKeyPrime1 (p)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.p)),
    // privateKeyPrime2 (q)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.q)),
    // privateKeyExponent1 (dP)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.dP)),
    // privateKeyExponent2 (dQ)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.dQ)),
    // coefficient (qInv)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.qInv))
  ]);
};

/**
 * Converts a public key from an ASN.1 SubjectPublicKeyInfo or RSAPublicKey.
 *
 * @param obj the asn1 representation of a SubjectPublicKeyInfo or RSAPublicKey.
 *
 * @return the public key.
 */
pki$4.publicKeyFromAsn1 = function(obj) {
  // get SubjectPublicKeyInfo
  var capture = {};
  var errors = [];
  if(asn1$7.validate(obj, publicKeyValidator$2, capture, errors)) {
    // get oid
    var oid = asn1$7.derToOid(capture.publicKeyOid);
    if(oid !== pki$4.oids.rsaEncryption) {
      var error = new Error('Cannot read public key. Unknown OID.');
      error.oid = oid;
      throw error;
    }
    obj = capture.rsaPublicKey;
  }

  // get RSA params
  errors = [];
  if(!asn1$7.validate(obj, rsaPublicKeyValidator, capture, errors)) {
    var error = new Error('Cannot read public key. ' +
      'ASN.1 object does not contain an RSAPublicKey.');
    error.errors = errors;
    throw error;
  }

  // FIXME: inefficient, get a BigInteger that uses byte strings
  var n = forge$k.util.createBuffer(capture.publicKeyModulus).toHex();
  var e = forge$k.util.createBuffer(capture.publicKeyExponent).toHex();

  // set public key
  return pki$4.setRsaPublicKey(
    new BigInteger$1(n, 16),
    new BigInteger$1(e, 16));
};

/**
 * Converts a public key to an ASN.1 SubjectPublicKeyInfo.
 *
 * @param key the public key.
 *
 * @return the asn1 representation of a SubjectPublicKeyInfo.
 */
pki$4.publicKeyToAsn1 = pki$4.publicKeyToSubjectPublicKeyInfo = function(key) {
  // SubjectPublicKeyInfo
  return asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
    // AlgorithmIdentifier
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
      // algorithm
      asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.OID, false,
        asn1$7.oidToDer(pki$4.oids.rsaEncryption).getBytes()),
      // parameters (null)
      asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.NULL, false, '')
    ]),
    // subjectPublicKey
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.BITSTRING, false, [
      pki$4.publicKeyToRSAPublicKey(key)
    ])
  ]);
};

/**
 * Converts a public key to an ASN.1 RSAPublicKey.
 *
 * @param key the public key.
 *
 * @return the asn1 representation of a RSAPublicKey.
 */
pki$4.publicKeyToRSAPublicKey = function(key) {
  // RSAPublicKey
  return asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.SEQUENCE, true, [
    // modulus (n)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.n)),
    // publicExponent (e)
    asn1$7.create(asn1$7.Class.UNIVERSAL, asn1$7.Type.INTEGER, false,
      _bnToBytes(key.e))
  ]);
};

/**
 * Encodes a message using PKCS#1 v1.5 padding.
 *
 * @param m the message to encode.
 * @param key the RSA key to use.
 * @param bt the block type to use, i.e. either 0x01 (for signing) or 0x02
 *          (for encryption).
 *
 * @return the padded byte buffer.
 */
function _encodePkcs1_v1_5(m, key, bt) {
  var eb = forge$k.util.createBuffer();

  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  /* use PKCS#1 v1.5 padding */
  if(m.length > (k - 11)) {
    var error = new Error('Message is too long for PKCS#1 v1.5 padding.');
    error.length = m.length;
    error.max = k - 11;
    throw error;
  }

  /* A block type BT, a padding string PS, and the data D shall be
    formatted into an octet string EB, the encryption block:

    EB = 00 || BT || PS || 00 || D

    The block type BT shall be a single octet indicating the structure of
    the encryption block. For this version of the document it shall have
    value 00, 01, or 02. For a private-key operation, the block type
    shall be 00 or 01. For a public-key operation, it shall be 02.

    The padding string PS shall consist of k-3-||D|| octets. For block
    type 00, the octets shall have value 00; for block type 01, they
    shall have value FF; and for block type 02, they shall be
    pseudorandomly generated and nonzero. This makes the length of the
    encryption block EB equal to k. */

  // build the encryption block
  eb.putByte(0x00);
  eb.putByte(bt);

  // create the padding
  var padNum = k - 3 - m.length;
  var padByte;
  // private key op
  if(bt === 0x00 || bt === 0x01) {
    padByte = (bt === 0x00) ? 0x00 : 0xFF;
    for(var i = 0; i < padNum; ++i) {
      eb.putByte(padByte);
    }
  } else {
    // public key op
    // pad with random non-zero values
    while(padNum > 0) {
      var numZeros = 0;
      var padBytes = forge$k.random.getBytes(padNum);
      for(var i = 0; i < padNum; ++i) {
        padByte = padBytes.charCodeAt(i);
        if(padByte === 0) {
          ++numZeros;
        } else {
          eb.putByte(padByte);
        }
      }
      padNum = numZeros;
    }
  }

  // zero followed by message
  eb.putByte(0x00);
  eb.putBytes(m);

  return eb;
}

/**
 * Decodes a message using PKCS#1 v1.5 padding.
 *
 * @param em the message to decode.
 * @param key the RSA key to use.
 * @param pub true if the key is a public key, false if it is private.
 * @param ml the message length, if specified.
 *
 * @return the decoded bytes.
 */
function _decodePkcs1_v1_5(em, key, pub, ml) {
  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  /* It is an error if any of the following conditions occurs:

    1. The encryption block EB cannot be parsed unambiguously.
    2. The padding string PS consists of fewer than eight octets
      or is inconsisent with the block type BT.
    3. The decryption process is a public-key operation and the block
      type BT is not 00 or 01, or the decryption process is a
      private-key operation and the block type is not 02.
   */

  // parse the encryption block
  var eb = forge$k.util.createBuffer(em);
  var first = eb.getByte();
  var bt = eb.getByte();
  if(first !== 0x00 ||
    (pub && bt !== 0x00 && bt !== 0x01) ||
    (!pub && bt != 0x02) ||
    (pub && bt === 0x00 && typeof(ml) === 'undefined')) {
    throw new Error('Encryption block is invalid.');
  }

  var padNum = 0;
  if(bt === 0x00) {
    // check all padding bytes for 0x00
    padNum = k - 3 - ml;
    for(var i = 0; i < padNum; ++i) {
      if(eb.getByte() !== 0x00) {
        throw new Error('Encryption block is invalid.');
      }
    }
  } else if(bt === 0x01) {
    // find the first byte that isn't 0xFF, should be after all padding
    padNum = 0;
    while(eb.length() > 1) {
      if(eb.getByte() !== 0xFF) {
        --eb.read;
        break;
      }
      ++padNum;
    }
  } else if(bt === 0x02) {
    // look for 0x00 byte
    padNum = 0;
    while(eb.length() > 1) {
      if(eb.getByte() === 0x00) {
        --eb.read;
        break;
      }
      ++padNum;
    }
  }

  // zero must be 0x00 and padNum must be (k - 3 - message length)
  var zero = eb.getByte();
  if(zero !== 0x00 || padNum !== (k - 3 - eb.length())) {
    throw new Error('Encryption block is invalid.');
  }

  return eb.getBytes();
}

/**
 * Runs the key-generation algorithm asynchronously, either in the background
 * via Web Workers, or using the main thread and setImmediate.
 *
 * @param state the key-pair generation state.
 * @param [options] options for key-pair generation:
 *          workerScript the worker script URL.
 *          workers the number of web workers (if supported) to use,
 *            (default: 2, -1 to use estimated cores minus one).
 *          workLoad the size of the work load, ie: number of possible prime
 *            numbers for each web worker to check per work assignment,
 *            (default: 100).
 * @param callback(err, keypair) called once the operation completes.
 */
function _generateKeyPair(state, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  var opts = {
    algorithm: {
      name: options.algorithm || 'PRIMEINC',
      options: {
        workers: options.workers || 2,
        workLoad: options.workLoad || 100,
        workerScript: options.workerScript
      }
    }
  };
  if('prng' in options) {
    opts.prng = options.prng;
  }

  generate();

  function generate() {
    // find p and then q (done in series to simplify)
    getPrime(state.pBits, function(err, num) {
      if(err) {
        return callback(err);
      }
      state.p = num;
      if(state.q !== null) {
        return finish(err, state.q);
      }
      getPrime(state.qBits, finish);
    });
  }

  function getPrime(bits, callback) {
    forge$k.prime.generateProbablePrime(bits, opts, callback);
  }

  function finish(err, num) {
    if(err) {
      return callback(err);
    }

    // set q
    state.q = num;

    // ensure p is larger than q (swap them if not)
    if(state.p.compareTo(state.q) < 0) {
      var tmp = state.p;
      state.p = state.q;
      state.q = tmp;
    }

    // ensure p is coprime with e
    if(state.p.subtract(BigInteger$1.ONE).gcd(state.e)
      .compareTo(BigInteger$1.ONE) !== 0) {
      state.p = null;
      generate();
      return;
    }

    // ensure q is coprime with e
    if(state.q.subtract(BigInteger$1.ONE).gcd(state.e)
      .compareTo(BigInteger$1.ONE) !== 0) {
      state.q = null;
      getPrime(state.qBits, finish);
      return;
    }

    // compute phi: (p - 1)(q - 1) (Euler's totient function)
    state.p1 = state.p.subtract(BigInteger$1.ONE);
    state.q1 = state.q.subtract(BigInteger$1.ONE);
    state.phi = state.p1.multiply(state.q1);

    // ensure e and phi are coprime
    if(state.phi.gcd(state.e).compareTo(BigInteger$1.ONE) !== 0) {
      // phi and e aren't coprime, so generate a new p and q
      state.p = state.q = null;
      generate();
      return;
    }

    // create n, ensure n is has the right number of bits
    state.n = state.p.multiply(state.q);
    if(state.n.bitLength() !== state.bits) {
      // failed, get new q
      state.q = null;
      getPrime(state.qBits, finish);
      return;
    }

    // set keys
    var d = state.e.modInverse(state.phi);
    state.keys = {
      privateKey: pki$4.rsa.setPrivateKey(
        state.n, state.e, d, state.p, state.q,
        d.mod(state.p1), d.mod(state.q1),
        state.q.modInverse(state.p)),
      publicKey: pki$4.rsa.setPublicKey(state.n, state.e)
    };

    callback(null, state.keys);
  }
}

/**
 * Converts a positive BigInteger into 2's-complement big-endian bytes.
 *
 * @param b the big integer to convert.
 *
 * @return the bytes.
 */
function _bnToBytes(b) {
  // prepend 0x00 if first byte >= 0x80
  var hex = b.toString(16);
  if(hex[0] >= '8') {
    hex = '00' + hex;
  }
  var bytes = forge$k.util.hexToBytes(hex);

  // ensure integer is minimally-encoded
  if(bytes.length > 1 &&
    // leading 0x00 for positive integer
    ((bytes.charCodeAt(0) === 0 &&
    (bytes.charCodeAt(1) & 0x80) === 0) ||
    // leading 0xFF for negative integer
    (bytes.charCodeAt(0) === 0xFF &&
    (bytes.charCodeAt(1) & 0x80) === 0x80))) {
    return bytes.substr(1);
  }
  return bytes;
}

/**
 * Returns the required number of Miller-Rabin tests to generate a
 * prime with an error probability of (1/2)^80.
 *
 * See Handbook of Applied Cryptography Chapter 4, Table 4.4.
 *
 * @param bits the bit size.
 *
 * @return the required number of iterations.
 */
function _getMillerRabinTests(bits) {
  if(bits <= 100) return 27;
  if(bits <= 150) return 18;
  if(bits <= 200) return 15;
  if(bits <= 250) return 12;
  if(bits <= 300) return 9;
  if(bits <= 350) return 8;
  if(bits <= 400) return 7;
  if(bits <= 500) return 6;
  if(bits <= 600) return 5;
  if(bits <= 800) return 4;
  if(bits <= 1250) return 3;
  return 2;
}

/**
 * Performs feature detection on the Node crypto interface.
 *
 * @param fn the feature (function) to detect.
 *
 * @return true if detected, false if not.
 */
function _detectNodeCrypto(fn) {
  return forge$k.util.isNodejs && typeof _crypto[fn] === 'function';
}

/**
 * Performs feature detection on the SubtleCrypto interface.
 *
 * @param fn the feature (function) to detect.
 *
 * @return true if detected, false if not.
 */
function _detectSubtleCrypto(fn) {
  return (typeof util.globalScope !== 'undefined' &&
    typeof util.globalScope.crypto === 'object' &&
    typeof util.globalScope.crypto.subtle === 'object' &&
    typeof util.globalScope.crypto.subtle[fn] === 'function');
}

/**
 * Performs feature detection on the deprecated Microsoft Internet Explorer
 * outdated SubtleCrypto interface. This function should only be used after
 * checking for the modern, standard SubtleCrypto interface.
 *
 * @param fn the feature (function) to detect.
 *
 * @return true if detected, false if not.
 */
function _detectSubtleMsCrypto(fn) {
  return (typeof util.globalScope !== 'undefined' &&
    typeof util.globalScope.msCrypto === 'object' &&
    typeof util.globalScope.msCrypto.subtle === 'object' &&
    typeof util.globalScope.msCrypto.subtle[fn] === 'function');
}

function _intToUint8Array(x) {
  var bytes = forge$k.util.hexToBytes(x.toString(16));
  var buffer = new Uint8Array(bytes.length);
  for(var i = 0; i < bytes.length; ++i) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return buffer;
}

/**
 * Password-based encryption functions.
 *
 * @author Dave Longley
 * @author Stefan Siegl <stesie@brokenpipe.de>
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 *
 * An EncryptedPrivateKeyInfo:
 *
 * EncryptedPrivateKeyInfo ::= SEQUENCE {
 *   encryptionAlgorithm  EncryptionAlgorithmIdentifier,
 *   encryptedData        EncryptedData }
 *
 * EncryptionAlgorithmIdentifier ::= AlgorithmIdentifier
 *
 * EncryptedData ::= OCTET STRING
 */

var forge$j = forge$F;

// shortcut for asn.1 API
var asn1$6 = forge$j.asn1;

/* Password-based encryption implementation. */
var pki$3 = forge$j.pki = forge$j.pki || {};
pki$3.pbe = forge$j.pbe = forge$j.pbe || {};
var oids$1 = pki$3.oids;

// validator for an EncryptedPrivateKeyInfo structure
// Note: Currently only works w/algorithm params
var encryptedPrivateKeyValidator = {
  name: 'EncryptedPrivateKeyInfo',
  tagClass: asn1$6.Class.UNIVERSAL,
  type: asn1$6.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'EncryptedPrivateKeyInfo.encryptionAlgorithm',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'AlgorithmIdentifier.algorithm',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.OID,
      constructed: false,
      capture: 'encryptionOid'
    }, {
      name: 'AlgorithmIdentifier.parameters',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.SEQUENCE,
      constructed: true,
      captureAsn1: 'encryptionParams'
    }]
  }, {
    // encryptedData
    name: 'EncryptedPrivateKeyInfo.encryptedData',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.OCTETSTRING,
    constructed: false,
    capture: 'encryptedData'
  }]
};

// validator for a PBES2Algorithms structure
// Note: Currently only works w/PBKDF2 + AES encryption schemes
var PBES2AlgorithmsValidator = {
  name: 'PBES2Algorithms',
  tagClass: asn1$6.Class.UNIVERSAL,
  type: asn1$6.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'PBES2Algorithms.keyDerivationFunc',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'PBES2Algorithms.keyDerivationFunc.oid',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.OID,
      constructed: false,
      capture: 'kdfOid'
    }, {
      name: 'PBES2Algorithms.params',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: 'PBES2Algorithms.params.salt',
        tagClass: asn1$6.Class.UNIVERSAL,
        type: asn1$6.Type.OCTETSTRING,
        constructed: false,
        capture: 'kdfSalt'
      }, {
        name: 'PBES2Algorithms.params.iterationCount',
        tagClass: asn1$6.Class.UNIVERSAL,
        type: asn1$6.Type.INTEGER,
        constructed: false,
        capture: 'kdfIterationCount'
      }, {
        name: 'PBES2Algorithms.params.keyLength',
        tagClass: asn1$6.Class.UNIVERSAL,
        type: asn1$6.Type.INTEGER,
        constructed: false,
        optional: true,
        capture: 'keyLength'
      }, {
        // prf
        name: 'PBES2Algorithms.params.prf',
        tagClass: asn1$6.Class.UNIVERSAL,
        type: asn1$6.Type.SEQUENCE,
        constructed: true,
        optional: true,
        value: [{
          name: 'PBES2Algorithms.params.prf.algorithm',
          tagClass: asn1$6.Class.UNIVERSAL,
          type: asn1$6.Type.OID,
          constructed: false,
          capture: 'prfOid'
        }]
      }]
    }]
  }, {
    name: 'PBES2Algorithms.encryptionScheme',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'PBES2Algorithms.encryptionScheme.oid',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.OID,
      constructed: false,
      capture: 'encOid'
    }, {
      name: 'PBES2Algorithms.encryptionScheme.iv',
      tagClass: asn1$6.Class.UNIVERSAL,
      type: asn1$6.Type.OCTETSTRING,
      constructed: false,
      capture: 'encIv'
    }]
  }]
};

var pkcs12PbeParamsValidator = {
  name: 'pkcs-12PbeParams',
  tagClass: asn1$6.Class.UNIVERSAL,
  type: asn1$6.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'pkcs-12PbeParams.salt',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.OCTETSTRING,
    constructed: false,
    capture: 'salt'
  }, {
    name: 'pkcs-12PbeParams.iterations',
    tagClass: asn1$6.Class.UNIVERSAL,
    type: asn1$6.Type.INTEGER,
    constructed: false,
    capture: 'iterations'
  }]
};

/**
 * Encrypts a ASN.1 PrivateKeyInfo object, producing an EncryptedPrivateKeyInfo.
 *
 * PBES2Algorithms ALGORITHM-IDENTIFIER ::=
 *   { {PBES2-params IDENTIFIED BY id-PBES2}, ...}
 *
 * id-PBES2 OBJECT IDENTIFIER ::= {pkcs-5 13}
 *
 * PBES2-params ::= SEQUENCE {
 *   keyDerivationFunc AlgorithmIdentifier {{PBES2-KDFs}},
 *   encryptionScheme AlgorithmIdentifier {{PBES2-Encs}}
 * }
 *
 * PBES2-KDFs ALGORITHM-IDENTIFIER ::=
 *   { {PBKDF2-params IDENTIFIED BY id-PBKDF2}, ... }
 *
 * PBES2-Encs ALGORITHM-IDENTIFIER ::= { ... }
 *
 * PBKDF2-params ::= SEQUENCE {
 *   salt CHOICE {
 *     specified OCTET STRING,
 *     otherSource AlgorithmIdentifier {{PBKDF2-SaltSources}}
 *   },
 *   iterationCount INTEGER (1..MAX),
 *   keyLength INTEGER (1..MAX) OPTIONAL,
 *   prf AlgorithmIdentifier {{PBKDF2-PRFs}} DEFAULT algid-hmacWithSHA1
 * }
 *
 * @param obj the ASN.1 PrivateKeyInfo object.
 * @param password the password to encrypt with.
 * @param options:
 *          algorithm the encryption algorithm to use
 *            ('aes128', 'aes192', 'aes256', '3des'), defaults to 'aes128'.
 *          count the iteration count to use.
 *          saltSize the salt size to use.
 *          prfAlgorithm the PRF message digest algorithm to use
 *            ('sha1', 'sha224', 'sha256', 'sha384', 'sha512')
 *
 * @return the ASN.1 EncryptedPrivateKeyInfo.
 */
pki$3.encryptPrivateKeyInfo = function(obj, password, options) {
  // set default options
  options = options || {};
  options.saltSize = options.saltSize || 8;
  options.count = options.count || 2048;
  options.algorithm = options.algorithm || 'aes128';
  options.prfAlgorithm = options.prfAlgorithm || 'sha1';

  // generate PBE params
  var salt = forge$j.random.getBytesSync(options.saltSize);
  var count = options.count;
  var countBytes = asn1$6.integerToDer(count);
  var dkLen;
  var encryptionAlgorithm;
  var encryptedData;
  if(options.algorithm.indexOf('aes') === 0 || options.algorithm === 'des') {
    // do PBES2
    var ivLen, encOid, cipherFn;
    switch(options.algorithm) {
    case 'aes128':
      dkLen = 16;
      ivLen = 16;
      encOid = oids$1['aes128-CBC'];
      cipherFn = forge$j.aes.createEncryptionCipher;
      break;
    case 'aes192':
      dkLen = 24;
      ivLen = 16;
      encOid = oids$1['aes192-CBC'];
      cipherFn = forge$j.aes.createEncryptionCipher;
      break;
    case 'aes256':
      dkLen = 32;
      ivLen = 16;
      encOid = oids$1['aes256-CBC'];
      cipherFn = forge$j.aes.createEncryptionCipher;
      break;
    case 'des':
      dkLen = 8;
      ivLen = 8;
      encOid = oids$1['desCBC'];
      cipherFn = forge$j.des.createEncryptionCipher;
      break;
    default:
      var error = new Error('Cannot encrypt private key. Unknown encryption algorithm.');
      error.algorithm = options.algorithm;
      throw error;
    }

    // get PRF message digest
    var prfAlgorithm = 'hmacWith' + options.prfAlgorithm.toUpperCase();
    var md = prfAlgorithmToMessageDigest(prfAlgorithm);

    // encrypt private key using pbe SHA-1 and AES/DES
    var dk = forge$j.pkcs5.pbkdf2(password, salt, count, dkLen, md);
    var iv = forge$j.random.getBytesSync(ivLen);
    var cipher = cipherFn(dk);
    cipher.start(iv);
    cipher.update(asn1$6.toDer(obj));
    cipher.finish();
    encryptedData = cipher.output.getBytes();

    // get PBKDF2-params
    var params = createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm);

    encryptionAlgorithm = asn1$6.create(
      asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OID, false,
        asn1$6.oidToDer(oids$1['pkcs5PBES2']).getBytes()),
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
        // keyDerivationFunc
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
          asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OID, false,
            asn1$6.oidToDer(oids$1['pkcs5PBKDF2']).getBytes()),
          // PBKDF2-params
          params
        ]),
        // encryptionScheme
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
          asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OID, false,
            asn1$6.oidToDer(encOid).getBytes()),
          // iv
          asn1$6.create(
            asn1$6.Class.UNIVERSAL, asn1$6.Type.OCTETSTRING, false, iv)
        ])
      ])
    ]);
  } else if(options.algorithm === '3des') {
    // Do PKCS12 PBE
    dkLen = 24;

    var saltBytes = new forge$j.util.ByteBuffer(salt);
    var dk = pki$3.pbe.generatePkcs12Key(password, saltBytes, 1, count, dkLen);
    var iv = pki$3.pbe.generatePkcs12Key(password, saltBytes, 2, count, dkLen);
    var cipher = forge$j.des.createEncryptionCipher(dk);
    cipher.start(iv);
    cipher.update(asn1$6.toDer(obj));
    cipher.finish();
    encryptedData = cipher.output.getBytes();

    encryptionAlgorithm = asn1$6.create(
      asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OID, false,
        asn1$6.oidToDer(oids$1['pbeWithSHAAnd3-KeyTripleDES-CBC']).getBytes()),
      // pkcs-12PbeParams
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
        // salt
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OCTETSTRING, false, salt),
        // iteration count
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.INTEGER, false,
          countBytes.getBytes())
      ])
    ]);
  } else {
    var error = new Error('Cannot encrypt private key. Unknown encryption algorithm.');
    error.algorithm = options.algorithm;
    throw error;
  }

  // EncryptedPrivateKeyInfo
  var rval = asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
    // encryptionAlgorithm
    encryptionAlgorithm,
    // encryptedData
    asn1$6.create(
      asn1$6.Class.UNIVERSAL, asn1$6.Type.OCTETSTRING, false, encryptedData)
  ]);
  return rval;
};

/**
 * Decrypts a ASN.1 PrivateKeyInfo object.
 *
 * @param obj the ASN.1 EncryptedPrivateKeyInfo object.
 * @param password the password to decrypt with.
 *
 * @return the ASN.1 PrivateKeyInfo on success, null on failure.
 */
pki$3.decryptPrivateKeyInfo = function(obj, password) {
  var rval = null;

  // get PBE params
  var capture = {};
  var errors = [];
  if(!asn1$6.validate(obj, encryptedPrivateKeyValidator, capture, errors)) {
    var error = new Error('Cannot read encrypted private key. ' +
      'ASN.1 object is not a supported EncryptedPrivateKeyInfo.');
    error.errors = errors;
    throw error;
  }

  // get cipher
  var oid = asn1$6.derToOid(capture.encryptionOid);
  var cipher = pki$3.pbe.getCipher(oid, capture.encryptionParams, password);

  // get encrypted data
  var encrypted = forge$j.util.createBuffer(capture.encryptedData);

  cipher.update(encrypted);
  if(cipher.finish()) {
    rval = asn1$6.fromDer(cipher.output);
  }

  return rval;
};

/**
 * Converts a EncryptedPrivateKeyInfo to PEM format.
 *
 * @param epki the EncryptedPrivateKeyInfo.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted encrypted private key.
 */
pki$3.encryptedPrivateKeyToPem = function(epki, maxline) {
  // convert to DER, then PEM-encode
  var msg = {
    type: 'ENCRYPTED PRIVATE KEY',
    body: asn1$6.toDer(epki).getBytes()
  };
  return forge$j.pem.encode(msg, {maxline: maxline});
};

/**
 * Converts a PEM-encoded EncryptedPrivateKeyInfo to ASN.1 format. Decryption
 * is not performed.
 *
 * @param pem the EncryptedPrivateKeyInfo in PEM-format.
 *
 * @return the ASN.1 EncryptedPrivateKeyInfo.
 */
pki$3.encryptedPrivateKeyFromPem = function(pem) {
  var msg = forge$j.pem.decode(pem)[0];

  if(msg.type !== 'ENCRYPTED PRIVATE KEY') {
    var error = new Error('Could not convert encrypted private key from PEM; ' +
      'PEM header type is "ENCRYPTED PRIVATE KEY".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert encrypted private key from PEM; ' +
      'PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  return asn1$6.fromDer(msg.body);
};

/**
 * Encrypts an RSA private key. By default, the key will be wrapped in
 * a PrivateKeyInfo and encrypted to produce a PKCS#8 EncryptedPrivateKeyInfo.
 * This is the standard, preferred way to encrypt a private key.
 *
 * To produce a non-standard PEM-encrypted private key that uses encapsulated
 * headers to indicate the encryption algorithm (old-style non-PKCS#8 OpenSSL
 * private key encryption), set the 'legacy' option to true. Note: Using this
 * option will cause the iteration count to be forced to 1.
 *
 * Note: The 'des' algorithm is supported, but it is not considered to be
 * secure because it only uses a single 56-bit key. If possible, it is highly
 * recommended that a different algorithm be used.
 *
 * @param rsaKey the RSA key to encrypt.
 * @param password the password to use.
 * @param options:
 *          algorithm: the encryption algorithm to use
 *            ('aes128', 'aes192', 'aes256', '3des', 'des').
 *          count: the iteration count to use.
 *          saltSize: the salt size to use.
 *          legacy: output an old non-PKCS#8 PEM-encrypted+encapsulated
 *            headers (DEK-Info) private key.
 *
 * @return the PEM-encoded ASN.1 EncryptedPrivateKeyInfo.
 */
pki$3.encryptRsaPrivateKey = function(rsaKey, password, options) {
  // standard PKCS#8
  options = options || {};
  if(!options.legacy) {
    // encrypt PrivateKeyInfo
    var rval = pki$3.wrapRsaPrivateKey(pki$3.privateKeyToAsn1(rsaKey));
    rval = pki$3.encryptPrivateKeyInfo(rval, password, options);
    return pki$3.encryptedPrivateKeyToPem(rval);
  }

  // legacy non-PKCS#8
  var algorithm;
  var iv;
  var dkLen;
  var cipherFn;
  switch(options.algorithm) {
  case 'aes128':
    algorithm = 'AES-128-CBC';
    dkLen = 16;
    iv = forge$j.random.getBytesSync(16);
    cipherFn = forge$j.aes.createEncryptionCipher;
    break;
  case 'aes192':
    algorithm = 'AES-192-CBC';
    dkLen = 24;
    iv = forge$j.random.getBytesSync(16);
    cipherFn = forge$j.aes.createEncryptionCipher;
    break;
  case 'aes256':
    algorithm = 'AES-256-CBC';
    dkLen = 32;
    iv = forge$j.random.getBytesSync(16);
    cipherFn = forge$j.aes.createEncryptionCipher;
    break;
  case '3des':
    algorithm = 'DES-EDE3-CBC';
    dkLen = 24;
    iv = forge$j.random.getBytesSync(8);
    cipherFn = forge$j.des.createEncryptionCipher;
    break;
  case 'des':
    algorithm = 'DES-CBC';
    dkLen = 8;
    iv = forge$j.random.getBytesSync(8);
    cipherFn = forge$j.des.createEncryptionCipher;
    break;
  default:
    var error = new Error('Could not encrypt RSA private key; unsupported ' +
      'encryption algorithm "' + options.algorithm + '".');
    error.algorithm = options.algorithm;
    throw error;
  }

  // encrypt private key using OpenSSL legacy key derivation
  var dk = forge$j.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
  var cipher = cipherFn(dk);
  cipher.start(iv);
  cipher.update(asn1$6.toDer(pki$3.privateKeyToAsn1(rsaKey)));
  cipher.finish();

  var msg = {
    type: 'RSA PRIVATE KEY',
    procType: {
      version: '4',
      type: 'ENCRYPTED'
    },
    dekInfo: {
      algorithm: algorithm,
      parameters: forge$j.util.bytesToHex(iv).toUpperCase()
    },
    body: cipher.output.getBytes()
  };
  return forge$j.pem.encode(msg);
};

/**
 * Decrypts an RSA private key.
 *
 * @param pem the PEM-formatted EncryptedPrivateKeyInfo to decrypt.
 * @param password the password to use.
 *
 * @return the RSA key on success, null on failure.
 */
pki$3.decryptRsaPrivateKey = function(pem, password) {
  var rval = null;

  var msg = forge$j.pem.decode(pem)[0];

  if(msg.type !== 'ENCRYPTED PRIVATE KEY' &&
    msg.type !== 'PRIVATE KEY' &&
    msg.type !== 'RSA PRIVATE KEY') {
    var error = new Error('Could not convert private key from PEM; PEM header type ' +
      'is not "ENCRYPTED PRIVATE KEY", "PRIVATE KEY", or "RSA PRIVATE KEY".');
    error.headerType = error;
    throw error;
  }

  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    var dkLen;
    var cipherFn;
    switch(msg.dekInfo.algorithm) {
    case 'DES-CBC':
      dkLen = 8;
      cipherFn = forge$j.des.createDecryptionCipher;
      break;
    case 'DES-EDE3-CBC':
      dkLen = 24;
      cipherFn = forge$j.des.createDecryptionCipher;
      break;
    case 'AES-128-CBC':
      dkLen = 16;
      cipherFn = forge$j.aes.createDecryptionCipher;
      break;
    case 'AES-192-CBC':
      dkLen = 24;
      cipherFn = forge$j.aes.createDecryptionCipher;
      break;
    case 'AES-256-CBC':
      dkLen = 32;
      cipherFn = forge$j.aes.createDecryptionCipher;
      break;
    case 'RC2-40-CBC':
      dkLen = 5;
      cipherFn = function(key) {
        return forge$j.rc2.createDecryptionCipher(key, 40);
      };
      break;
    case 'RC2-64-CBC':
      dkLen = 8;
      cipherFn = function(key) {
        return forge$j.rc2.createDecryptionCipher(key, 64);
      };
      break;
    case 'RC2-128-CBC':
      dkLen = 16;
      cipherFn = function(key) {
        return forge$j.rc2.createDecryptionCipher(key, 128);
      };
      break;
    default:
      var error = new Error('Could not decrypt private key; unsupported ' +
        'encryption algorithm "' + msg.dekInfo.algorithm + '".');
      error.algorithm = msg.dekInfo.algorithm;
      throw error;
    }

    // use OpenSSL legacy key derivation
    var iv = forge$j.util.hexToBytes(msg.dekInfo.parameters);
    var dk = forge$j.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
    var cipher = cipherFn(dk);
    cipher.start(iv);
    cipher.update(forge$j.util.createBuffer(msg.body));
    if(cipher.finish()) {
      rval = cipher.output.getBytes();
    } else {
      return rval;
    }
  } else {
    rval = msg.body;
  }

  if(msg.type === 'ENCRYPTED PRIVATE KEY') {
    rval = pki$3.decryptPrivateKeyInfo(asn1$6.fromDer(rval), password);
  } else {
    // decryption already performed above
    rval = asn1$6.fromDer(rval);
  }

  if(rval !== null) {
    rval = pki$3.privateKeyFromAsn1(rval);
  }

  return rval;
};

/**
 * Derives a PKCS#12 key.
 *
 * @param password the password to derive the key material from, null or
 *          undefined for none.
 * @param salt the salt, as a ByteBuffer, to use.
 * @param id the PKCS#12 ID byte (1 = key material, 2 = IV, 3 = MAC).
 * @param iter the iteration count.
 * @param n the number of bytes to derive from the password.
 * @param md the message digest to use, defaults to SHA-1.
 *
 * @return a ByteBuffer with the bytes derived from the password.
 */
pki$3.pbe.generatePkcs12Key = function(password, salt, id, iter, n, md) {
  var j, l;

  if(typeof md === 'undefined' || md === null) {
    if(!('sha1' in forge$j.md)) {
      throw new Error('"sha1" hash algorithm unavailable.');
    }
    md = forge$j.md.sha1.create();
  }

  var u = md.digestLength;
  var v = md.blockLength;
  var result = new forge$j.util.ByteBuffer();

  /* Convert password to Unicode byte buffer + trailing 0-byte. */
  var passBuf = new forge$j.util.ByteBuffer();
  if(password !== null && password !== undefined) {
    for(l = 0; l < password.length; l++) {
      passBuf.putInt16(password.charCodeAt(l));
    }
    passBuf.putInt16(0);
  }

  /* Length of salt and password in BYTES. */
  var p = passBuf.length();
  var s = salt.length();

  /* 1. Construct a string, D (the "diversifier"), by concatenating
        v copies of ID. */
  var D = new forge$j.util.ByteBuffer();
  D.fillWithByte(id, v);

  /* 2. Concatenate copies of the salt together to create a string S of length
        v * ceil(s / v) bytes (the final copy of the salt may be trunacted
        to create S).
        Note that if the salt is the empty string, then so is S. */
  var Slen = v * Math.ceil(s / v);
  var S = new forge$j.util.ByteBuffer();
  for(l = 0; l < Slen; l++) {
    S.putByte(salt.at(l % s));
  }

  /* 3. Concatenate copies of the password together to create a string P of
        length v * ceil(p / v) bytes (the final copy of the password may be
        truncated to create P).
        Note that if the password is the empty string, then so is P. */
  var Plen = v * Math.ceil(p / v);
  var P = new forge$j.util.ByteBuffer();
  for(l = 0; l < Plen; l++) {
    P.putByte(passBuf.at(l % p));
  }

  /* 4. Set I=S||P to be the concatenation of S and P. */
  var I = S;
  I.putBuffer(P);

  /* 5. Set c=ceil(n / u). */
  var c = Math.ceil(n / u);

  /* 6. For i=1, 2, ..., c, do the following: */
  for(var i = 1; i <= c; i++) {
    /* a) Set Ai=H^r(D||I). (l.e. the rth hash of D||I, H(H(H(...H(D||I)))) */
    var buf = new forge$j.util.ByteBuffer();
    buf.putBytes(D.bytes());
    buf.putBytes(I.bytes());
    for(var round = 0; round < iter; round++) {
      md.start();
      md.update(buf.getBytes());
      buf = md.digest();
    }

    /* b) Concatenate copies of Ai to create a string B of length v bytes (the
          final copy of Ai may be truncated to create B). */
    var B = new forge$j.util.ByteBuffer();
    for(l = 0; l < v; l++) {
      B.putByte(buf.at(l % u));
    }

    /* c) Treating I as a concatenation I0, I1, ..., Ik-1 of v-byte blocks,
          where k=ceil(s / v) + ceil(p / v), modify I by setting
          Ij=(Ij+B+1) mod 2v for each j.  */
    var k = Math.ceil(s / v) + Math.ceil(p / v);
    var Inew = new forge$j.util.ByteBuffer();
    for(j = 0; j < k; j++) {
      var chunk = new forge$j.util.ByteBuffer(I.getBytes(v));
      var x = 0x1ff;
      for(l = B.length() - 1; l >= 0; l--) {
        x = x >> 8;
        x += B.at(l) + chunk.at(l);
        chunk.setAt(l, x & 0xff);
      }
      Inew.putBuffer(chunk);
    }
    I = Inew;

    /* Add Ai to A. */
    result.putBuffer(buf);
  }

  result.truncate(result.length() - n);
  return result;
};

/**
 * Get new Forge cipher object instance.
 *
 * @param oid the OID (in string notation).
 * @param params the ASN.1 params object.
 * @param password the password to decrypt with.
 *
 * @return new cipher object instance.
 */
pki$3.pbe.getCipher = function(oid, params, password) {
  switch(oid) {
  case pki$3.oids['pkcs5PBES2']:
    return pki$3.pbe.getCipherForPBES2(oid, params, password);

  case pki$3.oids['pbeWithSHAAnd3-KeyTripleDES-CBC']:
  case pki$3.oids['pbewithSHAAnd40BitRC2-CBC']:
    return pki$3.pbe.getCipherForPKCS12PBE(oid, params, password);

  default:
    var error = new Error('Cannot read encrypted PBE data block. Unsupported OID.');
    error.oid = oid;
    error.supportedOids = [
      'pkcs5PBES2',
      'pbeWithSHAAnd3-KeyTripleDES-CBC',
      'pbewithSHAAnd40BitRC2-CBC'
    ];
    throw error;
  }
};

/**
 * Get new Forge cipher object instance according to PBES2 params block.
 *
 * The returned cipher instance is already started using the IV
 * from PBES2 parameter block.
 *
 * @param oid the PKCS#5 PBKDF2 OID (in string notation).
 * @param params the ASN.1 PBES2-params object.
 * @param password the password to decrypt with.
 *
 * @return new cipher object instance.
 */
pki$3.pbe.getCipherForPBES2 = function(oid, params, password) {
  // get PBE params
  var capture = {};
  var errors = [];
  if(!asn1$6.validate(params, PBES2AlgorithmsValidator, capture, errors)) {
    var error = new Error('Cannot read password-based-encryption algorithm ' +
      'parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.');
    error.errors = errors;
    throw error;
  }

  // check oids
  oid = asn1$6.derToOid(capture.kdfOid);
  if(oid !== pki$3.oids['pkcs5PBKDF2']) {
    var error = new Error('Cannot read encrypted private key. ' +
      'Unsupported key derivation function OID.');
    error.oid = oid;
    error.supportedOids = ['pkcs5PBKDF2'];
    throw error;
  }
  oid = asn1$6.derToOid(capture.encOid);
  if(oid !== pki$3.oids['aes128-CBC'] &&
    oid !== pki$3.oids['aes192-CBC'] &&
    oid !== pki$3.oids['aes256-CBC'] &&
    oid !== pki$3.oids['des-EDE3-CBC'] &&
    oid !== pki$3.oids['desCBC']) {
    var error = new Error('Cannot read encrypted private key. ' +
      'Unsupported encryption scheme OID.');
    error.oid = oid;
    error.supportedOids = [
      'aes128-CBC', 'aes192-CBC', 'aes256-CBC', 'des-EDE3-CBC', 'desCBC'];
    throw error;
  }

  // set PBE params
  var salt = capture.kdfSalt;
  var count = forge$j.util.createBuffer(capture.kdfIterationCount);
  count = count.getInt(count.length() << 3);
  var dkLen;
  var cipherFn;
  switch(pki$3.oids[oid]) {
  case 'aes128-CBC':
    dkLen = 16;
    cipherFn = forge$j.aes.createDecryptionCipher;
    break;
  case 'aes192-CBC':
    dkLen = 24;
    cipherFn = forge$j.aes.createDecryptionCipher;
    break;
  case 'aes256-CBC':
    dkLen = 32;
    cipherFn = forge$j.aes.createDecryptionCipher;
    break;
  case 'des-EDE3-CBC':
    dkLen = 24;
    cipherFn = forge$j.des.createDecryptionCipher;
    break;
  case 'desCBC':
    dkLen = 8;
    cipherFn = forge$j.des.createDecryptionCipher;
    break;
  }

  // get PRF message digest
  var md = prfOidToMessageDigest(capture.prfOid);

  // decrypt private key using pbe with chosen PRF and AES/DES
  var dk = forge$j.pkcs5.pbkdf2(password, salt, count, dkLen, md);
  var iv = capture.encIv;
  var cipher = cipherFn(dk);
  cipher.start(iv);

  return cipher;
};

/**
 * Get new Forge cipher object instance for PKCS#12 PBE.
 *
 * The returned cipher instance is already started using the key & IV
 * derived from the provided password and PKCS#12 PBE salt.
 *
 * @param oid The PKCS#12 PBE OID (in string notation).
 * @param params The ASN.1 PKCS#12 PBE-params object.
 * @param password The password to decrypt with.
 *
 * @return the new cipher object instance.
 */
pki$3.pbe.getCipherForPKCS12PBE = function(oid, params, password) {
  // get PBE params
  var capture = {};
  var errors = [];
  if(!asn1$6.validate(params, pkcs12PbeParamsValidator, capture, errors)) {
    var error = new Error('Cannot read password-based-encryption algorithm ' +
      'parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.');
    error.errors = errors;
    throw error;
  }

  var salt = forge$j.util.createBuffer(capture.salt);
  var count = forge$j.util.createBuffer(capture.iterations);
  count = count.getInt(count.length() << 3);

  var dkLen, dIvLen, cipherFn;
  switch(oid) {
    case pki$3.oids['pbeWithSHAAnd3-KeyTripleDES-CBC']:
      dkLen = 24;
      dIvLen = 8;
      cipherFn = forge$j.des.startDecrypting;
      break;

    case pki$3.oids['pbewithSHAAnd40BitRC2-CBC']:
      dkLen = 5;
      dIvLen = 8;
      cipherFn = function(key, iv) {
        var cipher = forge$j.rc2.createDecryptionCipher(key, 40);
        cipher.start(iv, null);
        return cipher;
      };
      break;

    default:
      var error = new Error('Cannot read PKCS #12 PBE data block. Unsupported OID.');
      error.oid = oid;
      throw error;
  }

  // get PRF message digest
  var md = prfOidToMessageDigest(capture.prfOid);
  var key = pki$3.pbe.generatePkcs12Key(password, salt, 1, count, dkLen, md);
  md.start();
  var iv = pki$3.pbe.generatePkcs12Key(password, salt, 2, count, dIvLen, md);

  return cipherFn(key, iv);
};

/**
 * OpenSSL's legacy key derivation function.
 *
 * See: http://www.openssl.org/docs/crypto/EVP_BytesToKey.html
 *
 * @param password the password to derive the key from.
 * @param salt the salt to use, null for none.
 * @param dkLen the number of bytes needed for the derived key.
 * @param [options] the options to use:
 *          [md] an optional message digest object to use.
 */
pki$3.pbe.opensslDeriveBytes = function(password, salt, dkLen, md) {
  if(typeof md === 'undefined' || md === null) {
    if(!('md5' in forge$j.md)) {
      throw new Error('"md5" hash algorithm unavailable.');
    }
    md = forge$j.md.md5.create();
  }
  if(salt === null) {
    salt = '';
  }
  var digests = [hash(md, password + salt)];
  for(var length = 16, i = 1; length < dkLen; ++i, length += 16) {
    digests.push(hash(md, digests[i - 1] + password + salt));
  }
  return digests.join('').substr(0, dkLen);
};

function hash(md, bytes) {
  return md.start().update(bytes).digest().getBytes();
}

function prfOidToMessageDigest(prfOid) {
  // get PRF algorithm, default to SHA-1
  var prfAlgorithm;
  if(!prfOid) {
    prfAlgorithm = 'hmacWithSHA1';
  } else {
    prfAlgorithm = pki$3.oids[asn1$6.derToOid(prfOid)];
    if(!prfAlgorithm) {
      var error = new Error('Unsupported PRF OID.');
      error.oid = prfOid;
      error.supported = [
        'hmacWithSHA1', 'hmacWithSHA224', 'hmacWithSHA256', 'hmacWithSHA384',
        'hmacWithSHA512'];
      throw error;
    }
  }
  return prfAlgorithmToMessageDigest(prfAlgorithm);
}

function prfAlgorithmToMessageDigest(prfAlgorithm) {
  var factory = forge$j.md;
  switch(prfAlgorithm) {
  case 'hmacWithSHA224':
    factory = forge$j.md.sha512;
  case 'hmacWithSHA1':
  case 'hmacWithSHA256':
  case 'hmacWithSHA384':
  case 'hmacWithSHA512':
    prfAlgorithm = prfAlgorithm.substr(8).toLowerCase();
    break;
  default:
    var error = new Error('Unsupported PRF algorithm.');
    error.algorithm = prfAlgorithm;
    error.supported = [
      'hmacWithSHA1', 'hmacWithSHA224', 'hmacWithSHA256', 'hmacWithSHA384',
      'hmacWithSHA512'];
    throw error;
  }
  if(!factory || !(prfAlgorithm in factory)) {
    throw new Error('Unknown hash algorithm: ' + prfAlgorithm);
  }
  return factory[prfAlgorithm].create();
}

function createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm) {
  var params = asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
    // salt
    asn1$6.create(
      asn1$6.Class.UNIVERSAL, asn1$6.Type.OCTETSTRING, false, salt),
    // iteration count
    asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.INTEGER, false,
      countBytes.getBytes())
  ]);
  // when PRF algorithm is not SHA-1 default, add key length and PRF algorithm
  if(prfAlgorithm !== 'hmacWithSHA1') {
    params.value.push(
      // key length
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.INTEGER, false,
        forge$j.util.hexToBytes(dkLen.toString(16))),
      // AlgorithmIdentifier
      asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.SEQUENCE, true, [
        // algorithm
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.OID, false,
          asn1$6.oidToDer(pki$3.oids[prfAlgorithm]).getBytes()),
        // parameters (null)
        asn1$6.create(asn1$6.Class.UNIVERSAL, asn1$6.Type.NULL, false, '')
      ]));
  }
  return params;
}

/**
 * Javascript implementation of ASN.1 validators for PKCS#7 v1.5.
 *
 * @author Dave Longley
 * @author Stefan Siegl
 *
 * Copyright (c) 2012-2015 Digital Bazaar, Inc.
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 *
 * The ASN.1 representation of PKCS#7 is as follows
 * (see RFC #2315 for details, http://www.ietf.org/rfc/rfc2315.txt):
 *
 * A PKCS#7 message consists of a ContentInfo on root level, which may
 * contain any number of further ContentInfo nested into it.
 *
 * ContentInfo ::= SEQUENCE {
 *   contentType                ContentType,
 *   content               [0]  EXPLICIT ANY DEFINED BY contentType OPTIONAL
 * }
 *
 * ContentType ::= OBJECT IDENTIFIER
 *
 * EnvelopedData ::= SEQUENCE {
 *   version                    Version,
 *   recipientInfos             RecipientInfos,
 *   encryptedContentInfo       EncryptedContentInfo
 * }
 *
 * EncryptedData ::= SEQUENCE {
 *   version                    Version,
 *   encryptedContentInfo       EncryptedContentInfo
 * }
 *
 * id-signedData OBJECT IDENTIFIER ::= { iso(1) member-body(2)
 *   us(840) rsadsi(113549) pkcs(1) pkcs7(7) 2 }
 *
 * SignedData ::= SEQUENCE {
 *   version           INTEGER,
 *   digestAlgorithms  DigestAlgorithmIdentifiers,
 *   contentInfo       ContentInfo,
 *   certificates      [0] IMPLICIT Certificates OPTIONAL,
 *   crls              [1] IMPLICIT CertificateRevocationLists OPTIONAL,
 *   signerInfos       SignerInfos
 * }
 *
 * SignerInfos ::= SET OF SignerInfo
 *
 * SignerInfo ::= SEQUENCE {
 *   version                    Version,
 *   issuerAndSerialNumber      IssuerAndSerialNumber,
 *   digestAlgorithm            DigestAlgorithmIdentifier,
 *   authenticatedAttributes    [0] IMPLICIT Attributes OPTIONAL,
 *   digestEncryptionAlgorithm  DigestEncryptionAlgorithmIdentifier,
 *   encryptedDigest            EncryptedDigest,
 *   unauthenticatedAttributes  [1] IMPLICIT Attributes OPTIONAL
 * }
 *
 * EncryptedDigest ::= OCTET STRING
 *
 * Attributes ::= SET OF Attribute
 *
 * Attribute ::= SEQUENCE {
 *   attrType    OBJECT IDENTIFIER,
 *   attrValues  SET OF AttributeValue
 * }
 *
 * AttributeValue ::= ANY
 *
 * Version ::= INTEGER
 *
 * RecipientInfos ::= SET OF RecipientInfo
 *
 * EncryptedContentInfo ::= SEQUENCE {
 *   contentType                 ContentType,
 *   contentEncryptionAlgorithm  ContentEncryptionAlgorithmIdentifier,
 *   encryptedContent       [0]  IMPLICIT EncryptedContent OPTIONAL
 * }
 *
 * ContentEncryptionAlgorithmIdentifier ::= AlgorithmIdentifier
 *
 * The AlgorithmIdentifier contains an Object Identifier (OID) and parameters
 * for the algorithm, if any. In the case of AES and DES3, there is only one,
 * the IV.
 *
 * AlgorithmIdentifer ::= SEQUENCE {
 *    algorithm OBJECT IDENTIFIER,
 *    parameters ANY DEFINED BY algorithm OPTIONAL
 * }
 *
 * EncryptedContent ::= OCTET STRING
 *
 * RecipientInfo ::= SEQUENCE {
 *   version                     Version,
 *   issuerAndSerialNumber       IssuerAndSerialNumber,
 *   keyEncryptionAlgorithm      KeyEncryptionAlgorithmIdentifier,
 *   encryptedKey                EncryptedKey
 * }
 *
 * IssuerAndSerialNumber ::= SEQUENCE {
 *   issuer                      Name,
 *   serialNumber                CertificateSerialNumber
 * }
 *
 * CertificateSerialNumber ::= INTEGER
 *
 * KeyEncryptionAlgorithmIdentifier ::= AlgorithmIdentifier
 *
 * EncryptedKey ::= OCTET STRING
 */

var forge$i = forge$F;



// shortcut for ASN.1 API
var asn1$5 = forge$i.asn1;

// shortcut for PKCS#7 API
var p7v = forge$i.pkcs7asn1 = forge$i.pkcs7asn1 || {};
forge$i.pkcs7 = forge$i.pkcs7 || {};
forge$i.pkcs7.asn1 = p7v;

var contentInfoValidator$1 = {
  name: 'ContentInfo',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'ContentInfo.ContentType',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.OID,
    constructed: false,
    capture: 'contentType'
  }, {
    name: 'ContentInfo.content',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    captureAsn1: 'content'
  }]
};
p7v.contentInfoValidator = contentInfoValidator$1;

var encryptedContentInfoValidator = {
  name: 'EncryptedContentInfo',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'EncryptedContentInfo.contentType',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.OID,
    constructed: false,
    capture: 'contentType'
  }, {
    name: 'EncryptedContentInfo.contentEncryptionAlgorithm',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'EncryptedContentInfo.contentEncryptionAlgorithm.algorithm',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.OID,
      constructed: false,
      capture: 'encAlgorithm'
    }, {
      name: 'EncryptedContentInfo.contentEncryptionAlgorithm.parameter',
      tagClass: asn1$5.Class.UNIVERSAL,
      captureAsn1: 'encParameter'
    }]
  }, {
    name: 'EncryptedContentInfo.encryptedContent',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 0,
    /* The PKCS#7 structure output by OpenSSL somewhat differs from what
     * other implementations do generate.
     *
     * OpenSSL generates a structure like this:
     * SEQUENCE {
     *    ...
     *    [0]
     *       26 DA 67 D2 17 9C 45 3C B1 2A A8 59 2F 29 33 38
     *       C3 C3 DF 86 71 74 7A 19 9F 40 D0 29 BE 85 90 45
     *       ...
     * }
     *
     * Whereas other implementations (and this PKCS#7 module) generate:
     * SEQUENCE {
     *    ...
     *    [0] {
     *       OCTET STRING
     *          26 DA 67 D2 17 9C 45 3C B1 2A A8 59 2F 29 33 38
     *          C3 C3 DF 86 71 74 7A 19 9F 40 D0 29 BE 85 90 45
     *          ...
     *    }
     * }
     *
     * In order to support both, we just capture the context specific
     * field here.  The OCTET STRING bit is removed below.
     */
    capture: 'encryptedContent',
    captureAsn1: 'encryptedContentAsn1'
  }]
};

p7v.envelopedDataValidator = {
  name: 'EnvelopedData',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'EnvelopedData.Version',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.INTEGER,
    constructed: false,
    capture: 'version'
  }, {
    name: 'EnvelopedData.RecipientInfos',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SET,
    constructed: true,
    captureAsn1: 'recipientInfos'
  }].concat(encryptedContentInfoValidator)
};

p7v.encryptedDataValidator = {
  name: 'EncryptedData',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'EncryptedData.Version',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.INTEGER,
    constructed: false,
    capture: 'version'
  }].concat(encryptedContentInfoValidator)
};

var signerValidator = {
  name: 'SignerInfo',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'SignerInfo.version',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.INTEGER,
    constructed: false
  }, {
    name: 'SignerInfo.issuerAndSerialNumber',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'SignerInfo.issuerAndSerialNumber.issuer',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.SEQUENCE,
      constructed: true,
      captureAsn1: 'issuer'
    }, {
      name: 'SignerInfo.issuerAndSerialNumber.serialNumber',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.INTEGER,
      constructed: false,
      capture: 'serial'
    }]
  }, {
    name: 'SignerInfo.digestAlgorithm',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'SignerInfo.digestAlgorithm.algorithm',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.OID,
      constructed: false,
      capture: 'digestAlgorithm'
    }, {
      name: 'SignerInfo.digestAlgorithm.parameter',
      tagClass: asn1$5.Class.UNIVERSAL,
      constructed: false,
      captureAsn1: 'digestParameter',
      optional: true
    }]
  }, {
    name: 'SignerInfo.authenticatedAttributes',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    capture: 'authenticatedAttributes'
  }, {
    name: 'SignerInfo.digestEncryptionAlgorithm',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    capture: 'signatureAlgorithm'
  }, {
    name: 'SignerInfo.encryptedDigest',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.OCTETSTRING,
    constructed: false,
    capture: 'signature'
  }, {
    name: 'SignerInfo.unauthenticatedAttributes',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 1,
    constructed: true,
    optional: true,
    capture: 'unauthenticatedAttributes'
  }]
};

p7v.signedDataValidator = {
  name: 'SignedData',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'SignedData.Version',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.INTEGER,
    constructed: false,
    capture: 'version'
  }, {
    name: 'SignedData.DigestAlgorithms',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SET,
    constructed: true,
    captureAsn1: 'digestAlgorithms'
  },
  contentInfoValidator$1,
  {
    name: 'SignedData.Certificates',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 0,
    optional: true,
    captureAsn1: 'certificates'
  }, {
    name: 'SignedData.CertificateRevocationLists',
    tagClass: asn1$5.Class.CONTEXT_SPECIFIC,
    type: 1,
    optional: true,
    captureAsn1: 'crls'
  }, {
    name: 'SignedData.SignerInfos',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SET,
    capture: 'signerInfos',
    optional: true,
    value: [signerValidator]
  }]
};

p7v.recipientInfoValidator = {
  name: 'RecipientInfo',
  tagClass: asn1$5.Class.UNIVERSAL,
  type: asn1$5.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'RecipientInfo.version',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.INTEGER,
    constructed: false,
    capture: 'version'
  }, {
    name: 'RecipientInfo.issuerAndSerial',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'RecipientInfo.issuerAndSerial.issuer',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.SEQUENCE,
      constructed: true,
      captureAsn1: 'issuer'
    }, {
      name: 'RecipientInfo.issuerAndSerial.serialNumber',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.INTEGER,
      constructed: false,
      capture: 'serial'
    }]
  }, {
    name: 'RecipientInfo.keyEncryptionAlgorithm',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'RecipientInfo.keyEncryptionAlgorithm.algorithm',
      tagClass: asn1$5.Class.UNIVERSAL,
      type: asn1$5.Type.OID,
      constructed: false,
      capture: 'encAlgorithm'
    }, {
      name: 'RecipientInfo.keyEncryptionAlgorithm.parameter',
      tagClass: asn1$5.Class.UNIVERSAL,
      constructed: false,
      captureAsn1: 'encParameter'
    }]
  }, {
    name: 'RecipientInfo.encryptedKey',
    tagClass: asn1$5.Class.UNIVERSAL,
    type: asn1$5.Type.OCTETSTRING,
    constructed: false,
    capture: 'encKey'
  }]
};

/**
 * Javascript implementation of mask generation function MGF1.
 *
 * @author Stefan Siegl
 * @author Dave Longley
 *
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 * Copyright (c) 2014 Digital Bazaar, Inc.
 */

var forge$h = forge$F;


forge$h.mgf = forge$h.mgf || {};
var mgf1 = forge$h.mgf.mgf1 = forge$h.mgf1 = forge$h.mgf1 || {};

/**
 * Creates a MGF1 mask generation function object.
 *
 * @param md the message digest API to use (eg: forge.md.sha1.create()).
 *
 * @return a mask generation function object.
 */
mgf1.create = function(md) {
  var mgf = {
    /**
     * Generate mask of specified length.
     *
     * @param {String} seed The seed for mask generation.
     * @param maskLen Number of bytes to generate.
     * @return {String} The generated mask.
     */
    generate: function(seed, maskLen) {
      /* 2. Let T be the empty octet string. */
      var t = new forge$h.util.ByteBuffer();

      /* 3. For counter from 0 to ceil(maskLen / hLen), do the following: */
      var len = Math.ceil(maskLen / md.digestLength);
      for(var i = 0; i < len; i++) {
        /* a. Convert counter to an octet string C of length 4 octets */
        var c = new forge$h.util.ByteBuffer();
        c.putInt32(i);

        /* b. Concatenate the hash of the seed mgfSeed and C to the octet
         * string T: */
        md.start();
        md.update(seed + c.getBytes());
        t.putBuffer(md.digest());
      }

      /* Output the leading maskLen octets of T as the octet string mask. */
      t.truncate(t.length() - maskLen);
      return t.getBytes();
    }
  };

  return mgf;
};

/**
 * Node.js module for Forge mask generation functions.
 *
 * @author Stefan Siegl
 *
 * Copyright 2012 Stefan Siegl <stesie@brokenpipe.de>
 */

var forge$g = forge$F;


forge$g.mgf = forge$g.mgf || {};
forge$g.mgf.mgf1 = forge$g.mgf1;

/**
 * Javascript implementation of PKCS#1 PSS signature padding.
 *
 * @author Stefan Siegl
 *
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 */

var forge$f = forge$F;



// shortcut for PSS API
var pss = forge$f.pss = forge$f.pss || {};

/**
 * Creates a PSS signature scheme object.
 *
 * There are several ways to provide a salt for encoding:
 *
 * 1. Specify the saltLength only and the built-in PRNG will generate it.
 * 2. Specify the saltLength and a custom PRNG with 'getBytesSync' defined that
 *   will be used.
 * 3. Specify the salt itself as a forge.util.ByteBuffer.
 *
 * @param options the options to use:
 *          md the message digest object to use, a forge md instance.
 *          mgf the mask generation function to use, a forge mgf instance.
 *          [saltLength] the length of the salt in octets.
 *          [prng] the pseudo-random number generator to use to produce a salt.
 *          [salt] the salt to use when encoding.
 *
 * @return a signature scheme object.
 */
pss.create = function(options) {
  // backwards compatibility w/legacy args: hash, mgf, sLen
  if(arguments.length === 3) {
    options = {
      md: arguments[0],
      mgf: arguments[1],
      saltLength: arguments[2]
    };
  }

  var hash = options.md;
  var mgf = options.mgf;
  var hLen = hash.digestLength;

  var salt_ = options.salt || null;
  if(typeof salt_ === 'string') {
    // assume binary-encoded string
    salt_ = forge$f.util.createBuffer(salt_);
  }

  var sLen;
  if('saltLength' in options) {
    sLen = options.saltLength;
  } else if(salt_ !== null) {
    sLen = salt_.length();
  } else {
    throw new Error('Salt length not specified or specific salt not given.');
  }

  if(salt_ !== null && salt_.length() !== sLen) {
    throw new Error('Given salt length does not match length of given salt.');
  }

  var prng = options.prng || forge$f.random;

  var pssobj = {};

  /**
   * Encodes a PSS signature.
   *
   * This function implements EMSA-PSS-ENCODE as per RFC 3447, section 9.1.1.
   *
   * @param md the message digest object with the hash to sign.
   * @param modsBits the length of the RSA modulus in bits.
   *
   * @return the encoded message as a binary-encoded string of length
   *           ceil((modBits - 1) / 8).
   */
  pssobj.encode = function(md, modBits) {
    var i;
    var emBits = modBits - 1;
    var emLen = Math.ceil(emBits / 8);

    /* 2. Let mHash = Hash(M), an octet string of length hLen. */
    var mHash = md.digest().getBytes();

    /* 3. If emLen < hLen + sLen + 2, output "encoding error" and stop. */
    if(emLen < hLen + sLen + 2) {
      throw new Error('Message is too long to encrypt.');
    }

    /* 4. Generate a random octet string salt of length sLen; if sLen = 0,
     *    then salt is the empty string. */
    var salt;
    if(salt_ === null) {
      salt = prng.getBytesSync(sLen);
    } else {
      salt = salt_.bytes();
    }

    /* 5. Let M' = (0x)00 00 00 00 00 00 00 00 || mHash || salt; */
    var m_ = new forge$f.util.ByteBuffer();
    m_.fillWithByte(0, 8);
    m_.putBytes(mHash);
    m_.putBytes(salt);

    /* 6. Let H = Hash(M'), an octet string of length hLen. */
    hash.start();
    hash.update(m_.getBytes());
    var h = hash.digest().getBytes();

    /* 7. Generate an octet string PS consisting of emLen - sLen - hLen - 2
     *    zero octets.  The length of PS may be 0. */
    var ps = new forge$f.util.ByteBuffer();
    ps.fillWithByte(0, emLen - sLen - hLen - 2);

    /* 8. Let DB = PS || 0x01 || salt; DB is an octet string of length
     *    emLen - hLen - 1. */
    ps.putByte(0x01);
    ps.putBytes(salt);
    var db = ps.getBytes();

    /* 9. Let dbMask = MGF(H, emLen - hLen - 1). */
    var maskLen = emLen - hLen - 1;
    var dbMask = mgf.generate(h, maskLen);

    /* 10. Let maskedDB = DB \xor dbMask. */
    var maskedDB = '';
    for(i = 0; i < maskLen; i++) {
      maskedDB += String.fromCharCode(db.charCodeAt(i) ^ dbMask.charCodeAt(i));
    }

    /* 11. Set the leftmost 8emLen - emBits bits of the leftmost octet in
     *     maskedDB to zero. */
    var mask = (0xFF00 >> (8 * emLen - emBits)) & 0xFF;
    maskedDB = String.fromCharCode(maskedDB.charCodeAt(0) & ~mask) +
      maskedDB.substr(1);

    /* 12. Let EM = maskedDB || H || 0xbc.
     * 13. Output EM. */
    return maskedDB + h + String.fromCharCode(0xbc);
  };

  /**
   * Verifies a PSS signature.
   *
   * This function implements EMSA-PSS-VERIFY as per RFC 3447, section 9.1.2.
   *
   * @param mHash the message digest hash, as a binary-encoded string, to
   *         compare against the signature.
   * @param em the encoded message, as a binary-encoded string
   *          (RSA decryption result).
   * @param modsBits the length of the RSA modulus in bits.
   *
   * @return true if the signature was verified, false if not.
   */
  pssobj.verify = function(mHash, em, modBits) {
    var i;
    var emBits = modBits - 1;
    var emLen = Math.ceil(emBits / 8);

    /* c. Convert the message representative m to an encoded message EM
     *    of length emLen = ceil((modBits - 1) / 8) octets, where modBits
     *    is the length in bits of the RSA modulus n */
    em = em.substr(-emLen);

    /* 3. If emLen < hLen + sLen + 2, output "inconsistent" and stop. */
    if(emLen < hLen + sLen + 2) {
      throw new Error('Inconsistent parameters to PSS signature verification.');
    }

    /* 4. If the rightmost octet of EM does not have hexadecimal value
     *    0xbc, output "inconsistent" and stop. */
    if(em.charCodeAt(emLen - 1) !== 0xbc) {
      throw new Error('Encoded message does not end in 0xBC.');
    }

    /* 5. Let maskedDB be the leftmost emLen - hLen - 1 octets of EM, and
     *    let H be the next hLen octets. */
    var maskLen = emLen - hLen - 1;
    var maskedDB = em.substr(0, maskLen);
    var h = em.substr(maskLen, hLen);

    /* 6. If the leftmost 8emLen - emBits bits of the leftmost octet in
     *    maskedDB are not all equal to zero, output "inconsistent" and stop. */
    var mask = (0xFF00 >> (8 * emLen - emBits)) & 0xFF;
    if((maskedDB.charCodeAt(0) & mask) !== 0) {
      throw new Error('Bits beyond keysize not zero as expected.');
    }

    /* 7. Let dbMask = MGF(H, emLen - hLen - 1). */
    var dbMask = mgf.generate(h, maskLen);

    /* 8. Let DB = maskedDB \xor dbMask. */
    var db = '';
    for(i = 0; i < maskLen; i++) {
      db += String.fromCharCode(maskedDB.charCodeAt(i) ^ dbMask.charCodeAt(i));
    }

    /* 9. Set the leftmost 8emLen - emBits bits of the leftmost octet
     * in DB to zero. */
    db = String.fromCharCode(db.charCodeAt(0) & ~mask) + db.substr(1);

    /* 10. If the emLen - hLen - sLen - 2 leftmost octets of DB are not zero
     * or if the octet at position emLen - hLen - sLen - 1 (the leftmost
     * position is "position 1") does not have hexadecimal value 0x01,
     * output "inconsistent" and stop. */
    var checkLen = emLen - hLen - sLen - 2;
    for(i = 0; i < checkLen; i++) {
      if(db.charCodeAt(i) !== 0x00) {
        throw new Error('Leftmost octets not zero as expected');
      }
    }

    if(db.charCodeAt(checkLen) !== 0x01) {
      throw new Error('Inconsistent PSS signature, 0x01 marker not found');
    }

    /* 11. Let salt be the last sLen octets of DB. */
    var salt = db.substr(-sLen);

    /* 12.  Let M' = (0x)00 00 00 00 00 00 00 00 || mHash || salt */
    var m_ = new forge$f.util.ByteBuffer();
    m_.fillWithByte(0, 8);
    m_.putBytes(mHash);
    m_.putBytes(salt);

    /* 13. Let H' = Hash(M'), an octet string of length hLen. */
    hash.start();
    hash.update(m_.getBytes());
    var h_ = hash.digest().getBytes();

    /* 14. If H = H', output "consistent." Otherwise, output "inconsistent." */
    return h === h_;
  };

  return pssobj;
};

/**
 * Javascript implementation of X.509 and related components (such as
 * Certification Signing Requests) of a Public Key Infrastructure.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 *
 * The ASN.1 representation of an X.509v3 certificate is as follows
 * (see RFC 2459):
 *
 * Certificate ::= SEQUENCE {
 *   tbsCertificate       TBSCertificate,
 *   signatureAlgorithm   AlgorithmIdentifier,
 *   signatureValue       BIT STRING
 * }
 *
 * TBSCertificate ::= SEQUENCE {
 *   version         [0]  EXPLICIT Version DEFAULT v1,
 *   serialNumber         CertificateSerialNumber,
 *   signature            AlgorithmIdentifier,
 *   issuer               Name,
 *   validity             Validity,
 *   subject              Name,
 *   subjectPublicKeyInfo SubjectPublicKeyInfo,
 *   issuerUniqueID  [1]  IMPLICIT UniqueIdentifier OPTIONAL,
 *                        -- If present, version shall be v2 or v3
 *   subjectUniqueID [2]  IMPLICIT UniqueIdentifier OPTIONAL,
 *                        -- If present, version shall be v2 or v3
 *   extensions      [3]  EXPLICIT Extensions OPTIONAL
 *                        -- If present, version shall be v3
 * }
 *
 * Version ::= INTEGER  { v1(0), v2(1), v3(2) }
 *
 * CertificateSerialNumber ::= INTEGER
 *
 * Name ::= CHOICE {
 *   // only one possible choice for now
 *   RDNSequence
 * }
 *
 * RDNSequence ::= SEQUENCE OF RelativeDistinguishedName
 *
 * RelativeDistinguishedName ::= SET OF AttributeTypeAndValue
 *
 * AttributeTypeAndValue ::= SEQUENCE {
 *   type     AttributeType,
 *   value    AttributeValue
 * }
 * AttributeType ::= OBJECT IDENTIFIER
 * AttributeValue ::= ANY DEFINED BY AttributeType
 *
 * Validity ::= SEQUENCE {
 *   notBefore      Time,
 *   notAfter       Time
 * }
 *
 * Time ::= CHOICE {
 *   utcTime        UTCTime,
 *   generalTime    GeneralizedTime
 * }
 *
 * UniqueIdentifier ::= BIT STRING
 *
 * SubjectPublicKeyInfo ::= SEQUENCE {
 *   algorithm            AlgorithmIdentifier,
 *   subjectPublicKey     BIT STRING
 * }
 *
 * Extensions ::= SEQUENCE SIZE (1..MAX) OF Extension
 *
 * Extension ::= SEQUENCE {
 *   extnID      OBJECT IDENTIFIER,
 *   critical    BOOLEAN DEFAULT FALSE,
 *   extnValue   OCTET STRING
 * }
 *
 * The only key algorithm currently supported for PKI is RSA.
 *
 * RSASSA-PSS signatures are described in RFC 3447 and RFC 4055.
 *
 * PKCS#10 v1.7 describes certificate signing requests:
 *
 * CertificationRequestInfo:
 *
 * CertificationRequestInfo ::= SEQUENCE {
 *   version       INTEGER { v1(0) } (v1,...),
 *   subject       Name,
 *   subjectPKInfo SubjectPublicKeyInfo{{ PKInfoAlgorithms }},
 *   attributes    [0] Attributes{{ CRIAttributes }}
 * }
 *
 * Attributes { ATTRIBUTE:IOSet } ::= SET OF Attribute{{ IOSet }}
 *
 * CRIAttributes  ATTRIBUTE  ::= {
 *   ... -- add any locally defined attributes here -- }
 *
 * Attribute { ATTRIBUTE:IOSet } ::= SEQUENCE {
 *   type   ATTRIBUTE.&id({IOSet}),
 *   values SET SIZE(1..MAX) OF ATTRIBUTE.&Type({IOSet}{@type})
 * }
 *
 * CertificationRequest ::= SEQUENCE {
 *   certificationRequestInfo CertificationRequestInfo,
 *   signatureAlgorithm AlgorithmIdentifier{{ SignatureAlgorithms }},
 *   signature          BIT STRING
 * }
 */

var forge$e = forge$F;











// shortcut for asn.1 API
var asn1$4 = forge$e.asn1;

/* Public Key Infrastructure (PKI) implementation. */
var pki$2 = forge$e.pki = forge$e.pki || {};
var oids = pki$2.oids;

// short name OID mappings
var _shortNames = {};
_shortNames['CN'] = oids['commonName'];
_shortNames['commonName'] = 'CN';
_shortNames['C'] = oids['countryName'];
_shortNames['countryName'] = 'C';
_shortNames['L'] = oids['localityName'];
_shortNames['localityName'] = 'L';
_shortNames['ST'] = oids['stateOrProvinceName'];
_shortNames['stateOrProvinceName'] = 'ST';
_shortNames['O'] = oids['organizationName'];
_shortNames['organizationName'] = 'O';
_shortNames['OU'] = oids['organizationalUnitName'];
_shortNames['organizationalUnitName'] = 'OU';
_shortNames['E'] = oids['emailAddress'];
_shortNames['emailAddress'] = 'E';

// validator for an SubjectPublicKeyInfo structure
// Note: Currently only works with an RSA public key
var publicKeyValidator$1 = forge$e.pki.rsa.publicKeyValidator;

// validator for an X.509v3 certificate
var x509CertificateValidator = {
  name: 'Certificate',
  tagClass: asn1$4.Class.UNIVERSAL,
  type: asn1$4.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'Certificate.TBSCertificate',
    tagClass: asn1$4.Class.UNIVERSAL,
    type: asn1$4.Type.SEQUENCE,
    constructed: true,
    captureAsn1: 'tbsCertificate',
    value: [{
      name: 'Certificate.TBSCertificate.version',
      tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
      type: 0,
      constructed: true,
      optional: true,
      value: [{
        name: 'Certificate.TBSCertificate.version.integer',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.INTEGER,
        constructed: false,
        capture: 'certVersion'
      }]
    }, {
      name: 'Certificate.TBSCertificate.serialNumber',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.INTEGER,
      constructed: false,
      capture: 'certSerialNumber'
    }, {
      name: 'Certificate.TBSCertificate.signature',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: 'Certificate.TBSCertificate.signature.algorithm',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.OID,
        constructed: false,
        capture: 'certinfoSignatureOid'
      }, {
        name: 'Certificate.TBSCertificate.signature.parameters',
        tagClass: asn1$4.Class.UNIVERSAL,
        optional: true,
        captureAsn1: 'certinfoSignatureParams'
      }]
    }, {
      name: 'Certificate.TBSCertificate.issuer',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      captureAsn1: 'certIssuer'
    }, {
      name: 'Certificate.TBSCertificate.validity',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      // Note: UTC and generalized times may both appear so the capture
      // names are based on their detected order, the names used below
      // are only for the common case, which validity time really means
      // "notBefore" and which means "notAfter" will be determined by order
      value: [{
        // notBefore (Time) (UTC time case)
        name: 'Certificate.TBSCertificate.validity.notBefore (utc)',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.UTCTIME,
        constructed: false,
        optional: true,
        capture: 'certValidity1UTCTime'
      }, {
        // notBefore (Time) (generalized time case)
        name: 'Certificate.TBSCertificate.validity.notBefore (generalized)',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.GENERALIZEDTIME,
        constructed: false,
        optional: true,
        capture: 'certValidity2GeneralizedTime'
      }, {
        // notAfter (Time) (only UTC time is supported)
        name: 'Certificate.TBSCertificate.validity.notAfter (utc)',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.UTCTIME,
        constructed: false,
        optional: true,
        capture: 'certValidity3UTCTime'
      }, {
        // notAfter (Time) (only UTC time is supported)
        name: 'Certificate.TBSCertificate.validity.notAfter (generalized)',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.GENERALIZEDTIME,
        constructed: false,
        optional: true,
        capture: 'certValidity4GeneralizedTime'
      }]
    }, {
      // Name (subject) (RDNSequence)
      name: 'Certificate.TBSCertificate.subject',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      captureAsn1: 'certSubject'
    },
    // SubjectPublicKeyInfo
    publicKeyValidator$1,
    {
      // issuerUniqueID (optional)
      name: 'Certificate.TBSCertificate.issuerUniqueID',
      tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
      type: 1,
      constructed: true,
      optional: true,
      value: [{
        name: 'Certificate.TBSCertificate.issuerUniqueID.id',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.BITSTRING,
        constructed: false,
        // TODO: support arbitrary bit length ids
        captureBitStringValue: 'certIssuerUniqueId'
      }]
    }, {
      // subjectUniqueID (optional)
      name: 'Certificate.TBSCertificate.subjectUniqueID',
      tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
      type: 2,
      constructed: true,
      optional: true,
      value: [{
        name: 'Certificate.TBSCertificate.subjectUniqueID.id',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.BITSTRING,
        constructed: false,
        // TODO: support arbitrary bit length ids
        captureBitStringValue: 'certSubjectUniqueId'
      }]
    }, {
      // Extensions (optional)
      name: 'Certificate.TBSCertificate.extensions',
      tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
      type: 3,
      constructed: true,
      captureAsn1: 'certExtensions',
      optional: true
    }]
  }, {
    // AlgorithmIdentifier (signature algorithm)
    name: 'Certificate.signatureAlgorithm',
    tagClass: asn1$4.Class.UNIVERSAL,
    type: asn1$4.Type.SEQUENCE,
    constructed: true,
    value: [{
      // algorithm
      name: 'Certificate.signatureAlgorithm.algorithm',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.OID,
      constructed: false,
      capture: 'certSignatureOid'
    }, {
      name: 'Certificate.TBSCertificate.signature.parameters',
      tagClass: asn1$4.Class.UNIVERSAL,
      optional: true,
      captureAsn1: 'certSignatureParams'
    }]
  }, {
    // SignatureValue
    name: 'Certificate.signatureValue',
    tagClass: asn1$4.Class.UNIVERSAL,
    type: asn1$4.Type.BITSTRING,
    constructed: false,
    captureBitStringValue: 'certSignature'
  }]
};

var rsassaPssParameterValidator = {
  name: 'rsapss',
  tagClass: asn1$4.Class.UNIVERSAL,
  type: asn1$4.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'rsapss.hashAlgorithm',
    tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    value: [{
      name: 'rsapss.hashAlgorithm.AlgorithmIdentifier',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Class.SEQUENCE,
      constructed: true,
      optional: true,
      value: [{
        name: 'rsapss.hashAlgorithm.AlgorithmIdentifier.algorithm',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.OID,
        constructed: false,
        capture: 'hashOid'
        /* parameter block omitted, for SHA1 NULL anyhow. */
      }]
    }]
  }, {
    name: 'rsapss.maskGenAlgorithm',
    tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
    type: 1,
    constructed: true,
    value: [{
      name: 'rsapss.maskGenAlgorithm.AlgorithmIdentifier',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Class.SEQUENCE,
      constructed: true,
      optional: true,
      value: [{
        name: 'rsapss.maskGenAlgorithm.AlgorithmIdentifier.algorithm',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.OID,
        constructed: false,
        capture: 'maskGenOid'
      }, {
        name: 'rsapss.maskGenAlgorithm.AlgorithmIdentifier.params',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: 'rsapss.maskGenAlgorithm.AlgorithmIdentifier.params.algorithm',
          tagClass: asn1$4.Class.UNIVERSAL,
          type: asn1$4.Type.OID,
          constructed: false,
          capture: 'maskGenHashOid'
          /* parameter block omitted, for SHA1 NULL anyhow. */
        }]
      }]
    }]
  }, {
    name: 'rsapss.saltLength',
    tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
    type: 2,
    optional: true,
    value: [{
      name: 'rsapss.saltLength.saltLength',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Class.INTEGER,
      constructed: false,
      capture: 'saltLength'
    }]
  }, {
    name: 'rsapss.trailerField',
    tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
    type: 3,
    optional: true,
    value: [{
      name: 'rsapss.trailer.trailer',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Class.INTEGER,
      constructed: false,
      capture: 'trailer'
    }]
  }]
};

// validator for a CertificationRequestInfo structure
var certificationRequestInfoValidator = {
  name: 'CertificationRequestInfo',
  tagClass: asn1$4.Class.UNIVERSAL,
  type: asn1$4.Type.SEQUENCE,
  constructed: true,
  captureAsn1: 'certificationRequestInfo',
  value: [{
    name: 'CertificationRequestInfo.integer',
    tagClass: asn1$4.Class.UNIVERSAL,
    type: asn1$4.Type.INTEGER,
    constructed: false,
    capture: 'certificationRequestInfoVersion'
  }, {
    // Name (subject) (RDNSequence)
    name: 'CertificationRequestInfo.subject',
    tagClass: asn1$4.Class.UNIVERSAL,
    type: asn1$4.Type.SEQUENCE,
    constructed: true,
    captureAsn1: 'certificationRequestInfoSubject'
  },
  // SubjectPublicKeyInfo
  publicKeyValidator$1,
  {
    name: 'CertificationRequestInfo.attributes',
    tagClass: asn1$4.Class.CONTEXT_SPECIFIC,
    type: 0,
    constructed: true,
    optional: true,
    capture: 'certificationRequestInfoAttributes',
    value: [{
      name: 'CertificationRequestInfo.attributes',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: 'CertificationRequestInfo.attributes.type',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.OID,
        constructed: false
      }, {
        name: 'CertificationRequestInfo.attributes.value',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.SET,
        constructed: true
      }]
    }]
  }]
};

// validator for a CertificationRequest structure
var certificationRequestValidator = {
  name: 'CertificationRequest',
  tagClass: asn1$4.Class.UNIVERSAL,
  type: asn1$4.Type.SEQUENCE,
  constructed: true,
  captureAsn1: 'csr',
  value: [
    certificationRequestInfoValidator, {
      // AlgorithmIdentifier (signature algorithm)
      name: 'CertificationRequest.signatureAlgorithm',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.SEQUENCE,
      constructed: true,
      value: [{
        // algorithm
        name: 'CertificationRequest.signatureAlgorithm.algorithm',
        tagClass: asn1$4.Class.UNIVERSAL,
        type: asn1$4.Type.OID,
        constructed: false,
        capture: 'csrSignatureOid'
      }, {
        name: 'CertificationRequest.signatureAlgorithm.parameters',
        tagClass: asn1$4.Class.UNIVERSAL,
        optional: true,
        captureAsn1: 'csrSignatureParams'
      }]
    }, {
      // signature
      name: 'CertificationRequest.signature',
      tagClass: asn1$4.Class.UNIVERSAL,
      type: asn1$4.Type.BITSTRING,
      constructed: false,
      captureBitStringValue: 'csrSignature'
    }
  ]
};

/**
 * Converts an RDNSequence of ASN.1 DER-encoded RelativeDistinguishedName
 * sets into an array with objects that have type and value properties.
 *
 * @param rdn the RDNSequence to convert.
 * @param md a message digest to append type and value to if provided.
 */
pki$2.RDNAttributesAsArray = function(rdn, md) {
  var rval = [];

  // each value in 'rdn' in is a SET of RelativeDistinguishedName
  var set, attr, obj;
  for(var si = 0; si < rdn.value.length; ++si) {
    // get the RelativeDistinguishedName set
    set = rdn.value[si];

    // each value in the SET is an AttributeTypeAndValue sequence
    // containing first a type (an OID) and second a value (defined by
    // the OID)
    for(var i = 0; i < set.value.length; ++i) {
      obj = {};
      attr = set.value[i];
      obj.type = asn1$4.derToOid(attr.value[0].value);
      obj.value = attr.value[1].value;
      obj.valueTagClass = attr.value[1].type;
      // if the OID is known, get its name and short name
      if(obj.type in oids) {
        obj.name = oids[obj.type];
        if(obj.name in _shortNames) {
          obj.shortName = _shortNames[obj.name];
        }
      }
      if(md) {
        md.update(obj.type);
        md.update(obj.value);
      }
      rval.push(obj);
    }
  }

  return rval;
};

/**
 * Converts ASN.1 CRIAttributes into an array with objects that have type and
 * value properties.
 *
 * @param attributes the CRIAttributes to convert.
 */
pki$2.CRIAttributesAsArray = function(attributes) {
  var rval = [];

  // each value in 'attributes' in is a SEQUENCE with an OID and a SET
  for(var si = 0; si < attributes.length; ++si) {
    // get the attribute sequence
    var seq = attributes[si];

    // each value in the SEQUENCE containing first a type (an OID) and
    // second a set of values (defined by the OID)
    var type = asn1$4.derToOid(seq.value[0].value);
    var values = seq.value[1].value;
    for(var vi = 0; vi < values.length; ++vi) {
      var obj = {};
      obj.type = type;
      obj.value = values[vi].value;
      obj.valueTagClass = values[vi].type;
      // if the OID is known, get its name and short name
      if(obj.type in oids) {
        obj.name = oids[obj.type];
        if(obj.name in _shortNames) {
          obj.shortName = _shortNames[obj.name];
        }
      }
      // parse extensions
      if(obj.type === oids.extensionRequest) {
        obj.extensions = [];
        for(var ei = 0; ei < obj.value.length; ++ei) {
          obj.extensions.push(pki$2.certificateExtensionFromAsn1(obj.value[ei]));
        }
      }
      rval.push(obj);
    }
  }

  return rval;
};

/**
 * Gets an issuer or subject attribute from its name, type, or short name.
 *
 * @param obj the issuer or subject object.
 * @param options a short name string or an object with:
 *          shortName the short name for the attribute.
 *          name the name for the attribute.
 *          type the type for the attribute.
 *
 * @return the attribute.
 */
function _getAttribute(obj, options) {
  if(typeof options === 'string') {
    options = {shortName: options};
  }

  var rval = null;
  var attr;
  for(var i = 0; rval === null && i < obj.attributes.length; ++i) {
    attr = obj.attributes[i];
    if(options.type && options.type === attr.type) {
      rval = attr;
    } else if(options.name && options.name === attr.name) {
      rval = attr;
    } else if(options.shortName && options.shortName === attr.shortName) {
      rval = attr;
    }
  }
  return rval;
}

/**
 * Converts signature parameters from ASN.1 structure.
 *
 * Currently only RSASSA-PSS supported.  The PKCS#1 v1.5 signature scheme had
 * no parameters.
 *
 * RSASSA-PSS-params  ::=  SEQUENCE  {
 *   hashAlgorithm      [0] HashAlgorithm DEFAULT
 *                             sha1Identifier,
 *   maskGenAlgorithm   [1] MaskGenAlgorithm DEFAULT
 *                             mgf1SHA1Identifier,
 *   saltLength         [2] INTEGER DEFAULT 20,
 *   trailerField       [3] INTEGER DEFAULT 1
 * }
 *
 * HashAlgorithm  ::=  AlgorithmIdentifier
 *
 * MaskGenAlgorithm  ::=  AlgorithmIdentifier
 *
 * AlgorithmIdentifer ::= SEQUENCE {
 *   algorithm OBJECT IDENTIFIER,
 *   parameters ANY DEFINED BY algorithm OPTIONAL
 * }
 *
 * @param oid The OID specifying the signature algorithm
 * @param obj The ASN.1 structure holding the parameters
 * @param fillDefaults Whether to use return default values where omitted
 * @return signature parameter object
 */
var _readSignatureParameters = function(oid, obj, fillDefaults) {
  var params = {};

  if(oid !== oids['RSASSA-PSS']) {
    return params;
  }

  if(fillDefaults) {
    params = {
      hash: {
        algorithmOid: oids['sha1']
      },
      mgf: {
        algorithmOid: oids['mgf1'],
        hash: {
          algorithmOid: oids['sha1']
        }
      },
      saltLength: 20
    };
  }

  var capture = {};
  var errors = [];
  if(!asn1$4.validate(obj, rsassaPssParameterValidator, capture, errors)) {
    var error = new Error('Cannot read RSASSA-PSS parameter block.');
    error.errors = errors;
    throw error;
  }

  if(capture.hashOid !== undefined) {
    params.hash = params.hash || {};
    params.hash.algorithmOid = asn1$4.derToOid(capture.hashOid);
  }

  if(capture.maskGenOid !== undefined) {
    params.mgf = params.mgf || {};
    params.mgf.algorithmOid = asn1$4.derToOid(capture.maskGenOid);
    params.mgf.hash = params.mgf.hash || {};
    params.mgf.hash.algorithmOid = asn1$4.derToOid(capture.maskGenHashOid);
  }

  if(capture.saltLength !== undefined) {
    params.saltLength = capture.saltLength.charCodeAt(0);
  }

  return params;
};

/**
 * Converts an X.509 certificate from PEM format.
 *
 * Note: If the certificate is to be verified then compute hash should
 * be set to true. This will scan the TBSCertificate part of the ASN.1
 * object while it is converted so it doesn't need to be converted back
 * to ASN.1-DER-encoding later.
 *
 * @param pem the PEM-formatted certificate.
 * @param computeHash true to compute the hash for verification.
 * @param strict true to be strict when checking ASN.1 value lengths, false to
 *          allow truncated values (default: true).
 *
 * @return the certificate.
 */
pki$2.certificateFromPem = function(pem, computeHash, strict) {
  var msg = forge$e.pem.decode(pem)[0];

  if(msg.type !== 'CERTIFICATE' &&
    msg.type !== 'X509 CERTIFICATE' &&
    msg.type !== 'TRUSTED CERTIFICATE') {
    var error = new Error(
      'Could not convert certificate from PEM; PEM header type ' +
      'is not "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error(
      'Could not convert certificate from PEM; PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  var obj = asn1$4.fromDer(msg.body, strict);

  return pki$2.certificateFromAsn1(obj, computeHash);
};

/**
 * Converts an X.509 certificate to PEM format.
 *
 * @param cert the certificate.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted certificate.
 */
pki$2.certificateToPem = function(cert, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var msg = {
    type: 'CERTIFICATE',
    body: asn1$4.toDer(pki$2.certificateToAsn1(cert)).getBytes()
  };
  return forge$e.pem.encode(msg, {maxline: maxline});
};

/**
 * Converts an RSA public key from PEM format.
 *
 * @param pem the PEM-formatted public key.
 *
 * @return the public key.
 */
pki$2.publicKeyFromPem = function(pem) {
  var msg = forge$e.pem.decode(pem)[0];

  if(msg.type !== 'PUBLIC KEY' && msg.type !== 'RSA PUBLIC KEY') {
    var error = new Error('Could not convert public key from PEM; PEM header ' +
      'type is not "PUBLIC KEY" or "RSA PUBLIC KEY".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert public key from PEM; PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  var obj = asn1$4.fromDer(msg.body);

  return pki$2.publicKeyFromAsn1(obj);
};

/**
 * Converts an RSA public key to PEM format (using a SubjectPublicKeyInfo).
 *
 * @param key the public key.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted public key.
 */
pki$2.publicKeyToPem = function(key, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var msg = {
    type: 'PUBLIC KEY',
    body: asn1$4.toDer(pki$2.publicKeyToAsn1(key)).getBytes()
  };
  return forge$e.pem.encode(msg, {maxline: maxline});
};

/**
 * Converts an RSA public key to PEM format (using an RSAPublicKey).
 *
 * @param key the public key.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted public key.
 */
pki$2.publicKeyToRSAPublicKeyPem = function(key, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var msg = {
    type: 'RSA PUBLIC KEY',
    body: asn1$4.toDer(pki$2.publicKeyToRSAPublicKey(key)).getBytes()
  };
  return forge$e.pem.encode(msg, {maxline: maxline});
};

/**
 * Gets a fingerprint for the given public key.
 *
 * @param options the options to use.
 *          [md] the message digest object to use (defaults to forge.md.sha1).
 *          [type] the type of fingerprint, such as 'RSAPublicKey',
 *            'SubjectPublicKeyInfo' (defaults to 'RSAPublicKey').
 *          [encoding] an alternative output encoding, such as 'hex'
 *            (defaults to none, outputs a byte buffer).
 *          [delimiter] the delimiter to use between bytes for 'hex' encoded
 *            output, eg: ':' (defaults to none).
 *
 * @return the fingerprint as a byte buffer or other encoding based on options.
 */
pki$2.getPublicKeyFingerprint = function(key, options) {
  options = options || {};
  var md = options.md || forge$e.md.sha1.create();
  var type = options.type || 'RSAPublicKey';

  var bytes;
  switch(type) {
    case 'RSAPublicKey':
      bytes = asn1$4.toDer(pki$2.publicKeyToRSAPublicKey(key)).getBytes();
      break;
    case 'SubjectPublicKeyInfo':
      bytes = asn1$4.toDer(pki$2.publicKeyToAsn1(key)).getBytes();
      break;
    default:
      throw new Error('Unknown fingerprint type "' + options.type + '".');
  }

  // hash public key bytes
  md.start();
  md.update(bytes);
  var digest = md.digest();
  if(options.encoding === 'hex') {
    var hex = digest.toHex();
    if(options.delimiter) {
      return hex.match(/.{2}/g).join(options.delimiter);
    }
    return hex;
  } else if(options.encoding === 'binary') {
    return digest.getBytes();
  } else if(options.encoding) {
    throw new Error('Unknown encoding "' + options.encoding + '".');
  }
  return digest;
};

/**
 * Converts a PKCS#10 certification request (CSR) from PEM format.
 *
 * Note: If the certification request is to be verified then compute hash
 * should be set to true. This will scan the CertificationRequestInfo part of
 * the ASN.1 object while it is converted so it doesn't need to be converted
 * back to ASN.1-DER-encoding later.
 *
 * @param pem the PEM-formatted certificate.
 * @param computeHash true to compute the hash for verification.
 * @param strict true to be strict when checking ASN.1 value lengths, false to
 *          allow truncated values (default: true).
 *
 * @return the certification request (CSR).
 */
pki$2.certificationRequestFromPem = function(pem, computeHash, strict) {
  var msg = forge$e.pem.decode(pem)[0];

  if(msg.type !== 'CERTIFICATE REQUEST') {
    var error = new Error('Could not convert certification request from PEM; ' +
      'PEM header type is not "CERTIFICATE REQUEST".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert certification request from PEM; ' +
      'PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  var obj = asn1$4.fromDer(msg.body, strict);

  return pki$2.certificationRequestFromAsn1(obj, computeHash);
};

/**
 * Converts a PKCS#10 certification request (CSR) to PEM format.
 *
 * @param csr the certification request.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted certification request.
 */
pki$2.certificationRequestToPem = function(csr, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var msg = {
    type: 'CERTIFICATE REQUEST',
    body: asn1$4.toDer(pki$2.certificationRequestToAsn1(csr)).getBytes()
  };
  return forge$e.pem.encode(msg, {maxline: maxline});
};

/**
 * Creates an empty X.509v3 RSA certificate.
 *
 * @return the certificate.
 */
pki$2.createCertificate = function() {
  var cert = {};
  cert.version = 0x02;
  cert.serialNumber = '00';
  cert.signatureOid = null;
  cert.signature = null;
  cert.siginfo = {};
  cert.siginfo.algorithmOid = null;
  cert.validity = {};
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();

  cert.issuer = {};
  cert.issuer.getField = function(sn) {
    return _getAttribute(cert.issuer, sn);
  };
  cert.issuer.addField = function(attr) {
    _fillMissingFields([attr]);
    cert.issuer.attributes.push(attr);
  };
  cert.issuer.attributes = [];
  cert.issuer.hash = null;

  cert.subject = {};
  cert.subject.getField = function(sn) {
    return _getAttribute(cert.subject, sn);
  };
  cert.subject.addField = function(attr) {
    _fillMissingFields([attr]);
    cert.subject.attributes.push(attr);
  };
  cert.subject.attributes = [];
  cert.subject.hash = null;

  cert.extensions = [];
  cert.publicKey = null;
  cert.md = null;

  /**
   * Sets the subject of this certificate.
   *
   * @param attrs the array of subject attributes to use.
   * @param uniqueId an optional a unique ID to use.
   */
  cert.setSubject = function(attrs, uniqueId) {
    // set new attributes, clear hash
    _fillMissingFields(attrs);
    cert.subject.attributes = attrs;
    delete cert.subject.uniqueId;
    if(uniqueId) {
      // TODO: support arbitrary bit length ids
      cert.subject.uniqueId = uniqueId;
    }
    cert.subject.hash = null;
  };

  /**
   * Sets the issuer of this certificate.
   *
   * @param attrs the array of issuer attributes to use.
   * @param uniqueId an optional a unique ID to use.
   */
  cert.setIssuer = function(attrs, uniqueId) {
    // set new attributes, clear hash
    _fillMissingFields(attrs);
    cert.issuer.attributes = attrs;
    delete cert.issuer.uniqueId;
    if(uniqueId) {
      // TODO: support arbitrary bit length ids
      cert.issuer.uniqueId = uniqueId;
    }
    cert.issuer.hash = null;
  };

  /**
   * Sets the extensions of this certificate.
   *
   * @param exts the array of extensions to use.
   */
  cert.setExtensions = function(exts) {
    for(var i = 0; i < exts.length; ++i) {
      _fillMissingExtensionFields(exts[i], {cert: cert});
    }
    // set new extensions
    cert.extensions = exts;
  };

  /**
   * Gets an extension by its name or id.
   *
   * @param options the name to use or an object with:
   *          name the name to use.
   *          id the id to use.
   *
   * @return the extension or null if not found.
   */
  cert.getExtension = function(options) {
    if(typeof options === 'string') {
      options = {name: options};
    }

    var rval = null;
    var ext;
    for(var i = 0; rval === null && i < cert.extensions.length; ++i) {
      ext = cert.extensions[i];
      if(options.id && ext.id === options.id) {
        rval = ext;
      } else if(options.name && ext.name === options.name) {
        rval = ext;
      }
    }
    return rval;
  };

  /**
   * Signs this certificate using the given private key.
   *
   * @param key the private key to sign with.
   * @param md the message digest object to use (defaults to forge.md.sha1).
   */
  cert.sign = function(key, md) {
    // TODO: get signature OID from private key
    cert.md = md || forge$e.md.sha1.create();
    var algorithmOid = oids[cert.md.algorithm + 'WithRSAEncryption'];
    if(!algorithmOid) {
      var error = new Error('Could not compute certificate digest. ' +
        'Unknown message digest algorithm OID.');
      error.algorithm = cert.md.algorithm;
      throw error;
    }
    cert.signatureOid = cert.siginfo.algorithmOid = algorithmOid;

    // get TBSCertificate, convert to DER
    cert.tbsCertificate = pki$2.getTBSCertificate(cert);
    var bytes = asn1$4.toDer(cert.tbsCertificate);

    // digest and sign
    cert.md.update(bytes.getBytes());
    cert.signature = key.sign(cert.md);
  };

  /**
   * Attempts verify the signature on the passed certificate using this
   * certificate's public key.
   *
   * @param child the certificate to verify.
   *
   * @return true if verified, false if not.
   */
  cert.verify = function(child) {
    var rval = false;

    if(!cert.issued(child)) {
      var issuer = child.issuer;
      var subject = cert.subject;
      var error = new Error(
        'The parent certificate did not issue the given child ' +
        'certificate; the child certificate\'s issuer does not match the ' +
        'parent\'s subject.');
      error.expectedIssuer = issuer.attributes;
      error.actualIssuer = subject.attributes;
      throw error;
    }

    var md = child.md;
    if(md === null) {
      // check signature OID for supported signature types
      if(child.signatureOid in oids) {
        var oid = oids[child.signatureOid];
        switch(oid) {
          case 'sha1WithRSAEncryption':
            md = forge$e.md.sha1.create();
            break;
          case 'md5WithRSAEncryption':
            md = forge$e.md.md5.create();
            break;
          case 'sha256WithRSAEncryption':
            md = forge$e.md.sha256.create();
            break;
          case 'sha384WithRSAEncryption':
            md = forge$e.md.sha384.create();
            break;
          case 'sha512WithRSAEncryption':
            md = forge$e.md.sha512.create();
            break;
          case 'RSASSA-PSS':
            md = forge$e.md.sha256.create();
            break;
        }
      }
      if(md === null) {
        var error = new Error('Could not compute certificate digest. ' +
          'Unknown signature OID.');
        error.signatureOid = child.signatureOid;
        throw error;
      }

      // produce DER formatted TBSCertificate and digest it
      var tbsCertificate = child.tbsCertificate || pki$2.getTBSCertificate(child);
      var bytes = asn1$4.toDer(tbsCertificate);
      md.update(bytes.getBytes());
    }

    if(md !== null) {
      var scheme;

      switch(child.signatureOid) {
        case oids.sha1WithRSAEncryption:
          scheme = undefined; /* use PKCS#1 v1.5 padding scheme */
          break;
        case oids['RSASSA-PSS']:
          var hash, mgf;

          /* initialize mgf */
          hash = oids[child.signatureParameters.mgf.hash.algorithmOid];
          if(hash === undefined || forge$e.md[hash] === undefined) {
            var error = new Error('Unsupported MGF hash function.');
            error.oid = child.signatureParameters.mgf.hash.algorithmOid;
            error.name = hash;
            throw error;
          }

          mgf = oids[child.signatureParameters.mgf.algorithmOid];
          if(mgf === undefined || forge$e.mgf[mgf] === undefined) {
            var error = new Error('Unsupported MGF function.');
            error.oid = child.signatureParameters.mgf.algorithmOid;
            error.name = mgf;
            throw error;
          }

          mgf = forge$e.mgf[mgf].create(forge$e.md[hash].create());

          /* initialize hash function */
          hash = oids[child.signatureParameters.hash.algorithmOid];
          if(hash === undefined || forge$e.md[hash] === undefined) {
            throw {
              message: 'Unsupported RSASSA-PSS hash function.',
              oid: child.signatureParameters.hash.algorithmOid,
              name: hash
            };
          }

          scheme = forge$e.pss.create(forge$e.md[hash].create(), mgf,
            child.signatureParameters.saltLength);
          break;
      }

      // verify signature on cert using public key
      rval = cert.publicKey.verify(
        md.digest().getBytes(), child.signature, scheme);
    }

    return rval;
  };

  /**
   * Returns true if this certificate's issuer matches the passed
   * certificate's subject. Note that no signature check is performed.
   *
   * @param parent the certificate to check.
   *
   * @return true if this certificate's issuer matches the passed certificate's
   *         subject.
   */
  cert.isIssuer = function(parent) {
    var rval = false;

    var i = cert.issuer;
    var s = parent.subject;

    // compare hashes if present
    if(i.hash && s.hash) {
      rval = (i.hash === s.hash);
    } else if(i.attributes.length === s.attributes.length) {
      // all attributes are the same so issuer matches subject
      rval = true;
      var iattr, sattr;
      for(var n = 0; rval && n < i.attributes.length; ++n) {
        iattr = i.attributes[n];
        sattr = s.attributes[n];
        if(iattr.type !== sattr.type || iattr.value !== sattr.value) {
          // attribute mismatch
          rval = false;
        }
      }
    }

    return rval;
  };

  /**
   * Returns true if this certificate's subject matches the issuer of the
   * given certificate). Note that not signature check is performed.
   *
   * @param child the certificate to check.
   *
   * @return true if this certificate's subject matches the passed
   *         certificate's issuer.
   */
  cert.issued = function(child) {
    return child.isIssuer(cert);
  };

  /**
   * Generates the subjectKeyIdentifier for this certificate as byte buffer.
   *
   * @return the subjectKeyIdentifier for this certificate as byte buffer.
   */
  cert.generateSubjectKeyIdentifier = function() {
    /* See: 4.2.1.2 section of the the RFC3280, keyIdentifier is either:

      (1) The keyIdentifier is composed of the 160-bit SHA-1 hash of the
        value of the BIT STRING subjectPublicKey (excluding the tag,
        length, and number of unused bits).

      (2) The keyIdentifier is composed of a four bit type field with
        the value 0100 followed by the least significant 60 bits of the
        SHA-1 hash of the value of the BIT STRING subjectPublicKey
        (excluding the tag, length, and number of unused bit string bits).
    */

    // skipping the tag, length, and number of unused bits is the same
    // as just using the RSAPublicKey (for RSA keys, which are the
    // only ones supported)
    return pki$2.getPublicKeyFingerprint(cert.publicKey, {type: 'RSAPublicKey'});
  };

  /**
   * Verifies the subjectKeyIdentifier extension value for this certificate
   * against its public key. If no extension is found, false will be
   * returned.
   *
   * @return true if verified, false if not.
   */
  cert.verifySubjectKeyIdentifier = function() {
    var oid = oids['subjectKeyIdentifier'];
    for(var i = 0; i < cert.extensions.length; ++i) {
      var ext = cert.extensions[i];
      if(ext.id === oid) {
        var ski = cert.generateSubjectKeyIdentifier().getBytes();
        return (forge$e.util.hexToBytes(ext.subjectKeyIdentifier) === ski);
      }
    }
    return false;
  };

  return cert;
};

/**
 * Converts an X.509v3 RSA certificate from an ASN.1 object.
 *
 * Note: If the certificate is to be verified then compute hash should
 * be set to true. There is currently no implementation for converting
 * a certificate back to ASN.1 so the TBSCertificate part of the ASN.1
 * object needs to be scanned before the cert object is created.
 *
 * @param obj the asn1 representation of an X.509v3 RSA certificate.
 * @param computeHash true to compute the hash for verification.
 *
 * @return the certificate.
 */
pki$2.certificateFromAsn1 = function(obj, computeHash) {
  // validate certificate and capture data
  var capture = {};
  var errors = [];
  if(!asn1$4.validate(obj, x509CertificateValidator, capture, errors)) {
    var error = new Error('Cannot read X.509 certificate. ' +
      'ASN.1 object is not an X509v3 Certificate.');
    error.errors = errors;
    throw error;
  }

  // get oid
  var oid = asn1$4.derToOid(capture.publicKeyOid);
  if(oid !== pki$2.oids.rsaEncryption) {
    throw new Error('Cannot read public key. OID is not RSA.');
  }

  // create certificate
  var cert = pki$2.createCertificate();
  cert.version = capture.certVersion ?
    capture.certVersion.charCodeAt(0) : 0;
  var serial = forge$e.util.createBuffer(capture.certSerialNumber);
  cert.serialNumber = serial.toHex();
  cert.signatureOid = forge$e.asn1.derToOid(capture.certSignatureOid);
  cert.signatureParameters = _readSignatureParameters(
    cert.signatureOid, capture.certSignatureParams, true);
  cert.siginfo.algorithmOid = forge$e.asn1.derToOid(capture.certinfoSignatureOid);
  cert.siginfo.parameters = _readSignatureParameters(cert.siginfo.algorithmOid,
    capture.certinfoSignatureParams, false);
  cert.signature = capture.certSignature;

  var validity = [];
  if(capture.certValidity1UTCTime !== undefined) {
    validity.push(asn1$4.utcTimeToDate(capture.certValidity1UTCTime));
  }
  if(capture.certValidity2GeneralizedTime !== undefined) {
    validity.push(asn1$4.generalizedTimeToDate(
      capture.certValidity2GeneralizedTime));
  }
  if(capture.certValidity3UTCTime !== undefined) {
    validity.push(asn1$4.utcTimeToDate(capture.certValidity3UTCTime));
  }
  if(capture.certValidity4GeneralizedTime !== undefined) {
    validity.push(asn1$4.generalizedTimeToDate(
      capture.certValidity4GeneralizedTime));
  }
  if(validity.length > 2) {
    throw new Error('Cannot read notBefore/notAfter validity times; more ' +
      'than two times were provided in the certificate.');
  }
  if(validity.length < 2) {
    throw new Error('Cannot read notBefore/notAfter validity times; they ' +
      'were not provided as either UTCTime or GeneralizedTime.');
  }
  cert.validity.notBefore = validity[0];
  cert.validity.notAfter = validity[1];

  // keep TBSCertificate to preserve signature when exporting
  cert.tbsCertificate = capture.tbsCertificate;

  if(computeHash) {
    // check signature OID for supported signature types
    cert.md = null;
    if(cert.signatureOid in oids) {
      var oid = oids[cert.signatureOid];
      switch(oid) {
        case 'sha1WithRSAEncryption':
          cert.md = forge$e.md.sha1.create();
          break;
        case 'md5WithRSAEncryption':
          cert.md = forge$e.md.md5.create();
          break;
        case 'sha256WithRSAEncryption':
          cert.md = forge$e.md.sha256.create();
          break;
        case 'sha384WithRSAEncryption':
          cert.md = forge$e.md.sha384.create();
          break;
        case 'sha512WithRSAEncryption':
          cert.md = forge$e.md.sha512.create();
          break;
        case 'RSASSA-PSS':
          cert.md = forge$e.md.sha256.create();
          break;
      }
    }
    if(cert.md === null) {
      var error = new Error('Could not compute certificate digest. ' +
        'Unknown signature OID.');
      error.signatureOid = cert.signatureOid;
      throw error;
    }

    // produce DER formatted TBSCertificate and digest it
    var bytes = asn1$4.toDer(cert.tbsCertificate);
    cert.md.update(bytes.getBytes());
  }

  // handle issuer, build issuer message digest
  var imd = forge$e.md.sha1.create();
  cert.issuer.getField = function(sn) {
    return _getAttribute(cert.issuer, sn);
  };
  cert.issuer.addField = function(attr) {
    _fillMissingFields([attr]);
    cert.issuer.attributes.push(attr);
  };
  cert.issuer.attributes = pki$2.RDNAttributesAsArray(capture.certIssuer, imd);
  if(capture.certIssuerUniqueId) {
    cert.issuer.uniqueId = capture.certIssuerUniqueId;
  }
  cert.issuer.hash = imd.digest().toHex();

  // handle subject, build subject message digest
  var smd = forge$e.md.sha1.create();
  cert.subject.getField = function(sn) {
    return _getAttribute(cert.subject, sn);
  };
  cert.subject.addField = function(attr) {
    _fillMissingFields([attr]);
    cert.subject.attributes.push(attr);
  };
  cert.subject.attributes = pki$2.RDNAttributesAsArray(capture.certSubject, smd);
  if(capture.certSubjectUniqueId) {
    cert.subject.uniqueId = capture.certSubjectUniqueId;
  }
  cert.subject.hash = smd.digest().toHex();

  // handle extensions
  if(capture.certExtensions) {
    cert.extensions = pki$2.certificateExtensionsFromAsn1(capture.certExtensions);
  } else {
    cert.extensions = [];
  }

  // convert RSA public key from ASN.1
  cert.publicKey = pki$2.publicKeyFromAsn1(capture.subjectPublicKeyInfo);

  return cert;
};

/**
 * Converts an ASN.1 extensions object (with extension sequences as its
 * values) into an array of extension objects with types and values.
 *
 * Supported extensions:
 *
 * id-ce-keyUsage OBJECT IDENTIFIER ::=  { id-ce 15 }
 * KeyUsage ::= BIT STRING {
 *   digitalSignature        (0),
 *   nonRepudiation          (1),
 *   keyEncipherment         (2),
 *   dataEncipherment        (3),
 *   keyAgreement            (4),
 *   keyCertSign             (5),
 *   cRLSign                 (6),
 *   encipherOnly            (7),
 *   decipherOnly            (8)
 * }
 *
 * id-ce-basicConstraints OBJECT IDENTIFIER ::=  { id-ce 19 }
 * BasicConstraints ::= SEQUENCE {
 *   cA                      BOOLEAN DEFAULT FALSE,
 *   pathLenConstraint       INTEGER (0..MAX) OPTIONAL
 * }
 *
 * subjectAltName EXTENSION ::= {
 *   SYNTAX GeneralNames
 *   IDENTIFIED BY id-ce-subjectAltName
 * }
 *
 * GeneralNames ::= SEQUENCE SIZE (1..MAX) OF GeneralName
 *
 * GeneralName ::= CHOICE {
 *   otherName      [0] INSTANCE OF OTHER-NAME,
 *   rfc822Name     [1] IA5String,
 *   dNSName        [2] IA5String,
 *   x400Address    [3] ORAddress,
 *   directoryName  [4] Name,
 *   ediPartyName   [5] EDIPartyName,
 *   uniformResourceIdentifier [6] IA5String,
 *   IPAddress      [7] OCTET STRING,
 *   registeredID   [8] OBJECT IDENTIFIER
 * }
 *
 * OTHER-NAME ::= TYPE-IDENTIFIER
 *
 * EDIPartyName ::= SEQUENCE {
 *   nameAssigner [0] DirectoryString {ub-name} OPTIONAL,
 *   partyName    [1] DirectoryString {ub-name}
 * }
 *
 * @param exts the extensions ASN.1 with extension sequences to parse.
 *
 * @return the array.
 */
pki$2.certificateExtensionsFromAsn1 = function(exts) {
  var rval = [];
  for(var i = 0; i < exts.value.length; ++i) {
    // get extension sequence
    var extseq = exts.value[i];
    for(var ei = 0; ei < extseq.value.length; ++ei) {
      rval.push(pki$2.certificateExtensionFromAsn1(extseq.value[ei]));
    }
  }

  return rval;
};

/**
 * Parses a single certificate extension from ASN.1.
 *
 * @param ext the extension in ASN.1 format.
 *
 * @return the parsed extension as an object.
 */
pki$2.certificateExtensionFromAsn1 = function(ext) {
  // an extension has:
  // [0] extnID      OBJECT IDENTIFIER
  // [1] critical    BOOLEAN DEFAULT FALSE
  // [2] extnValue   OCTET STRING
  var e = {};
  e.id = asn1$4.derToOid(ext.value[0].value);
  e.critical = false;
  if(ext.value[1].type === asn1$4.Type.BOOLEAN) {
    e.critical = (ext.value[1].value.charCodeAt(0) !== 0x00);
    e.value = ext.value[2].value;
  } else {
    e.value = ext.value[1].value;
  }
  // if the oid is known, get its name
  if(e.id in oids) {
    e.name = oids[e.id];

    // handle key usage
    if(e.name === 'keyUsage') {
      // get value as BIT STRING
      var ev = asn1$4.fromDer(e.value);
      var b2 = 0x00;
      var b3 = 0x00;
      if(ev.value.length > 1) {
        // skip first byte, just indicates unused bits which
        // will be padded with 0s anyway
        // get bytes with flag bits
        b2 = ev.value.charCodeAt(1);
        b3 = ev.value.length > 2 ? ev.value.charCodeAt(2) : 0;
      }
      // set flags
      e.digitalSignature = (b2 & 0x80) === 0x80;
      e.nonRepudiation = (b2 & 0x40) === 0x40;
      e.keyEncipherment = (b2 & 0x20) === 0x20;
      e.dataEncipherment = (b2 & 0x10) === 0x10;
      e.keyAgreement = (b2 & 0x08) === 0x08;
      e.keyCertSign = (b2 & 0x04) === 0x04;
      e.cRLSign = (b2 & 0x02) === 0x02;
      e.encipherOnly = (b2 & 0x01) === 0x01;
      e.decipherOnly = (b3 & 0x80) === 0x80;
    } else if(e.name === 'basicConstraints') {
      // handle basic constraints
      // get value as SEQUENCE
      var ev = asn1$4.fromDer(e.value);
      // get cA BOOLEAN flag (defaults to false)
      if(ev.value.length > 0 && ev.value[0].type === asn1$4.Type.BOOLEAN) {
        e.cA = (ev.value[0].value.charCodeAt(0) !== 0x00);
      } else {
        e.cA = false;
      }
      // get path length constraint
      var value = null;
      if(ev.value.length > 0 && ev.value[0].type === asn1$4.Type.INTEGER) {
        value = ev.value[0].value;
      } else if(ev.value.length > 1) {
        value = ev.value[1].value;
      }
      if(value !== null) {
        e.pathLenConstraint = asn1$4.derToInteger(value);
      }
    } else if(e.name === 'extKeyUsage') {
      // handle extKeyUsage
      // value is a SEQUENCE of OIDs
      var ev = asn1$4.fromDer(e.value);
      for(var vi = 0; vi < ev.value.length; ++vi) {
        var oid = asn1$4.derToOid(ev.value[vi].value);
        if(oid in oids) {
          e[oids[oid]] = true;
        } else {
          e[oid] = true;
        }
      }
    } else if(e.name === 'nsCertType') {
      // handle nsCertType
      // get value as BIT STRING
      var ev = asn1$4.fromDer(e.value);
      var b2 = 0x00;
      if(ev.value.length > 1) {
        // skip first byte, just indicates unused bits which
        // will be padded with 0s anyway
        // get bytes with flag bits
        b2 = ev.value.charCodeAt(1);
      }
      // set flags
      e.client = (b2 & 0x80) === 0x80;
      e.server = (b2 & 0x40) === 0x40;
      e.email = (b2 & 0x20) === 0x20;
      e.objsign = (b2 & 0x10) === 0x10;
      e.reserved = (b2 & 0x08) === 0x08;
      e.sslCA = (b2 & 0x04) === 0x04;
      e.emailCA = (b2 & 0x02) === 0x02;
      e.objCA = (b2 & 0x01) === 0x01;
    } else if(
      e.name === 'subjectAltName' ||
      e.name === 'issuerAltName') {
      // handle subjectAltName/issuerAltName
      e.altNames = [];

      // ev is a SYNTAX SEQUENCE
      var gn;
      var ev = asn1$4.fromDer(e.value);
      for(var n = 0; n < ev.value.length; ++n) {
        // get GeneralName
        gn = ev.value[n];

        var altName = {
          type: gn.type,
          value: gn.value
        };
        e.altNames.push(altName);

        // Note: Support for types 1,2,6,7,8
        switch(gn.type) {
          // rfc822Name
          case 1:
          // dNSName
          case 2:
          // uniformResourceIdentifier (URI)
          case 6:
            break;
          // IPAddress
          case 7:
            // convert to IPv4/IPv6 string representation
            altName.ip = forge$e.util.bytesToIP(gn.value);
            break;
          // registeredID
          case 8:
            altName.oid = asn1$4.derToOid(gn.value);
            break;
            // unsupported
        }
      }
    } else if(e.name === 'subjectKeyIdentifier') {
      // value is an OCTETSTRING w/the hash of the key-type specific
      // public key structure (eg: RSAPublicKey)
      var ev = asn1$4.fromDer(e.value);
      e.subjectKeyIdentifier = forge$e.util.bytesToHex(ev.value);
    }
  }
  return e;
};

/**
 * Converts a PKCS#10 certification request (CSR) from an ASN.1 object.
 *
 * Note: If the certification request is to be verified then compute hash
 * should be set to true. There is currently no implementation for converting
 * a certificate back to ASN.1 so the CertificationRequestInfo part of the
 * ASN.1 object needs to be scanned before the csr object is created.
 *
 * @param obj the asn1 representation of a PKCS#10 certification request (CSR).
 * @param computeHash true to compute the hash for verification.
 *
 * @return the certification request (CSR).
 */
pki$2.certificationRequestFromAsn1 = function(obj, computeHash) {
  // validate certification request and capture data
  var capture = {};
  var errors = [];
  if(!asn1$4.validate(obj, certificationRequestValidator, capture, errors)) {
    var error = new Error('Cannot read PKCS#10 certificate request. ' +
      'ASN.1 object is not a PKCS#10 CertificationRequest.');
    error.errors = errors;
    throw error;
  }

  // get oid
  var oid = asn1$4.derToOid(capture.publicKeyOid);
  if(oid !== pki$2.oids.rsaEncryption) {
    throw new Error('Cannot read public key. OID is not RSA.');
  }

  // create certification request
  var csr = pki$2.createCertificationRequest();
  csr.version = capture.csrVersion ? capture.csrVersion.charCodeAt(0) : 0;
  csr.signatureOid = forge$e.asn1.derToOid(capture.csrSignatureOid);
  csr.signatureParameters = _readSignatureParameters(
    csr.signatureOid, capture.csrSignatureParams, true);
  csr.siginfo.algorithmOid = forge$e.asn1.derToOid(capture.csrSignatureOid);
  csr.siginfo.parameters = _readSignatureParameters(
    csr.siginfo.algorithmOid, capture.csrSignatureParams, false);
  csr.signature = capture.csrSignature;

  // keep CertificationRequestInfo to preserve signature when exporting
  csr.certificationRequestInfo = capture.certificationRequestInfo;

  if(computeHash) {
    // check signature OID for supported signature types
    csr.md = null;
    if(csr.signatureOid in oids) {
      var oid = oids[csr.signatureOid];
      switch(oid) {
        case 'sha1WithRSAEncryption':
          csr.md = forge$e.md.sha1.create();
          break;
        case 'md5WithRSAEncryption':
          csr.md = forge$e.md.md5.create();
          break;
        case 'sha256WithRSAEncryption':
          csr.md = forge$e.md.sha256.create();
          break;
        case 'sha384WithRSAEncryption':
          csr.md = forge$e.md.sha384.create();
          break;
        case 'sha512WithRSAEncryption':
          csr.md = forge$e.md.sha512.create();
          break;
        case 'RSASSA-PSS':
          csr.md = forge$e.md.sha256.create();
          break;
      }
    }
    if(csr.md === null) {
      var error = new Error('Could not compute certification request digest. ' +
        'Unknown signature OID.');
      error.signatureOid = csr.signatureOid;
      throw error;
    }

    // produce DER formatted CertificationRequestInfo and digest it
    var bytes = asn1$4.toDer(csr.certificationRequestInfo);
    csr.md.update(bytes.getBytes());
  }

  // handle subject, build subject message digest
  var smd = forge$e.md.sha1.create();
  csr.subject.getField = function(sn) {
    return _getAttribute(csr.subject, sn);
  };
  csr.subject.addField = function(attr) {
    _fillMissingFields([attr]);
    csr.subject.attributes.push(attr);
  };
  csr.subject.attributes = pki$2.RDNAttributesAsArray(
    capture.certificationRequestInfoSubject, smd);
  csr.subject.hash = smd.digest().toHex();

  // convert RSA public key from ASN.1
  csr.publicKey = pki$2.publicKeyFromAsn1(capture.subjectPublicKeyInfo);

  // convert attributes from ASN.1
  csr.getAttribute = function(sn) {
    return _getAttribute(csr, sn);
  };
  csr.addAttribute = function(attr) {
    _fillMissingFields([attr]);
    csr.attributes.push(attr);
  };
  csr.attributes = pki$2.CRIAttributesAsArray(
    capture.certificationRequestInfoAttributes || []);

  return csr;
};

/**
 * Creates an empty certification request (a CSR or certificate signing
 * request). Once created, its public key and attributes can be set and then
 * it can be signed.
 *
 * @return the empty certification request.
 */
pki$2.createCertificationRequest = function() {
  var csr = {};
  csr.version = 0x00;
  csr.signatureOid = null;
  csr.signature = null;
  csr.siginfo = {};
  csr.siginfo.algorithmOid = null;

  csr.subject = {};
  csr.subject.getField = function(sn) {
    return _getAttribute(csr.subject, sn);
  };
  csr.subject.addField = function(attr) {
    _fillMissingFields([attr]);
    csr.subject.attributes.push(attr);
  };
  csr.subject.attributes = [];
  csr.subject.hash = null;

  csr.publicKey = null;
  csr.attributes = [];
  csr.getAttribute = function(sn) {
    return _getAttribute(csr, sn);
  };
  csr.addAttribute = function(attr) {
    _fillMissingFields([attr]);
    csr.attributes.push(attr);
  };
  csr.md = null;

  /**
   * Sets the subject of this certification request.
   *
   * @param attrs the array of subject attributes to use.
   */
  csr.setSubject = function(attrs) {
    // set new attributes
    _fillMissingFields(attrs);
    csr.subject.attributes = attrs;
    csr.subject.hash = null;
  };

  /**
   * Sets the attributes of this certification request.
   *
   * @param attrs the array of attributes to use.
   */
  csr.setAttributes = function(attrs) {
    // set new attributes
    _fillMissingFields(attrs);
    csr.attributes = attrs;
  };

  /**
   * Signs this certification request using the given private key.
   *
   * @param key the private key to sign with.
   * @param md the message digest object to use (defaults to forge.md.sha1).
   */
  csr.sign = function(key, md) {
    // TODO: get signature OID from private key
    csr.md = md || forge$e.md.sha1.create();
    var algorithmOid = oids[csr.md.algorithm + 'WithRSAEncryption'];
    if(!algorithmOid) {
      var error = new Error('Could not compute certification request digest. ' +
        'Unknown message digest algorithm OID.');
      error.algorithm = csr.md.algorithm;
      throw error;
    }
    csr.signatureOid = csr.siginfo.algorithmOid = algorithmOid;

    // get CertificationRequestInfo, convert to DER
    csr.certificationRequestInfo = pki$2.getCertificationRequestInfo(csr);
    var bytes = asn1$4.toDer(csr.certificationRequestInfo);

    // digest and sign
    csr.md.update(bytes.getBytes());
    csr.signature = key.sign(csr.md);
  };

  /**
   * Attempts verify the signature on the passed certification request using
   * its public key.
   *
   * A CSR that has been exported to a file in PEM format can be verified using
   * OpenSSL using this command:
   *
   * openssl req -in <the-csr-pem-file> -verify -noout -text
   *
   * @return true if verified, false if not.
   */
  csr.verify = function() {
    var rval = false;

    var md = csr.md;
    if(md === null) {
      // check signature OID for supported signature types
      if(csr.signatureOid in oids) {
        // TODO: create DRY `OID to md` function
        var oid = oids[csr.signatureOid];
        switch(oid) {
          case 'sha1WithRSAEncryption':
            md = forge$e.md.sha1.create();
            break;
          case 'md5WithRSAEncryption':
            md = forge$e.md.md5.create();
            break;
          case 'sha256WithRSAEncryption':
            md = forge$e.md.sha256.create();
            break;
          case 'sha384WithRSAEncryption':
            md = forge$e.md.sha384.create();
            break;
          case 'sha512WithRSAEncryption':
            md = forge$e.md.sha512.create();
            break;
          case 'RSASSA-PSS':
            md = forge$e.md.sha256.create();
            break;
        }
      }
      if(md === null) {
        var error = new Error(
          'Could not compute certification request digest. ' +
          'Unknown signature OID.');
        error.signatureOid = csr.signatureOid;
        throw error;
      }

      // produce DER formatted CertificationRequestInfo and digest it
      var cri = csr.certificationRequestInfo ||
        pki$2.getCertificationRequestInfo(csr);
      var bytes = asn1$4.toDer(cri);
      md.update(bytes.getBytes());
    }

    if(md !== null) {
      var scheme;

      switch(csr.signatureOid) {
        case oids.sha1WithRSAEncryption:
          /* use PKCS#1 v1.5 padding scheme */
          break;
        case oids['RSASSA-PSS']:
          var hash, mgf;

          /* initialize mgf */
          hash = oids[csr.signatureParameters.mgf.hash.algorithmOid];
          if(hash === undefined || forge$e.md[hash] === undefined) {
            var error = new Error('Unsupported MGF hash function.');
            error.oid = csr.signatureParameters.mgf.hash.algorithmOid;
            error.name = hash;
            throw error;
          }

          mgf = oids[csr.signatureParameters.mgf.algorithmOid];
          if(mgf === undefined || forge$e.mgf[mgf] === undefined) {
            var error = new Error('Unsupported MGF function.');
            error.oid = csr.signatureParameters.mgf.algorithmOid;
            error.name = mgf;
            throw error;
          }

          mgf = forge$e.mgf[mgf].create(forge$e.md[hash].create());

          /* initialize hash function */
          hash = oids[csr.signatureParameters.hash.algorithmOid];
          if(hash === undefined || forge$e.md[hash] === undefined) {
            var error = new Error('Unsupported RSASSA-PSS hash function.');
            error.oid = csr.signatureParameters.hash.algorithmOid;
            error.name = hash;
            throw error;
          }

          scheme = forge$e.pss.create(forge$e.md[hash].create(), mgf,
            csr.signatureParameters.saltLength);
          break;
      }

      // verify signature on csr using its public key
      rval = csr.publicKey.verify(
        md.digest().getBytes(), csr.signature, scheme);
    }

    return rval;
  };

  return csr;
};

/**
 * Converts an X.509 subject or issuer to an ASN.1 RDNSequence.
 *
 * @param obj the subject or issuer (distinguished name).
 *
 * @return the ASN.1 RDNSequence.
 */
function _dnToAsn1(obj) {
  // create an empty RDNSequence
  var rval = asn1$4.create(
    asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);

  // iterate over attributes
  var attr, set;
  var attrs = obj.attributes;
  for(var i = 0; i < attrs.length; ++i) {
    attr = attrs[i];
    var value = attr.value;

    // reuse tag class for attribute value if available
    var valueTagClass = asn1$4.Type.PRINTABLESTRING;
    if('valueTagClass' in attr) {
      valueTagClass = attr.valueTagClass;

      if(valueTagClass === asn1$4.Type.UTF8) {
        value = forge$e.util.encodeUtf8(value);
      }
      // FIXME: handle more encodings
    }

    // create a RelativeDistinguishedName set
    // each value in the set is an AttributeTypeAndValue first
    // containing the type (an OID) and second the value
    set = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SET, true, [
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
        // AttributeType
        asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
          asn1$4.oidToDer(attr.type).getBytes()),
        // AttributeValue
        asn1$4.create(asn1$4.Class.UNIVERSAL, valueTagClass, false, value)
      ])
    ]);
    rval.value.push(set);
  }

  return rval;
}

/**
 * Fills in missing fields in attributes.
 *
 * @param attrs the attributes to fill missing fields in.
 */
function _fillMissingFields(attrs) {
  var attr;
  for(var i = 0; i < attrs.length; ++i) {
    attr = attrs[i];

    // populate missing name
    if(typeof attr.name === 'undefined') {
      if(attr.type && attr.type in pki$2.oids) {
        attr.name = pki$2.oids[attr.type];
      } else if(attr.shortName && attr.shortName in _shortNames) {
        attr.name = pki$2.oids[_shortNames[attr.shortName]];
      }
    }

    // populate missing type (OID)
    if(typeof attr.type === 'undefined') {
      if(attr.name && attr.name in pki$2.oids) {
        attr.type = pki$2.oids[attr.name];
      } else {
        var error = new Error('Attribute type not specified.');
        error.attribute = attr;
        throw error;
      }
    }

    // populate missing shortname
    if(typeof attr.shortName === 'undefined') {
      if(attr.name && attr.name in _shortNames) {
        attr.shortName = _shortNames[attr.name];
      }
    }

    // convert extensions to value
    if(attr.type === oids.extensionRequest) {
      attr.valueConstructed = true;
      attr.valueTagClass = asn1$4.Type.SEQUENCE;
      if(!attr.value && attr.extensions) {
        attr.value = [];
        for(var ei = 0; ei < attr.extensions.length; ++ei) {
          attr.value.push(pki$2.certificateExtensionToAsn1(
            _fillMissingExtensionFields(attr.extensions[ei])));
        }
      }
    }

    if(typeof attr.value === 'undefined') {
      var error = new Error('Attribute value not specified.');
      error.attribute = attr;
      throw error;
    }
  }
}

/**
 * Fills in missing fields in certificate extensions.
 *
 * @param e the extension.
 * @param [options] the options to use.
 *          [cert] the certificate the extensions are for.
 *
 * @return the extension.
 */
function _fillMissingExtensionFields(e, options) {
  options = options || {};

  // populate missing name
  if(typeof e.name === 'undefined') {
    if(e.id && e.id in pki$2.oids) {
      e.name = pki$2.oids[e.id];
    }
  }

  // populate missing id
  if(typeof e.id === 'undefined') {
    if(e.name && e.name in pki$2.oids) {
      e.id = pki$2.oids[e.name];
    } else {
      var error = new Error('Extension ID not specified.');
      error.extension = e;
      throw error;
    }
  }

  if(typeof e.value !== 'undefined') {
    return e;
  }

  // handle missing value:

  // value is a BIT STRING
  if(e.name === 'keyUsage') {
    // build flags
    var unused = 0;
    var b2 = 0x00;
    var b3 = 0x00;
    if(e.digitalSignature) {
      b2 |= 0x80;
      unused = 7;
    }
    if(e.nonRepudiation) {
      b2 |= 0x40;
      unused = 6;
    }
    if(e.keyEncipherment) {
      b2 |= 0x20;
      unused = 5;
    }
    if(e.dataEncipherment) {
      b2 |= 0x10;
      unused = 4;
    }
    if(e.keyAgreement) {
      b2 |= 0x08;
      unused = 3;
    }
    if(e.keyCertSign) {
      b2 |= 0x04;
      unused = 2;
    }
    if(e.cRLSign) {
      b2 |= 0x02;
      unused = 1;
    }
    if(e.encipherOnly) {
      b2 |= 0x01;
      unused = 0;
    }
    if(e.decipherOnly) {
      b3 |= 0x80;
      unused = 7;
    }

    // create bit string
    var value = String.fromCharCode(unused);
    if(b3 !== 0) {
      value += String.fromCharCode(b2) + String.fromCharCode(b3);
    } else if(b2 !== 0) {
      value += String.fromCharCode(b2);
    }
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false, value);
  } else if(e.name === 'basicConstraints') {
    // basicConstraints is a SEQUENCE
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);
    // cA BOOLEAN flag defaults to false
    if(e.cA) {
      e.value.value.push(asn1$4.create(
        asn1$4.Class.UNIVERSAL, asn1$4.Type.BOOLEAN, false,
        String.fromCharCode(0xFF)));
    }
    if('pathLenConstraint' in e) {
      e.value.value.push(asn1$4.create(
        asn1$4.Class.UNIVERSAL, asn1$4.Type.INTEGER, false,
        asn1$4.integerToDer(e.pathLenConstraint).getBytes()));
    }
  } else if(e.name === 'extKeyUsage') {
    // extKeyUsage is a SEQUENCE of OIDs
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);
    var seq = e.value.value;
    for(var key in e) {
      if(e[key] !== true) {
        continue;
      }
      // key is name in OID map
      if(key in oids) {
        seq.push(asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID,
          false, asn1$4.oidToDer(oids[key]).getBytes()));
      } else if(key.indexOf('.') !== -1) {
        // assume key is an OID
        seq.push(asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID,
          false, asn1$4.oidToDer(key).getBytes()));
      }
    }
  } else if(e.name === 'nsCertType') {
    // nsCertType is a BIT STRING
    // build flags
    var unused = 0;
    var b2 = 0x00;

    if(e.client) {
      b2 |= 0x80;
      unused = 7;
    }
    if(e.server) {
      b2 |= 0x40;
      unused = 6;
    }
    if(e.email) {
      b2 |= 0x20;
      unused = 5;
    }
    if(e.objsign) {
      b2 |= 0x10;
      unused = 4;
    }
    if(e.reserved) {
      b2 |= 0x08;
      unused = 3;
    }
    if(e.sslCA) {
      b2 |= 0x04;
      unused = 2;
    }
    if(e.emailCA) {
      b2 |= 0x02;
      unused = 1;
    }
    if(e.objCA) {
      b2 |= 0x01;
      unused = 0;
    }

    // create bit string
    var value = String.fromCharCode(unused);
    if(b2 !== 0) {
      value += String.fromCharCode(b2);
    }
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false, value);
  } else if(e.name === 'subjectAltName' || e.name === 'issuerAltName') {
    // SYNTAX SEQUENCE
    e.value = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);

    var altName;
    for(var n = 0; n < e.altNames.length; ++n) {
      altName = e.altNames[n];
      var value = altName.value;
      // handle IP
      if(altName.type === 7 && altName.ip) {
        value = forge$e.util.bytesFromIP(altName.ip);
        if(value === null) {
          var error = new Error(
            'Extension "ip" value is not a valid IPv4 or IPv6 address.');
          error.extension = e;
          throw error;
        }
      } else if(altName.type === 8) {
        // handle OID
        if(altName.oid) {
          value = asn1$4.oidToDer(asn1$4.oidToDer(altName.oid));
        } else {
          // deprecated ... convert value to OID
          value = asn1$4.oidToDer(value);
        }
      }
      e.value.value.push(asn1$4.create(
        asn1$4.Class.CONTEXT_SPECIFIC, altName.type, false,
        value));
    }
  } else if(e.name === 'nsComment' && options.cert) {
    // sanity check value is ASCII (req'd) and not too big
    if(!(/^[\x00-\x7F]*$/.test(e.comment)) ||
      (e.comment.length < 1) || (e.comment.length > 128)) {
      throw new Error('Invalid "nsComment" content.');
    }
    // IA5STRING opaque comment
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.IA5STRING, false, e.comment);
  } else if(e.name === 'subjectKeyIdentifier' && options.cert) {
    var ski = options.cert.generateSubjectKeyIdentifier();
    e.subjectKeyIdentifier = ski.toHex();
    // OCTETSTRING w/digest
    e.value = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.OCTETSTRING, false, ski.getBytes());
  } else if(e.name === 'authorityKeyIdentifier' && options.cert) {
    // SYNTAX SEQUENCE
    e.value = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);
    var seq = e.value.value;

    if(e.keyIdentifier) {
      var keyIdentifier = (e.keyIdentifier === true ?
        options.cert.generateSubjectKeyIdentifier().getBytes() :
        e.keyIdentifier);
      seq.push(
        asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 0, false, keyIdentifier));
    }

    if(e.authorityCertIssuer) {
      var authorityCertIssuer = [
        asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 4, true, [
          _dnToAsn1(e.authorityCertIssuer === true ?
            options.cert.issuer : e.authorityCertIssuer)
        ])
      ];
      seq.push(
        asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 1, true, authorityCertIssuer));
    }

    if(e.serialNumber) {
      var serialNumber = forge$e.util.hexToBytes(e.serialNumber === true ?
        options.cert.serialNumber : e.serialNumber);
      seq.push(
        asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 2, false, serialNumber));
    }
  } else if(e.name === 'cRLDistributionPoints') {
    e.value = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);
    var seq = e.value.value;

    // Create sub SEQUENCE of DistributionPointName
    var subSeq = asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);

    // Create fullName CHOICE
    var fullNameGeneralNames = asn1$4.create(
      asn1$4.Class.CONTEXT_SPECIFIC, 0, true, []);
    var altName;
    for(var n = 0; n < e.altNames.length; ++n) {
      altName = e.altNames[n];
      var value = altName.value;
      // handle IP
      if(altName.type === 7 && altName.ip) {
        value = forge$e.util.bytesFromIP(altName.ip);
        if(value === null) {
          var error = new Error(
            'Extension "ip" value is not a valid IPv4 or IPv6 address.');
          error.extension = e;
          throw error;
        }
      } else if(altName.type === 8) {
        // handle OID
        if(altName.oid) {
          value = asn1$4.oidToDer(asn1$4.oidToDer(altName.oid));
        } else {
          // deprecated ... convert value to OID
          value = asn1$4.oidToDer(value);
        }
      }
      fullNameGeneralNames.value.push(asn1$4.create(
        asn1$4.Class.CONTEXT_SPECIFIC, altName.type, false,
        value));
    }

    // Add to the parent SEQUENCE
    subSeq.value.push(asn1$4.create(
      asn1$4.Class.CONTEXT_SPECIFIC, 0, true, [fullNameGeneralNames]));
    seq.push(subSeq);
  }

  // ensure value has been defined by now
  if(typeof e.value === 'undefined') {
    var error = new Error('Extension value not specified.');
    error.extension = e;
    throw error;
  }

  return e;
}

/**
 * Convert signature parameters object to ASN.1
 *
 * @param {String} oid Signature algorithm OID
 * @param params The signature parametrs object
 * @return ASN.1 object representing signature parameters
 */
function _signatureParametersToAsn1(oid, params) {
  switch(oid) {
    case oids['RSASSA-PSS']:
      var parts = [];

      if(params.hash.algorithmOid !== undefined) {
        parts.push(asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 0, true, [
          asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
            asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
              asn1$4.oidToDer(params.hash.algorithmOid).getBytes()),
            asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.NULL, false, '')
          ])
        ]));
      }

      if(params.mgf.algorithmOid !== undefined) {
        parts.push(asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 1, true, [
          asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
            asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
              asn1$4.oidToDer(params.mgf.algorithmOid).getBytes()),
            asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
              asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
                asn1$4.oidToDer(params.mgf.hash.algorithmOid).getBytes()),
              asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.NULL, false, '')
            ])
          ])
        ]));
      }

      if(params.saltLength !== undefined) {
        parts.push(asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 2, true, [
          asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.INTEGER, false,
            asn1$4.integerToDer(params.saltLength).getBytes())
        ]));
      }

      return asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, parts);

    default:
      return asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.NULL, false, '');
  }
}

/**
 * Converts a certification request's attributes to an ASN.1 set of
 * CRIAttributes.
 *
 * @param csr certification request.
 *
 * @return the ASN.1 set of CRIAttributes.
 */
function _CRIAttributesToAsn1(csr) {
  // create an empty context-specific container
  var rval = asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 0, true, []);

  // no attributes, return empty container
  if(csr.attributes.length === 0) {
    return rval;
  }

  // each attribute has a sequence with a type and a set of values
  var attrs = csr.attributes;
  for(var i = 0; i < attrs.length; ++i) {
    var attr = attrs[i];
    var value = attr.value;

    // reuse tag class for attribute value if available
    var valueTagClass = asn1$4.Type.UTF8;
    if('valueTagClass' in attr) {
      valueTagClass = attr.valueTagClass;
    }
    if(valueTagClass === asn1$4.Type.UTF8) {
      value = forge$e.util.encodeUtf8(value);
    }
    var valueConstructed = false;
    if('valueConstructed' in attr) {
      valueConstructed = attr.valueConstructed;
    }
    // FIXME: handle more encodings

    // create a RelativeDistinguishedName set
    // each value in the set is an AttributeTypeAndValue first
    // containing the type (an OID) and second the value
    var seq = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
      // AttributeType
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
        asn1$4.oidToDer(attr.type).getBytes()),
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SET, true, [
        // AttributeValue
        asn1$4.create(
          asn1$4.Class.UNIVERSAL, valueTagClass, valueConstructed, value)
      ])
    ]);
    rval.value.push(seq);
  }

  return rval;
}

var jan_1_1950 = new Date('1950-01-01T00:00:00Z');
var jan_1_2050 = new Date('2050-01-01T00:00:00Z');

/**
 * Converts a Date object to ASN.1
 * Handles the different format before and after 1st January 2050
 *
 * @param date date object.
 *
 * @return the ASN.1 object representing the date.
 */
function _dateToAsn1(date) {
  if(date >= jan_1_1950 && date < jan_1_2050) {
    return asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.UTCTIME, false,
      asn1$4.dateToUtcTime(date));
  } else {
    return asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.GENERALIZEDTIME, false,
      asn1$4.dateToGeneralizedTime(date));
  }
}

/**
 * Gets the ASN.1 TBSCertificate part of an X.509v3 certificate.
 *
 * @param cert the certificate.
 *
 * @return the asn1 TBSCertificate.
 */
pki$2.getTBSCertificate = function(cert) {
  // TBSCertificate
  var notBefore = _dateToAsn1(cert.validity.notBefore);
  var notAfter = _dateToAsn1(cert.validity.notAfter);
  var tbs = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
    // version
    asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 0, true, [
      // integer
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.INTEGER, false,
        asn1$4.integerToDer(cert.version).getBytes())
    ]),
    // serialNumber
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.INTEGER, false,
      forge$e.util.hexToBytes(cert.serialNumber)),
    // signature
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
      // algorithm
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
        asn1$4.oidToDer(cert.siginfo.algorithmOid).getBytes()),
      // parameters
      _signatureParametersToAsn1(
        cert.siginfo.algorithmOid, cert.siginfo.parameters)
    ]),
    // issuer
    _dnToAsn1(cert.issuer),
    // validity
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
      notBefore,
      notAfter
    ]),
    // subject
    _dnToAsn1(cert.subject),
    // SubjectPublicKeyInfo
    pki$2.publicKeyToAsn1(cert.publicKey)
  ]);

  if(cert.issuer.uniqueId) {
    // issuerUniqueID (optional)
    tbs.value.push(
      asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 1, true, [
        asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false,
          // TODO: support arbitrary bit length ids
          String.fromCharCode(0x00) +
          cert.issuer.uniqueId
        )
      ])
    );
  }
  if(cert.subject.uniqueId) {
    // subjectUniqueID (optional)
    tbs.value.push(
      asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 2, true, [
        asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false,
          // TODO: support arbitrary bit length ids
          String.fromCharCode(0x00) +
          cert.subject.uniqueId
        )
      ])
    );
  }

  if(cert.extensions.length > 0) {
    // extensions (optional)
    tbs.value.push(pki$2.certificateExtensionsToAsn1(cert.extensions));
  }

  return tbs;
};

/**
 * Gets the ASN.1 CertificationRequestInfo part of a
 * PKCS#10 CertificationRequest.
 *
 * @param csr the certification request.
 *
 * @return the asn1 CertificationRequestInfo.
 */
pki$2.getCertificationRequestInfo = function(csr) {
  // CertificationRequestInfo
  var cri = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
    // version
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.INTEGER, false,
      asn1$4.integerToDer(csr.version).getBytes()),
    // subject
    _dnToAsn1(csr.subject),
    // SubjectPublicKeyInfo
    pki$2.publicKeyToAsn1(csr.publicKey),
    // attributes
    _CRIAttributesToAsn1(csr)
  ]);

  return cri;
};

/**
 * Converts a DistinguishedName (subject or issuer) to an ASN.1 object.
 *
 * @param dn the DistinguishedName.
 *
 * @return the asn1 representation of a DistinguishedName.
 */
pki$2.distinguishedNameToAsn1 = function(dn) {
  return _dnToAsn1(dn);
};

/**
 * Converts an X.509v3 RSA certificate to an ASN.1 object.
 *
 * @param cert the certificate.
 *
 * @return the asn1 representation of an X.509v3 RSA certificate.
 */
pki$2.certificateToAsn1 = function(cert) {
  // prefer cached TBSCertificate over generating one
  var tbsCertificate = cert.tbsCertificate || pki$2.getTBSCertificate(cert);

  // Certificate
  return asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
    // TBSCertificate
    tbsCertificate,
    // AlgorithmIdentifier (signature algorithm)
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
      // algorithm
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
        asn1$4.oidToDer(cert.signatureOid).getBytes()),
      // parameters
      _signatureParametersToAsn1(cert.signatureOid, cert.signatureParameters)
    ]),
    // SignatureValue
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false,
      String.fromCharCode(0x00) + cert.signature)
  ]);
};

/**
 * Converts X.509v3 certificate extensions to ASN.1.
 *
 * @param exts the extensions to convert.
 *
 * @return the extensions in ASN.1 format.
 */
pki$2.certificateExtensionsToAsn1 = function(exts) {
  // create top-level extension container
  var rval = asn1$4.create(asn1$4.Class.CONTEXT_SPECIFIC, 3, true, []);

  // create extension sequence (stores a sequence for each extension)
  var seq = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);
  rval.value.push(seq);

  for(var i = 0; i < exts.length; ++i) {
    seq.value.push(pki$2.certificateExtensionToAsn1(exts[i]));
  }

  return rval;
};

/**
 * Converts a single certificate extension to ASN.1.
 *
 * @param ext the extension to convert.
 *
 * @return the extension in ASN.1 format.
 */
pki$2.certificateExtensionToAsn1 = function(ext) {
  // create a sequence for each extension
  var extseq = asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, []);

  // extnID (OID)
  extseq.value.push(asn1$4.create(
    asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
    asn1$4.oidToDer(ext.id).getBytes()));

  // critical defaults to false
  if(ext.critical) {
    // critical BOOLEAN DEFAULT FALSE
    extseq.value.push(asn1$4.create(
      asn1$4.Class.UNIVERSAL, asn1$4.Type.BOOLEAN, false,
      String.fromCharCode(0xFF)));
  }

  var value = ext.value;
  if(typeof ext.value !== 'string') {
    // value is asn.1
    value = asn1$4.toDer(value).getBytes();
  }

  // extnValue (OCTET STRING)
  extseq.value.push(asn1$4.create(
    asn1$4.Class.UNIVERSAL, asn1$4.Type.OCTETSTRING, false, value));

  return extseq;
};

/**
 * Converts a PKCS#10 certification request to an ASN.1 object.
 *
 * @param csr the certification request.
 *
 * @return the asn1 representation of a certification request.
 */
pki$2.certificationRequestToAsn1 = function(csr) {
  // prefer cached CertificationRequestInfo over generating one
  var cri = csr.certificationRequestInfo ||
    pki$2.getCertificationRequestInfo(csr);

  // Certificate
  return asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
    // CertificationRequestInfo
    cri,
    // AlgorithmIdentifier (signature algorithm)
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.SEQUENCE, true, [
      // algorithm
      asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.OID, false,
        asn1$4.oidToDer(csr.signatureOid).getBytes()),
      // parameters
      _signatureParametersToAsn1(csr.signatureOid, csr.signatureParameters)
    ]),
    // signature
    asn1$4.create(asn1$4.Class.UNIVERSAL, asn1$4.Type.BITSTRING, false,
      String.fromCharCode(0x00) + csr.signature)
  ]);
};

/**
 * Creates a CA store.
 *
 * @param certs an optional array of certificate objects or PEM-formatted
 *          certificate strings to add to the CA store.
 *
 * @return the CA store.
 */
pki$2.createCaStore = function(certs) {
  // create CA store
  var caStore = {
    // stored certificates
    certs: {}
  };

  /**
   * Gets the certificate that issued the passed certificate or its
   * 'parent'.
   *
   * @param cert the certificate to get the parent for.
   *
   * @return the parent certificate or null if none was found.
   */
  caStore.getIssuer = function(cert) {
    var rval = getBySubject(cert.issuer);

    // see if there are multiple matches
    /*if(forge.util.isArray(rval)) {
      // TODO: resolve multiple matches by checking
      // authorityKey/subjectKey/issuerUniqueID/other identifiers, etc.
      // FIXME: or alternatively do authority key mapping
      // if possible (X.509v1 certs can't work?)
      throw new Error('Resolving multiple issuer matches not implemented yet.');
    }*/

    return rval;
  };

  /**
   * Adds a trusted certificate to the store.
   *
   * @param cert the certificate to add as a trusted certificate (either a
   *          pki.certificate object or a PEM-formatted certificate).
   */
  caStore.addCertificate = function(cert) {
    // convert from pem if necessary
    if(typeof cert === 'string') {
      cert = forge$e.pki.certificateFromPem(cert);
    }

    ensureSubjectHasHash(cert.subject);

    if(!caStore.hasCertificate(cert)) { // avoid duplicate certificates in store
      if(cert.subject.hash in caStore.certs) {
        // subject hash already exists, append to array
        var tmp = caStore.certs[cert.subject.hash];
        if(!forge$e.util.isArray(tmp)) {
          tmp = [tmp];
        }
        tmp.push(cert);
        caStore.certs[cert.subject.hash] = tmp;
      } else {
        caStore.certs[cert.subject.hash] = cert;
      }
    }
  };

  /**
   * Checks to see if the given certificate is in the store.
   *
   * @param cert the certificate to check (either a pki.certificate or a
   *          PEM-formatted certificate).
   *
   * @return true if the certificate is in the store, false if not.
   */
  caStore.hasCertificate = function(cert) {
    // convert from pem if necessary
    if(typeof cert === 'string') {
      cert = forge$e.pki.certificateFromPem(cert);
    }

    var match = getBySubject(cert.subject);
    if(!match) {
      return false;
    }
    if(!forge$e.util.isArray(match)) {
      match = [match];
    }
    // compare DER-encoding of certificates
    var der1 = asn1$4.toDer(pki$2.certificateToAsn1(cert)).getBytes();
    for(var i = 0; i < match.length; ++i) {
      var der2 = asn1$4.toDer(pki$2.certificateToAsn1(match[i])).getBytes();
      if(der1 === der2) {
        return true;
      }
    }
    return false;
  };

  /**
   * Lists all of the certificates kept in the store.
   *
   * @return an array of all of the pki.certificate objects in the store.
   */
  caStore.listAllCertificates = function() {
    var certList = [];

    for(var hash in caStore.certs) {
      if(caStore.certs.hasOwnProperty(hash)) {
        var value = caStore.certs[hash];
        if(!forge$e.util.isArray(value)) {
          certList.push(value);
        } else {
          for(var i = 0; i < value.length; ++i) {
            certList.push(value[i]);
          }
        }
      }
    }

    return certList;
  };

  /**
   * Removes a certificate from the store.
   *
   * @param cert the certificate to remove (either a pki.certificate or a
   *          PEM-formatted certificate).
   *
   * @return the certificate that was removed or null if the certificate
   *           wasn't in store.
   */
  caStore.removeCertificate = function(cert) {
    var result;

    // convert from pem if necessary
    if(typeof cert === 'string') {
      cert = forge$e.pki.certificateFromPem(cert);
    }
    ensureSubjectHasHash(cert.subject);
    if(!caStore.hasCertificate(cert)) {
      return null;
    }

    var match = getBySubject(cert.subject);

    if(!forge$e.util.isArray(match)) {
      result = caStore.certs[cert.subject.hash];
      delete caStore.certs[cert.subject.hash];
      return result;
    }

    // compare DER-encoding of certificates
    var der1 = asn1$4.toDer(pki$2.certificateToAsn1(cert)).getBytes();
    for(var i = 0; i < match.length; ++i) {
      var der2 = asn1$4.toDer(pki$2.certificateToAsn1(match[i])).getBytes();
      if(der1 === der2) {
        result = match[i];
        match.splice(i, 1);
      }
    }
    if(match.length === 0) {
      delete caStore.certs[cert.subject.hash];
    }

    return result;
  };

  function getBySubject(subject) {
    ensureSubjectHasHash(subject);
    return caStore.certs[subject.hash] || null;
  }

  function ensureSubjectHasHash(subject) {
    // produce subject hash if it doesn't exist
    if(!subject.hash) {
      var md = forge$e.md.sha1.create();
      subject.attributes = pki$2.RDNAttributesAsArray(_dnToAsn1(subject), md);
      subject.hash = md.digest().toHex();
    }
  }

  // auto-add passed in certs
  if(certs) {
    // parse PEM-formatted certificates as necessary
    for(var i = 0; i < certs.length; ++i) {
      var cert = certs[i];
      caStore.addCertificate(cert);
    }
  }

  return caStore;
};

/**
 * Certificate verification errors, based on TLS.
 */
pki$2.certificateError = {
  bad_certificate: 'forge.pki.BadCertificate',
  unsupported_certificate: 'forge.pki.UnsupportedCertificate',
  certificate_revoked: 'forge.pki.CertificateRevoked',
  certificate_expired: 'forge.pki.CertificateExpired',
  certificate_unknown: 'forge.pki.CertificateUnknown',
  unknown_ca: 'forge.pki.UnknownCertificateAuthority'
};

/**
 * Verifies a certificate chain against the given Certificate Authority store
 * with an optional custom verify callback.
 *
 * @param caStore a certificate store to verify against.
 * @param chain the certificate chain to verify, with the root or highest
 *          authority at the end (an array of certificates).
 * @param options a callback to be called for every certificate in the chain or
 *                  an object with:
 *                  verify a callback to be called for every certificate in the
 *                    chain
 *                  validityCheckDate the date against which the certificate
 *                    validity period should be checked. Pass null to not check
 *                    the validity period. By default, the current date is used.
 *
 * The verify callback has the following signature:
 *
 * verified - Set to true if certificate was verified, otherwise the
 *   pki.certificateError for why the certificate failed.
 * depth - The current index in the chain, where 0 is the end point's cert.
 * certs - The certificate chain, *NOTE* an empty chain indicates an anonymous
 *   end point.
 *
 * The function returns true on success and on failure either the appropriate
 * pki.certificateError or an object with 'error' set to the appropriate
 * pki.certificateError and 'message' set to a custom error message.
 *
 * @return true if successful, error thrown if not.
 */
pki$2.verifyCertificateChain = function(caStore, chain, options) {
  /* From: RFC3280 - Internet X.509 Public Key Infrastructure Certificate
    Section 6: Certification Path Validation
    See inline parentheticals related to this particular implementation.

    The primary goal of path validation is to verify the binding between
    a subject distinguished name or a subject alternative name and subject
    public key, as represented in the end entity certificate, based on the
    public key of the trust anchor. This requires obtaining a sequence of
    certificates that support that binding. That sequence should be provided
    in the passed 'chain'. The trust anchor should be in the given CA
    store. The 'end entity' certificate is the certificate provided by the
    end point (typically a server) and is the first in the chain.

    To meet this goal, the path validation process verifies, among other
    things, that a prospective certification path (a sequence of n
    certificates or a 'chain') satisfies the following conditions:

    (a) for all x in {1, ..., n-1}, the subject of certificate x is
          the issuer of certificate x+1;

    (b) certificate 1 is issued by the trust anchor;

    (c) certificate n is the certificate to be validated; and

    (d) for all x in {1, ..., n}, the certificate was valid at the
          time in question.

    Note that here 'n' is index 0 in the chain and 1 is the last certificate
    in the chain and it must be signed by a certificate in the connection's
    CA store.

    The path validation process also determines the set of certificate
    policies that are valid for this path, based on the certificate policies
    extension, policy mapping extension, policy constraints extension, and
    inhibit any-policy extension.

    Note: Policy mapping extension not supported (Not Required).

    Note: If the certificate has an unsupported critical extension, then it
    must be rejected.

    Note: A certificate is self-issued if the DNs that appear in the subject
    and issuer fields are identical and are not empty.

    The path validation algorithm assumes the following seven inputs are
    provided to the path processing logic. What this specific implementation
    will use is provided parenthetically:

    (a) a prospective certification path of length n (the 'chain')
    (b) the current date/time: ('now').
    (c) user-initial-policy-set: A set of certificate policy identifiers
          naming the policies that are acceptable to the certificate user.
          The user-initial-policy-set contains the special value any-policy
          if the user is not concerned about certificate policy
          (Not implemented. Any policy is accepted).
    (d) trust anchor information, describing a CA that serves as a trust
          anchor for the certification path. The trust anchor information
          includes:

      (1)  the trusted issuer name,
      (2)  the trusted public key algorithm,
      (3)  the trusted public key, and
      (4)  optionally, the trusted public key parameters associated
             with the public key.

      (Trust anchors are provided via certificates in the CA store).

      The trust anchor information may be provided to the path processing
      procedure in the form of a self-signed certificate. The trusted anchor
      information is trusted because it was delivered to the path processing
      procedure by some trustworthy out-of-band procedure. If the trusted
      public key algorithm requires parameters, then the parameters are
      provided along with the trusted public key (No parameters used in this
      implementation).

    (e) initial-policy-mapping-inhibit, which indicates if policy mapping is
          allowed in the certification path.
          (Not implemented, no policy checking)

    (f) initial-explicit-policy, which indicates if the path must be valid
          for at least one of the certificate policies in the user-initial-
          policy-set.
          (Not implemented, no policy checking)

    (g) initial-any-policy-inhibit, which indicates whether the
          anyPolicy OID should be processed if it is included in a
          certificate.
          (Not implemented, so any policy is valid provided that it is
          not marked as critical) */

  /* Basic Path Processing:

    For each certificate in the 'chain', the following is checked:

    1. The certificate validity period includes the current time.
    2. The certificate was signed by its parent (where the parent is either
       the next in the chain or from the CA store). Allow processing to
       continue to the next step if no parent is found but the certificate is
       in the CA store.
    3. TODO: The certificate has not been revoked.
    4. The certificate issuer name matches the parent's subject name.
    5. TODO: If the certificate is self-issued and not the final certificate
       in the chain, skip this step, otherwise verify that the subject name
       is within one of the permitted subtrees of X.500 distinguished names
       and that each of the alternative names in the subjectAltName extension
       (critical or non-critical) is within one of the permitted subtrees for
       that name type.
    6. TODO: If the certificate is self-issued and not the final certificate
       in the chain, skip this step, otherwise verify that the subject name
       is not within one of the excluded subtrees for X.500 distinguished
       names and none of the subjectAltName extension names are excluded for
       that name type.
    7. The other steps in the algorithm for basic path processing involve
       handling the policy extension which is not presently supported in this
       implementation. Instead, if a critical policy extension is found, the
       certificate is rejected as not supported.
    8. If the certificate is not the first or if its the only certificate in
       the chain (having no parent from the CA store or is self-signed) and it
       has a critical key usage extension, verify that the keyCertSign bit is
       set. If the key usage extension exists, verify that the basic
       constraints extension exists. If the basic constraints extension exists,
       verify that the cA flag is set. If pathLenConstraint is set, ensure that
       the number of certificates that precede in the chain (come earlier
       in the chain as implemented below), excluding the very first in the
       chain (typically the end-entity one), isn't greater than the
       pathLenConstraint. This constraint limits the number of intermediate
       CAs that may appear below a CA before only end-entity certificates
       may be issued. */

  // if a verify callback is passed as the third parameter, package it within
  // the options object. This is to support a legacy function signature that
  // expected the verify callback as the third parameter.
  if(typeof options === 'function') {
    options = {verify: options};
  }
  options = options || {};

  // copy cert chain references to another array to protect against changes
  // in verify callback
  chain = chain.slice(0);
  var certs = chain.slice(0);

  var validityCheckDate = options.validityCheckDate;
  // if no validityCheckDate is specified, default to the current date. Make
  // sure to maintain the value null because it indicates that the validity
  // period should not be checked.
  if(typeof validityCheckDate === 'undefined') {
    validityCheckDate = new Date();
  }

  // verify each cert in the chain using its parent, where the parent
  // is either the next in the chain or from the CA store
  var first = true;
  var error = null;
  var depth = 0;
  do {
    var cert = chain.shift();
    var parent = null;
    var selfSigned = false;

    if(validityCheckDate) {
      // 1. check valid time
      if(validityCheckDate < cert.validity.notBefore ||
         validityCheckDate > cert.validity.notAfter) {
        error = {
          message: 'Certificate is not valid yet or has expired.',
          error: pki$2.certificateError.certificate_expired,
          notBefore: cert.validity.notBefore,
          notAfter: cert.validity.notAfter,
          // TODO: we might want to reconsider renaming 'now' to
          // 'validityCheckDate' should this API be changed in the future.
          now: validityCheckDate
        };
      }
    }

    // 2. verify with parent from chain or CA store
    if(error === null) {
      parent = chain[0] || caStore.getIssuer(cert);
      if(parent === null) {
        // check for self-signed cert
        if(cert.isIssuer(cert)) {
          selfSigned = true;
          parent = cert;
        }
      }

      if(parent) {
        // FIXME: current CA store implementation might have multiple
        // certificates where the issuer can't be determined from the
        // certificate (happens rarely with, eg: old certificates) so normalize
        // by always putting parents into an array
        // TODO: there's may be an extreme degenerate case currently uncovered
        // where an old intermediate certificate seems to have a matching parent
        // but none of the parents actually verify ... but the intermediate
        // is in the CA and it should pass this check; needs investigation
        var parents = parent;
        if(!forge$e.util.isArray(parents)) {
          parents = [parents];
        }

        // try to verify with each possible parent (typically only one)
        var verified = false;
        while(!verified && parents.length > 0) {
          parent = parents.shift();
          try {
            verified = parent.verify(cert);
          } catch(ex) {
            // failure to verify, don't care why, try next one
          }
        }

        if(!verified) {
          error = {
            message: 'Certificate signature is invalid.',
            error: pki$2.certificateError.bad_certificate
          };
        }
      }

      if(error === null && (!parent || selfSigned) &&
        !caStore.hasCertificate(cert)) {
        // no parent issuer and certificate itself is not trusted
        error = {
          message: 'Certificate is not trusted.',
          error: pki$2.certificateError.unknown_ca
        };
      }
    }

    // TODO: 3. check revoked

    // 4. check for matching issuer/subject
    if(error === null && parent && !cert.isIssuer(parent)) {
      // parent is not issuer
      error = {
        message: 'Certificate issuer is invalid.',
        error: pki$2.certificateError.bad_certificate
      };
    }

    // 5. TODO: check names with permitted names tree

    // 6. TODO: check names against excluded names tree

    // 7. check for unsupported critical extensions
    if(error === null) {
      // supported extensions
      var se = {
        keyUsage: true,
        basicConstraints: true
      };
      for(var i = 0; error === null && i < cert.extensions.length; ++i) {
        var ext = cert.extensions[i];
        if(ext.critical && !(ext.name in se)) {
          error = {
            message:
              'Certificate has an unsupported critical extension.',
            error: pki$2.certificateError.unsupported_certificate
          };
        }
      }
    }

    // 8. check for CA if cert is not first or is the only certificate
    // remaining in chain with no parent or is self-signed
    if(error === null &&
      (!first || (chain.length === 0 && (!parent || selfSigned)))) {
      // first check keyUsage extension and then basic constraints
      var bcExt = cert.getExtension('basicConstraints');
      var keyUsageExt = cert.getExtension('keyUsage');
      if(keyUsageExt !== null) {
        // keyCertSign must be true and there must be a basic
        // constraints extension
        if(!keyUsageExt.keyCertSign || bcExt === null) {
          // bad certificate
          error = {
            message:
              'Certificate keyUsage or basicConstraints conflict ' +
              'or indicate that the certificate is not a CA. ' +
              'If the certificate is the only one in the chain or ' +
              'isn\'t the first then the certificate must be a ' +
              'valid CA.',
            error: pki$2.certificateError.bad_certificate
          };
        }
      }
      // basic constraints cA flag must be set
      if(error === null && bcExt !== null && !bcExt.cA) {
        // bad certificate
        error = {
          message:
            'Certificate basicConstraints indicates the certificate ' +
            'is not a CA.',
          error: pki$2.certificateError.bad_certificate
        };
      }
      // if error is not null and keyUsage is available, then we know it
      // has keyCertSign and there is a basic constraints extension too,
      // which means we can check pathLenConstraint (if it exists)
      if(error === null && keyUsageExt !== null &&
        'pathLenConstraint' in bcExt) {
        // pathLen is the maximum # of intermediate CA certs that can be
        // found between the current certificate and the end-entity (depth 0)
        // certificate; this number does not include the end-entity (depth 0,
        // last in the chain) even if it happens to be a CA certificate itself
        var pathLen = depth - 1;
        if(pathLen > bcExt.pathLenConstraint) {
          // pathLenConstraint violated, bad certificate
          error = {
            message:
              'Certificate basicConstraints pathLenConstraint violated.',
            error: pki$2.certificateError.bad_certificate
          };
        }
      }
    }

    // call application callback
    var vfd = (error === null) ? true : error.error;
    var ret = options.verify ? options.verify(vfd, depth, certs) : vfd;
    if(ret === true) {
      // clear any set error
      error = null;
    } else {
      // if passed basic tests, set default message and alert
      if(vfd === true) {
        error = {
          message: 'The application rejected the certificate.',
          error: pki$2.certificateError.bad_certificate
        };
      }

      // check for custom error info
      if(ret || ret === 0) {
        // set custom message and error
        if(typeof ret === 'object' && !forge$e.util.isArray(ret)) {
          if(ret.message) {
            error.message = ret.message;
          }
          if(ret.error) {
            error.error = ret.error;
          }
        } else if(typeof ret === 'string') {
          // set custom error
          error.error = ret;
        }
      }

      // throw error
      throw error;
    }

    // no longer first cert in chain
    first = false;
    ++depth;
  } while(chain.length > 0);

  return true;
};

/**
 * Javascript implementation of PKCS#12.
 *
 * @author Dave Longley
 * @author Stefan Siegl <stesie@brokenpipe.de>
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 *
 * The ASN.1 representation of PKCS#12 is as follows
 * (see ftp://ftp.rsasecurity.com/pub/pkcs/pkcs-12/pkcs-12-tc1.pdf for details)
 *
 * PFX ::= SEQUENCE {
 *   version  INTEGER {v3(3)}(v3,...),
 *   authSafe ContentInfo,
 *   macData  MacData OPTIONAL
 * }
 *
 * MacData ::= SEQUENCE {
 *   mac DigestInfo,
 *   macSalt OCTET STRING,
 *   iterations INTEGER DEFAULT 1
 * }
 * Note: The iterations default is for historical reasons and its use is
 * deprecated. A higher value, like 1024, is recommended.
 *
 * DigestInfo is defined in PKCS#7 as follows:
 *
 * DigestInfo ::= SEQUENCE {
 *   digestAlgorithm DigestAlgorithmIdentifier,
 *   digest Digest
 * }
 *
 * DigestAlgorithmIdentifier ::= AlgorithmIdentifier
 *
 * The AlgorithmIdentifier contains an Object Identifier (OID) and parameters
 * for the algorithm, if any. In the case of SHA1 there is none.
 *
 * AlgorithmIdentifer ::= SEQUENCE {
 *    algorithm OBJECT IDENTIFIER,
 *    parameters ANY DEFINED BY algorithm OPTIONAL
 * }
 *
 * Digest ::= OCTET STRING
 *
 *
 * ContentInfo ::= SEQUENCE {
 *   contentType ContentType,
 *   content     [0] EXPLICIT ANY DEFINED BY contentType OPTIONAL
 * }
 *
 * ContentType ::= OBJECT IDENTIFIER
 *
 * AuthenticatedSafe ::= SEQUENCE OF ContentInfo
 * -- Data if unencrypted
 * -- EncryptedData if password-encrypted
 * -- EnvelopedData if public key-encrypted
 *
 *
 * SafeContents ::= SEQUENCE OF SafeBag
 *
 * SafeBag ::= SEQUENCE {
 *   bagId     BAG-TYPE.&id ({PKCS12BagSet})
 *   bagValue  [0] EXPLICIT BAG-TYPE.&Type({PKCS12BagSet}{@bagId}),
 *   bagAttributes SET OF PKCS12Attribute OPTIONAL
 * }
 *
 * PKCS12Attribute ::= SEQUENCE {
 *   attrId ATTRIBUTE.&id ({PKCS12AttrSet}),
 *   attrValues SET OF ATTRIBUTE.&Type ({PKCS12AttrSet}{@attrId})
 * } -- This type is compatible with the X.500 type 'Attribute'
 *
 * PKCS12AttrSet ATTRIBUTE ::= {
 *   friendlyName | -- from PKCS #9
 *   localKeyId, -- from PKCS #9
 *   ... -- Other attributes are allowed
 * }
 *
 * CertBag ::= SEQUENCE {
 *   certId    BAG-TYPE.&id   ({CertTypes}),
 *   certValue [0] EXPLICIT BAG-TYPE.&Type ({CertTypes}{@certId})
 * }
 *
 * x509Certificate BAG-TYPE ::= {OCTET STRING IDENTIFIED BY {certTypes 1}}
 *   -- DER-encoded X.509 certificate stored in OCTET STRING
 *
 * sdsiCertificate BAG-TYPE ::= {IA5String IDENTIFIED BY {certTypes 2}}
 * -- Base64-encoded SDSI certificate stored in IA5String
 *
 * CertTypes BAG-TYPE ::= {
 *   x509Certificate |
 *   sdsiCertificate,
 *   ... -- For future extensions
 * }
 */

var forge$d = forge$F;











// shortcut for asn.1 & PKI API
var asn1$3 = forge$d.asn1;
var pki$1 = forge$d.pki;

// shortcut for PKCS#12 API
var p12 = forge$d.pkcs12 = forge$d.pkcs12 || {};

var contentInfoValidator = {
  name: 'ContentInfo',
  tagClass: asn1$3.Class.UNIVERSAL,
  type: asn1$3.Type.SEQUENCE,  // a ContentInfo
  constructed: true,
  value: [{
    name: 'ContentInfo.contentType',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.OID,
    constructed: false,
    capture: 'contentType'
  }, {
    name: 'ContentInfo.content',
    tagClass: asn1$3.Class.CONTEXT_SPECIFIC,
    constructed: true,
    captureAsn1: 'content'
  }]
};

var pfxValidator = {
  name: 'PFX',
  tagClass: asn1$3.Class.UNIVERSAL,
  type: asn1$3.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'PFX.version',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.INTEGER,
    constructed: false,
    capture: 'version'
  },
  contentInfoValidator, {
    name: 'PFX.macData',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.SEQUENCE,
    constructed: true,
    optional: true,
    captureAsn1: 'mac',
    value: [{
      name: 'PFX.macData.mac',
      tagClass: asn1$3.Class.UNIVERSAL,
      type: asn1$3.Type.SEQUENCE,  // DigestInfo
      constructed: true,
      value: [{
        name: 'PFX.macData.mac.digestAlgorithm',
        tagClass: asn1$3.Class.UNIVERSAL,
        type: asn1$3.Type.SEQUENCE,  // DigestAlgorithmIdentifier
        constructed: true,
        value: [{
          name: 'PFX.macData.mac.digestAlgorithm.algorithm',
          tagClass: asn1$3.Class.UNIVERSAL,
          type: asn1$3.Type.OID,
          constructed: false,
          capture: 'macAlgorithm'
        }, {
          name: 'PFX.macData.mac.digestAlgorithm.parameters',
          tagClass: asn1$3.Class.UNIVERSAL,
          captureAsn1: 'macAlgorithmParameters'
        }]
      }, {
        name: 'PFX.macData.mac.digest',
        tagClass: asn1$3.Class.UNIVERSAL,
        type: asn1$3.Type.OCTETSTRING,
        constructed: false,
        capture: 'macDigest'
      }]
    }, {
      name: 'PFX.macData.macSalt',
      tagClass: asn1$3.Class.UNIVERSAL,
      type: asn1$3.Type.OCTETSTRING,
      constructed: false,
      capture: 'macSalt'
    }, {
      name: 'PFX.macData.iterations',
      tagClass: asn1$3.Class.UNIVERSAL,
      type: asn1$3.Type.INTEGER,
      constructed: false,
      optional: true,
      capture: 'macIterations'
    }]
  }]
};

var safeBagValidator = {
  name: 'SafeBag',
  tagClass: asn1$3.Class.UNIVERSAL,
  type: asn1$3.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'SafeBag.bagId',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.OID,
    constructed: false,
    capture: 'bagId'
  }, {
    name: 'SafeBag.bagValue',
    tagClass: asn1$3.Class.CONTEXT_SPECIFIC,
    constructed: true,
    captureAsn1: 'bagValue'
  }, {
    name: 'SafeBag.bagAttributes',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.SET,
    constructed: true,
    optional: true,
    capture: 'bagAttributes'
  }]
};

var attributeValidator = {
  name: 'Attribute',
  tagClass: asn1$3.Class.UNIVERSAL,
  type: asn1$3.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'Attribute.attrId',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.OID,
    constructed: false,
    capture: 'oid'
  }, {
    name: 'Attribute.attrValues',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.SET,
    constructed: true,
    capture: 'values'
  }]
};

var certBagValidator = {
  name: 'CertBag',
  tagClass: asn1$3.Class.UNIVERSAL,
  type: asn1$3.Type.SEQUENCE,
  constructed: true,
  value: [{
    name: 'CertBag.certId',
    tagClass: asn1$3.Class.UNIVERSAL,
    type: asn1$3.Type.OID,
    constructed: false,
    capture: 'certId'
  }, {
    name: 'CertBag.certValue',
    tagClass: asn1$3.Class.CONTEXT_SPECIFIC,
    constructed: true,
    /* So far we only support X.509 certificates (which are wrapped in
       an OCTET STRING, hence hard code that here). */
    value: [{
      name: 'CertBag.certValue[0]',
      tagClass: asn1$3.Class.UNIVERSAL,
      type: asn1$3.Class.OCTETSTRING,
      constructed: false,
      capture: 'cert'
    }]
  }]
};

/**
 * Search SafeContents structure for bags with matching attributes.
 *
 * The search can optionally be narrowed by a certain bag type.
 *
 * @param safeContents the SafeContents structure to search in.
 * @param attrName the name of the attribute to compare against.
 * @param attrValue the attribute value to search for.
 * @param [bagType] bag type to narrow search by.
 *
 * @return an array of matching bags.
 */
function _getBagsByAttribute(safeContents, attrName, attrValue, bagType) {
  var result = [];

  for(var i = 0; i < safeContents.length; i++) {
    for(var j = 0; j < safeContents[i].safeBags.length; j++) {
      var bag = safeContents[i].safeBags[j];
      if(bagType !== undefined && bag.type !== bagType) {
        continue;
      }
      // only filter by bag type, no attribute specified
      if(attrName === null) {
        result.push(bag);
        continue;
      }
      if(bag.attributes[attrName] !== undefined &&
        bag.attributes[attrName].indexOf(attrValue) >= 0) {
        result.push(bag);
      }
    }
  }

  return result;
}

/**
 * Converts a PKCS#12 PFX in ASN.1 notation into a PFX object.
 *
 * @param obj The PKCS#12 PFX in ASN.1 notation.
 * @param strict true to use strict DER decoding, false not to (default: true).
 * @param {String} password Password to decrypt with (optional).
 *
 * @return PKCS#12 PFX object.
 */
p12.pkcs12FromAsn1 = function(obj, strict, password) {
  // handle args
  if(typeof strict === 'string') {
    password = strict;
    strict = true;
  } else if(strict === undefined) {
    strict = true;
  }

  // validate PFX and capture data
  var capture = {};
  var errors = [];
  if(!asn1$3.validate(obj, pfxValidator, capture, errors)) {
    var error = new Error('Cannot read PKCS#12 PFX. ' +
      'ASN.1 object is not an PKCS#12 PFX.');
    error.errors = error;
    throw error;
  }

  var pfx = {
    version: capture.version.charCodeAt(0),
    safeContents: [],

    /**
     * Gets bags with matching attributes.
     *
     * @param filter the attributes to filter by:
     *          [localKeyId] the localKeyId to search for.
     *          [localKeyIdHex] the localKeyId in hex to search for.
     *          [friendlyName] the friendly name to search for.
     *          [bagType] bag type to narrow each attribute search by.
     *
     * @return a map of attribute type to an array of matching bags or, if no
     *           attribute was given but a bag type, the map key will be the
     *           bag type.
     */
    getBags: function(filter) {
      var rval = {};

      var localKeyId;
      if('localKeyId' in filter) {
        localKeyId = filter.localKeyId;
      } else if('localKeyIdHex' in filter) {
        localKeyId = forge$d.util.hexToBytes(filter.localKeyIdHex);
      }

      // filter on bagType only
      if(localKeyId === undefined && !('friendlyName' in filter) &&
        'bagType' in filter) {
        rval[filter.bagType] = _getBagsByAttribute(
          pfx.safeContents, null, null, filter.bagType);
      }

      if(localKeyId !== undefined) {
        rval.localKeyId = _getBagsByAttribute(
          pfx.safeContents, 'localKeyId',
          localKeyId, filter.bagType);
      }
      if('friendlyName' in filter) {
        rval.friendlyName = _getBagsByAttribute(
          pfx.safeContents, 'friendlyName',
          filter.friendlyName, filter.bagType);
      }

      return rval;
    },

    /**
     * DEPRECATED: use getBags() instead.
     *
     * Get bags with matching friendlyName attribute.
     *
     * @param friendlyName the friendly name to search for.
     * @param [bagType] bag type to narrow search by.
     *
     * @return an array of bags with matching friendlyName attribute.
     */
    getBagsByFriendlyName: function(friendlyName, bagType) {
      return _getBagsByAttribute(
        pfx.safeContents, 'friendlyName', friendlyName, bagType);
    },

    /**
     * DEPRECATED: use getBags() instead.
     *
     * Get bags with matching localKeyId attribute.
     *
     * @param localKeyId the localKeyId to search for.
     * @param [bagType] bag type to narrow search by.
     *
     * @return an array of bags with matching localKeyId attribute.
     */
    getBagsByLocalKeyId: function(localKeyId, bagType) {
      return _getBagsByAttribute(
        pfx.safeContents, 'localKeyId', localKeyId, bagType);
    }
  };

  if(capture.version.charCodeAt(0) !== 3) {
    var error = new Error('PKCS#12 PFX of version other than 3 not supported.');
    error.version = capture.version.charCodeAt(0);
    throw error;
  }

  if(asn1$3.derToOid(capture.contentType) !== pki$1.oids.data) {
    var error = new Error('Only PKCS#12 PFX in password integrity mode supported.');
    error.oid = asn1$3.derToOid(capture.contentType);
    throw error;
  }

  var data = capture.content.value[0];
  if(data.tagClass !== asn1$3.Class.UNIVERSAL ||
     data.type !== asn1$3.Type.OCTETSTRING) {
    throw new Error('PKCS#12 authSafe content data is not an OCTET STRING.');
  }
  data = _decodePkcs7Data(data);

  // check for MAC
  if(capture.mac) {
    var md = null;
    var macKeyBytes = 0;
    var macAlgorithm = asn1$3.derToOid(capture.macAlgorithm);
    switch(macAlgorithm) {
    case pki$1.oids.sha1:
      md = forge$d.md.sha1.create();
      macKeyBytes = 20;
      break;
    case pki$1.oids.sha256:
      md = forge$d.md.sha256.create();
      macKeyBytes = 32;
      break;
    case pki$1.oids.sha384:
      md = forge$d.md.sha384.create();
      macKeyBytes = 48;
      break;
    case pki$1.oids.sha512:
      md = forge$d.md.sha512.create();
      macKeyBytes = 64;
      break;
    case pki$1.oids.md5:
      md = forge$d.md.md5.create();
      macKeyBytes = 16;
      break;
    }
    if(md === null) {
      throw new Error('PKCS#12 uses unsupported MAC algorithm: ' + macAlgorithm);
    }

    // verify MAC (iterations default to 1)
    var macSalt = new forge$d.util.ByteBuffer(capture.macSalt);
    var macIterations = (('macIterations' in capture) ?
      parseInt(forge$d.util.bytesToHex(capture.macIterations), 16) : 1);
    var macKey = p12.generateKey(
      password, macSalt, 3, macIterations, macKeyBytes, md);
    var mac = forge$d.hmac.create();
    mac.start(md, macKey);
    mac.update(data.value);
    var macValue = mac.getMac();
    if(macValue.getBytes() !== capture.macDigest) {
      throw new Error('PKCS#12 MAC could not be verified. Invalid password?');
    }
  }

  _decodeAuthenticatedSafe(pfx, data.value, strict, password);
  return pfx;
};

/**
 * Decodes PKCS#7 Data. PKCS#7 (RFC 2315) defines "Data" as an OCTET STRING,
 * but it is sometimes an OCTET STRING that is composed/constructed of chunks,
 * each its own OCTET STRING. This is BER-encoding vs. DER-encoding. This
 * function transforms this corner-case into the usual simple,
 * non-composed/constructed OCTET STRING.
 *
 * This function may be moved to ASN.1 at some point to better deal with
 * more BER-encoding issues, should they arise.
 *
 * @param data the ASN.1 Data object to transform.
 */
function _decodePkcs7Data(data) {
  // handle special case of "chunked" data content: an octet string composed
  // of other octet strings
  if(data.composed || data.constructed) {
    var value = forge$d.util.createBuffer();
    for(var i = 0; i < data.value.length; ++i) {
      value.putBytes(data.value[i].value);
    }
    data.composed = data.constructed = false;
    data.value = value.getBytes();
  }
  return data;
}

/**
 * Decode PKCS#12 AuthenticatedSafe (BER encoded) into PFX object.
 *
 * The AuthenticatedSafe is a BER-encoded SEQUENCE OF ContentInfo.
 *
 * @param pfx The PKCS#12 PFX object to fill.
 * @param {String} authSafe BER-encoded AuthenticatedSafe.
 * @param strict true to use strict DER decoding, false not to.
 * @param {String} password Password to decrypt with (optional).
 */
function _decodeAuthenticatedSafe(pfx, authSafe, strict, password) {
  authSafe = asn1$3.fromDer(authSafe, strict);  /* actually it's BER encoded */

  if(authSafe.tagClass !== asn1$3.Class.UNIVERSAL ||
     authSafe.type !== asn1$3.Type.SEQUENCE ||
     authSafe.constructed !== true) {
    throw new Error('PKCS#12 AuthenticatedSafe expected to be a ' +
      'SEQUENCE OF ContentInfo');
  }

  for(var i = 0; i < authSafe.value.length; i++) {
    var contentInfo = authSafe.value[i];

    // validate contentInfo and capture data
    var capture = {};
    var errors = [];
    if(!asn1$3.validate(contentInfo, contentInfoValidator, capture, errors)) {
      var error = new Error('Cannot read ContentInfo.');
      error.errors = errors;
      throw error;
    }

    var obj = {
      encrypted: false
    };
    var safeContents = null;
    var data = capture.content.value[0];
    switch(asn1$3.derToOid(capture.contentType)) {
    case pki$1.oids.data:
      if(data.tagClass !== asn1$3.Class.UNIVERSAL ||
         data.type !== asn1$3.Type.OCTETSTRING) {
        throw new Error('PKCS#12 SafeContents Data is not an OCTET STRING.');
      }
      safeContents = _decodePkcs7Data(data).value;
      break;
    case pki$1.oids.encryptedData:
      safeContents = _decryptSafeContents(data, password);
      obj.encrypted = true;
      break;
    default:
      var error = new Error('Unsupported PKCS#12 contentType.');
      error.contentType = asn1$3.derToOid(capture.contentType);
      throw error;
    }

    obj.safeBags = _decodeSafeContents(safeContents, strict, password);
    pfx.safeContents.push(obj);
  }
}

/**
 * Decrypt PKCS#7 EncryptedData structure.
 *
 * @param data ASN.1 encoded EncryptedContentInfo object.
 * @param password The user-provided password.
 *
 * @return The decrypted SafeContents (ASN.1 object).
 */
function _decryptSafeContents(data, password) {
  var capture = {};
  var errors = [];
  if(!asn1$3.validate(
    data, forge$d.pkcs7.asn1.encryptedDataValidator, capture, errors)) {
    var error = new Error('Cannot read EncryptedContentInfo.');
    error.errors = errors;
    throw error;
  }

  var oid = asn1$3.derToOid(capture.contentType);
  if(oid !== pki$1.oids.data) {
    var error = new Error(
      'PKCS#12 EncryptedContentInfo ContentType is not Data.');
    error.oid = oid;
    throw error;
  }

  // get cipher
  oid = asn1$3.derToOid(capture.encAlgorithm);
  var cipher = pki$1.pbe.getCipher(oid, capture.encParameter, password);

  // get encrypted data
  var encryptedContentAsn1 = _decodePkcs7Data(capture.encryptedContentAsn1);
  var encrypted = forge$d.util.createBuffer(encryptedContentAsn1.value);

  cipher.update(encrypted);
  if(!cipher.finish()) {
    throw new Error('Failed to decrypt PKCS#12 SafeContents.');
  }

  return cipher.output.getBytes();
}

/**
 * Decode PKCS#12 SafeContents (BER-encoded) into array of Bag objects.
 *
 * The safeContents is a BER-encoded SEQUENCE OF SafeBag.
 *
 * @param {String} safeContents BER-encoded safeContents.
 * @param strict true to use strict DER decoding, false not to.
 * @param {String} password Password to decrypt with (optional).
 *
 * @return {Array} Array of Bag objects.
 */
function _decodeSafeContents(safeContents, strict, password) {
  // if strict and no safe contents, return empty safes
  if(!strict && safeContents.length === 0) {
    return [];
  }

  // actually it's BER-encoded
  safeContents = asn1$3.fromDer(safeContents, strict);

  if(safeContents.tagClass !== asn1$3.Class.UNIVERSAL ||
    safeContents.type !== asn1$3.Type.SEQUENCE ||
    safeContents.constructed !== true) {
    throw new Error(
      'PKCS#12 SafeContents expected to be a SEQUENCE OF SafeBag.');
  }

  var res = [];
  for(var i = 0; i < safeContents.value.length; i++) {
    var safeBag = safeContents.value[i];

    // validate SafeBag and capture data
    var capture = {};
    var errors = [];
    if(!asn1$3.validate(safeBag, safeBagValidator, capture, errors)) {
      var error = new Error('Cannot read SafeBag.');
      error.errors = errors;
      throw error;
    }

    /* Create bag object and push to result array. */
    var bag = {
      type: asn1$3.derToOid(capture.bagId),
      attributes: _decodeBagAttributes(capture.bagAttributes)
    };
    res.push(bag);

    var validator, decoder;
    var bagAsn1 = capture.bagValue.value[0];
    switch(bag.type) {
      case pki$1.oids.pkcs8ShroudedKeyBag:
        /* bagAsn1 has a EncryptedPrivateKeyInfo, which we need to decrypt.
           Afterwards we can handle it like a keyBag,
           which is a PrivateKeyInfo. */
        bagAsn1 = pki$1.decryptPrivateKeyInfo(bagAsn1, password);
        if(bagAsn1 === null) {
          throw new Error(
            'Unable to decrypt PKCS#8 ShroudedKeyBag, wrong password?');
        }

        /* fall through */
      case pki$1.oids.keyBag:
        /* A PKCS#12 keyBag is a simple PrivateKeyInfo as understood by our
           PKI module, hence we don't have to do validation/capturing here,
           just pass what we already got. */
        try {
          bag.key = pki$1.privateKeyFromAsn1(bagAsn1);
        } catch(e) {
          // ignore unknown key type, pass asn1 value
          bag.key = null;
          bag.asn1 = bagAsn1;
        }
        continue;  /* Nothing more to do. */

      case pki$1.oids.certBag:
        /* A PKCS#12 certBag can wrap both X.509 and sdsi certificates.
           Therefore put the SafeBag content through another validator to
           capture the fields.  Afterwards check & store the results. */
        validator = certBagValidator;
        decoder = function() {
          if(asn1$3.derToOid(capture.certId) !== pki$1.oids.x509Certificate) {
            var error = new Error(
              'Unsupported certificate type, only X.509 supported.');
            error.oid = asn1$3.derToOid(capture.certId);
            throw error;
          }

          // true=produce cert hash
          var certAsn1 = asn1$3.fromDer(capture.cert, strict);
          try {
            bag.cert = pki$1.certificateFromAsn1(certAsn1, true);
          } catch(e) {
            // ignore unknown cert type, pass asn1 value
            bag.cert = null;
            bag.asn1 = certAsn1;
          }
        };
        break;

      default:
        var error = new Error('Unsupported PKCS#12 SafeBag type.');
        error.oid = bag.type;
        throw error;
    }

    /* Validate SafeBag value (i.e. CertBag, etc.) and capture data if needed. */
    if(validator !== undefined &&
       !asn1$3.validate(bagAsn1, validator, capture, errors)) {
      var error = new Error('Cannot read PKCS#12 ' + validator.name);
      error.errors = errors;
      throw error;
    }

    /* Call decoder function from above to store the results. */
    decoder();
  }

  return res;
}

/**
 * Decode PKCS#12 SET OF PKCS12Attribute into JavaScript object.
 *
 * @param attributes SET OF PKCS12Attribute (ASN.1 object).
 *
 * @return the decoded attributes.
 */
function _decodeBagAttributes(attributes) {
  var decodedAttrs = {};

  if(attributes !== undefined) {
    for(var i = 0; i < attributes.length; ++i) {
      var capture = {};
      var errors = [];
      if(!asn1$3.validate(attributes[i], attributeValidator, capture, errors)) {
        var error = new Error('Cannot read PKCS#12 BagAttribute.');
        error.errors = errors;
        throw error;
      }

      var oid = asn1$3.derToOid(capture.oid);
      if(pki$1.oids[oid] === undefined) {
        // unsupported attribute type, ignore.
        continue;
      }

      decodedAttrs[pki$1.oids[oid]] = [];
      for(var j = 0; j < capture.values.length; ++j) {
        decodedAttrs[pki$1.oids[oid]].push(capture.values[j].value);
      }
    }
  }

  return decodedAttrs;
}

/**
 * Wraps a private key and certificate in a PKCS#12 PFX wrapper. If a
 * password is provided then the private key will be encrypted.
 *
 * An entire certificate chain may also be included. To do this, pass
 * an array for the "cert" parameter where the first certificate is
 * the one that is paired with the private key and each subsequent one
 * verifies the previous one. The certificates may be in PEM format or
 * have been already parsed by Forge.
 *
 * @todo implement password-based-encryption for the whole package
 *
 * @param key the private key.
 * @param cert the certificate (may be an array of certificates in order
 *          to specify a certificate chain).
 * @param password the password to use, null for none.
 * @param options:
 *          algorithm the encryption algorithm to use
 *            ('aes128', 'aes192', 'aes256', '3des'), defaults to 'aes128'.
 *          count the iteration count to use.
 *          saltSize the salt size to use.
 *          useMac true to include a MAC, false not to, defaults to true.
 *          localKeyId the local key ID to use, in hex.
 *          friendlyName the friendly name to use.
 *          generateLocalKeyId true to generate a random local key ID,
 *            false not to, defaults to true.
 *
 * @return the PKCS#12 PFX ASN.1 object.
 */
p12.toPkcs12Asn1 = function(key, cert, password, options) {
  // set default options
  options = options || {};
  options.saltSize = options.saltSize || 8;
  options.count = options.count || 2048;
  options.algorithm = options.algorithm || options.encAlgorithm || 'aes128';
  if(!('useMac' in options)) {
    options.useMac = true;
  }
  if(!('localKeyId' in options)) {
    options.localKeyId = null;
  }
  if(!('generateLocalKeyId' in options)) {
    options.generateLocalKeyId = true;
  }

  var localKeyId = options.localKeyId;
  var bagAttrs;
  if(localKeyId !== null) {
    localKeyId = forge$d.util.hexToBytes(localKeyId);
  } else if(options.generateLocalKeyId) {
    // use SHA-1 of paired cert, if available
    if(cert) {
      var pairedCert = forge$d.util.isArray(cert) ? cert[0] : cert;
      if(typeof pairedCert === 'string') {
        pairedCert = pki$1.certificateFromPem(pairedCert);
      }
      var sha1 = forge$d.md.sha1.create();
      sha1.update(asn1$3.toDer(pki$1.certificateToAsn1(pairedCert)).getBytes());
      localKeyId = sha1.digest().getBytes();
    } else {
      // FIXME: consider using SHA-1 of public key (which can be generated
      // from private key components), see: cert.generateSubjectKeyIdentifier
      // generate random bytes
      localKeyId = forge$d.random.getBytes(20);
    }
  }

  var attrs = [];
  if(localKeyId !== null) {
    attrs.push(
      // localKeyID
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // attrId
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          asn1$3.oidToDer(pki$1.oids.localKeyId).getBytes()),
        // attrValues
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SET, true, [
          asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false,
            localKeyId)
        ])
      ]));
  }
  if('friendlyName' in options) {
    attrs.push(
      // friendlyName
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // attrId
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          asn1$3.oidToDer(pki$1.oids.friendlyName).getBytes()),
        // attrValues
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SET, true, [
          asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.BMPSTRING, false,
            options.friendlyName)
        ])
      ]));
  }

  if(attrs.length > 0) {
    bagAttrs = asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SET, true, attrs);
  }

  // collect contents for AuthenticatedSafe
  var contents = [];

  // create safe bag(s) for certificate chain
  var chain = [];
  if(cert !== null) {
    if(forge$d.util.isArray(cert)) {
      chain = cert;
    } else {
      chain = [cert];
    }
  }

  var certSafeBags = [];
  for(var i = 0; i < chain.length; ++i) {
    // convert cert from PEM as necessary
    cert = chain[i];
    if(typeof cert === 'string') {
      cert = pki$1.certificateFromPem(cert);
    }

    // SafeBag
    var certBagAttrs = (i === 0) ? bagAttrs : undefined;
    var certAsn1 = pki$1.certificateToAsn1(cert);
    var certSafeBag =
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // bagId
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          asn1$3.oidToDer(pki$1.oids.certBag).getBytes()),
        // bagValue
        asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
          // CertBag
          asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
            // certId
            asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
              asn1$3.oidToDer(pki$1.oids.x509Certificate).getBytes()),
            // certValue (x509Certificate)
            asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
              asn1$3.create(
                asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false,
                asn1$3.toDer(certAsn1).getBytes())
            ])])]),
        // bagAttributes (OPTIONAL)
        certBagAttrs
      ]);
    certSafeBags.push(certSafeBag);
  }

  if(certSafeBags.length > 0) {
    // SafeContents
    var certSafeContents = asn1$3.create(
      asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, certSafeBags);

    // ContentInfo
    var certCI =
      // PKCS#7 ContentInfo
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // contentType
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          // OID for the content type is 'data'
          asn1$3.oidToDer(pki$1.oids.data).getBytes()),
        // content
        asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
          asn1$3.create(
            asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false,
            asn1$3.toDer(certSafeContents).getBytes())
        ])
      ]);
    contents.push(certCI);
  }

  // create safe contents for private key
  var keyBag = null;
  if(key !== null) {
    // SafeBag
    var pkAsn1 = pki$1.wrapRsaPrivateKey(pki$1.privateKeyToAsn1(key));
    if(password === null) {
      // no encryption
      keyBag = asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // bagId
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          asn1$3.oidToDer(pki$1.oids.keyBag).getBytes()),
        // bagValue
        asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
          // PrivateKeyInfo
          pkAsn1
        ]),
        // bagAttributes (OPTIONAL)
        bagAttrs
      ]);
    } else {
      // encrypted PrivateKeyInfo
      keyBag = asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // bagId
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          asn1$3.oidToDer(pki$1.oids.pkcs8ShroudedKeyBag).getBytes()),
        // bagValue
        asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
          // EncryptedPrivateKeyInfo
          pki$1.encryptPrivateKeyInfo(pkAsn1, password, options)
        ]),
        // bagAttributes (OPTIONAL)
        bagAttrs
      ]);
    }

    // SafeContents
    var keySafeContents =
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [keyBag]);

    // ContentInfo
    var keyCI =
      // PKCS#7 ContentInfo
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // contentType
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
          // OID for the content type is 'data'
          asn1$3.oidToDer(pki$1.oids.data).getBytes()),
        // content
        asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
          asn1$3.create(
            asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false,
            asn1$3.toDer(keySafeContents).getBytes())
        ])
      ]);
    contents.push(keyCI);
  }

  // create AuthenticatedSafe by stringing together the contents
  var safe = asn1$3.create(
    asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, contents);

  var macData;
  if(options.useMac) {
    // MacData
    var sha1 = forge$d.md.sha1.create();
    var macSalt = new forge$d.util.ByteBuffer(
      forge$d.random.getBytes(options.saltSize));
    var count = options.count;
    // 160-bit key
    var key = p12.generateKey(password, macSalt, 3, count, 20);
    var mac = forge$d.hmac.create();
    mac.start(sha1, key);
    mac.update(asn1$3.toDer(safe).getBytes());
    var macValue = mac.getMac();
    macData = asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
      // mac DigestInfo
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
        // digestAlgorithm
        asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
          // algorithm = SHA-1
          asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
            asn1$3.oidToDer(pki$1.oids.sha1).getBytes()),
          // parameters = Null
          asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.NULL, false, '')
        ]),
        // digest
        asn1$3.create(
          asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING,
          false, macValue.getBytes())
      ]),
      // macSalt OCTET STRING
      asn1$3.create(
        asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false, macSalt.getBytes()),
      // iterations INTEGER (XXX: Only support count < 65536)
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.INTEGER, false,
        asn1$3.integerToDer(count).getBytes()
      )
    ]);
  }

  // PFX
  return asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
    // version (3)
    asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.INTEGER, false,
      asn1$3.integerToDer(3).getBytes()),
    // PKCS#7 ContentInfo
    asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.SEQUENCE, true, [
      // contentType
      asn1$3.create(asn1$3.Class.UNIVERSAL, asn1$3.Type.OID, false,
        // OID for the content type is 'data'
        asn1$3.oidToDer(pki$1.oids.data).getBytes()),
      // content
      asn1$3.create(asn1$3.Class.CONTEXT_SPECIFIC, 0, true, [
        asn1$3.create(
          asn1$3.Class.UNIVERSAL, asn1$3.Type.OCTETSTRING, false,
          asn1$3.toDer(safe).getBytes())
      ])
    ]),
    macData
  ]);
};

/**
 * Derives a PKCS#12 key.
 *
 * @param password the password to derive the key material from, null or
 *          undefined for none.
 * @param salt the salt, as a ByteBuffer, to use.
 * @param id the PKCS#12 ID byte (1 = key material, 2 = IV, 3 = MAC).
 * @param iter the iteration count.
 * @param n the number of bytes to derive from the password.
 * @param md the message digest to use, defaults to SHA-1.
 *
 * @return a ByteBuffer with the bytes derived from the password.
 */
p12.generateKey = forge$d.pbe.generatePkcs12Key;

/**
 * Javascript implementation of a basic Public Key Infrastructure, including
 * support for RSA public and private keys.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 */

var forge$c = forge$F;











// shortcut for asn.1 API
var asn1$2 = forge$c.asn1;

/* Public Key Infrastructure (PKI) implementation. */
var pki = forge$c.pki = forge$c.pki || {};

/**
 * NOTE: THIS METHOD IS DEPRECATED. Use pem.decode() instead.
 *
 * Converts PEM-formatted data to DER.
 *
 * @param pem the PEM-formatted data.
 *
 * @return the DER-formatted data.
 */
pki.pemToDer = function(pem) {
  var msg = forge$c.pem.decode(pem)[0];
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert PEM to DER; PEM is encrypted.');
  }
  return forge$c.util.createBuffer(msg.body);
};

/**
 * Converts an RSA private key from PEM format.
 *
 * @param pem the PEM-formatted private key.
 *
 * @return the private key.
 */
pki.privateKeyFromPem = function(pem) {
  var msg = forge$c.pem.decode(pem)[0];

  if(msg.type !== 'PRIVATE KEY' && msg.type !== 'RSA PRIVATE KEY') {
    var error = new Error('Could not convert private key from PEM; PEM ' +
      'header type is not "PRIVATE KEY" or "RSA PRIVATE KEY".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert private key from PEM; PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  var obj = asn1$2.fromDer(msg.body);

  return pki.privateKeyFromAsn1(obj);
};

/**
 * Converts an RSA private key to PEM format.
 *
 * @param key the private key.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted private key.
 */
pki.privateKeyToPem = function(key, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var msg = {
    type: 'RSA PRIVATE KEY',
    body: asn1$2.toDer(pki.privateKeyToAsn1(key)).getBytes()
  };
  return forge$c.pem.encode(msg, {maxline: maxline});
};

/**
 * Converts a PrivateKeyInfo to PEM format.
 *
 * @param pki the PrivateKeyInfo.
 * @param maxline the maximum characters per line, defaults to 64.
 *
 * @return the PEM-formatted private key.
 */
pki.privateKeyInfoToPem = function(pki, maxline) {
  // convert to DER, then PEM-encode
  var msg = {
    type: 'PRIVATE KEY',
    body: asn1$2.toDer(pki).getBytes()
  };
  return forge$c.pem.encode(msg, {maxline: maxline});
};

/**
 * A Javascript implementation of Transport Layer Security (TLS).
 *
 * @author Dave Longley
 *
 * Copyright (c) 2009-2014 Digital Bazaar, Inc.
 *
 * The TLS Handshake Protocol involves the following steps:
 *
 * - Exchange hello messages to agree on algorithms, exchange random values,
 * and check for session resumption.
 *
 * - Exchange the necessary cryptographic parameters to allow the client and
 * server to agree on a premaster secret.
 *
 * - Exchange certificates and cryptographic information to allow the client
 * and server to authenticate themselves.
 *
 * - Generate a master secret from the premaster secret and exchanged random
 * values.
 *
 * - Provide security parameters to the record layer.
 *
 * - Allow the client and server to verify that their peer has calculated the
 * same security parameters and that the handshake occurred without tampering
 * by an attacker.
 *
 * Up to 4 different messages may be sent during a key exchange. The server
 * certificate, the server key exchange, the client certificate, and the
 * client key exchange.
 *
 * A typical handshake (from the client's perspective).
 *
 * 1. Client sends ClientHello.
 * 2. Client receives ServerHello.
 * 3. Client receives optional Certificate.
 * 4. Client receives optional ServerKeyExchange.
 * 5. Client receives ServerHelloDone.
 * 6. Client sends optional Certificate.
 * 7. Client sends ClientKeyExchange.
 * 8. Client sends optional CertificateVerify.
 * 9. Client sends ChangeCipherSpec.
 * 10. Client sends Finished.
 * 11. Client receives ChangeCipherSpec.
 * 12. Client receives Finished.
 * 13. Client sends/receives application data.
 *
 * To reuse an existing session:
 *
 * 1. Client sends ClientHello with session ID for reuse.
 * 2. Client receives ServerHello with same session ID if reusing.
 * 3. Client receives ChangeCipherSpec message if reusing.
 * 4. Client receives Finished.
 * 5. Client sends ChangeCipherSpec.
 * 6. Client sends Finished.
 *
 * Note: Client ignores HelloRequest if in the middle of a handshake.
 *
 * Record Layer:
 *
 * The record layer fragments information blocks into TLSPlaintext records
 * carrying data in chunks of 2^14 bytes or less. Client message boundaries are
 * not preserved in the record layer (i.e., multiple client messages of the
 * same ContentType MAY be coalesced into a single TLSPlaintext record, or a
 * single message MAY be fragmented across several records).
 *
 * struct {
 *   uint8 major;
 *   uint8 minor;
 * } ProtocolVersion;
 *
 * struct {
 *   ContentType type;
 *   ProtocolVersion version;
 *   uint16 length;
 *   opaque fragment[TLSPlaintext.length];
 * } TLSPlaintext;
 *
 * type:
 *   The higher-level protocol used to process the enclosed fragment.
 *
 * version:
 *   The version of the protocol being employed. TLS Version 1.2 uses version
 *   {3, 3}. TLS Version 1.0 uses version {3, 1}. Note that a client that
 *   supports multiple versions of TLS may not know what version will be
 *   employed before it receives the ServerHello.
 *
 * length:
 *   The length (in bytes) of the following TLSPlaintext.fragment. The length
 *   MUST NOT exceed 2^14 = 16384 bytes.
 *
 * fragment:
 *   The application data. This data is transparent and treated as an
 *   independent block to be dealt with by the higher-level protocol specified
 *   by the type field.
 *
 * Implementations MUST NOT send zero-length fragments of Handshake, Alert, or
 * ChangeCipherSpec content types. Zero-length fragments of Application data
 * MAY be sent as they are potentially useful as a traffic analysis
 * countermeasure.
 *
 * Note: Data of different TLS record layer content types MAY be interleaved.
 * Application data is generally of lower precedence for transmission than
 * other content types. However, records MUST be delivered to the network in
 * the same order as they are protected by the record layer. Recipients MUST
 * receive and process interleaved application layer traffic during handshakes
 * subsequent to the first one on a connection.
 *
 * struct {
 *   ContentType type;       // same as TLSPlaintext.type
 *   ProtocolVersion version;// same as TLSPlaintext.version
 *   uint16 length;
 *   opaque fragment[TLSCompressed.length];
 * } TLSCompressed;
 *
 * length:
 *   The length (in bytes) of the following TLSCompressed.fragment.
 *   The length MUST NOT exceed 2^14 + 1024.
 *
 * fragment:
 *   The compressed form of TLSPlaintext.fragment.
 *
 * Note: A CompressionMethod.null operation is an identity operation; no fields
 * are altered. In this implementation, since no compression is supported,
 * uncompressed records are always the same as compressed records.
 *
 * Encryption Information:
 *
 * The encryption and MAC functions translate a TLSCompressed structure into a
 * TLSCiphertext. The decryption functions reverse the process. The MAC of the
 * record also includes a sequence number so that missing, extra, or repeated
 * messages are detectable.
 *
 * struct {
 *   ContentType type;
 *   ProtocolVersion version;
 *   uint16 length;
 *   select (SecurityParameters.cipher_type) {
 *     case stream: GenericStreamCipher;
 *     case block:  GenericBlockCipher;
 *     case aead:   GenericAEADCipher;
 *   } fragment;
 * } TLSCiphertext;
 *
 * type:
 *   The type field is identical to TLSCompressed.type.
 *
 * version:
 *   The version field is identical to TLSCompressed.version.
 *
 * length:
 *   The length (in bytes) of the following TLSCiphertext.fragment.
 *   The length MUST NOT exceed 2^14 + 2048.
 *
 * fragment:
 *   The encrypted form of TLSCompressed.fragment, with the MAC.
 *
 * Note: Only CBC Block Ciphers are supported by this implementation.
 *
 * The TLSCompressed.fragment structures are converted to/from block
 * TLSCiphertext.fragment structures.
 *
 * struct {
 *   opaque IV[SecurityParameters.record_iv_length];
 *   block-ciphered struct {
 *     opaque content[TLSCompressed.length];
 *     opaque MAC[SecurityParameters.mac_length];
 *     uint8 padding[GenericBlockCipher.padding_length];
 *     uint8 padding_length;
 *   };
 * } GenericBlockCipher;
 *
 * The MAC is generated as described in Section 6.2.3.1.
 *
 * IV:
 *   The Initialization Vector (IV) SHOULD be chosen at random, and MUST be
 *   unpredictable. Note that in versions of TLS prior to 1.1, there was no
 *   IV field, and the last ciphertext block of the previous record (the "CBC
 *   residue") was used as the IV. This was changed to prevent the attacks
 *   described in [CBCATT]. For block ciphers, the IV length is of length
 *   SecurityParameters.record_iv_length, which is equal to the
 *   SecurityParameters.block_size.
 *
 * padding:
 *   Padding that is added to force the length of the plaintext to be an
 *   integral multiple of the block cipher's block length. The padding MAY be
 *   any length up to 255 bytes, as long as it results in the
 *   TLSCiphertext.length being an integral multiple of the block length.
 *   Lengths longer than necessary might be desirable to frustrate attacks on
 *   a protocol that are based on analysis of the lengths of exchanged
 *   messages. Each uint8 in the padding data vector MUST be filled with the
 *   padding length value. The receiver MUST check this padding and MUST use
 *   the bad_record_mac alert to indicate padding errors.
 *
 * padding_length:
 *   The padding length MUST be such that the total size of the
 *   GenericBlockCipher structure is a multiple of the cipher's block length.
 *   Legal values range from zero to 255, inclusive. This length specifies the
 *   length of the padding field exclusive of the padding_length field itself.
 *
 * The encrypted data length (TLSCiphertext.length) is one more than the sum of
 * SecurityParameters.block_length, TLSCompressed.length,
 * SecurityParameters.mac_length, and padding_length.
 *
 * Example: If the block length is 8 bytes, the content length
 * (TLSCompressed.length) is 61 bytes, and the MAC length is 20 bytes, then the
 * length before padding is 82 bytes (this does not include the IV. Thus, the
 * padding length modulo 8 must be equal to 6 in order to make the total length
 * an even multiple of 8 bytes (the block length). The padding length can be
 * 6, 14, 22, and so on, through 254. If the padding length were the minimum
 * necessary, 6, the padding would be 6 bytes, each containing the value 6.
 * Thus, the last 8 octets of the GenericBlockCipher before block encryption
 * would be xx 06 06 06 06 06 06 06, where xx is the last octet of the MAC.
 *
 * Note: With block ciphers in CBC mode (Cipher Block Chaining), it is critical
 * that the entire plaintext of the record be known before any ciphertext is
 * transmitted. Otherwise, it is possible for the attacker to mount the attack
 * described in [CBCATT].
 *
 * Implementation note: Canvel et al. [CBCTIME] have demonstrated a timing
 * attack on CBC padding based on the time required to compute the MAC. In
 * order to defend against this attack, implementations MUST ensure that
 * record processing time is essentially the same whether or not the padding
 * is correct. In general, the best way to do this is to compute the MAC even
 * if the padding is incorrect, and only then reject the packet. For instance,
 * if the pad appears to be incorrect, the implementation might assume a
 * zero-length pad and then compute the MAC. This leaves a small timing
 * channel, since MAC performance depends, to some extent, on the size of the
 * data fragment, but it is not believed to be large enough to be exploitable,
 * due to the large block size of existing MACs and the small size of the
 * timing signal.
 */

var forge$b = forge$F;









/**
 * Generates pseudo random bytes by mixing the result of two hash functions,
 * MD5 and SHA-1.
 *
 * prf_TLS1(secret, label, seed) =
 *   P_MD5(S1, label + seed) XOR P_SHA-1(S2, label + seed);
 *
 * Each P_hash function functions as follows:
 *
 * P_hash(secret, seed) = HMAC_hash(secret, A(1) + seed) +
 *                        HMAC_hash(secret, A(2) + seed) +
 *                        HMAC_hash(secret, A(3) + seed) + ...
 * A() is defined as:
 *   A(0) = seed
 *   A(i) = HMAC_hash(secret, A(i-1))
 *
 * The '+' operator denotes concatenation.
 *
 * As many iterations A(N) as are needed are performed to generate enough
 * pseudo random byte output. If an iteration creates more data than is
 * necessary, then it is truncated.
 *
 * Therefore:
 * A(1) = HMAC_hash(secret, A(0))
 *      = HMAC_hash(secret, seed)
 * A(2) = HMAC_hash(secret, A(1))
 *      = HMAC_hash(secret, HMAC_hash(secret, seed))
 *
 * Therefore:
 * P_hash(secret, seed) =
 *   HMAC_hash(secret, HMAC_hash(secret, A(0)) + seed) +
 *   HMAC_hash(secret, HMAC_hash(secret, A(1)) + seed) +
 *   ...
 *
 * Therefore:
 * P_hash(secret, seed) =
 *   HMAC_hash(secret, HMAC_hash(secret, seed) + seed) +
 *   HMAC_hash(secret, HMAC_hash(secret, HMAC_hash(secret, seed)) + seed) +
 *   ...
 *
 * @param secret the secret to use.
 * @param label the label to use.
 * @param seed the seed value to use.
 * @param length the number of bytes to generate.
 *
 * @return the pseudo random bytes in a byte buffer.
 */
var prf_TLS1 = function(secret, label, seed, length) {
  var rval = forge$b.util.createBuffer();

  /* For TLS 1.0, the secret is split in half, into two secrets of equal
    length. If the secret has an odd length then the last byte of the first
    half will be the same as the first byte of the second. The length of the
    two secrets is half of the secret rounded up. */
  var idx = (secret.length >> 1);
  var slen = idx + (secret.length & 1);
  var s1 = secret.substr(0, slen);
  var s2 = secret.substr(idx, slen);
  var ai = forge$b.util.createBuffer();
  var hmac = forge$b.hmac.create();
  seed = label + seed;

  // determine the number of iterations that must be performed to generate
  // enough output bytes, md5 creates 16 byte hashes, sha1 creates 20
  var md5itr = Math.ceil(length / 16);
  var sha1itr = Math.ceil(length / 20);

  // do md5 iterations
  hmac.start('MD5', s1);
  var md5bytes = forge$b.util.createBuffer();
  ai.putBytes(seed);
  for(var i = 0; i < md5itr; ++i) {
    // HMAC_hash(secret, A(i-1))
    hmac.start(null, null);
    hmac.update(ai.getBytes());
    ai.putBuffer(hmac.digest());

    // HMAC_hash(secret, A(i) + seed)
    hmac.start(null, null);
    hmac.update(ai.bytes() + seed);
    md5bytes.putBuffer(hmac.digest());
  }

  // do sha1 iterations
  hmac.start('SHA1', s2);
  var sha1bytes = forge$b.util.createBuffer();
  ai.clear();
  ai.putBytes(seed);
  for(var i = 0; i < sha1itr; ++i) {
    // HMAC_hash(secret, A(i-1))
    hmac.start(null, null);
    hmac.update(ai.getBytes());
    ai.putBuffer(hmac.digest());

    // HMAC_hash(secret, A(i) + seed)
    hmac.start(null, null);
    hmac.update(ai.bytes() + seed);
    sha1bytes.putBuffer(hmac.digest());
  }

  // XOR the md5 bytes with the sha1 bytes
  rval.putBytes(forge$b.util.xorBytes(
    md5bytes.getBytes(), sha1bytes.getBytes(), length));

  return rval;
};

/**
 * Gets a MAC for a record using the SHA-1 hash algorithm.
 *
 * @param key the mac key.
 * @param state the sequence number (array of two 32-bit integers).
 * @param record the record.
 *
 * @return the sha-1 hash (20 bytes) for the given record.
 */
var hmac_sha1 = function(key, seqNum, record) {
  /* MAC is computed like so:
  HMAC_hash(
    key, seqNum +
      TLSCompressed.type +
      TLSCompressed.version +
      TLSCompressed.length +
      TLSCompressed.fragment)
  */
  var hmac = forge$b.hmac.create();
  hmac.start('SHA1', key);
  var b = forge$b.util.createBuffer();
  b.putInt32(seqNum[0]);
  b.putInt32(seqNum[1]);
  b.putByte(record.type);
  b.putByte(record.version.major);
  b.putByte(record.version.minor);
  b.putInt16(record.length);
  b.putBytes(record.fragment.bytes());
  hmac.update(b.getBytes());
  return hmac.digest().getBytes();
};

/**
 * Compresses the TLSPlaintext record into a TLSCompressed record using the
 * deflate algorithm.
 *
 * @param c the TLS connection.
 * @param record the TLSPlaintext record to compress.
 * @param s the ConnectionState to use.
 *
 * @return true on success, false on failure.
 */
var deflate = function(c, record, s) {
  var rval = false;

  try {
    var bytes = c.deflate(record.fragment.getBytes());
    record.fragment = forge$b.util.createBuffer(bytes);
    record.length = bytes.length;
    rval = true;
  } catch(ex) {
    // deflate error, fail out
  }

  return rval;
};

/**
 * Decompresses the TLSCompressed record into a TLSPlaintext record using the
 * deflate algorithm.
 *
 * @param c the TLS connection.
 * @param record the TLSCompressed record to decompress.
 * @param s the ConnectionState to use.
 *
 * @return true on success, false on failure.
 */
var inflate = function(c, record, s) {
  var rval = false;

  try {
    var bytes = c.inflate(record.fragment.getBytes());
    record.fragment = forge$b.util.createBuffer(bytes);
    record.length = bytes.length;
    rval = true;
  } catch(ex) {
    // inflate error, fail out
  }

  return rval;
};

/**
 * Reads a TLS variable-length vector from a byte buffer.
 *
 * Variable-length vectors are defined by specifying a subrange of legal
 * lengths, inclusively, using the notation <floor..ceiling>. When these are
 * encoded, the actual length precedes the vector's contents in the byte
 * stream. The length will be in the form of a number consuming as many bytes
 * as required to hold the vector's specified maximum (ceiling) length. A
 * variable-length vector with an actual length field of zero is referred to
 * as an empty vector.
 *
 * @param b the byte buffer.
 * @param lenBytes the number of bytes required to store the length.
 *
 * @return the resulting byte buffer.
 */
var readVector = function(b, lenBytes) {
  var len = 0;
  switch(lenBytes) {
  case 1:
    len = b.getByte();
    break;
  case 2:
    len = b.getInt16();
    break;
  case 3:
    len = b.getInt24();
    break;
  case 4:
    len = b.getInt32();
    break;
  }

  // read vector bytes into a new buffer
  return forge$b.util.createBuffer(b.getBytes(len));
};

/**
 * Writes a TLS variable-length vector to a byte buffer.
 *
 * @param b the byte buffer.
 * @param lenBytes the number of bytes required to store the length.
 * @param v the byte buffer vector.
 */
var writeVector = function(b, lenBytes, v) {
  // encode length at the start of the vector, where the number of bytes for
  // the length is the maximum number of bytes it would take to encode the
  // vector's ceiling
  b.putInt(v.length(), lenBytes << 3);
  b.putBuffer(v);
};

/**
 * The tls implementation.
 */
var tls$1 = {};

/**
 * Version: TLS 1.2 = 3.3, TLS 1.1 = 3.2, TLS 1.0 = 3.1. Both TLS 1.1 and
 * TLS 1.2 were still too new (ie: openSSL didn't implement them) at the time
 * of this implementation so TLS 1.0 was implemented instead.
 */
tls$1.Versions = {
  TLS_1_0: {major: 3, minor: 1},
  TLS_1_1: {major: 3, minor: 2},
  TLS_1_2: {major: 3, minor: 3}
};
tls$1.SupportedVersions = [
  tls$1.Versions.TLS_1_1,
  tls$1.Versions.TLS_1_0
];
tls$1.Version = tls$1.SupportedVersions[0];

/**
 * Maximum fragment size. True maximum is 16384, but we fragment before that
 * to allow for unusual small increases during compression.
 */
tls$1.MaxFragment = 16384 - 1024;

/**
 * Whether this entity is considered the "client" or "server".
 * enum { server, client } ConnectionEnd;
 */
tls$1.ConnectionEnd = {
  server: 0,
  client: 1
};

/**
 * Pseudo-random function algorithm used to generate keys from the master
 * secret.
 * enum { tls_prf_sha256 } PRFAlgorithm;
 */
tls$1.PRFAlgorithm = {
  tls_prf_sha256: 0
};

/**
 * Bulk encryption algorithms.
 * enum { null, rc4, des3, aes } BulkCipherAlgorithm;
 */
tls$1.BulkCipherAlgorithm = {
  none: null,
  rc4: 0,
  des3: 1,
  aes: 2
};

/**
 * Cipher types.
 * enum { stream, block, aead } CipherType;
 */
tls$1.CipherType = {
  stream: 0,
  block: 1,
  aead: 2
};

/**
 * MAC (Message Authentication Code) algorithms.
 * enum { null, hmac_md5, hmac_sha1, hmac_sha256,
 *   hmac_sha384, hmac_sha512} MACAlgorithm;
 */
tls$1.MACAlgorithm = {
  none: null,
  hmac_md5: 0,
  hmac_sha1: 1,
  hmac_sha256: 2,
  hmac_sha384: 3,
  hmac_sha512: 4
};

/**
 * Compression algorithms.
 * enum { null(0), deflate(1), (255) } CompressionMethod;
 */
tls$1.CompressionMethod = {
  none: 0,
  deflate: 1
};

/**
 * TLS record content types.
 * enum {
 *   change_cipher_spec(20), alert(21), handshake(22),
 *   application_data(23), (255)
 * } ContentType;
 */
tls$1.ContentType = {
  change_cipher_spec: 20,
  alert: 21,
  handshake: 22,
  application_data: 23,
  heartbeat: 24
};

/**
 * TLS handshake types.
 * enum {
 *   hello_request(0), client_hello(1), server_hello(2),
 *   certificate(11), server_key_exchange (12),
 *   certificate_request(13), server_hello_done(14),
 *   certificate_verify(15), client_key_exchange(16),
 *   finished(20), (255)
 * } HandshakeType;
 */
tls$1.HandshakeType = {
  hello_request: 0,
  client_hello: 1,
  server_hello: 2,
  certificate: 11,
  server_key_exchange: 12,
  certificate_request: 13,
  server_hello_done: 14,
  certificate_verify: 15,
  client_key_exchange: 16,
  finished: 20
};

/**
 * TLS Alert Protocol.
 *
 * enum { warning(1), fatal(2), (255) } AlertLevel;
 *
 * enum {
 *   close_notify(0),
 *   unexpected_message(10),
 *   bad_record_mac(20),
 *   decryption_failed(21),
 *   record_overflow(22),
 *   decompression_failure(30),
 *   handshake_failure(40),
 *   bad_certificate(42),
 *   unsupported_certificate(43),
 *   certificate_revoked(44),
 *   certificate_expired(45),
 *   certificate_unknown(46),
 *   illegal_parameter(47),
 *   unknown_ca(48),
 *   access_denied(49),
 *   decode_error(50),
 *   decrypt_error(51),
 *   export_restriction(60),
 *   protocol_version(70),
 *   insufficient_security(71),
 *   internal_error(80),
 *   user_canceled(90),
 *   no_renegotiation(100),
 *   (255)
 * } AlertDescription;
 *
 * struct {
 *   AlertLevel level;
 *   AlertDescription description;
 * } Alert;
 */
tls$1.Alert = {};
tls$1.Alert.Level = {
  warning: 1,
  fatal: 2
};
tls$1.Alert.Description = {
  close_notify: 0,
  unexpected_message: 10,
  bad_record_mac: 20,
  decryption_failed: 21,
  record_overflow: 22,
  decompression_failure: 30,
  handshake_failure: 40,
  bad_certificate: 42,
  unsupported_certificate: 43,
  certificate_revoked: 44,
  certificate_expired: 45,
  certificate_unknown: 46,
  illegal_parameter: 47,
  unknown_ca: 48,
  access_denied: 49,
  decode_error: 50,
  decrypt_error: 51,
  export_restriction: 60,
  protocol_version: 70,
  insufficient_security: 71,
  internal_error: 80,
  user_canceled: 90,
  no_renegotiation: 100
};

/**
 * TLS Heartbeat Message types.
 * enum {
 *   heartbeat_request(1),
 *   heartbeat_response(2),
 *   (255)
 * } HeartbeatMessageType;
 */
tls$1.HeartbeatMessageType = {
  heartbeat_request: 1,
  heartbeat_response: 2
};

/**
 * Supported cipher suites.
 */
tls$1.CipherSuites = {};

/**
 * Gets a supported cipher suite from its 2 byte ID.
 *
 * @param twoBytes two bytes in a string.
 *
 * @return the matching supported cipher suite or null.
 */
tls$1.getCipherSuite = function(twoBytes) {
  var rval = null;
  for(var key in tls$1.CipherSuites) {
    var cs = tls$1.CipherSuites[key];
    if(cs.id[0] === twoBytes.charCodeAt(0) &&
      cs.id[1] === twoBytes.charCodeAt(1)) {
      rval = cs;
      break;
    }
  }
  return rval;
};

/**
 * Called when an unexpected record is encountered.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleUnexpected = function(c, record) {
  // if connection is client and closed, ignore unexpected messages
  var ignore = (!c.open && c.entity === tls$1.ConnectionEnd.client);
  if(!ignore) {
    c.error(c, {
      message: 'Unexpected message. Received TLS record out of order.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.unexpected_message
      }
    });
  }
};

/**
 * Called when a client receives a HelloRequest record.
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleHelloRequest = function(c, record, length) {
  // ignore renegotiation requests from the server during a handshake, but
  // if handshaking, send a warning alert that renegotation is denied
  if(!c.handshaking && c.handshakes > 0) {
    // send alert warning
    tls$1.queue(c, tls$1.createAlert(c, {
       level: tls$1.Alert.Level.warning,
       description: tls$1.Alert.Description.no_renegotiation
    }));
    tls$1.flush(c);
  }

  // continue
  c.process();
};

/**
 * Parses a hello message from a ClientHello or ServerHello record.
 *
 * @param record the record to parse.
 *
 * @return the parsed message.
 */
tls$1.parseHelloMessage = function(c, record, length) {
  var msg = null;

  var client = (c.entity === tls$1.ConnectionEnd.client);

  // minimum of 38 bytes in message
  if(length < 38) {
    c.error(c, {
      message: client ?
        'Invalid ServerHello message. Message too short.' :
        'Invalid ClientHello message. Message too short.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  } else {
    // use 'remaining' to calculate # of remaining bytes in the message
    var b = record.fragment;
    var remaining = b.length();
    msg = {
      version: {
        major: b.getByte(),
        minor: b.getByte()
      },
      random: forge$b.util.createBuffer(b.getBytes(32)),
      session_id: readVector(b, 1),
      extensions: []
    };
    if(client) {
      msg.cipher_suite = b.getBytes(2);
      msg.compression_method = b.getByte();
    } else {
      msg.cipher_suites = readVector(b, 2);
      msg.compression_methods = readVector(b, 1);
    }

    // read extensions if there are any bytes left in the message
    remaining = length - (remaining - b.length());
    if(remaining > 0) {
      // parse extensions
      var exts = readVector(b, 2);
      while(exts.length() > 0) {
        msg.extensions.push({
          type: [exts.getByte(), exts.getByte()],
          data: readVector(exts, 2)
        });
      }

      // TODO: make extension support modular
      if(!client) {
        for(var i = 0; i < msg.extensions.length; ++i) {
          var ext = msg.extensions[i];

          // support SNI extension
          if(ext.type[0] === 0x00 && ext.type[1] === 0x00) {
            // get server name list
            var snl = readVector(ext.data, 2);
            while(snl.length() > 0) {
              // read server name type
              var snType = snl.getByte();

              // only HostName type (0x00) is known, break out if
              // another type is detected
              if(snType !== 0x00) {
                break;
              }

              // add host name to server name list
              c.session.extensions.server_name.serverNameList.push(
                readVector(snl, 2).getBytes());
            }
          }
        }
      }
    }

    // version already set, do not allow version change
    if(c.session.version) {
      if(msg.version.major !== c.session.version.major ||
        msg.version.minor !== c.session.version.minor) {
        return c.error(c, {
          message: 'TLS version change is disallowed during renegotiation.',
          send: true,
          alert: {
            level: tls$1.Alert.Level.fatal,
            description: tls$1.Alert.Description.protocol_version
          }
        });
      }
    }

    // get the chosen (ServerHello) cipher suite
    if(client) {
      // FIXME: should be checking configured acceptable cipher suites
      c.session.cipherSuite = tls$1.getCipherSuite(msg.cipher_suite);
    } else {
      // get a supported preferred (ClientHello) cipher suite
      // choose the first supported cipher suite
      var tmp = forge$b.util.createBuffer(msg.cipher_suites.bytes());
      while(tmp.length() > 0) {
        // FIXME: should be checking configured acceptable suites
        // cipher suites take up 2 bytes
        c.session.cipherSuite = tls$1.getCipherSuite(tmp.getBytes(2));
        if(c.session.cipherSuite !== null) {
          break;
        }
      }
    }

    // cipher suite not supported
    if(c.session.cipherSuite === null) {
      return c.error(c, {
        message: 'No cipher suites in common.',
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.handshake_failure
        },
        cipherSuite: forge$b.util.bytesToHex(msg.cipher_suite)
      });
    }

    // TODO: handle compression methods
    if(client) {
      c.session.compressionMethod = msg.compression_method;
    } else {
      // no compression
      c.session.compressionMethod = tls$1.CompressionMethod.none;
    }
  }

  return msg;
};

/**
 * Creates security parameters for the given connection based on the given
 * hello message.
 *
 * @param c the TLS connection.
 * @param msg the hello message.
 */
tls$1.createSecurityParameters = function(c, msg) {
  /* Note: security params are from TLS 1.2, some values like prf_algorithm
  are ignored for TLS 1.0/1.1 and the builtin as specified in the spec is
  used. */

  // TODO: handle other options from server when more supported

  // get client and server randoms
  var client = (c.entity === tls$1.ConnectionEnd.client);
  var msgRandom = msg.random.bytes();
  var cRandom = client ? c.session.sp.client_random : msgRandom;
  var sRandom = client ? msgRandom : tls$1.createRandom().getBytes();

  // create new security parameters
  c.session.sp = {
    entity: c.entity,
    prf_algorithm: tls$1.PRFAlgorithm.tls_prf_sha256,
    bulk_cipher_algorithm: null,
    cipher_type: null,
    enc_key_length: null,
    block_length: null,
    fixed_iv_length: null,
    record_iv_length: null,
    mac_algorithm: null,
    mac_length: null,
    mac_key_length: null,
    compression_algorithm: c.session.compressionMethod,
    pre_master_secret: null,
    master_secret: null,
    client_random: cRandom,
    server_random: sRandom
  };
};

/**
 * Called when a client receives a ServerHello record.
 *
 * When a ServerHello message will be sent:
 *   The server will send this message in response to a client hello message
 *   when it was able to find an acceptable set of algorithms. If it cannot
 *   find such a match, it will respond with a handshake failure alert.
 *
 * uint24 length;
 * struct {
 *   ProtocolVersion server_version;
 *   Random random;
 *   SessionID session_id;
 *   CipherSuite cipher_suite;
 *   CompressionMethod compression_method;
 *   select(extensions_present) {
 *     case false:
 *       struct {};
 *     case true:
 *       Extension extensions<0..2^16-1>;
 *   };
 * } ServerHello;
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleServerHello = function(c, record, length) {
  var msg = tls$1.parseHelloMessage(c, record, length);
  if(c.fail) {
    return;
  }

  // ensure server version is compatible
  if(msg.version.minor <= c.version.minor) {
    c.version.minor = msg.version.minor;
  } else {
    return c.error(c, {
      message: 'Incompatible TLS version.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.protocol_version
      }
    });
  }

  // indicate session version has been set
  c.session.version = c.version;

  // get the session ID from the message
  var sessionId = msg.session_id.bytes();

  // if the session ID is not blank and matches the cached one, resume
  // the session
  if(sessionId.length > 0 && sessionId === c.session.id) {
    // resuming session, expect a ChangeCipherSpec next
    c.expect = SCC;
    c.session.resuming = true;

    // get new server random
    c.session.sp.server_random = msg.random.bytes();
  } else {
    // not resuming, expect a server Certificate message next
    c.expect = SCE;
    c.session.resuming = false;

    // create new security parameters
    tls$1.createSecurityParameters(c, msg);
  }

  // set new session ID
  c.session.id = sessionId;

  // continue
  c.process();
};

/**
 * Called when a server receives a ClientHello record.
 *
 * When a ClientHello message will be sent:
 *   When a client first connects to a server it is required to send the
 *   client hello as its first message. The client can also send a client
 *   hello in response to a hello request or on its own initiative in order
 *   to renegotiate the security parameters in an existing connection.
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleClientHello = function(c, record, length) {
  var msg = tls$1.parseHelloMessage(c, record, length);
  if(c.fail) {
    return;
  }

  // get the session ID from the message
  var sessionId = msg.session_id.bytes();

  // see if the given session ID is in the cache
  var session = null;
  if(c.sessionCache) {
    session = c.sessionCache.getSession(sessionId);
    if(session === null) {
      // session ID not found
      sessionId = '';
    } else if(session.version.major !== msg.version.major ||
      session.version.minor > msg.version.minor) {
      // if session version is incompatible with client version, do not resume
      session = null;
      sessionId = '';
    }
  }

  // no session found to resume, generate a new session ID
  if(sessionId.length === 0) {
    sessionId = forge$b.random.getBytes(32);
  }

  // update session
  c.session.id = sessionId;
  c.session.clientHelloVersion = msg.version;
  c.session.sp = {};
  if(session) {
    // use version and security parameters from resumed session
    c.version = c.session.version = session.version;
    c.session.sp = session.sp;
  } else {
    // use highest compatible minor version
    var version;
    for(var i = 1; i < tls$1.SupportedVersions.length; ++i) {
      version = tls$1.SupportedVersions[i];
      if(version.minor <= msg.version.minor) {
        break;
      }
    }
    c.version = {major: version.major, minor: version.minor};
    c.session.version = c.version;
  }

  // if a session is set, resume it
  if(session !== null) {
    // resuming session, expect a ChangeCipherSpec next
    c.expect = CCC;
    c.session.resuming = true;

    // get new client random
    c.session.sp.client_random = msg.random.bytes();
  } else {
    // not resuming, expect a Certificate or ClientKeyExchange
    c.expect = (c.verifyClient !== false) ? CCE : CKE;
    c.session.resuming = false;

    // create new security parameters
    tls$1.createSecurityParameters(c, msg);
  }

  // connection now open
  c.open = true;

  // queue server hello
  tls$1.queue(c, tls$1.createRecord(c, {
    type: tls$1.ContentType.handshake,
    data: tls$1.createServerHello(c)
  }));

  if(c.session.resuming) {
    // queue change cipher spec message
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.change_cipher_spec,
      data: tls$1.createChangeCipherSpec()
    }));

    // create pending state
    c.state.pending = tls$1.createConnectionState(c);

    // change current write state to pending write state
    c.state.current.write = c.state.pending.write;

    // queue finished
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.handshake,
      data: tls$1.createFinished(c)
    }));
  } else {
    // queue server certificate
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.handshake,
      data: tls$1.createCertificate(c)
    }));

    if(!c.fail) {
      // queue server key exchange
      tls$1.queue(c, tls$1.createRecord(c, {
        type: tls$1.ContentType.handshake,
        data: tls$1.createServerKeyExchange(c)
      }));

      // request client certificate if set
      if(c.verifyClient !== false) {
        // queue certificate request
        tls$1.queue(c, tls$1.createRecord(c, {
          type: tls$1.ContentType.handshake,
          data: tls$1.createCertificateRequest(c)
        }));
      }

      // queue server hello done
      tls$1.queue(c, tls$1.createRecord(c, {
        type: tls$1.ContentType.handshake,
        data: tls$1.createServerHelloDone(c)
      }));
    }
  }

  // send records
  tls$1.flush(c);

  // continue
  c.process();
};

/**
 * Called when a client receives a Certificate record.
 *
 * When this message will be sent:
 *   The server must send a certificate whenever the agreed-upon key exchange
 *   method is not an anonymous one. This message will always immediately
 *   follow the server hello message.
 *
 * Meaning of this message:
 *   The certificate type must be appropriate for the selected cipher suite's
 *   key exchange algorithm, and is generally an X.509v3 certificate. It must
 *   contain a key which matches the key exchange method, as follows. Unless
 *   otherwise specified, the signing algorithm for the certificate must be
 *   the same as the algorithm for the certificate key. Unless otherwise
 *   specified, the public key may be of any length.
 *
 * opaque ASN.1Cert<1..2^24-1>;
 * struct {
 *   ASN.1Cert certificate_list<1..2^24-1>;
 * } Certificate;
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleCertificate = function(c, record, length) {
  // minimum of 3 bytes in message
  if(length < 3) {
    return c.error(c, {
      message: 'Invalid Certificate message. Message too short.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  }

  var b = record.fragment;
  var msg = {
    certificate_list: readVector(b, 3)
  };

  /* The sender's certificate will be first in the list (chain), each
    subsequent one that follows will certify the previous one, but root
    certificates (self-signed) that specify the certificate authority may
    be omitted under the assumption that clients must already possess it. */
  var cert, asn1;
  var certs = [];
  try {
    while(msg.certificate_list.length() > 0) {
      // each entry in msg.certificate_list is a vector with 3 len bytes
      cert = readVector(msg.certificate_list, 3);
      asn1 = forge$b.asn1.fromDer(cert);
      cert = forge$b.pki.certificateFromAsn1(asn1, true);
      certs.push(cert);
    }
  } catch(ex) {
    return c.error(c, {
      message: 'Could not parse certificate list.',
      cause: ex,
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.bad_certificate
      }
    });
  }

  // ensure at least 1 certificate was provided if in client-mode
  // or if verifyClient was set to true to require a certificate
  // (as opposed to 'optional')
  var client = (c.entity === tls$1.ConnectionEnd.client);
  if((client || c.verifyClient === true) && certs.length === 0) {
    // error, no certificate
    c.error(c, {
      message: client ?
        'No server certificate provided.' :
        'No client certificate provided.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  } else if(certs.length === 0) {
    // no certs to verify
    // expect a ServerKeyExchange or ClientKeyExchange message next
    c.expect = client ? SKE : CKE;
  } else {
    // save certificate in session
    if(client) {
      c.session.serverCertificate = certs[0];
    } else {
      c.session.clientCertificate = certs[0];
    }

    if(tls$1.verifyCertificateChain(c, certs)) {
      // expect a ServerKeyExchange or ClientKeyExchange message next
      c.expect = client ? SKE : CKE;
    }
  }

  // continue
  c.process();
};

/**
 * Called when a client receives a ServerKeyExchange record.
 *
 * When this message will be sent:
 *   This message will be sent immediately after the server certificate
 *   message (or the server hello message, if this is an anonymous
 *   negotiation).
 *
 *   The server key exchange message is sent by the server only when the
 *   server certificate message (if sent) does not contain enough data to
 *   allow the client to exchange a premaster secret.
 *
 * Meaning of this message:
 *   This message conveys cryptographic information to allow the client to
 *   communicate the premaster secret: either an RSA public key to encrypt
 *   the premaster secret with, or a Diffie-Hellman public key with which the
 *   client can complete a key exchange (with the result being the premaster
 *   secret.)
 *
 * enum {
 *   dhe_dss, dhe_rsa, dh_anon, rsa, dh_dss, dh_rsa
 * } KeyExchangeAlgorithm;
 *
 * struct {
 *   opaque dh_p<1..2^16-1>;
 *   opaque dh_g<1..2^16-1>;
 *   opaque dh_Ys<1..2^16-1>;
 * } ServerDHParams;
 *
 * struct {
 *   select(KeyExchangeAlgorithm) {
 *     case dh_anon:
 *       ServerDHParams params;
 *     case dhe_dss:
 *     case dhe_rsa:
 *       ServerDHParams params;
 *       digitally-signed struct {
 *         opaque client_random[32];
 *         opaque server_random[32];
 *         ServerDHParams params;
 *       } signed_params;
 *     case rsa:
 *     case dh_dss:
 *     case dh_rsa:
 *       struct {};
 *   };
 * } ServerKeyExchange;
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleServerKeyExchange = function(c, record, length) {
  // this implementation only supports RSA, no Diffie-Hellman support
  // so any length > 0 is invalid
  if(length > 0) {
    return c.error(c, {
      message: 'Invalid key parameters. Only RSA is supported.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.unsupported_certificate
      }
    });
  }

  // expect an optional CertificateRequest message next
  c.expect = SCR;

  // continue
  c.process();
};

/**
 * Called when a client receives a ClientKeyExchange record.
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleClientKeyExchange = function(c, record, length) {
  // this implementation only supports RSA, no Diffie-Hellman support
  // so any length < 48 is invalid
  if(length < 48) {
    return c.error(c, {
      message: 'Invalid key parameters. Only RSA is supported.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.unsupported_certificate
      }
    });
  }

  var b = record.fragment;
  var msg = {
    enc_pre_master_secret: readVector(b, 2).getBytes()
  };

  // do rsa decryption
  var privateKey = null;
  if(c.getPrivateKey) {
    try {
      privateKey = c.getPrivateKey(c, c.session.serverCertificate);
      privateKey = forge$b.pki.privateKeyFromPem(privateKey);
    } catch(ex) {
      c.error(c, {
        message: 'Could not get private key.',
        cause: ex,
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.internal_error
        }
      });
    }
  }

  if(privateKey === null) {
    return c.error(c, {
      message: 'No private key set.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.internal_error
      }
    });
  }

  try {
    // decrypt 48-byte pre-master secret
    var sp = c.session.sp;
    sp.pre_master_secret = privateKey.decrypt(msg.enc_pre_master_secret);

    // ensure client hello version matches first 2 bytes
    var version = c.session.clientHelloVersion;
    if(version.major !== sp.pre_master_secret.charCodeAt(0) ||
      version.minor !== sp.pre_master_secret.charCodeAt(1)) {
      // error, do not send alert (see BLEI attack below)
      throw new Error('TLS version rollback attack detected.');
    }
  } catch(ex) {
    /* Note: Daniel Bleichenbacher [BLEI] can be used to attack a
      TLS server which is using PKCS#1 encoded RSA, so instead of
      failing here, we generate 48 random bytes and use that as
      the pre-master secret. */
    sp.pre_master_secret = forge$b.random.getBytes(48);
  }

  // expect a CertificateVerify message if a Certificate was received that
  // does not have fixed Diffie-Hellman params, otherwise expect
  // ChangeCipherSpec
  c.expect = CCC;
  if(c.session.clientCertificate !== null) {
    // only RSA support, so expect CertificateVerify
    // TODO: support Diffie-Hellman
    c.expect = CCV;
  }

  // continue
  c.process();
};

/**
 * Called when a client receives a CertificateRequest record.
 *
 * When this message will be sent:
 *   A non-anonymous server can optionally request a certificate from the
 *   client, if appropriate for the selected cipher suite. This message, if
 *   sent, will immediately follow the Server Key Exchange message (if it is
 *   sent; otherwise, the Server Certificate message).
 *
 * enum {
 *   rsa_sign(1), dss_sign(2), rsa_fixed_dh(3), dss_fixed_dh(4),
 *   rsa_ephemeral_dh_RESERVED(5), dss_ephemeral_dh_RESERVED(6),
 *   fortezza_dms_RESERVED(20), (255)
 * } ClientCertificateType;
 *
 * opaque DistinguishedName<1..2^16-1>;
 *
 * struct {
 *   ClientCertificateType certificate_types<1..2^8-1>;
 *   SignatureAndHashAlgorithm supported_signature_algorithms<2^16-1>;
 *   DistinguishedName certificate_authorities<0..2^16-1>;
 * } CertificateRequest;
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleCertificateRequest = function(c, record, length) {
  // minimum of 3 bytes in message
  if(length < 3) {
    return c.error(c, {
      message: 'Invalid CertificateRequest. Message too short.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  }

  // TODO: TLS 1.2+ has different format including
  // SignatureAndHashAlgorithm after cert types
  var b = record.fragment;
  var msg = {
    certificate_types: readVector(b, 1),
    certificate_authorities: readVector(b, 2)
  };

  // save certificate request in session
  c.session.certificateRequest = msg;

  // expect a ServerHelloDone message next
  c.expect = SHD;

  // continue
  c.process();
};

/**
 * Called when a server receives a CertificateVerify record.
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleCertificateVerify = function(c, record, length) {
  if(length < 2) {
    return c.error(c, {
      message: 'Invalid CertificateVerify. Message too short.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  }

  // rewind to get full bytes for message so it can be manually
  // digested below (special case for CertificateVerify messages because
  // they must be digested *after* handling as opposed to all others)
  var b = record.fragment;
  b.read -= 4;
  var msgBytes = b.bytes();
  b.read += 4;

  var msg = {
    signature: readVector(b, 2).getBytes()
  };

  // TODO: add support for DSA

  // generate data to verify
  var verify = forge$b.util.createBuffer();
  verify.putBuffer(c.session.md5.digest());
  verify.putBuffer(c.session.sha1.digest());
  verify = verify.getBytes();

  try {
    var cert = c.session.clientCertificate;
    /*b = forge.pki.rsa.decrypt(
      msg.signature, cert.publicKey, true, verify.length);
    if(b !== verify) {*/
    if(!cert.publicKey.verify(verify, msg.signature, 'NONE')) {
      throw new Error('CertificateVerify signature does not match.');
    }

    // digest message now that it has been handled
    c.session.md5.update(msgBytes);
    c.session.sha1.update(msgBytes);
  } catch(ex) {
    return c.error(c, {
      message: 'Bad signature in CertificateVerify.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.handshake_failure
      }
    });
  }

  // expect ChangeCipherSpec
  c.expect = CCC;

  // continue
  c.process();
};

/**
 * Called when a client receives a ServerHelloDone record.
 *
 * When this message will be sent:
 *   The server hello done message is sent by the server to indicate the end
 *   of the server hello and associated messages. After sending this message
 *   the server will wait for a client response.
 *
 * Meaning of this message:
 *   This message means that the server is done sending messages to support
 *   the key exchange, and the client can proceed with its phase of the key
 *   exchange.
 *
 *   Upon receipt of the server hello done message the client should verify
 *   that the server provided a valid certificate if required and check that
 *   the server hello parameters are acceptable.
 *
 * struct {} ServerHelloDone;
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleServerHelloDone = function(c, record, length) {
  // len must be 0 bytes
  if(length > 0) {
    return c.error(c, {
      message: 'Invalid ServerHelloDone message. Invalid length.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.record_overflow
      }
    });
  }

  if(c.serverCertificate === null) {
    // no server certificate was provided
    var error = {
      message: 'No server certificate provided. Not enough security.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.insufficient_security
      }
    };

    // call application callback
    var depth = 0;
    var ret = c.verify(c, error.alert.description, depth, []);
    if(ret !== true) {
      // check for custom alert info
      if(ret || ret === 0) {
        // set custom message and alert description
        if(typeof ret === 'object' && !forge$b.util.isArray(ret)) {
          if(ret.message) {
            error.message = ret.message;
          }
          if(ret.alert) {
            error.alert.description = ret.alert;
          }
        } else if(typeof ret === 'number') {
          // set custom alert description
          error.alert.description = ret;
        }
      }

      // send error
      return c.error(c, error);
    }
  }

  // create client certificate message if requested
  if(c.session.certificateRequest !== null) {
    record = tls$1.createRecord(c, {
      type: tls$1.ContentType.handshake,
      data: tls$1.createCertificate(c)
    });
    tls$1.queue(c, record);
  }

  // create client key exchange message
  record = tls$1.createRecord(c, {
     type: tls$1.ContentType.handshake,
     data: tls$1.createClientKeyExchange(c)
  });
  tls$1.queue(c, record);

  // expect no messages until the following callback has been called
  c.expect = SER;

  // create callback to handle client signature (for client-certs)
  var callback = function(c, signature) {
    if(c.session.certificateRequest !== null &&
      c.session.clientCertificate !== null) {
      // create certificate verify message
      tls$1.queue(c, tls$1.createRecord(c, {
        type: tls$1.ContentType.handshake,
        data: tls$1.createCertificateVerify(c, signature)
      }));
    }

    // create change cipher spec message
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.change_cipher_spec,
      data: tls$1.createChangeCipherSpec()
    }));

    // create pending state
    c.state.pending = tls$1.createConnectionState(c);

    // change current write state to pending write state
    c.state.current.write = c.state.pending.write;

    // create finished message
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.handshake,
      data: tls$1.createFinished(c)
    }));

    // expect a server ChangeCipherSpec message next
    c.expect = SCC;

    // send records
    tls$1.flush(c);

    // continue
    c.process();
  };

  // if there is no certificate request or no client certificate, do
  // callback immediately
  if(c.session.certificateRequest === null ||
    c.session.clientCertificate === null) {
    return callback(c, null);
  }

  // otherwise get the client signature
  tls$1.getClientSignature(c, callback);
};

/**
 * Called when a ChangeCipherSpec record is received.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleChangeCipherSpec = function(c, record) {
  if(record.fragment.getByte() !== 0x01) {
    return c.error(c, {
      message: 'Invalid ChangeCipherSpec message received.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.illegal_parameter
      }
    });
  }

  // create pending state if:
  // 1. Resuming session in client mode OR
  // 2. NOT resuming session in server mode
  var client = (c.entity === tls$1.ConnectionEnd.client);
  if((c.session.resuming && client) || (!c.session.resuming && !client)) {
    c.state.pending = tls$1.createConnectionState(c);
  }

  // change current read state to pending read state
  c.state.current.read = c.state.pending.read;

  // clear pending state if:
  // 1. NOT resuming session in client mode OR
  // 2. resuming a session in server mode
  if((!c.session.resuming && client) || (c.session.resuming && !client)) {
    c.state.pending = null;
  }

  // expect a Finished record next
  c.expect = client ? SFI : CFI;

  // continue
  c.process();
};

/**
 * Called when a Finished record is received.
 *
 * When this message will be sent:
 *   A finished message is always sent immediately after a change
 *   cipher spec message to verify that the key exchange and
 *   authentication processes were successful. It is essential that a
 *   change cipher spec message be received between the other
 *   handshake messages and the Finished message.
 *
 * Meaning of this message:
 *   The finished message is the first protected with the just-
 *   negotiated algorithms, keys, and secrets. Recipients of finished
 *   messages must verify that the contents are correct.  Once a side
 *   has sent its Finished message and received and validated the
 *   Finished message from its peer, it may begin to send and receive
 *   application data over the connection.
 *
 * struct {
 *   opaque verify_data[verify_data_length];
 * } Finished;
 *
 * verify_data
 *   PRF(master_secret, finished_label, Hash(handshake_messages))
 *     [0..verify_data_length-1];
 *
 * finished_label
 *   For Finished messages sent by the client, the string
 *   "client finished". For Finished messages sent by the server, the
 *   string "server finished".
 *
 * verify_data_length depends on the cipher suite. If it is not specified
 * by the cipher suite, then it is 12. Versions of TLS < 1.2 always used
 * 12 bytes.
 *
 * @param c the connection.
 * @param record the record.
 * @param length the length of the handshake message.
 */
tls$1.handleFinished = function(c, record, length) {
  // rewind to get full bytes for message so it can be manually
  // digested below (special case for Finished messages because they
  // must be digested *after* handling as opposed to all others)
  var b = record.fragment;
  b.read -= 4;
  var msgBytes = b.bytes();
  b.read += 4;

  // message contains only verify_data
  var vd = record.fragment.getBytes();

  // ensure verify data is correct
  b = forge$b.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());

  // set label based on entity type
  var client = (c.entity === tls$1.ConnectionEnd.client);
  var label = client ? 'server finished' : 'client finished';

  // TODO: determine prf function and verify length for TLS 1.2
  var sp = c.session.sp;
  var vdl = 12;
  var prf = prf_TLS1;
  b = prf(sp.master_secret, label, b.getBytes(), vdl);
  if(b.getBytes() !== vd) {
    return c.error(c, {
      message: 'Invalid verify_data in Finished message.',
      send: true,
      alert: {
        level: tls$1.Alert.Level.fatal,
        description: tls$1.Alert.Description.decrypt_error
      }
    });
  }

  // digest finished message now that it has been handled
  c.session.md5.update(msgBytes);
  c.session.sha1.update(msgBytes);

  // resuming session as client or NOT resuming session as server
  if((c.session.resuming && client) || (!c.session.resuming && !client)) {
    // create change cipher spec message
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.change_cipher_spec,
      data: tls$1.createChangeCipherSpec()
    }));

    // change current write state to pending write state, clear pending
    c.state.current.write = c.state.pending.write;
    c.state.pending = null;

    // create finished message
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.handshake,
      data: tls$1.createFinished(c)
    }));
  }

  // expect application data next
  c.expect = client ? SAD : CAD;

  // handshake complete
  c.handshaking = false;
  ++c.handshakes;

  // save access to peer certificate
  c.peerCertificate = client ?
    c.session.serverCertificate : c.session.clientCertificate;

  // send records
  tls$1.flush(c);

  // now connected
  c.isConnected = true;
  c.connected(c);

  // continue
  c.process();
};

/**
 * Called when an Alert record is received.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleAlert = function(c, record) {
  // read alert
  var b = record.fragment;
  var alert = {
    level: b.getByte(),
    description: b.getByte()
  };

  // TODO: consider using a table?
  // get appropriate message
  var msg;
  switch(alert.description) {
  case tls$1.Alert.Description.close_notify:
    msg = 'Connection closed.';
    break;
  case tls$1.Alert.Description.unexpected_message:
    msg = 'Unexpected message.';
    break;
  case tls$1.Alert.Description.bad_record_mac:
    msg = 'Bad record MAC.';
    break;
  case tls$1.Alert.Description.decryption_failed:
    msg = 'Decryption failed.';
    break;
  case tls$1.Alert.Description.record_overflow:
    msg = 'Record overflow.';
    break;
  case tls$1.Alert.Description.decompression_failure:
    msg = 'Decompression failed.';
    break;
  case tls$1.Alert.Description.handshake_failure:
    msg = 'Handshake failure.';
    break;
  case tls$1.Alert.Description.bad_certificate:
    msg = 'Bad certificate.';
    break;
  case tls$1.Alert.Description.unsupported_certificate:
    msg = 'Unsupported certificate.';
    break;
  case tls$1.Alert.Description.certificate_revoked:
    msg = 'Certificate revoked.';
    break;
  case tls$1.Alert.Description.certificate_expired:
    msg = 'Certificate expired.';
    break;
  case tls$1.Alert.Description.certificate_unknown:
    msg = 'Certificate unknown.';
    break;
  case tls$1.Alert.Description.illegal_parameter:
    msg = 'Illegal parameter.';
    break;
  case tls$1.Alert.Description.unknown_ca:
    msg = 'Unknown certificate authority.';
    break;
  case tls$1.Alert.Description.access_denied:
    msg = 'Access denied.';
    break;
  case tls$1.Alert.Description.decode_error:
    msg = 'Decode error.';
    break;
  case tls$1.Alert.Description.decrypt_error:
    msg = 'Decrypt error.';
    break;
  case tls$1.Alert.Description.export_restriction:
    msg = 'Export restriction.';
    break;
  case tls$1.Alert.Description.protocol_version:
    msg = 'Unsupported protocol version.';
    break;
  case tls$1.Alert.Description.insufficient_security:
    msg = 'Insufficient security.';
    break;
  case tls$1.Alert.Description.internal_error:
    msg = 'Internal error.';
    break;
  case tls$1.Alert.Description.user_canceled:
    msg = 'User canceled.';
    break;
  case tls$1.Alert.Description.no_renegotiation:
    msg = 'Renegotiation not supported.';
    break;
  default:
    msg = 'Unknown error.';
    break;
  }

  // close connection on close_notify, not an error
  if(alert.description === tls$1.Alert.Description.close_notify) {
    return c.close();
  }

  // call error handler
  c.error(c, {
    message: msg,
    send: false,
    // origin is the opposite end
    origin: (c.entity === tls$1.ConnectionEnd.client) ? 'server' : 'client',
    alert: alert
  });

  // continue
  c.process();
};

/**
 * Called when a Handshake record is received.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleHandshake = function(c, record) {
  // get the handshake type and message length
  var b = record.fragment;
  var type = b.getByte();
  var length = b.getInt24();

  // see if the record fragment doesn't yet contain the full message
  if(length > b.length()) {
    // cache the record, clear its fragment, and reset the buffer read
    // pointer before the type and length were read
    c.fragmented = record;
    record.fragment = forge$b.util.createBuffer();
    b.read -= 4;

    // continue
    return c.process();
  }

  // full message now available, clear cache, reset read pointer to
  // before type and length
  c.fragmented = null;
  b.read -= 4;

  // save the handshake bytes for digestion after handler is found
  // (include type and length of handshake msg)
  var bytes = b.bytes(length + 4);

  // restore read pointer
  b.read += 4;

  // handle expected message
  if(type in hsTable[c.entity][c.expect]) {
    // initialize server session
    if(c.entity === tls$1.ConnectionEnd.server && !c.open && !c.fail) {
      c.handshaking = true;
      c.session = {
        version: null,
        extensions: {
          server_name: {
            serverNameList: []
          }
        },
        cipherSuite: null,
        compressionMethod: null,
        serverCertificate: null,
        clientCertificate: null,
        md5: forge$b.md.md5.create(),
        sha1: forge$b.md.sha1.create()
      };
    }

    /* Update handshake messages digest. Finished and CertificateVerify
      messages are not digested here. They can't be digested as part of
      the verify_data that they contain. These messages are manually
      digested in their handlers. HelloRequest messages are simply never
      included in the handshake message digest according to spec. */
    if(type !== tls$1.HandshakeType.hello_request &&
      type !== tls$1.HandshakeType.certificate_verify &&
      type !== tls$1.HandshakeType.finished) {
      c.session.md5.update(bytes);
      c.session.sha1.update(bytes);
    }

    // handle specific handshake type record
    hsTable[c.entity][c.expect][type](c, record, length);
  } else {
    // unexpected record
    tls$1.handleUnexpected(c, record);
  }
};

/**
 * Called when an ApplicationData record is received.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleApplicationData = function(c, record) {
  // buffer data, notify that its ready
  c.data.putBuffer(record.fragment);
  c.dataReady(c);

  // continue
  c.process();
};

/**
 * Called when a Heartbeat record is received.
 *
 * @param c the connection.
 * @param record the record.
 */
tls$1.handleHeartbeat = function(c, record) {
  // get the heartbeat type and payload
  var b = record.fragment;
  var type = b.getByte();
  var length = b.getInt16();
  var payload = b.getBytes(length);

  if(type === tls$1.HeartbeatMessageType.heartbeat_request) {
    // discard request during handshake or if length is too large
    if(c.handshaking || length > payload.length) {
      // continue
      return c.process();
    }
    // retransmit payload
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.heartbeat,
      data: tls$1.createHeartbeat(
        tls$1.HeartbeatMessageType.heartbeat_response, payload)
    }));
    tls$1.flush(c);
  } else if(type === tls$1.HeartbeatMessageType.heartbeat_response) {
    // check payload against expected payload, discard heartbeat if no match
    if(payload !== c.expectedHeartbeatPayload) {
      // continue
      return c.process();
    }

    // notify that a valid heartbeat was received
    if(c.heartbeatReceived) {
      c.heartbeatReceived(c, forge$b.util.createBuffer(payload));
    }
  }

  // continue
  c.process();
};

/**
 * The transistional state tables for receiving TLS records. It maps the
 * current TLS engine state and a received record to a function to handle the
 * record and update the state.
 *
 * For instance, if the current state is SHE, then the TLS engine is expecting
 * a ServerHello record. Once a record is received, the handler function is
 * looked up using the state SHE and the record's content type.
 *
 * The resulting function will either be an error handler or a record handler.
 * The function will take whatever action is appropriate and update the state
 * for the next record.
 *
 * The states are all based on possible server record types. Note that the
 * client will never specifically expect to receive a HelloRequest or an alert
 * from the server so there is no state that reflects this. These messages may
 * occur at any time.
 *
 * There are two tables for mapping states because there is a second tier of
 * types for handshake messages. Once a record with a content type of handshake
 * is received, the handshake record handler will look up the handshake type in
 * the secondary map to get its appropriate handler.
 *
 * Valid message orders are as follows:
 *
 * =======================FULL HANDSHAKE======================
 * Client                                               Server
 *
 * ClientHello                  -------->
 *                                                 ServerHello
 *                                                Certificate*
 *                                          ServerKeyExchange*
 *                                         CertificateRequest*
 *                              <--------      ServerHelloDone
 * Certificate*
 * ClientKeyExchange
 * CertificateVerify*
 * [ChangeCipherSpec]
 * Finished                     -------->
 *                                          [ChangeCipherSpec]
 *                              <--------             Finished
 * Application Data             <------->     Application Data
 *
 * =====================SESSION RESUMPTION=====================
 * Client                                                Server
 *
 * ClientHello                   -------->
 *                                                  ServerHello
 *                                           [ChangeCipherSpec]
 *                               <--------             Finished
 * [ChangeCipherSpec]
 * Finished                      -------->
 * Application Data              <------->     Application Data
 */
// client expect states (indicate which records are expected to be received)
var SHE = 0; // rcv server hello
var SCE = 1; // rcv server certificate
var SKE = 2; // rcv server key exchange
var SCR = 3; // rcv certificate request
var SHD = 4; // rcv server hello done
var SCC = 5; // rcv change cipher spec
var SFI = 6; // rcv finished
var SAD = 7; // rcv application data
var SER = 8; // not expecting any messages at this point

// server expect states
var CHE = 0; // rcv client hello
var CCE = 1; // rcv client certificate
var CKE = 2; // rcv client key exchange
var CCV = 3; // rcv certificate verify
var CCC = 4; // rcv change cipher spec
var CFI = 5; // rcv finished
var CAD = 6; // rcv application data

// map client current expect state and content type to function
var __ = tls$1.handleUnexpected;
var R0 = tls$1.handleChangeCipherSpec;
var R1 = tls$1.handleAlert;
var R2 = tls$1.handleHandshake;
var R3 = tls$1.handleApplicationData;
var R4 = tls$1.handleHeartbeat;
var ctTable = [];
ctTable[tls$1.ConnectionEnd.client] = [
//      CC,AL,HS,AD,HB
/*SHE*/[__,R1,R2,__,R4],
/*SCE*/[__,R1,R2,__,R4],
/*SKE*/[__,R1,R2,__,R4],
/*SCR*/[__,R1,R2,__,R4],
/*SHD*/[__,R1,R2,__,R4],
/*SCC*/[R0,R1,__,__,R4],
/*SFI*/[__,R1,R2,__,R4],
/*SAD*/[__,R1,R2,R3,R4],
/*SER*/[__,R1,R2,__,R4]
];

// map server current expect state and content type to function
ctTable[tls$1.ConnectionEnd.server] = [
//      CC,AL,HS,AD
/*CHE*/[__,R1,R2,__,R4],
/*CCE*/[__,R1,R2,__,R4],
/*CKE*/[__,R1,R2,__,R4],
/*CCV*/[__,R1,R2,__,R4],
/*CCC*/[R0,R1,__,__,R4],
/*CFI*/[__,R1,R2,__,R4],
/*CAD*/[__,R1,R2,R3,R4],
/*CER*/[__,R1,R2,__,R4]
];

// map client current expect state and handshake type to function
var H0 = tls$1.handleHelloRequest;
var H1 = tls$1.handleServerHello;
var H2 = tls$1.handleCertificate;
var H3 = tls$1.handleServerKeyExchange;
var H4 = tls$1.handleCertificateRequest;
var H5 = tls$1.handleServerHelloDone;
var H6 = tls$1.handleFinished;
var hsTable = [];
hsTable[tls$1.ConnectionEnd.client] = [
//      HR,01,SH,03,04,05,06,07,08,09,10,SC,SK,CR,HD,15,CK,17,18,19,FI
/*SHE*/[__,__,H1,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*SCE*/[H0,__,__,__,__,__,__,__,__,__,__,H2,H3,H4,H5,__,__,__,__,__,__],
/*SKE*/[H0,__,__,__,__,__,__,__,__,__,__,__,H3,H4,H5,__,__,__,__,__,__],
/*SCR*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,H4,H5,__,__,__,__,__,__],
/*SHD*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,__,H5,__,__,__,__,__,__],
/*SCC*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*SFI*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,H6],
/*SAD*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*SER*/[H0,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__]
];

// map server current expect state and handshake type to function
// Note: CAD[CH] does not map to FB because renegotation is prohibited
var H7 = tls$1.handleClientHello;
var H8 = tls$1.handleClientKeyExchange;
var H9 = tls$1.handleCertificateVerify;
hsTable[tls$1.ConnectionEnd.server] = [
//      01,CH,02,03,04,05,06,07,08,09,10,CC,12,13,14,CV,CK,17,18,19,FI
/*CHE*/[__,H7,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*CCE*/[__,__,__,__,__,__,__,__,__,__,__,H2,__,__,__,__,__,__,__,__,__],
/*CKE*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,H8,__,__,__,__],
/*CCV*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,H9,__,__,__,__,__],
/*CCC*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*CFI*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,H6],
/*CAD*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__],
/*CER*/[__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__,__]
];

/**
 * Generates the master_secret and keys using the given security parameters.
 *
 * The security parameters for a TLS connection state are defined as such:
 *
 * struct {
 *   ConnectionEnd          entity;
 *   PRFAlgorithm           prf_algorithm;
 *   BulkCipherAlgorithm    bulk_cipher_algorithm;
 *   CipherType             cipher_type;
 *   uint8                  enc_key_length;
 *   uint8                  block_length;
 *   uint8                  fixed_iv_length;
 *   uint8                  record_iv_length;
 *   MACAlgorithm           mac_algorithm;
 *   uint8                  mac_length;
 *   uint8                  mac_key_length;
 *   CompressionMethod      compression_algorithm;
 *   opaque                 master_secret[48];
 *   opaque                 client_random[32];
 *   opaque                 server_random[32];
 * } SecurityParameters;
 *
 * Note that this definition is from TLS 1.2. In TLS 1.0 some of these
 * parameters are ignored because, for instance, the PRFAlgorithm is a
 * builtin-fixed algorithm combining iterations of MD5 and SHA-1 in TLS 1.0.
 *
 * The Record Protocol requires an algorithm to generate keys required by the
 * current connection state.
 *
 * The master secret is expanded into a sequence of secure bytes, which is then
 * split to a client write MAC key, a server write MAC key, a client write
 * encryption key, and a server write encryption key. In TLS 1.0 a client write
 * IV and server write IV are also generated. Each of these is generated from
 * the byte sequence in that order. Unused values are empty. In TLS 1.2, some
 * AEAD ciphers may additionally require a client write IV and a server write
 * IV (see Section 6.2.3.3).
 *
 * When keys, MAC keys, and IVs are generated, the master secret is used as an
 * entropy source.
 *
 * To generate the key material, compute:
 *
 * master_secret = PRF(pre_master_secret, "master secret",
 *                     ClientHello.random + ServerHello.random)
 *
 * key_block = PRF(SecurityParameters.master_secret,
 *                 "key expansion",
 *                 SecurityParameters.server_random +
 *                 SecurityParameters.client_random);
 *
 * until enough output has been generated. Then, the key_block is
 * partitioned as follows:
 *
 * client_write_MAC_key[SecurityParameters.mac_key_length]
 * server_write_MAC_key[SecurityParameters.mac_key_length]
 * client_write_key[SecurityParameters.enc_key_length]
 * server_write_key[SecurityParameters.enc_key_length]
 * client_write_IV[SecurityParameters.fixed_iv_length]
 * server_write_IV[SecurityParameters.fixed_iv_length]
 *
 * In TLS 1.2, the client_write_IV and server_write_IV are only generated for
 * implicit nonce techniques as described in Section 3.2.1 of [AEAD]. This
 * implementation uses TLS 1.0 so IVs are generated.
 *
 * Implementation note: The currently defined cipher suite which requires the
 * most material is AES_256_CBC_SHA256. It requires 2 x 32 byte keys and 2 x 32
 * byte MAC keys, for a total 128 bytes of key material. In TLS 1.0 it also
 * requires 2 x 16 byte IVs, so it actually takes 160 bytes of key material.
 *
 * @param c the connection.
 * @param sp the security parameters to use.
 *
 * @return the security keys.
 */
tls$1.generateKeys = function(c, sp) {
  // TLS_RSA_WITH_AES_128_CBC_SHA (required to be compliant with TLS 1.2) &
  // TLS_RSA_WITH_AES_256_CBC_SHA are the only cipher suites implemented
  // at present

  // TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA is required to be compliant with
  // TLS 1.0 but we don't care right now because AES is better and we have
  // an implementation for it

  // TODO: TLS 1.2 implementation
  /*
  // determine the PRF
  var prf;
  switch(sp.prf_algorithm) {
  case tls.PRFAlgorithm.tls_prf_sha256:
    prf = prf_sha256;
    break;
  default:
    // should never happen
    throw new Error('Invalid PRF');
  }
  */

  // TLS 1.0/1.1 implementation
  var prf = prf_TLS1;

  // concatenate server and client random
  var random = sp.client_random + sp.server_random;

  // only create master secret if session is new
  if(!c.session.resuming) {
    // create master secret, clean up pre-master secret
    sp.master_secret = prf(
      sp.pre_master_secret, 'master secret', random, 48).bytes();
    sp.pre_master_secret = null;
  }

  // generate the amount of key material needed
  random = sp.server_random + sp.client_random;
  var length = 2 * sp.mac_key_length + 2 * sp.enc_key_length;

  // include IV for TLS/1.0
  var tls10 = (c.version.major === tls$1.Versions.TLS_1_0.major &&
    c.version.minor === tls$1.Versions.TLS_1_0.minor);
  if(tls10) {
    length += 2 * sp.fixed_iv_length;
  }
  var km = prf(sp.master_secret, 'key expansion', random, length);

  // split the key material into the MAC and encryption keys
  var rval = {
    client_write_MAC_key: km.getBytes(sp.mac_key_length),
    server_write_MAC_key: km.getBytes(sp.mac_key_length),
    client_write_key: km.getBytes(sp.enc_key_length),
    server_write_key: km.getBytes(sp.enc_key_length)
  };

  // include TLS 1.0 IVs
  if(tls10) {
    rval.client_write_IV = km.getBytes(sp.fixed_iv_length);
    rval.server_write_IV = km.getBytes(sp.fixed_iv_length);
  }

  return rval;
};

/**
 * Creates a new initialized TLS connection state. A connection state has
 * a read mode and a write mode.
 *
 * compression state:
 *   The current state of the compression algorithm.
 *
 * cipher state:
 *   The current state of the encryption algorithm. This will consist of the
 *   scheduled key for that connection. For stream ciphers, this will also
 *   contain whatever state information is necessary to allow the stream to
 *   continue to encrypt or decrypt data.
 *
 * MAC key:
 *   The MAC key for the connection.
 *
 * sequence number:
 *   Each connection state contains a sequence number, which is maintained
 *   separately for read and write states. The sequence number MUST be set to
 *   zero whenever a connection state is made the active state. Sequence
 *   numbers are of type uint64 and may not exceed 2^64-1. Sequence numbers do
 *   not wrap. If a TLS implementation would need to wrap a sequence number,
 *   it must renegotiate instead. A sequence number is incremented after each
 *   record: specifically, the first record transmitted under a particular
 *   connection state MUST use sequence number 0.
 *
 * @param c the connection.
 *
 * @return the new initialized TLS connection state.
 */
tls$1.createConnectionState = function(c) {
  var client = (c.entity === tls$1.ConnectionEnd.client);

  var createMode = function() {
    var mode = {
      // two 32-bit numbers, first is most significant
      sequenceNumber: [0, 0],
      macKey: null,
      macLength: 0,
      macFunction: null,
      cipherState: null,
      cipherFunction: function(record) {return true;},
      compressionState: null,
      compressFunction: function(record) {return true;},
      updateSequenceNumber: function() {
        if(mode.sequenceNumber[1] === 0xFFFFFFFF) {
          mode.sequenceNumber[1] = 0;
          ++mode.sequenceNumber[0];
        } else {
          ++mode.sequenceNumber[1];
        }
      }
    };
    return mode;
  };
  var state = {
    read: createMode(),
    write: createMode()
  };

  // update function in read mode will decrypt then decompress a record
  state.read.update = function(c, record) {
    if(!state.read.cipherFunction(record, state.read)) {
      c.error(c, {
        message: 'Could not decrypt record or bad MAC.',
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          // doesn't matter if decryption failed or MAC was
          // invalid, return the same error so as not to reveal
          // which one occurred
          description: tls$1.Alert.Description.bad_record_mac
        }
      });
    } else if(!state.read.compressFunction(c, record, state.read)) {
      c.error(c, {
        message: 'Could not decompress record.',
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.decompression_failure
        }
      });
    }
    return !c.fail;
  };

  // update function in write mode will compress then encrypt a record
  state.write.update = function(c, record) {
    if(!state.write.compressFunction(c, record, state.write)) {
      // error, but do not send alert since it would require
      // compression as well
      c.error(c, {
        message: 'Could not compress record.',
        send: false,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.internal_error
        }
      });
    } else if(!state.write.cipherFunction(record, state.write)) {
      // error, but do not send alert since it would require
      // encryption as well
      c.error(c, {
        message: 'Could not encrypt record.',
        send: false,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.internal_error
        }
      });
    }
    return !c.fail;
  };

  // handle security parameters
  if(c.session) {
    var sp = c.session.sp;
    c.session.cipherSuite.initSecurityParameters(sp);

    // generate keys
    sp.keys = tls$1.generateKeys(c, sp);
    state.read.macKey = client ?
      sp.keys.server_write_MAC_key : sp.keys.client_write_MAC_key;
    state.write.macKey = client ?
      sp.keys.client_write_MAC_key : sp.keys.server_write_MAC_key;

    // cipher suite setup
    c.session.cipherSuite.initConnectionState(state, c, sp);

    // compression setup
    switch(sp.compression_algorithm) {
    case tls$1.CompressionMethod.none:
      break;
    case tls$1.CompressionMethod.deflate:
      state.read.compressFunction = inflate;
      state.write.compressFunction = deflate;
      break;
    default:
      throw new Error('Unsupported compression algorithm.');
    }
  }

  return state;
};

/**
 * Creates a Random structure.
 *
 * struct {
 *   uint32 gmt_unix_time;
 *   opaque random_bytes[28];
 * } Random;
 *
 * gmt_unix_time:
 *   The current time and date in standard UNIX 32-bit format (seconds since
 *   the midnight starting Jan 1, 1970, UTC, ignoring leap seconds) according
 *   to the sender's internal clock. Clocks are not required to be set
 *   correctly by the basic TLS protocol; higher-level or application
 *   protocols may define additional requirements. Note that, for historical
 *   reasons, the data element is named using GMT, the predecessor of the
 *   current worldwide time base, UTC.
 * random_bytes:
 *   28 bytes generated by a secure random number generator.
 *
 * @return the Random structure as a byte array.
 */
tls$1.createRandom = function() {
  // get UTC milliseconds
  var d = new Date();
  var utc = +d + d.getTimezoneOffset() * 60000;
  var rval = forge$b.util.createBuffer();
  rval.putInt32(utc);
  rval.putBytes(forge$b.random.getBytes(28));
  return rval;
};

/**
 * Creates a TLS record with the given type and data.
 *
 * @param c the connection.
 * @param options:
 *   type: the record type.
 *   data: the plain text data in a byte buffer.
 *
 * @return the created record.
 */
tls$1.createRecord = function(c, options) {
  if(!options.data) {
    return null;
  }
  var record = {
    type: options.type,
    version: {
      major: c.version.major,
      minor: c.version.minor
    },
    length: options.data.length(),
    fragment: options.data
  };
  return record;
};

/**
 * Creates a TLS alert record.
 *
 * @param c the connection.
 * @param alert:
 *   level: the TLS alert level.
 *   description: the TLS alert description.
 *
 * @return the created alert record.
 */
tls$1.createAlert = function(c, alert) {
  var b = forge$b.util.createBuffer();
  b.putByte(alert.level);
  b.putByte(alert.description);
  return tls$1.createRecord(c, {
    type: tls$1.ContentType.alert,
    data: b
  });
};

/* The structure of a TLS handshake message.
 *
 * struct {
 *    HandshakeType msg_type;    // handshake type
 *    uint24 length;             // bytes in message
 *    select(HandshakeType) {
 *       case hello_request:       HelloRequest;
 *       case client_hello:        ClientHello;
 *       case server_hello:        ServerHello;
 *       case certificate:         Certificate;
 *       case server_key_exchange: ServerKeyExchange;
 *       case certificate_request: CertificateRequest;
 *       case server_hello_done:   ServerHelloDone;
 *       case certificate_verify:  CertificateVerify;
 *       case client_key_exchange: ClientKeyExchange;
 *       case finished:            Finished;
 *    } body;
 * } Handshake;
 */

/**
 * Creates a ClientHello message.
 *
 * opaque SessionID<0..32>;
 * enum { null(0), deflate(1), (255) } CompressionMethod;
 * uint8 CipherSuite[2];
 *
 * struct {
 *   ProtocolVersion client_version;
 *   Random random;
 *   SessionID session_id;
 *   CipherSuite cipher_suites<2..2^16-2>;
 *   CompressionMethod compression_methods<1..2^8-1>;
 *   select(extensions_present) {
 *     case false:
 *       struct {};
 *     case true:
 *       Extension extensions<0..2^16-1>;
 *   };
 * } ClientHello;
 *
 * The extension format for extended client hellos and server hellos is:
 *
 * struct {
 *   ExtensionType extension_type;
 *   opaque extension_data<0..2^16-1>;
 * } Extension;
 *
 * Here:
 *
 * - "extension_type" identifies the particular extension type.
 * - "extension_data" contains information specific to the particular
 * extension type.
 *
 * The extension types defined in this document are:
 *
 * enum {
 *   server_name(0), max_fragment_length(1),
 *   client_certificate_url(2), trusted_ca_keys(3),
 *   truncated_hmac(4), status_request(5), (65535)
 * } ExtensionType;
 *
 * @param c the connection.
 *
 * @return the ClientHello byte buffer.
 */
tls$1.createClientHello = function(c) {
  // save hello version
  c.session.clientHelloVersion = {
    major: c.version.major,
    minor: c.version.minor
  };

  // create supported cipher suites
  var cipherSuites = forge$b.util.createBuffer();
  for(var i = 0; i < c.cipherSuites.length; ++i) {
    var cs = c.cipherSuites[i];
    cipherSuites.putByte(cs.id[0]);
    cipherSuites.putByte(cs.id[1]);
  }
  var cSuites = cipherSuites.length();

  // create supported compression methods, null always supported, but
  // also support deflate if connection has inflate and deflate methods
  var compressionMethods = forge$b.util.createBuffer();
  compressionMethods.putByte(tls$1.CompressionMethod.none);
  // FIXME: deflate support disabled until issues with raw deflate data
  // without zlib headers are resolved
  /*
  if(c.inflate !== null && c.deflate !== null) {
    compressionMethods.putByte(tls.CompressionMethod.deflate);
  }
  */
  var cMethods = compressionMethods.length();

  // create TLS SNI (server name indication) extension if virtual host
  // has been specified, see RFC 3546
  var extensions = forge$b.util.createBuffer();
  if(c.virtualHost) {
    // create extension struct
    var ext = forge$b.util.createBuffer();
    ext.putByte(0x00); // type server_name (ExtensionType is 2 bytes)
    ext.putByte(0x00);

    /* In order to provide the server name, clients MAY include an
     * extension of type "server_name" in the (extended) client hello.
     * The "extension_data" field of this extension SHALL contain
     * "ServerNameList" where:
     *
     * struct {
     *   NameType name_type;
     *   select(name_type) {
     *     case host_name: HostName;
     *   } name;
     * } ServerName;
     *
     * enum {
     *   host_name(0), (255)
     * } NameType;
     *
     * opaque HostName<1..2^16-1>;
     *
     * struct {
     *   ServerName server_name_list<1..2^16-1>
     * } ServerNameList;
     */
    var serverName = forge$b.util.createBuffer();
    serverName.putByte(0x00); // type host_name
    writeVector(serverName, 2, forge$b.util.createBuffer(c.virtualHost));

    // ServerNameList is in extension_data
    var snList = forge$b.util.createBuffer();
    writeVector(snList, 2, serverName);
    writeVector(ext, 2, snList);
    extensions.putBuffer(ext);
  }
  var extLength = extensions.length();
  if(extLength > 0) {
    // add extension vector length
    extLength += 2;
  }

  // determine length of the handshake message
  // cipher suites and compression methods size will need to be
  // updated if more get added to the list
  var sessionId = c.session.id;
  var length =
    sessionId.length + 1 + // session ID vector
    2 +                    // version (major + minor)
    4 + 28 +               // random time and random bytes
    2 + cSuites +          // cipher suites vector
    1 + cMethods +         // compression methods vector
    extLength;             // extensions vector

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.client_hello);
  rval.putInt24(length);                     // handshake length
  rval.putByte(c.version.major);             // major version
  rval.putByte(c.version.minor);             // minor version
  rval.putBytes(c.session.sp.client_random); // random time + bytes
  writeVector(rval, 1, forge$b.util.createBuffer(sessionId));
  writeVector(rval, 2, cipherSuites);
  writeVector(rval, 1, compressionMethods);
  if(extLength > 0) {
    writeVector(rval, 2, extensions);
  }
  return rval;
};

/**
 * Creates a ServerHello message.
 *
 * @param c the connection.
 *
 * @return the ServerHello byte buffer.
 */
tls$1.createServerHello = function(c) {
  // determine length of the handshake message
  var sessionId = c.session.id;
  var length =
    sessionId.length + 1 + // session ID vector
    2 +                    // version (major + minor)
    4 + 28 +               // random time and random bytes
    2 +                    // chosen cipher suite
    1;                     // chosen compression method

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.server_hello);
  rval.putInt24(length);                     // handshake length
  rval.putByte(c.version.major);             // major version
  rval.putByte(c.version.minor);             // minor version
  rval.putBytes(c.session.sp.server_random); // random time + bytes
  writeVector(rval, 1, forge$b.util.createBuffer(sessionId));
  rval.putByte(c.session.cipherSuite.id[0]);
  rval.putByte(c.session.cipherSuite.id[1]);
  rval.putByte(c.session.compressionMethod);
  return rval;
};

/**
 * Creates a Certificate message.
 *
 * When this message will be sent:
 *   This is the first message the client can send after receiving a server
 *   hello done message and the first message the server can send after
 *   sending a ServerHello. This client message is only sent if the server
 *   requests a certificate. If no suitable certificate is available, the
 *   client should send a certificate message containing no certificates. If
 *   client authentication is required by the server for the handshake to
 *   continue, it may respond with a fatal handshake failure alert.
 *
 * opaque ASN.1Cert<1..2^24-1>;
 *
 * struct {
 *   ASN.1Cert certificate_list<0..2^24-1>;
 * } Certificate;
 *
 * @param c the connection.
 *
 * @return the Certificate byte buffer.
 */
tls$1.createCertificate = function(c) {
  // TODO: check certificate request to ensure types are supported

  // get a certificate (a certificate as a PEM string)
  var client = (c.entity === tls$1.ConnectionEnd.client);
  var cert = null;
  if(c.getCertificate) {
    var hint;
    if(client) {
      hint = c.session.certificateRequest;
    } else {
      hint = c.session.extensions.server_name.serverNameList;
    }
    cert = c.getCertificate(c, hint);
  }

  // buffer to hold certificate list
  var certList = forge$b.util.createBuffer();
  if(cert !== null) {
    try {
      // normalize cert to a chain of certificates
      if(!forge$b.util.isArray(cert)) {
        cert = [cert];
      }
      var asn1 = null;
      for(var i = 0; i < cert.length; ++i) {
        var msg = forge$b.pem.decode(cert[i])[0];
        if(msg.type !== 'CERTIFICATE' &&
          msg.type !== 'X509 CERTIFICATE' &&
          msg.type !== 'TRUSTED CERTIFICATE') {
          var error = new Error('Could not convert certificate from PEM; PEM ' +
            'header type is not "CERTIFICATE", "X509 CERTIFICATE", or ' +
            '"TRUSTED CERTIFICATE".');
          error.headerType = msg.type;
          throw error;
        }
        if(msg.procType && msg.procType.type === 'ENCRYPTED') {
          throw new Error('Could not convert certificate from PEM; PEM is encrypted.');
        }

        var der = forge$b.util.createBuffer(msg.body);
        if(asn1 === null) {
          asn1 = forge$b.asn1.fromDer(der.bytes(), false);
        }

        // certificate entry is itself a vector with 3 length bytes
        var certBuffer = forge$b.util.createBuffer();
        writeVector(certBuffer, 3, der);

        // add cert vector to cert list vector
        certList.putBuffer(certBuffer);
      }

      // save certificate
      cert = forge$b.pki.certificateFromAsn1(asn1);
      if(client) {
        c.session.clientCertificate = cert;
      } else {
        c.session.serverCertificate = cert;
      }
    } catch(ex) {
      return c.error(c, {
        message: 'Could not send certificate list.',
        cause: ex,
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.bad_certificate
        }
      });
    }
  }

  // determine length of the handshake message
  var length = 3 + certList.length(); // cert list vector

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.certificate);
  rval.putInt24(length);
  writeVector(rval, 3, certList);
  return rval;
};

/**
 * Creates a ClientKeyExchange message.
 *
 * When this message will be sent:
 *   This message is always sent by the client. It will immediately follow the
 *   client certificate message, if it is sent. Otherwise it will be the first
 *   message sent by the client after it receives the server hello done
 *   message.
 *
 * Meaning of this message:
 *   With this message, the premaster secret is set, either though direct
 *   transmission of the RSA-encrypted secret, or by the transmission of
 *   Diffie-Hellman parameters which will allow each side to agree upon the
 *   same premaster secret. When the key exchange method is DH_RSA or DH_DSS,
 *   client certification has been requested, and the client was able to
 *   respond with a certificate which contained a Diffie-Hellman public key
 *   whose parameters (group and generator) matched those specified by the
 *   server in its certificate, this message will not contain any data.
 *
 * Meaning of this message:
 *   If RSA is being used for key agreement and authentication, the client
 *   generates a 48-byte premaster secret, encrypts it using the public key
 *   from the server's certificate or the temporary RSA key provided in a
 *   server key exchange message, and sends the result in an encrypted
 *   premaster secret message. This structure is a variant of the client
 *   key exchange message, not a message in itself.
 *
 * struct {
 *   select(KeyExchangeAlgorithm) {
 *     case rsa: EncryptedPreMasterSecret;
 *     case diffie_hellman: ClientDiffieHellmanPublic;
 *   } exchange_keys;
 * } ClientKeyExchange;
 *
 * struct {
 *   ProtocolVersion client_version;
 *   opaque random[46];
 * } PreMasterSecret;
 *
 * struct {
 *   public-key-encrypted PreMasterSecret pre_master_secret;
 * } EncryptedPreMasterSecret;
 *
 * A public-key-encrypted element is encoded as a vector <0..2^16-1>.
 *
 * @param c the connection.
 *
 * @return the ClientKeyExchange byte buffer.
 */
tls$1.createClientKeyExchange = function(c) {
  // create buffer to encrypt
  var b = forge$b.util.createBuffer();

  // add highest client-supported protocol to help server avoid version
  // rollback attacks
  b.putByte(c.session.clientHelloVersion.major);
  b.putByte(c.session.clientHelloVersion.minor);

  // generate and add 46 random bytes
  b.putBytes(forge$b.random.getBytes(46));

  // save pre-master secret
  var sp = c.session.sp;
  sp.pre_master_secret = b.getBytes();

  // RSA-encrypt the pre-master secret
  var key = c.session.serverCertificate.publicKey;
  b = key.encrypt(sp.pre_master_secret);

  /* Note: The encrypted pre-master secret will be stored in a
    public-key-encrypted opaque vector that has the length prefixed using
    2 bytes, so include those 2 bytes in the handshake message length. This
    is done as a minor optimization instead of calling writeVector(). */

  // determine length of the handshake message
  var length = b.length + 2;

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.client_key_exchange);
  rval.putInt24(length);
  // add vector length bytes
  rval.putInt16(b.length);
  rval.putBytes(b);
  return rval;
};

/**
 * Creates a ServerKeyExchange message.
 *
 * @param c the connection.
 *
 * @return the ServerKeyExchange byte buffer.
 */
tls$1.createServerKeyExchange = function(c) {

  // build record fragment
  var rval = forge$b.util.createBuffer();
  return rval;
};

/**
 * Gets the signed data used to verify a client-side certificate. See
 * tls.createCertificateVerify() for details.
 *
 * @param c the connection.
 * @param callback the callback to call once the signed data is ready.
 */
tls$1.getClientSignature = function(c, callback) {
  // generate data to RSA encrypt
  var b = forge$b.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());
  b = b.getBytes();

  // create default signing function as necessary
  c.getSignature = c.getSignature || function(c, b, callback) {
    // do rsa encryption, call callback
    var privateKey = null;
    if(c.getPrivateKey) {
      try {
        privateKey = c.getPrivateKey(c, c.session.clientCertificate);
        privateKey = forge$b.pki.privateKeyFromPem(privateKey);
      } catch(ex) {
        c.error(c, {
          message: 'Could not get private key.',
          cause: ex,
          send: true,
          alert: {
            level: tls$1.Alert.Level.fatal,
            description: tls$1.Alert.Description.internal_error
          }
        });
      }
    }
    if(privateKey === null) {
      c.error(c, {
        message: 'No private key set.',
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: tls$1.Alert.Description.internal_error
        }
      });
    } else {
      b = privateKey.sign(b, null);
    }
    callback(c, b);
  };

  // get client signature
  c.getSignature(c, b, callback);
};

/**
 * Creates a CertificateVerify message.
 *
 * Meaning of this message:
 *   This structure conveys the client's Diffie-Hellman public value
 *   (Yc) if it was not already included in the client's certificate.
 *   The encoding used for Yc is determined by the enumerated
 *   PublicValueEncoding. This structure is a variant of the client
 *   key exchange message, not a message in itself.
 *
 * When this message will be sent:
 *   This message is used to provide explicit verification of a client
 *   certificate. This message is only sent following a client
 *   certificate that has signing capability (i.e. all certificates
 *   except those containing fixed Diffie-Hellman parameters). When
 *   sent, it will immediately follow the client key exchange message.
 *
 * struct {
 *   Signature signature;
 * } CertificateVerify;
 *
 * CertificateVerify.signature.md5_hash
 *   MD5(handshake_messages);
 *
 * Certificate.signature.sha_hash
 *   SHA(handshake_messages);
 *
 * Here handshake_messages refers to all handshake messages sent or
 * received starting at client hello up to but not including this
 * message, including the type and length fields of the handshake
 * messages.
 *
 * select(SignatureAlgorithm) {
 *   case anonymous: struct { };
 *   case rsa:
 *     digitally-signed struct {
 *       opaque md5_hash[16];
 *       opaque sha_hash[20];
 *     };
 *   case dsa:
 *     digitally-signed struct {
 *       opaque sha_hash[20];
 *     };
 * } Signature;
 *
 * In digital signing, one-way hash functions are used as input for a
 * signing algorithm. A digitally-signed element is encoded as an opaque
 * vector <0..2^16-1>, where the length is specified by the signing
 * algorithm and key.
 *
 * In RSA signing, a 36-byte structure of two hashes (one SHA and one
 * MD5) is signed (encrypted with the private key). It is encoded with
 * PKCS #1 block type 0 or type 1 as described in [PKCS1].
 *
 * In DSS, the 20 bytes of the SHA hash are run directly through the
 * Digital Signing Algorithm with no additional hashing.
 *
 * @param c the connection.
 * @param signature the signature to include in the message.
 *
 * @return the CertificateVerify byte buffer.
 */
tls$1.createCertificateVerify = function(c, signature) {
  /* Note: The signature will be stored in a "digitally-signed" opaque
    vector that has the length prefixed using 2 bytes, so include those
    2 bytes in the handshake message length. This is done as a minor
    optimization instead of calling writeVector(). */

  // determine length of the handshake message
  var length = signature.length + 2;

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.certificate_verify);
  rval.putInt24(length);
  // add vector length bytes
  rval.putInt16(signature.length);
  rval.putBytes(signature);
  return rval;
};

/**
 * Creates a CertificateRequest message.
 *
 * @param c the connection.
 *
 * @return the CertificateRequest byte buffer.
 */
tls$1.createCertificateRequest = function(c) {
  // TODO: support other certificate types
  var certTypes = forge$b.util.createBuffer();

  // common RSA certificate type
  certTypes.putByte(0x01);

  // add distinguished names from CA store
  var cAs = forge$b.util.createBuffer();
  for(var key in c.caStore.certs) {
    var cert = c.caStore.certs[key];
    var dn = forge$b.pki.distinguishedNameToAsn1(cert.subject);
    var byteBuffer = forge$b.asn1.toDer(dn);
    cAs.putInt16(byteBuffer.length());
    cAs.putBuffer(byteBuffer);
  }

  // TODO: TLS 1.2+ has a different format

  // determine length of the handshake message
  var length =
    1 + certTypes.length() +
    2 + cAs.length();

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.certificate_request);
  rval.putInt24(length);
  writeVector(rval, 1, certTypes);
  writeVector(rval, 2, cAs);
  return rval;
};

/**
 * Creates a ServerHelloDone message.
 *
 * @param c the connection.
 *
 * @return the ServerHelloDone byte buffer.
 */
tls$1.createServerHelloDone = function(c) {
  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.server_hello_done);
  rval.putInt24(0);
  return rval;
};

/**
 * Creates a ChangeCipherSpec message.
 *
 * The change cipher spec protocol exists to signal transitions in
 * ciphering strategies. The protocol consists of a single message,
 * which is encrypted and compressed under the current (not the pending)
 * connection state. The message consists of a single byte of value 1.
 *
 * struct {
 *   enum { change_cipher_spec(1), (255) } type;
 * } ChangeCipherSpec;
 *
 * @return the ChangeCipherSpec byte buffer.
 */
tls$1.createChangeCipherSpec = function() {
  var rval = forge$b.util.createBuffer();
  rval.putByte(0x01);
  return rval;
};

/**
 * Creates a Finished message.
 *
 * struct {
 *   opaque verify_data[12];
 * } Finished;
 *
 * verify_data
 *   PRF(master_secret, finished_label, MD5(handshake_messages) +
 *   SHA-1(handshake_messages)) [0..11];
 *
 * finished_label
 *   For Finished messages sent by the client, the string "client
 *   finished". For Finished messages sent by the server, the
 *   string "server finished".
 *
 * handshake_messages
 *   All of the data from all handshake messages up to but not
 *   including this message. This is only data visible at the
 *   handshake layer and does not include record layer headers.
 *   This is the concatenation of all the Handshake structures as
 *   defined in 7.4 exchanged thus far.
 *
 * @param c the connection.
 *
 * @return the Finished byte buffer.
 */
tls$1.createFinished = function(c) {
  // generate verify_data
  var b = forge$b.util.createBuffer();
  b.putBuffer(c.session.md5.digest());
  b.putBuffer(c.session.sha1.digest());

  // TODO: determine prf function and verify length for TLS 1.2
  var client = (c.entity === tls$1.ConnectionEnd.client);
  var sp = c.session.sp;
  var vdl = 12;
  var prf = prf_TLS1;
  var label = client ? 'client finished' : 'server finished';
  b = prf(sp.master_secret, label, b.getBytes(), vdl);

  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(tls$1.HandshakeType.finished);
  rval.putInt24(b.length());
  rval.putBuffer(b);
  return rval;
};

/**
 * Creates a HeartbeatMessage (See RFC 6520).
 *
 * struct {
 *   HeartbeatMessageType type;
 *   uint16 payload_length;
 *   opaque payload[HeartbeatMessage.payload_length];
 *   opaque padding[padding_length];
 * } HeartbeatMessage;
 *
 * The total length of a HeartbeatMessage MUST NOT exceed 2^14 or
 * max_fragment_length when negotiated as defined in [RFC6066].
 *
 * type: The message type, either heartbeat_request or heartbeat_response.
 *
 * payload_length: The length of the payload.
 *
 * payload: The payload consists of arbitrary content.
 *
 * padding: The padding is random content that MUST be ignored by the
 *   receiver. The length of a HeartbeatMessage is TLSPlaintext.length
 *   for TLS and DTLSPlaintext.length for DTLS. Furthermore, the
 *   length of the type field is 1 byte, and the length of the
 *   payload_length is 2. Therefore, the padding_length is
 *   TLSPlaintext.length - payload_length - 3 for TLS and
 *   DTLSPlaintext.length - payload_length - 3 for DTLS. The
 *   padding_length MUST be at least 16.
 *
 * The sender of a HeartbeatMessage MUST use a random padding of at
 * least 16 bytes. The padding of a received HeartbeatMessage message
 * MUST be ignored.
 *
 * If the payload_length of a received HeartbeatMessage is too large,
 * the received HeartbeatMessage MUST be discarded silently.
 *
 * @param c the connection.
 * @param type the tls.HeartbeatMessageType.
 * @param payload the heartbeat data to send as the payload.
 * @param [payloadLength] the payload length to use, defaults to the
 *          actual payload length.
 *
 * @return the HeartbeatRequest byte buffer.
 */
tls$1.createHeartbeat = function(type, payload, payloadLength) {
  if(typeof payloadLength === 'undefined') {
    payloadLength = payload.length;
  }
  // build record fragment
  var rval = forge$b.util.createBuffer();
  rval.putByte(type);               // heartbeat message type
  rval.putInt16(payloadLength);     // payload length
  rval.putBytes(payload);           // payload
  // padding
  var plaintextLength = rval.length();
  var paddingLength = Math.max(16, plaintextLength - payloadLength - 3);
  rval.putBytes(forge$b.random.getBytes(paddingLength));
  return rval;
};

/**
 * Fragments, compresses, encrypts, and queues a record for delivery.
 *
 * @param c the connection.
 * @param record the record to queue.
 */
tls$1.queue = function(c, record) {
  // error during record creation
  if(!record) {
    return;
  }

  if(record.fragment.length() === 0) {
    if(record.type === tls$1.ContentType.handshake ||
      record.type === tls$1.ContentType.alert ||
      record.type === tls$1.ContentType.change_cipher_spec) {
      // Empty handshake, alert of change cipher spec messages are not allowed per the TLS specification and should not be sent.
      return;
    }
  }

  // if the record is a handshake record, update handshake hashes
  if(record.type === tls$1.ContentType.handshake) {
    var bytes = record.fragment.bytes();
    c.session.md5.update(bytes);
    c.session.sha1.update(bytes);
    bytes = null;
  }

  // handle record fragmentation
  var records;
  if(record.fragment.length() <= tls$1.MaxFragment) {
    records = [record];
  } else {
    // fragment data as long as it is too long
    records = [];
    var data = record.fragment.bytes();
    while(data.length > tls$1.MaxFragment) {
      records.push(tls$1.createRecord(c, {
        type: record.type,
        data: forge$b.util.createBuffer(data.slice(0, tls$1.MaxFragment))
      }));
      data = data.slice(tls$1.MaxFragment);
    }
    // add last record
    if(data.length > 0) {
      records.push(tls$1.createRecord(c, {
        type: record.type,
        data: forge$b.util.createBuffer(data)
      }));
    }
  }

  // compress and encrypt all fragmented records
  for(var i = 0; i < records.length && !c.fail; ++i) {
    // update the record using current write state
    var rec = records[i];
    var s = c.state.current.write;
    if(s.update(c, rec)) {
      // store record
      c.records.push(rec);
    }
  }
};

/**
 * Flushes all queued records to the output buffer and calls the
 * tlsDataReady() handler on the given connection.
 *
 * @param c the connection.
 *
 * @return true on success, false on failure.
 */
tls$1.flush = function(c) {
  for(var i = 0; i < c.records.length; ++i) {
    var record = c.records[i];

    // add record header and fragment
    c.tlsData.putByte(record.type);
    c.tlsData.putByte(record.version.major);
    c.tlsData.putByte(record.version.minor);
    c.tlsData.putInt16(record.fragment.length());
    c.tlsData.putBuffer(c.records[i].fragment);
  }
  c.records = [];
  return c.tlsDataReady(c);
};

/**
 * Maps a pki.certificateError to a tls.Alert.Description.
 *
 * @param error the error to map.
 *
 * @return the alert description.
 */
var _certErrorToAlertDesc = function(error) {
  switch(error) {
  case true:
    return true;
  case forge$b.pki.certificateError.bad_certificate:
    return tls$1.Alert.Description.bad_certificate;
  case forge$b.pki.certificateError.unsupported_certificate:
    return tls$1.Alert.Description.unsupported_certificate;
  case forge$b.pki.certificateError.certificate_revoked:
    return tls$1.Alert.Description.certificate_revoked;
  case forge$b.pki.certificateError.certificate_expired:
    return tls$1.Alert.Description.certificate_expired;
  case forge$b.pki.certificateError.certificate_unknown:
    return tls$1.Alert.Description.certificate_unknown;
  case forge$b.pki.certificateError.unknown_ca:
    return tls$1.Alert.Description.unknown_ca;
  default:
    return tls$1.Alert.Description.bad_certificate;
  }
};

/**
 * Maps a tls.Alert.Description to a pki.certificateError.
 *
 * @param desc the alert description.
 *
 * @return the certificate error.
 */
var _alertDescToCertError = function(desc) {
  switch(desc) {
  case true:
    return true;
  case tls$1.Alert.Description.bad_certificate:
    return forge$b.pki.certificateError.bad_certificate;
  case tls$1.Alert.Description.unsupported_certificate:
    return forge$b.pki.certificateError.unsupported_certificate;
  case tls$1.Alert.Description.certificate_revoked:
    return forge$b.pki.certificateError.certificate_revoked;
  case tls$1.Alert.Description.certificate_expired:
    return forge$b.pki.certificateError.certificate_expired;
  case tls$1.Alert.Description.certificate_unknown:
    return forge$b.pki.certificateError.certificate_unknown;
  case tls$1.Alert.Description.unknown_ca:
    return forge$b.pki.certificateError.unknown_ca;
  default:
    return forge$b.pki.certificateError.bad_certificate;
  }
};

/**
 * Verifies a certificate chain against the given connection's
 * Certificate Authority store.
 *
 * @param c the TLS connection.
 * @param chain the certificate chain to verify, with the root or highest
 *          authority at the end.
 *
 * @return true if successful, false if not.
 */
tls$1.verifyCertificateChain = function(c, chain) {
  try {
    // Make a copy of c.verifyOptions so that we can modify options.verify
    // without modifying c.verifyOptions.
    var options = {};
    for (var key in c.verifyOptions) {
      options[key] = c.verifyOptions[key];
    }

    options.verify = function(vfd, depth, chain) {

      // call application callback
      var ret = c.verify(c, vfd, depth, chain);
      if(ret !== true) {
        if(typeof ret === 'object' && !forge$b.util.isArray(ret)) {
          // throw custom error
          var error = new Error('The application rejected the certificate.');
          error.send = true;
          error.alert = {
            level: tls$1.Alert.Level.fatal,
            description: tls$1.Alert.Description.bad_certificate
          };
          if(ret.message) {
            error.message = ret.message;
          }
          if(ret.alert) {
            error.alert.description = ret.alert;
          }
          throw error;
        }

        // convert tls alert description to pki.certificateError
        if(ret !== vfd) {
          ret = _alertDescToCertError(ret);
        }
      }

      return ret;
    };

    // verify chain
    forge$b.pki.verifyCertificateChain(c.caStore, chain, options);
  } catch(ex) {
    // build tls error if not already customized
    var err = ex;
    if(typeof err !== 'object' || forge$b.util.isArray(err)) {
      err = {
        send: true,
        alert: {
          level: tls$1.Alert.Level.fatal,
          description: _certErrorToAlertDesc(ex)
        }
      };
    }
    if(!('send' in err)) {
      err.send = true;
    }
    if(!('alert' in err)) {
      err.alert = {
        level: tls$1.Alert.Level.fatal,
        description: _certErrorToAlertDesc(err.error)
      };
    }

    // send error
    c.error(c, err);
  }

  return !c.fail;
};

/**
 * Creates a new TLS session cache.
 *
 * @param cache optional map of session ID to cached session.
 * @param capacity the maximum size for the cache (default: 100).
 *
 * @return the new TLS session cache.
 */
tls$1.createSessionCache = function(cache, capacity) {
  var rval = null;

  // assume input is already a session cache object
  if(cache && cache.getSession && cache.setSession && cache.order) {
    rval = cache;
  } else {
    // create cache
    rval = {};
    rval.cache = cache || {};
    rval.capacity = Math.max(capacity || 100, 1);
    rval.order = [];

    // store order for sessions, delete session overflow
    for(var key in cache) {
      if(rval.order.length <= capacity) {
        rval.order.push(key);
      } else {
        delete cache[key];
      }
    }

    // get a session from a session ID (or get any session)
    rval.getSession = function(sessionId) {
      var session = null;
      var key = null;

      // if session ID provided, use it
      if(sessionId) {
        key = forge$b.util.bytesToHex(sessionId);
      } else if(rval.order.length > 0) {
        // get first session from cache
        key = rval.order[0];
      }

      if(key !== null && key in rval.cache) {
        // get cached session and remove from cache
        session = rval.cache[key];
        delete rval.cache[key];
        for(var i in rval.order) {
          if(rval.order[i] === key) {
            rval.order.splice(i, 1);
            break;
          }
        }
      }

      return session;
    };

    // set a session in the cache
    rval.setSession = function(sessionId, session) {
      // remove session from cache if at capacity
      if(rval.order.length === rval.capacity) {
        var key = rval.order.shift();
        delete rval.cache[key];
      }
      // add session to cache
      var key = forge$b.util.bytesToHex(sessionId);
      rval.order.push(key);
      rval.cache[key] = session;
    };
  }

  return rval;
};

/**
 * Creates a new TLS connection.
 *
 * See public createConnection() docs for more details.
 *
 * @param options the options for this connection.
 *
 * @return the new TLS connection.
 */
tls$1.createConnection = function(options) {
  var caStore = null;
  if(options.caStore) {
    // if CA store is an array, convert it to a CA store object
    if(forge$b.util.isArray(options.caStore)) {
      caStore = forge$b.pki.createCaStore(options.caStore);
    } else {
      caStore = options.caStore;
    }
  } else {
    // create empty CA store
    caStore = forge$b.pki.createCaStore();
  }

  // setup default cipher suites
  var cipherSuites = options.cipherSuites || null;
  if(cipherSuites === null) {
    cipherSuites = [];
    for(var key in tls$1.CipherSuites) {
      cipherSuites.push(tls$1.CipherSuites[key]);
    }
  }

  // set default entity
  var entity = (options.server || false) ?
    tls$1.ConnectionEnd.server : tls$1.ConnectionEnd.client;

  // create session cache if requested
  var sessionCache = options.sessionCache ?
    tls$1.createSessionCache(options.sessionCache) : null;

  // create TLS connection
  var c = {
    version: {major: tls$1.Version.major, minor: tls$1.Version.minor},
    entity: entity,
    sessionId: options.sessionId,
    caStore: caStore,
    sessionCache: sessionCache,
    cipherSuites: cipherSuites,
    connected: options.connected,
    virtualHost: options.virtualHost || null,
    verifyClient: options.verifyClient || false,
    verify: options.verify || function(cn, vfd, dpth, cts) {return vfd;},
    verifyOptions: options.verifyOptions || {},
    getCertificate: options.getCertificate || null,
    getPrivateKey: options.getPrivateKey || null,
    getSignature: options.getSignature || null,
    input: forge$b.util.createBuffer(),
    tlsData: forge$b.util.createBuffer(),
    data: forge$b.util.createBuffer(),
    tlsDataReady: options.tlsDataReady,
    dataReady: options.dataReady,
    heartbeatReceived: options.heartbeatReceived,
    closed: options.closed,
    error: function(c, ex) {
      // set origin if not set
      ex.origin = ex.origin ||
        ((c.entity === tls$1.ConnectionEnd.client) ? 'client' : 'server');

      // send TLS alert
      if(ex.send) {
        tls$1.queue(c, tls$1.createAlert(c, ex.alert));
        tls$1.flush(c);
      }

      // error is fatal by default
      var fatal = (ex.fatal !== false);
      if(fatal) {
        // set fail flag
        c.fail = true;
      }

      // call error handler first
      options.error(c, ex);

      if(fatal) {
        // fatal error, close connection, do not clear fail
        c.close(false);
      }
    },
    deflate: options.deflate || null,
    inflate: options.inflate || null
  };

  /**
   * Resets a closed TLS connection for reuse. Called in c.close().
   *
   * @param clearFail true to clear the fail flag (default: true).
   */
  c.reset = function(clearFail) {
    c.version = {major: tls$1.Version.major, minor: tls$1.Version.minor};
    c.record = null;
    c.session = null;
    c.peerCertificate = null;
    c.state = {
      pending: null,
      current: null
    };
    c.expect = (c.entity === tls$1.ConnectionEnd.client) ? SHE : CHE;
    c.fragmented = null;
    c.records = [];
    c.open = false;
    c.handshakes = 0;
    c.handshaking = false;
    c.isConnected = false;
    c.fail = !(clearFail || typeof(clearFail) === 'undefined');
    c.input.clear();
    c.tlsData.clear();
    c.data.clear();
    c.state.current = tls$1.createConnectionState(c);
  };

  // do initial reset of connection
  c.reset();

  /**
   * Updates the current TLS engine state based on the given record.
   *
   * @param c the TLS connection.
   * @param record the TLS record to act on.
   */
  var _update = function(c, record) {
    // get record handler (align type in table by subtracting lowest)
    var aligned = record.type - tls$1.ContentType.change_cipher_spec;
    var handlers = ctTable[c.entity][c.expect];
    if(aligned in handlers) {
      handlers[aligned](c, record);
    } else {
      // unexpected record
      tls$1.handleUnexpected(c, record);
    }
  };

  /**
   * Reads the record header and initializes the next record on the given
   * connection.
   *
   * @param c the TLS connection with the next record.
   *
   * @return 0 if the input data could be processed, otherwise the
   *         number of bytes required for data to be processed.
   */
  var _readRecordHeader = function(c) {
    var rval = 0;

    // get input buffer and its length
    var b = c.input;
    var len = b.length();

    // need at least 5 bytes to initialize a record
    if(len < 5) {
      rval = 5 - len;
    } else {
      // enough bytes for header
      // initialize record
      c.record = {
        type: b.getByte(),
        version: {
          major: b.getByte(),
          minor: b.getByte()
        },
        length: b.getInt16(),
        fragment: forge$b.util.createBuffer(),
        ready: false
      };

      // check record version
      var compatibleVersion = (c.record.version.major === c.version.major);
      if(compatibleVersion && c.session && c.session.version) {
        // session version already set, require same minor version
        compatibleVersion = (c.record.version.minor === c.version.minor);
      }
      if(!compatibleVersion) {
        c.error(c, {
          message: 'Incompatible TLS version.',
          send: true,
          alert: {
            level: tls$1.Alert.Level.fatal,
            description: tls$1.Alert.Description.protocol_version
          }
        });
      }
    }

    return rval;
  };

  /**
   * Reads the next record's contents and appends its message to any
   * previously fragmented message.
   *
   * @param c the TLS connection with the next record.
   *
   * @return 0 if the input data could be processed, otherwise the
   *         number of bytes required for data to be processed.
   */
  var _readRecord = function(c) {
    var rval = 0;

    // ensure there is enough input data to get the entire record
    var b = c.input;
    var len = b.length();
    if(len < c.record.length) {
      // not enough data yet, return how much is required
      rval = c.record.length - len;
    } else {
      // there is enough data to parse the pending record
      // fill record fragment and compact input buffer
      c.record.fragment.putBytes(b.getBytes(c.record.length));
      b.compact();

      // update record using current read state
      var s = c.state.current.read;
      if(s.update(c, c.record)) {
        // see if there is a previously fragmented message that the
        // new record's message fragment should be appended to
        if(c.fragmented !== null) {
          // if the record type matches a previously fragmented
          // record, append the record fragment to it
          if(c.fragmented.type === c.record.type) {
            // concatenate record fragments
            c.fragmented.fragment.putBuffer(c.record.fragment);
            c.record = c.fragmented;
          } else {
            // error, invalid fragmented record
            c.error(c, {
              message: 'Invalid fragmented record.',
              send: true,
              alert: {
                level: tls$1.Alert.Level.fatal,
                description:
                  tls$1.Alert.Description.unexpected_message
              }
            });
          }
        }

        // record is now ready
        c.record.ready = true;
      }
    }

    return rval;
  };

  /**
   * Performs a handshake using the TLS Handshake Protocol, as a client.
   *
   * This method should only be called if the connection is in client mode.
   *
   * @param sessionId the session ID to use, null to start a new one.
   */
  c.handshake = function(sessionId) {
    // error to call this in non-client mode
    if(c.entity !== tls$1.ConnectionEnd.client) {
      // not fatal error
      c.error(c, {
        message: 'Cannot initiate handshake as a server.',
        fatal: false
      });
    } else if(c.handshaking) {
      // handshake is already in progress, fail but not fatal error
      c.error(c, {
        message: 'Handshake already in progress.',
        fatal: false
      });
    } else {
      // clear fail flag on reuse
      if(c.fail && !c.open && c.handshakes === 0) {
        c.fail = false;
      }

      // now handshaking
      c.handshaking = true;

      // default to blank (new session)
      sessionId = sessionId || '';

      // if a session ID was specified, try to find it in the cache
      var session = null;
      if(sessionId.length > 0) {
        if(c.sessionCache) {
          session = c.sessionCache.getSession(sessionId);
        }

        // matching session not found in cache, clear session ID
        if(session === null) {
          sessionId = '';
        }
      }

      // no session given, grab a session from the cache, if available
      if(sessionId.length === 0 && c.sessionCache) {
        session = c.sessionCache.getSession();
        if(session !== null) {
          sessionId = session.id;
        }
      }

      // set up session
      c.session = {
        id: sessionId,
        version: null,
        cipherSuite: null,
        compressionMethod: null,
        serverCertificate: null,
        certificateRequest: null,
        clientCertificate: null,
        sp: {},
        md5: forge$b.md.md5.create(),
        sha1: forge$b.md.sha1.create()
      };

      // use existing session information
      if(session) {
        // only update version on connection, session version not yet set
        c.version = session.version;
        c.session.sp = session.sp;
      }

      // generate new client random
      c.session.sp.client_random = tls$1.createRandom().getBytes();

      // connection now open
      c.open = true;

      // send hello
      tls$1.queue(c, tls$1.createRecord(c, {
        type: tls$1.ContentType.handshake,
        data: tls$1.createClientHello(c)
      }));
      tls$1.flush(c);
    }
  };

  /**
   * Called when TLS protocol data has been received from somewhere and should
   * be processed by the TLS engine.
   *
   * @param data the TLS protocol data, as a string, to process.
   *
   * @return 0 if the data could be processed, otherwise the number of bytes
   *         required for data to be processed.
   */
  c.process = function(data) {
    var rval = 0;

    // buffer input data
    if(data) {
      c.input.putBytes(data);
    }

    // process next record if no failure, process will be called after
    // each record is handled (since handling can be asynchronous)
    if(!c.fail) {
      // reset record if ready and now empty
      if(c.record !== null &&
        c.record.ready && c.record.fragment.isEmpty()) {
        c.record = null;
      }

      // if there is no pending record, try to read record header
      if(c.record === null) {
        rval = _readRecordHeader(c);
      }

      // read the next record (if record not yet ready)
      if(!c.fail && c.record !== null && !c.record.ready) {
        rval = _readRecord(c);
      }

      // record ready to be handled, update engine state
      if(!c.fail && c.record !== null && c.record.ready) {
        _update(c, c.record);
      }
    }

    return rval;
  };

  /**
   * Requests that application data be packaged into a TLS record. The
   * tlsDataReady handler will be called when the TLS record(s) have been
   * prepared.
   *
   * @param data the application data, as a raw 'binary' encoded string, to
   *          be sent; to send utf-16/utf-8 string data, use the return value
   *          of util.encodeUtf8(str).
   *
   * @return true on success, false on failure.
   */
  c.prepare = function(data) {
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.application_data,
      data: forge$b.util.createBuffer(data)
    }));
    return tls$1.flush(c);
  };

  /**
   * Requests that a heartbeat request be packaged into a TLS record for
   * transmission. The tlsDataReady handler will be called when TLS record(s)
   * have been prepared.
   *
   * When a heartbeat response has been received, the heartbeatReceived
   * handler will be called with the matching payload. This handler can
   * be used to clear a retransmission timer, etc.
   *
   * @param payload the heartbeat data to send as the payload in the message.
   * @param [payloadLength] the payload length to use, defaults to the
   *          actual payload length.
   *
   * @return true on success, false on failure.
   */
  c.prepareHeartbeatRequest = function(payload, payloadLength) {
    if(payload instanceof forge$b.util.ByteBuffer) {
      payload = payload.bytes();
    }
    if(typeof payloadLength === 'undefined') {
      payloadLength = payload.length;
    }
    c.expectedHeartbeatPayload = payload;
    tls$1.queue(c, tls$1.createRecord(c, {
      type: tls$1.ContentType.heartbeat,
      data: tls$1.createHeartbeat(
        tls$1.HeartbeatMessageType.heartbeat_request, payload, payloadLength)
    }));
    return tls$1.flush(c);
  };

  /**
   * Closes the connection (sends a close_notify alert).
   *
   * @param clearFail true to clear the fail flag (default: true).
   */
  c.close = function(clearFail) {
    // save session if connection didn't fail
    if(!c.fail && c.sessionCache && c.session) {
      // only need to preserve session ID, version, and security params
      var session = {
        id: c.session.id,
        version: c.session.version,
        sp: c.session.sp
      };
      session.sp.keys = null;
      c.sessionCache.setSession(session.id, session);
    }

    if(c.open) {
      // connection no longer open, clear input
      c.open = false;
      c.input.clear();

      // if connected or handshaking, send an alert
      if(c.isConnected || c.handshaking) {
        c.isConnected = c.handshaking = false;

        // send close_notify alert
        tls$1.queue(c, tls$1.createAlert(c, {
          level: tls$1.Alert.Level.warning,
          description: tls$1.Alert.Description.close_notify
        }));
        tls$1.flush(c);
      }

      // call handler
      c.closed(c);
    }

    // reset TLS connection, do not clear fail flag
    c.reset(clearFail);
  };

  return c;
};

/* TLS API */
forge$b.tls = forge$b.tls || {};

// expose non-functions
for(var key in tls$1) {
  if(typeof tls$1[key] !== 'function') {
    forge$b.tls[key] = tls$1[key];
  }
}

// expose prf_tls1 for testing
forge$b.tls.prf_tls1 = prf_TLS1;

// expose sha1 hmac method
forge$b.tls.hmac_sha1 = hmac_sha1;

// expose session cache creation
forge$b.tls.createSessionCache = tls$1.createSessionCache;

/**
 * Creates a new TLS connection. This does not make any assumptions about the
 * transport layer that TLS is working on top of, ie: it does not assume there
 * is a TCP/IP connection or establish one. A TLS connection is totally
 * abstracted away from the layer is runs on top of, it merely establishes a
 * secure channel between a client" and a "server".
 *
 * A TLS connection contains 4 connection states: pending read and write, and
 * current read and write.
 *
 * At initialization, the current read and write states will be null. Only once
 * the security parameters have been set and the keys have been generated can
 * the pending states be converted into current states. Current states will be
 * updated for each record processed.
 *
 * A custom certificate verify callback may be provided to check information
 * like the common name on the server's certificate. It will be called for
 * every certificate in the chain. It has the following signature:
 *
 * variable func(c, certs, index, preVerify)
 * Where:
 * c         The TLS connection
 * verified  Set to true if certificate was verified, otherwise the alert
 *           tls.Alert.Description for why the certificate failed.
 * depth     The current index in the chain, where 0 is the server's cert.
 * certs     The certificate chain, *NOTE* if the server was anonymous then
 *           the chain will be empty.
 *
 * The function returns true on success and on failure either the appropriate
 * tls.Alert.Description or an object with 'alert' set to the appropriate
 * tls.Alert.Description and 'message' set to a custom error message. If true
 * is not returned then the connection will abort using, in order of
 * availability, first the returned alert description, second the preVerify
 * alert description, and lastly the default 'bad_certificate'.
 *
 * There are three callbacks that can be used to make use of client-side
 * certificates where each takes the TLS connection as the first parameter:
 *
 * getCertificate(conn, hint)
 *   The second parameter is a hint as to which certificate should be
 *   returned. If the connection entity is a client, then the hint will be
 *   the CertificateRequest message from the server that is part of the
 *   TLS protocol. If the connection entity is a server, then it will be
 *   the servername list provided via an SNI extension the ClientHello, if
 *   one was provided (empty array if not). The hint can be examined to
 *   determine which certificate to use (advanced). Most implementations
 *   will just return a certificate. The return value must be a
 *   PEM-formatted certificate or an array of PEM-formatted certificates
 *   that constitute a certificate chain, with the first in the array/chain
 *   being the client's certificate.
 * getPrivateKey(conn, certificate)
 *   The second parameter is an forge.pki X.509 certificate object that
 *   is associated with the requested private key. The return value must
 *   be a PEM-formatted private key.
 * getSignature(conn, bytes, callback)
 *   This callback can be used instead of getPrivateKey if the private key
 *   is not directly accessible in javascript or should not be. For
 *   instance, a secure external web service could provide the signature
 *   in exchange for appropriate credentials. The second parameter is a
 *   string of bytes to be signed that are part of the TLS protocol. These
 *   bytes are used to verify that the private key for the previously
 *   provided client-side certificate is accessible to the client. The
 *   callback is a function that takes 2 parameters, the TLS connection
 *   and the RSA encrypted (signed) bytes as a string. This callback must
 *   be called once the signature is ready.
 *
 * @param options the options for this connection:
 *   server: true if the connection is server-side, false for client.
 *   sessionId: a session ID to reuse, null for a new connection.
 *   caStore: an array of certificates to trust.
 *   sessionCache: a session cache to use.
 *   cipherSuites: an optional array of cipher suites to use,
 *     see tls.CipherSuites.
 *   connected: function(conn) called when the first handshake completes.
 *   virtualHost: the virtual server name to use in a TLS SNI extension.
 *   verifyClient: true to require a client certificate in server mode,
 *     'optional' to request one, false not to (default: false).
 *   verify: a handler used to custom verify certificates in the chain.
 *   verifyOptions: an object with options for the certificate chain validation.
 *     See documentation of pki.verifyCertificateChain for possible options.
 *     verifyOptions.verify is ignored. If you wish to specify a verify handler
 *     use the verify key.
 *   getCertificate: an optional callback used to get a certificate or
 *     a chain of certificates (as an array).
 *   getPrivateKey: an optional callback used to get a private key.
 *   getSignature: an optional callback used to get a signature.
 *   tlsDataReady: function(conn) called when TLS protocol data has been
 *     prepared and is ready to be used (typically sent over a socket
 *     connection to its destination), read from conn.tlsData buffer.
 *   dataReady: function(conn) called when application data has
 *     been parsed from a TLS record and should be consumed by the
 *     application, read from conn.data buffer.
 *   closed: function(conn) called when the connection has been closed.
 *   error: function(conn, error) called when there was an error.
 *   deflate: function(inBytes) if provided, will deflate TLS records using
 *     the deflate algorithm if the server supports it.
 *   inflate: function(inBytes) if provided, will inflate TLS records using
 *     the deflate algorithm if the server supports it.
 *
 * @return the new TLS connection.
 */
forge$b.tls.createConnection = tls$1.createConnection;

/**
 * A Javascript implementation of AES Cipher Suites for TLS.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2009-2015 Digital Bazaar, Inc.
 *
 */

var forge$a = forge$F;



var tls = forge$a.tls;

/**
 * Supported cipher suites.
 */
tls.CipherSuites['TLS_RSA_WITH_AES_128_CBC_SHA'] = {
  id: [0x00, 0x2f],
  name: 'TLS_RSA_WITH_AES_128_CBC_SHA',
  initSecurityParameters: function(sp) {
    sp.bulk_cipher_algorithm = tls.BulkCipherAlgorithm.aes;
    sp.cipher_type = tls.CipherType.block;
    sp.enc_key_length = 16;
    sp.block_length = 16;
    sp.fixed_iv_length = 16;
    sp.record_iv_length = 16;
    sp.mac_algorithm = tls.MACAlgorithm.hmac_sha1;
    sp.mac_length = 20;
    sp.mac_key_length = 20;
  },
  initConnectionState: initConnectionState
};
tls.CipherSuites['TLS_RSA_WITH_AES_256_CBC_SHA'] = {
  id: [0x00, 0x35],
  name: 'TLS_RSA_WITH_AES_256_CBC_SHA',
  initSecurityParameters: function(sp) {
    sp.bulk_cipher_algorithm = tls.BulkCipherAlgorithm.aes;
    sp.cipher_type = tls.CipherType.block;
    sp.enc_key_length = 32;
    sp.block_length = 16;
    sp.fixed_iv_length = 16;
    sp.record_iv_length = 16;
    sp.mac_algorithm = tls.MACAlgorithm.hmac_sha1;
    sp.mac_length = 20;
    sp.mac_key_length = 20;
  },
  initConnectionState: initConnectionState
};

function initConnectionState(state, c, sp) {
  var client = (c.entity === forge$a.tls.ConnectionEnd.client);

  // cipher setup
  state.read.cipherState = {
    init: false,
    cipher: forge$a.cipher.createDecipher('AES-CBC', client ?
      sp.keys.server_write_key : sp.keys.client_write_key),
    iv: client ? sp.keys.server_write_IV : sp.keys.client_write_IV
  };
  state.write.cipherState = {
    init: false,
    cipher: forge$a.cipher.createCipher('AES-CBC', client ?
      sp.keys.client_write_key : sp.keys.server_write_key),
    iv: client ? sp.keys.client_write_IV : sp.keys.server_write_IV
  };
  state.read.cipherFunction = decrypt_aes_cbc_sha1;
  state.write.cipherFunction = encrypt_aes_cbc_sha1;

  // MAC setup
  state.read.macLength = state.write.macLength = sp.mac_length;
  state.read.macFunction = state.write.macFunction = tls.hmac_sha1;
}

/**
 * Encrypts the TLSCompressed record into a TLSCipherText record using AES
 * in CBC mode.
 *
 * @param record the TLSCompressed record to encrypt.
 * @param s the ConnectionState to use.
 *
 * @return true on success, false on failure.
 */
function encrypt_aes_cbc_sha1(record, s) {
  var rval = false;

  // append MAC to fragment, update sequence number
  var mac = s.macFunction(s.macKey, s.sequenceNumber, record);
  record.fragment.putBytes(mac);
  s.updateSequenceNumber();

  // TLS 1.1+ use an explicit IV every time to protect against CBC attacks
  var iv;
  if(record.version.minor === tls.Versions.TLS_1_0.minor) {
    // use the pre-generated IV when initializing for TLS 1.0, otherwise use
    // the residue from the previous encryption
    iv = s.cipherState.init ? null : s.cipherState.iv;
  } else {
    iv = forge$a.random.getBytesSync(16);
  }

  s.cipherState.init = true;

  // start cipher
  var cipher = s.cipherState.cipher;
  cipher.start({iv: iv});

  // TLS 1.1+ write IV into output
  if(record.version.minor >= tls.Versions.TLS_1_1.minor) {
    cipher.output.putBytes(iv);
  }

  // do encryption (default padding is appropriate)
  cipher.update(record.fragment);
  if(cipher.finish(encrypt_aes_cbc_sha1_padding)) {
    // set record fragment to encrypted output
    record.fragment = cipher.output;
    record.length = record.fragment.length();
    rval = true;
  }

  return rval;
}

/**
 * Handles padding for aes_cbc_sha1 in encrypt mode.
 *
 * @param blockSize the block size.
 * @param input the input buffer.
 * @param decrypt true in decrypt mode, false in encrypt mode.
 *
 * @return true on success, false on failure.
 */
function encrypt_aes_cbc_sha1_padding(blockSize, input, decrypt) {
  /* The encrypted data length (TLSCiphertext.length) is one more than the sum
   of SecurityParameters.block_length, TLSCompressed.length,
   SecurityParameters.mac_length, and padding_length.

   The padding may be any length up to 255 bytes long, as long as it results in
   the TLSCiphertext.length being an integral multiple of the block length.
   Lengths longer than necessary might be desirable to frustrate attacks on a
   protocol based on analysis of the lengths of exchanged messages. Each uint8
   in the padding data vector must be filled with the padding length value.

   The padding length should be such that the total size of the
   GenericBlockCipher structure is a multiple of the cipher's block length.
   Legal values range from zero to 255, inclusive. This length specifies the
   length of the padding field exclusive of the padding_length field itself.

   This is slightly different from PKCS#7 because the padding value is 1
   less than the actual number of padding bytes if you include the
   padding_length uint8 itself as a padding byte. */
  if(!decrypt) {
    // get the number of padding bytes required to reach the blockSize and
    // subtract 1 for the padding value (to make room for the padding_length
    // uint8)
    var padding = blockSize - (input.length() % blockSize);
    input.fillWithByte(padding - 1, padding);
  }
  return true;
}

/**
 * Handles padding for aes_cbc_sha1 in decrypt mode.
 *
 * @param blockSize the block size.
 * @param output the output buffer.
 * @param decrypt true in decrypt mode, false in encrypt mode.
 *
 * @return true on success, false on failure.
 */
function decrypt_aes_cbc_sha1_padding(blockSize, output, decrypt) {
  var rval = true;
  if(decrypt) {
    /* The last byte in the output specifies the number of padding bytes not
      including itself. Each of the padding bytes has the same value as that
      last byte (known as the padding_length). Here we check all padding
      bytes to ensure they have the value of padding_length even if one of
      them is bad in order to ward-off timing attacks. */
    var len = output.length();
    var paddingLength = output.last();
    for(var i = len - 1 - paddingLength; i < len - 1; ++i) {
      rval = rval && (output.at(i) == paddingLength);
    }
    if(rval) {
      // trim off padding bytes and last padding length byte
      output.truncate(paddingLength + 1);
    }
  }
  return rval;
}

/**
 * Decrypts a TLSCipherText record into a TLSCompressed record using
 * AES in CBC mode.
 *
 * @param record the TLSCipherText record to decrypt.
 * @param s the ConnectionState to use.
 *
 * @return true on success, false on failure.
 */
function decrypt_aes_cbc_sha1(record, s) {
  var rval = false;

  var iv;
  if(record.version.minor === tls.Versions.TLS_1_0.minor) {
    // use pre-generated IV when initializing for TLS 1.0, otherwise use the
    // residue from the previous decryption
    iv = s.cipherState.init ? null : s.cipherState.iv;
  } else {
    // TLS 1.1+ use an explicit IV every time to protect against CBC attacks
    // that is appended to the record fragment
    iv = record.fragment.getBytes(16);
  }

  s.cipherState.init = true;

  // start cipher
  var cipher = s.cipherState.cipher;
  cipher.start({iv: iv});

  // do decryption
  cipher.update(record.fragment);
  rval = cipher.finish(decrypt_aes_cbc_sha1_padding);

  // even if decryption fails, keep going to minimize timing attacks

  // decrypted data:
  // first (len - 20) bytes = application data
  // last 20 bytes          = MAC
  var macLen = s.macLength;

  // create a random MAC to check against should the mac length check fail
  // Note: do this regardless of the failure to keep timing consistent
  var mac = forge$a.random.getBytesSync(macLen);

  // get fragment and mac
  var len = cipher.output.length();
  if(len >= macLen) {
    record.fragment = cipher.output.getBytes(len - macLen);
    mac = cipher.output.getBytes(macLen);
  } else {
    // bad data, but get bytes anyway to try to keep timing consistent
    record.fragment = cipher.output.getBytes();
  }
  record.fragment = forge$a.util.createBuffer(record.fragment);
  record.length = record.fragment.length();

  // see if data integrity checks out, update sequence number
  var mac2 = s.macFunction(s.macKey, s.sequenceNumber, record);
  s.updateSequenceNumber();
  rval = compareMacs(s.macKey, mac, mac2) && rval;
  return rval;
}

/**
 * Safely compare two MACs. This function will compare two MACs in a way
 * that protects against timing attacks.
 *
 * TODO: Expose elsewhere as a utility API.
 *
 * See: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/february/double-hmac-verification/
 *
 * @param key the MAC key to use.
 * @param mac1 as a binary-encoded string of bytes.
 * @param mac2 as a binary-encoded string of bytes.
 *
 * @return true if the MACs are the same, false if not.
 */
function compareMacs(key, mac1, mac2) {
  var hmac = forge$a.hmac.create();

  hmac.start('SHA1', key);
  hmac.update(mac1);
  mac1 = hmac.digest().getBytes();

  hmac.start(null, null);
  hmac.update(mac2);
  mac2 = hmac.digest().getBytes();

  return mac1 === mac2;
}

/**
 * Debugging support for web applications.
 *
 * @author David I. Lehn <dlehn@digitalbazaar.com>
 *
 * Copyright 2008-2013 Digital Bazaar, Inc.
 */

var forge$9 = forge$F;

/* DEBUG API */
forge$9.debug = forge$9.debug || {};

// Private storage for debugging.
// Useful to expose data that is otherwise unviewable behind closures.
// NOTE: remember that this can hold references to data and cause leaks!
// format is "forge._debug.<modulename>.<dataname> = data"
// Example:
// (function() {
//   var cat = 'forge.test.Test'; // debugging category
//   var sState = {...}; // local state
//   forge.debug.set(cat, 'sState', sState);
// })();
forge$9.debug.storage = {};

/**
 * Gets debug data. Omit name for all cat data  Omit name and cat for
 * all data.
 *
 * @param cat name of debugging category.
 * @param name name of data to get (optional).
 * @return object with requested debug data or undefined.
 */
forge$9.debug.get = function(cat, name) {
  var rval;
  if(typeof(cat) === 'undefined') {
    rval = forge$9.debug.storage;
  } else if(cat in forge$9.debug.storage) {
    if(typeof(name) === 'undefined') {
      rval = forge$9.debug.storage[cat];
    } else {
      rval = forge$9.debug.storage[cat][name];
    }
  }
  return rval;
};

/**
 * Sets debug data.
 *
 * @param cat name of debugging category.
 * @param name name of data to set.
 * @param data data to set.
 */
forge$9.debug.set = function(cat, name, data) {
  if(!(cat in forge$9.debug.storage)) {
    forge$9.debug.storage[cat] = {};
  }
  forge$9.debug.storage[cat][name] = data;
};

/**
 * Clears debug data. Omit name for all cat data. Omit name and cat for
 * all data.
 *
 * @param cat name of debugging category.
 * @param name name of data to clear or omit to clear entire category.
 */
forge$9.debug.clear = function(cat, name) {
  if(typeof(cat) === 'undefined') {
    forge$9.debug.storage = {};
  } else if(cat in forge$9.debug.storage) {
    if(typeof(name) === 'undefined') {
      delete forge$9.debug.storage[cat];
    } else {
      delete forge$9.debug.storage[cat][name];
    }
  }
};

/**
 * Secure Hash Algorithm with a 1024-bit block size implementation.
 *
 * This includes: SHA-512, SHA-384, SHA-512/224, and SHA-512/256. For
 * SHA-256 (block size 512 bits), see sha256.js.
 *
 * See FIPS 180-4 for details.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2014-2015 Digital Bazaar, Inc.
 */

var forge$8 = forge$F;



var sha512$1 = forge$8.sha512 = forge$8.sha512 || {};

// SHA-512
forge$8.md.sha512 = forge$8.md.algorithms.sha512 = sha512$1;

// SHA-384
var sha384 = forge$8.sha384 = forge$8.sha512.sha384 = forge$8.sha512.sha384 || {};
sha384.create = function() {
  return sha512$1.create('SHA-384');
};
forge$8.md.sha384 = forge$8.md.algorithms.sha384 = sha384;

// SHA-512/256
forge$8.sha512.sha256 = forge$8.sha512.sha256 || {
  create: function() {
    return sha512$1.create('SHA-512/256');
  }
};
forge$8.md['sha512/256'] = forge$8.md.algorithms['sha512/256'] =
  forge$8.sha512.sha256;

// SHA-512/224
forge$8.sha512.sha224 = forge$8.sha512.sha224 || {
  create: function() {
    return sha512$1.create('SHA-512/224');
  }
};
forge$8.md['sha512/224'] = forge$8.md.algorithms['sha512/224'] =
  forge$8.sha512.sha224;

/**
 * Creates a SHA-2 message digest object.
 *
 * @param algorithm the algorithm to use (SHA-512, SHA-384, SHA-512/224,
 *          SHA-512/256).
 *
 * @return a message digest object.
 */
sha512$1.create = function(algorithm) {
  // do initialization as necessary
  if(!_initialized) {
    _init();
  }

  if(typeof algorithm === 'undefined') {
    algorithm = 'SHA-512';
  }

  if(!(algorithm in _states)) {
    throw new Error('Invalid SHA-512 algorithm: ' + algorithm);
  }

  // SHA-512 state contains eight 64-bit integers (each as two 32-bit ints)
  var _state = _states[algorithm];
  var _h = null;

  // input buffer
  var _input = forge$8.util.createBuffer();

  // used for 64-bit word storage
  var _w = new Array(80);
  for(var wi = 0; wi < 80; ++wi) {
    _w[wi] = new Array(2);
  }

  // determine digest length by algorithm name (default)
  var digestLength = 64;
  switch(algorithm) {
    case 'SHA-384':
      digestLength = 48;
      break;
    case 'SHA-512/256':
      digestLength = 32;
      break;
    case 'SHA-512/224':
      digestLength = 28;
      break;
  }

  // message digest object
  var md = {
    // SHA-512 => sha512
    algorithm: algorithm.replace('-', '').toLowerCase(),
    blockLength: 128,
    digestLength: digestLength,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 16
  };

  /**
   * Starts the digest.
   *
   * @return this digest object.
   */
  md.start = function() {
    // up to 56-bit message length for convenience
    md.messageLength = 0;

    // full message length (set md.messageLength128 for backwards-compatibility)
    md.fullMessageLength = md.messageLength128 = [];
    var int32s = md.messageLengthSize / 4;
    for(var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = forge$8.util.createBuffer();
    _h = new Array(_state.length);
    for(var i = 0; i < _state.length; ++i) {
      _h[i] = _state[i].slice(0);
    }
    return md;
  };
  // start digest automatically for first time
  md.start();

  /**
   * Updates the digest with the given message input. The given input can
   * treated as raw input (no encoding will be applied) or an encoding of
   * 'utf8' maybe given to encode the input using UTF-8.
   *
   * @param msg the message input to update with.
   * @param encoding the encoding to use (default: 'raw', other: 'utf8').
   *
   * @return this digest object.
   */
  md.update = function(msg, encoding) {
    if(encoding === 'utf8') {
      msg = forge$8.util.encodeUtf8(msg);
    }

    // update message length
    var len = msg.length;
    md.messageLength += len;
    len = [(len / 0x100000000) >>> 0, len >>> 0];
    for(var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + ((md.fullMessageLength[i] / 0x100000000) >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = ((len[1] / 0x100000000) >>> 0);
    }

    // add bytes to input buffer
    _input.putBytes(msg);

    // process bytes
    _update(_h, _w, _input);

    // compact input buffer every 2K or if empty
    if(_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }

    return md;
  };

  /**
   * Produces the digest.
   *
   * @return a byte buffer containing the digest value.
   */
  md.digest = function() {
    /* Note: Here we copy the remaining bytes in the input buffer and
    add the appropriate SHA-512 padding. Then we do the final update
    on a copy of the state so that if the user wants to get
    intermediate digests they can do so. */

    /* Determine the number of bytes that must be added to the message
    to ensure its length is congruent to 896 mod 1024. In other words,
    the data to be digested must be a multiple of 1024 bits (or 128 bytes).
    This data includes the message, some padding, and the length of the
    message. Since the length of the message will be encoded as 16 bytes (128
    bits), that means that the last segment of the data must have 112 bytes
    (896 bits) of message and padding. Therefore, the length of the message
    plus the padding must be congruent to 896 mod 1024 because
    1024 - 128 = 896.

    In order to fill up the message length it must be filled with
    padding that begins with 1 bit followed by all 0 bits. Padding
    must *always* be present, so if the message length is already
    congruent to 896 mod 1024, then 1024 padding bits must be added. */

    var finalBlock = forge$8.util.createBuffer();
    finalBlock.putBytes(_input.bytes());

    // compute remaining size to be digested (include message length size)
    var remaining = (
      md.fullMessageLength[md.fullMessageLength.length - 1] +
      md.messageLengthSize);

    // add padding for overflow blockSize - overflow
    // _padding starts with 1 byte with first bit is set (byte value 128), then
    // there may be up to (blockSize - 1) other pad bytes
    var overflow = remaining & (md.blockLength - 1);
    finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));

    // serialize message length in bits in big-endian order; since length
    // is stored in bytes we multiply by 8 and add carry from next int
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for(var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = (next / 0x100000000) >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);

    var h = new Array(_h.length);
    for(var i = 0; i < _h.length; ++i) {
      h[i] = _h[i].slice(0);
    }
    _update(h, _w, finalBlock);
    var rval = forge$8.util.createBuffer();
    var hlen;
    if(algorithm === 'SHA-512') {
      hlen = h.length;
    } else if(algorithm === 'SHA-384') {
      hlen = h.length - 2;
    } else {
      hlen = h.length - 4;
    }
    for(var i = 0; i < hlen; ++i) {
      rval.putInt32(h[i][0]);
      if(i !== hlen - 1 || algorithm !== 'SHA-512/224') {
        rval.putInt32(h[i][1]);
      }
    }
    return rval;
  };

  return md;
};

// sha-512 padding bytes not initialized yet
var _padding = null;
var _initialized = false;

// table of constants
var _k = null;

// initial hash states
var _states = null;

/**
 * Initializes the constant tables.
 */
function _init() {
  // create padding
  _padding = String.fromCharCode(128);
  _padding += forge$8.util.fillString(String.fromCharCode(0x00), 128);

  // create K table for SHA-512
  _k = [
    [0x428a2f98, 0xd728ae22], [0x71374491, 0x23ef65cd],
    [0xb5c0fbcf, 0xec4d3b2f], [0xe9b5dba5, 0x8189dbbc],
    [0x3956c25b, 0xf348b538], [0x59f111f1, 0xb605d019],
    [0x923f82a4, 0xaf194f9b], [0xab1c5ed5, 0xda6d8118],
    [0xd807aa98, 0xa3030242], [0x12835b01, 0x45706fbe],
    [0x243185be, 0x4ee4b28c], [0x550c7dc3, 0xd5ffb4e2],
    [0x72be5d74, 0xf27b896f], [0x80deb1fe, 0x3b1696b1],
    [0x9bdc06a7, 0x25c71235], [0xc19bf174, 0xcf692694],
    [0xe49b69c1, 0x9ef14ad2], [0xefbe4786, 0x384f25e3],
    [0x0fc19dc6, 0x8b8cd5b5], [0x240ca1cc, 0x77ac9c65],
    [0x2de92c6f, 0x592b0275], [0x4a7484aa, 0x6ea6e483],
    [0x5cb0a9dc, 0xbd41fbd4], [0x76f988da, 0x831153b5],
    [0x983e5152, 0xee66dfab], [0xa831c66d, 0x2db43210],
    [0xb00327c8, 0x98fb213f], [0xbf597fc7, 0xbeef0ee4],
    [0xc6e00bf3, 0x3da88fc2], [0xd5a79147, 0x930aa725],
    [0x06ca6351, 0xe003826f], [0x14292967, 0x0a0e6e70],
    [0x27b70a85, 0x46d22ffc], [0x2e1b2138, 0x5c26c926],
    [0x4d2c6dfc, 0x5ac42aed], [0x53380d13, 0x9d95b3df],
    [0x650a7354, 0x8baf63de], [0x766a0abb, 0x3c77b2a8],
    [0x81c2c92e, 0x47edaee6], [0x92722c85, 0x1482353b],
    [0xa2bfe8a1, 0x4cf10364], [0xa81a664b, 0xbc423001],
    [0xc24b8b70, 0xd0f89791], [0xc76c51a3, 0x0654be30],
    [0xd192e819, 0xd6ef5218], [0xd6990624, 0x5565a910],
    [0xf40e3585, 0x5771202a], [0x106aa070, 0x32bbd1b8],
    [0x19a4c116, 0xb8d2d0c8], [0x1e376c08, 0x5141ab53],
    [0x2748774c, 0xdf8eeb99], [0x34b0bcb5, 0xe19b48a8],
    [0x391c0cb3, 0xc5c95a63], [0x4ed8aa4a, 0xe3418acb],
    [0x5b9cca4f, 0x7763e373], [0x682e6ff3, 0xd6b2b8a3],
    [0x748f82ee, 0x5defb2fc], [0x78a5636f, 0x43172f60],
    [0x84c87814, 0xa1f0ab72], [0x8cc70208, 0x1a6439ec],
    [0x90befffa, 0x23631e28], [0xa4506ceb, 0xde82bde9],
    [0xbef9a3f7, 0xb2c67915], [0xc67178f2, 0xe372532b],
    [0xca273ece, 0xea26619c], [0xd186b8c7, 0x21c0c207],
    [0xeada7dd6, 0xcde0eb1e], [0xf57d4f7f, 0xee6ed178],
    [0x06f067aa, 0x72176fba], [0x0a637dc5, 0xa2c898a6],
    [0x113f9804, 0xbef90dae], [0x1b710b35, 0x131c471b],
    [0x28db77f5, 0x23047d84], [0x32caab7b, 0x40c72493],
    [0x3c9ebe0a, 0x15c9bebc], [0x431d67c4, 0x9c100d4c],
    [0x4cc5d4be, 0xcb3e42b6], [0x597f299c, 0xfc657e2a],
    [0x5fcb6fab, 0x3ad6faec], [0x6c44198c, 0x4a475817]
  ];

  // initial hash states
  _states = {};
  _states['SHA-512'] = [
    [0x6a09e667, 0xf3bcc908],
    [0xbb67ae85, 0x84caa73b],
    [0x3c6ef372, 0xfe94f82b],
    [0xa54ff53a, 0x5f1d36f1],
    [0x510e527f, 0xade682d1],
    [0x9b05688c, 0x2b3e6c1f],
    [0x1f83d9ab, 0xfb41bd6b],
    [0x5be0cd19, 0x137e2179]
  ];
  _states['SHA-384'] = [
    [0xcbbb9d5d, 0xc1059ed8],
    [0x629a292a, 0x367cd507],
    [0x9159015a, 0x3070dd17],
    [0x152fecd8, 0xf70e5939],
    [0x67332667, 0xffc00b31],
    [0x8eb44a87, 0x68581511],
    [0xdb0c2e0d, 0x64f98fa7],
    [0x47b5481d, 0xbefa4fa4]
  ];
  _states['SHA-512/256'] = [
    [0x22312194, 0xFC2BF72C],
    [0x9F555FA3, 0xC84C64C2],
    [0x2393B86B, 0x6F53B151],
    [0x96387719, 0x5940EABD],
    [0x96283EE2, 0xA88EFFE3],
    [0xBE5E1E25, 0x53863992],
    [0x2B0199FC, 0x2C85B8AA],
    [0x0EB72DDC, 0x81C52CA2]
  ];
  _states['SHA-512/224'] = [
    [0x8C3D37C8, 0x19544DA2],
    [0x73E19966, 0x89DCD4D6],
    [0x1DFAB7AE, 0x32FF9C82],
    [0x679DD514, 0x582F9FCF],
    [0x0F6D2B69, 0x7BD44DA8],
    [0x77E36F73, 0x04C48942],
    [0x3F9D85A8, 0x6A1D36C8],
    [0x1112E6AD, 0x91D692A1]
  ];

  // now initialized
  _initialized = true;
}

/**
 * Updates a SHA-512 state with the given byte buffer.
 *
 * @param s the SHA-512 state to update.
 * @param w the array to use to store words.
 * @param bytes the byte buffer to update with.
 */
function _update(s, w, bytes) {
  // consume 512 bit (128 byte) chunks
  var t1_hi, t1_lo;
  var t2_hi, t2_lo;
  var s0_hi, s0_lo;
  var s1_hi, s1_lo;
  var ch_hi, ch_lo;
  var maj_hi, maj_lo;
  var a_hi, a_lo;
  var b_hi, b_lo;
  var c_hi, c_lo;
  var d_hi, d_lo;
  var e_hi, e_lo;
  var f_hi, f_lo;
  var g_hi, g_lo;
  var h_hi, h_lo;
  var i, hi, lo, w2, w7, w15, w16;
  var len = bytes.length();
  while(len >= 128) {
    // the w array will be populated with sixteen 64-bit big-endian words
    // and then extended into 64 64-bit words according to SHA-512
    for(i = 0; i < 16; ++i) {
      w[i][0] = bytes.getInt32() >>> 0;
      w[i][1] = bytes.getInt32() >>> 0;
    }
    for(; i < 80; ++i) {
      // for word 2 words ago: ROTR 19(x) ^ ROTR 61(x) ^ SHR 6(x)
      w2 = w[i - 2];
      hi = w2[0];
      lo = w2[1];

      // high bits
      t1_hi = (
        ((hi >>> 19) | (lo << 13)) ^ // ROTR 19
        ((lo >>> 29) | (hi << 3)) ^ // ROTR 61/(swap + ROTR 29)
        (hi >>> 6)) >>> 0; // SHR 6
      // low bits
      t1_lo = (
        ((hi << 13) | (lo >>> 19)) ^ // ROTR 19
        ((lo << 3) | (hi >>> 29)) ^ // ROTR 61/(swap + ROTR 29)
        ((hi << 26) | (lo >>> 6))) >>> 0; // SHR 6

      // for word 15 words ago: ROTR 1(x) ^ ROTR 8(x) ^ SHR 7(x)
      w15 = w[i - 15];
      hi = w15[0];
      lo = w15[1];

      // high bits
      t2_hi = (
        ((hi >>> 1) | (lo << 31)) ^ // ROTR 1
        ((hi >>> 8) | (lo << 24)) ^ // ROTR 8
        (hi >>> 7)) >>> 0; // SHR 7
      // low bits
      t2_lo = (
        ((hi << 31) | (lo >>> 1)) ^ // ROTR 1
        ((hi << 24) | (lo >>> 8)) ^ // ROTR 8
        ((hi << 25) | (lo >>> 7))) >>> 0; // SHR 7

      // sum(t1, word 7 ago, t2, word 16 ago) modulo 2^64 (carry lo overflow)
      w7 = w[i - 7];
      w16 = w[i - 16];
      lo = (t1_lo + w7[1] + t2_lo + w16[1]);
      w[i][0] = (t1_hi + w7[0] + t2_hi + w16[0] +
        ((lo / 0x100000000) >>> 0)) >>> 0;
      w[i][1] = lo >>> 0;
    }

    // initialize hash value for this chunk
    a_hi = s[0][0];
    a_lo = s[0][1];
    b_hi = s[1][0];
    b_lo = s[1][1];
    c_hi = s[2][0];
    c_lo = s[2][1];
    d_hi = s[3][0];
    d_lo = s[3][1];
    e_hi = s[4][0];
    e_lo = s[4][1];
    f_hi = s[5][0];
    f_lo = s[5][1];
    g_hi = s[6][0];
    g_lo = s[6][1];
    h_hi = s[7][0];
    h_lo = s[7][1];

    // round function
    for(i = 0; i < 80; ++i) {
      // Sum1(e) = ROTR 14(e) ^ ROTR 18(e) ^ ROTR 41(e)
      s1_hi = (
        ((e_hi >>> 14) | (e_lo << 18)) ^ // ROTR 14
        ((e_hi >>> 18) | (e_lo << 14)) ^ // ROTR 18
        ((e_lo >>> 9) | (e_hi << 23))) >>> 0; // ROTR 41/(swap + ROTR 9)
      s1_lo = (
        ((e_hi << 18) | (e_lo >>> 14)) ^ // ROTR 14
        ((e_hi << 14) | (e_lo >>> 18)) ^ // ROTR 18
        ((e_lo << 23) | (e_hi >>> 9))) >>> 0; // ROTR 41/(swap + ROTR 9)

      // Ch(e, f, g) (optimized the same way as SHA-1)
      ch_hi = (g_hi ^ (e_hi & (f_hi ^ g_hi))) >>> 0;
      ch_lo = (g_lo ^ (e_lo & (f_lo ^ g_lo))) >>> 0;

      // Sum0(a) = ROTR 28(a) ^ ROTR 34(a) ^ ROTR 39(a)
      s0_hi = (
        ((a_hi >>> 28) | (a_lo << 4)) ^ // ROTR 28
        ((a_lo >>> 2) | (a_hi << 30)) ^ // ROTR 34/(swap + ROTR 2)
        ((a_lo >>> 7) | (a_hi << 25))) >>> 0; // ROTR 39/(swap + ROTR 7)
      s0_lo = (
        ((a_hi << 4) | (a_lo >>> 28)) ^ // ROTR 28
        ((a_lo << 30) | (a_hi >>> 2)) ^ // ROTR 34/(swap + ROTR 2)
        ((a_lo << 25) | (a_hi >>> 7))) >>> 0; // ROTR 39/(swap + ROTR 7)

      // Maj(a, b, c) (optimized the same way as SHA-1)
      maj_hi = ((a_hi & b_hi) | (c_hi & (a_hi ^ b_hi))) >>> 0;
      maj_lo = ((a_lo & b_lo) | (c_lo & (a_lo ^ b_lo))) >>> 0;

      // main algorithm
      // t1 = (h + s1 + ch + _k[i] + _w[i]) modulo 2^64 (carry lo overflow)
      lo = (h_lo + s1_lo + ch_lo + _k[i][1] + w[i][1]);
      t1_hi = (h_hi + s1_hi + ch_hi + _k[i][0] + w[i][0] +
        ((lo / 0x100000000) >>> 0)) >>> 0;
      t1_lo = lo >>> 0;

      // t2 = s0 + maj modulo 2^64 (carry lo overflow)
      lo = s0_lo + maj_lo;
      t2_hi = (s0_hi + maj_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
      t2_lo = lo >>> 0;

      h_hi = g_hi;
      h_lo = g_lo;

      g_hi = f_hi;
      g_lo = f_lo;

      f_hi = e_hi;
      f_lo = e_lo;

      // e = (d + t1) modulo 2^64 (carry lo overflow)
      lo = d_lo + t1_lo;
      e_hi = (d_hi + t1_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
      e_lo = lo >>> 0;

      d_hi = c_hi;
      d_lo = c_lo;

      c_hi = b_hi;
      c_lo = b_lo;

      b_hi = a_hi;
      b_lo = a_lo;

      // a = (t1 + t2) modulo 2^64 (carry lo overflow)
      lo = t1_lo + t2_lo;
      a_hi = (t1_hi + t2_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
      a_lo = lo >>> 0;
    }

    // update hash state (additional modulo 2^64)
    lo = s[0][1] + a_lo;
    s[0][0] = (s[0][0] + a_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[0][1] = lo >>> 0;

    lo = s[1][1] + b_lo;
    s[1][0] = (s[1][0] + b_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[1][1] = lo >>> 0;

    lo = s[2][1] + c_lo;
    s[2][0] = (s[2][0] + c_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[2][1] = lo >>> 0;

    lo = s[3][1] + d_lo;
    s[3][0] = (s[3][0] + d_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[3][1] = lo >>> 0;

    lo = s[4][1] + e_lo;
    s[4][0] = (s[4][0] + e_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[4][1] = lo >>> 0;

    lo = s[5][1] + f_lo;
    s[5][0] = (s[5][0] + f_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[5][1] = lo >>> 0;

    lo = s[6][1] + g_lo;
    s[6][0] = (s[6][0] + g_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[6][1] = lo >>> 0;

    lo = s[7][1] + h_lo;
    s[7][0] = (s[7][0] + h_hi + ((lo / 0x100000000) >>> 0)) >>> 0;
    s[7][1] = lo >>> 0;

    len -= 128;
  }
}

var asn1Validator$1 = {};

/**
 * Copyright (c) 2019 Digital Bazaar, Inc.
 */

var forge$7 = forge$F;

var asn1$1 = forge$7.asn1;

asn1Validator$1.privateKeyValidator = {
  // PrivateKeyInfo
  name: 'PrivateKeyInfo',
  tagClass: asn1$1.Class.UNIVERSAL,
  type: asn1$1.Type.SEQUENCE,
  constructed: true,
  value: [{
    // Version (INTEGER)
    name: 'PrivateKeyInfo.version',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.INTEGER,
    constructed: false,
    capture: 'privateKeyVersion'
  }, {
    // privateKeyAlgorithm
    name: 'PrivateKeyInfo.privateKeyAlgorithm',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'AlgorithmIdentifier.algorithm',
      tagClass: asn1$1.Class.UNIVERSAL,
      type: asn1$1.Type.OID,
      constructed: false,
      capture: 'privateKeyOid'
    }]
  }, {
    // PrivateKey
    name: 'PrivateKeyInfo',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.OCTETSTRING,
    constructed: false,
    capture: 'privateKey'
  }]
};

asn1Validator$1.publicKeyValidator = {
  name: 'SubjectPublicKeyInfo',
  tagClass: asn1$1.Class.UNIVERSAL,
  type: asn1$1.Type.SEQUENCE,
  constructed: true,
  captureAsn1: 'subjectPublicKeyInfo',
  value: [{
    name: 'SubjectPublicKeyInfo.AlgorithmIdentifier',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.SEQUENCE,
    constructed: true,
    value: [{
      name: 'AlgorithmIdentifier.algorithm',
      tagClass: asn1$1.Class.UNIVERSAL,
      type: asn1$1.Type.OID,
      constructed: false,
      capture: 'publicKeyOid'
    }]
  },
  // capture group for ed25519PublicKey
  {
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.BITSTRING,
    constructed: false,
    composed: true,
    captureBitStringValue: 'ed25519PublicKey'
  }
  // FIXME: this is capture group for rsaPublicKey, use it in this API or
  // discard?
  /* {
    // subjectPublicKey
    name: 'SubjectPublicKeyInfo.subjectPublicKey',
    tagClass: asn1.Class.UNIVERSAL,
    type: asn1.Type.BITSTRING,
    constructed: false,
    value: [{
      // RSAPublicKey
      name: 'SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey',
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      optional: true,
      captureAsn1: 'rsaPublicKey'
    }]
  } */
  ]
};

/**
 * JavaScript implementation of Ed25519.
 *
 * Copyright (c) 2017-2019 Digital Bazaar, Inc.
 *
 * This implementation is based on the most excellent TweetNaCl which is
 * in the public domain. Many thanks to its contributors:
 *
 * https://github.com/dchest/tweetnacl-js
 */

var forge$6 = forge$F;




var asn1Validator = asn1Validator$1;
var publicKeyValidator = asn1Validator.publicKeyValidator;
var privateKeyValidator = asn1Validator.privateKeyValidator;

var ByteBuffer = forge$6.util.ByteBuffer;
var NativeBuffer = typeof Buffer === 'undefined' ? Uint8Array : Buffer;

/*
 * Ed25519 algorithms, see RFC 8032:
 * https://tools.ietf.org/html/rfc8032
 */
forge$6.pki = forge$6.pki || {};
forge$6.pki.ed25519 = forge$6.ed25519 = forge$6.ed25519 || {};
var ed25519 = forge$6.ed25519;

ed25519.constants = {};
ed25519.constants.PUBLIC_KEY_BYTE_LENGTH = 32;
ed25519.constants.PRIVATE_KEY_BYTE_LENGTH = 64;
ed25519.constants.SEED_BYTE_LENGTH = 32;
ed25519.constants.SIGN_BYTE_LENGTH = 64;
ed25519.constants.HASH_BYTE_LENGTH = 64;

ed25519.generateKeyPair = function(options) {
  options = options || {};
  var seed = options.seed;
  if(seed === undefined) {
    // generate seed
    seed = forge$6.random.getBytesSync(ed25519.constants.SEED_BYTE_LENGTH);
  } else if(typeof seed === 'string') {
    if(seed.length !== ed25519.constants.SEED_BYTE_LENGTH) {
      throw new TypeError(
        '"seed" must be ' + ed25519.constants.SEED_BYTE_LENGTH +
        ' bytes in length.');
    }
  } else if(!(seed instanceof Uint8Array)) {
    throw new TypeError(
      '"seed" must be a node.js Buffer, Uint8Array, or a binary string.');
  }

  seed = messageToNativeBuffer({message: seed, encoding: 'binary'});

  var pk = new NativeBuffer(ed25519.constants.PUBLIC_KEY_BYTE_LENGTH);
  var sk = new NativeBuffer(ed25519.constants.PRIVATE_KEY_BYTE_LENGTH);
  for(var i = 0; i < 32; ++i) {
    sk[i] = seed[i];
  }
  crypto_sign_keypair(pk, sk);
  return {publicKey: pk, privateKey: sk};
};

/**
 * Converts a private key from a RFC8410 ASN.1 encoding.
 *
 * @param obj - The asn1 representation of a private key.
 *
 * @returns {Object} keyInfo - The key information.
 * @returns {Buffer|Uint8Array} keyInfo.privateKeyBytes - 32 private key bytes.
 */
ed25519.privateKeyFromAsn1 = function(obj) {
  var capture = {};
  var errors = [];
  var valid = forge$6.asn1.validate(obj, privateKeyValidator, capture, errors);
  if(!valid) {
    var error = new Error('Invalid Key.');
    error.errors = errors;
    throw error;
  }
  var oid = forge$6.asn1.derToOid(capture.privateKeyOid);
  var ed25519Oid = forge$6.oids.EdDSA25519;
  if(oid !== ed25519Oid) {
    throw new Error('Invalid OID "' + oid + '"; OID must be "' +
      ed25519Oid + '".');
  }
  var privateKey = capture.privateKey;
  // manually extract the private key bytes from nested octet string, see FIXME:
  // https://github.com/digitalbazaar/forge/blob/master/lib/asn1.js#L542
  var privateKeyBytes = messageToNativeBuffer({
    message: forge$6.asn1.fromDer(privateKey).value,
    encoding: 'binary'
  });
  // TODO: RFC8410 specifies a format for encoding the public key bytes along
  // with the private key bytes. `publicKeyBytes` can be returned in the
  // future. https://tools.ietf.org/html/rfc8410#section-10.3
  return {privateKeyBytes: privateKeyBytes};
};

/**
 * Converts a public key from a RFC8410 ASN.1 encoding.
 *
 * @param obj - The asn1 representation of a public key.
 *
 * @return {Buffer|Uint8Array} - 32 public key bytes.
 */
ed25519.publicKeyFromAsn1 = function(obj) {
  // get SubjectPublicKeyInfo
  var capture = {};
  var errors = [];
  var valid = forge$6.asn1.validate(obj, publicKeyValidator, capture, errors);
  if(!valid) {
    var error = new Error('Invalid Key.');
    error.errors = errors;
    throw error;
  }
  var oid = forge$6.asn1.derToOid(capture.publicKeyOid);
  var ed25519Oid = forge$6.oids.EdDSA25519;
  if(oid !== ed25519Oid) {
    throw new Error('Invalid OID "' + oid + '"; OID must be "' +
      ed25519Oid + '".');
  }
  var publicKeyBytes = capture.ed25519PublicKey;
  if(publicKeyBytes.length !== ed25519.constants.PUBLIC_KEY_BYTE_LENGTH) {
    throw new Error('Key length is invalid.');
  }
  return messageToNativeBuffer({
    message: publicKeyBytes,
    encoding: 'binary'
  });
};

ed25519.publicKeyFromPrivateKey = function(options) {
  options = options || {};
  var privateKey = messageToNativeBuffer({
    message: options.privateKey, encoding: 'binary'
  });
  if(privateKey.length !== ed25519.constants.PRIVATE_KEY_BYTE_LENGTH) {
    throw new TypeError(
      '"options.privateKey" must have a byte length of ' +
      ed25519.constants.PRIVATE_KEY_BYTE_LENGTH);
  }

  var pk = new NativeBuffer(ed25519.constants.PUBLIC_KEY_BYTE_LENGTH);
  for(var i = 0; i < pk.length; ++i) {
    pk[i] = privateKey[32 + i];
  }
  return pk;
};

ed25519.sign = function(options) {
  options = options || {};
  var msg = messageToNativeBuffer(options);
  var privateKey = messageToNativeBuffer({
    message: options.privateKey,
    encoding: 'binary'
  });
  if(privateKey.length === ed25519.constants.SEED_BYTE_LENGTH) {
    var keyPair = ed25519.generateKeyPair({seed: privateKey});
    privateKey = keyPair.privateKey;
  } else if(privateKey.length !== ed25519.constants.PRIVATE_KEY_BYTE_LENGTH) {
    throw new TypeError(
      '"options.privateKey" must have a byte length of ' +
      ed25519.constants.SEED_BYTE_LENGTH + ' or ' +
      ed25519.constants.PRIVATE_KEY_BYTE_LENGTH);
  }

  var signedMsg = new NativeBuffer(
    ed25519.constants.SIGN_BYTE_LENGTH + msg.length);
  crypto_sign(signedMsg, msg, msg.length, privateKey);

  var sig = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH);
  for(var i = 0; i < sig.length; ++i) {
    sig[i] = signedMsg[i];
  }
  return sig;
};

ed25519.verify = function(options) {
  options = options || {};
  var msg = messageToNativeBuffer(options);
  if(options.signature === undefined) {
    throw new TypeError(
      '"options.signature" must be a node.js Buffer, a Uint8Array, a forge ' +
      'ByteBuffer, or a binary string.');
  }
  var sig = messageToNativeBuffer({
    message: options.signature,
    encoding: 'binary'
  });
  if(sig.length !== ed25519.constants.SIGN_BYTE_LENGTH) {
    throw new TypeError(
      '"options.signature" must have a byte length of ' +
      ed25519.constants.SIGN_BYTE_LENGTH);
  }
  var publicKey = messageToNativeBuffer({
    message: options.publicKey,
    encoding: 'binary'
  });
  if(publicKey.length !== ed25519.constants.PUBLIC_KEY_BYTE_LENGTH) {
    throw new TypeError(
      '"options.publicKey" must have a byte length of ' +
      ed25519.constants.PUBLIC_KEY_BYTE_LENGTH);
  }

  var sm = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH + msg.length);
  var m = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH + msg.length);
  var i;
  for(i = 0; i < ed25519.constants.SIGN_BYTE_LENGTH; ++i) {
    sm[i] = sig[i];
  }
  for(i = 0; i < msg.length; ++i) {
    sm[i + ed25519.constants.SIGN_BYTE_LENGTH] = msg[i];
  }
  return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
};

function messageToNativeBuffer(options) {
  var message = options.message;
  if(message instanceof Uint8Array || message instanceof NativeBuffer) {
    return message;
  }

  var encoding = options.encoding;
  if(message === undefined) {
    if(options.md) {
      // TODO: more rigorous validation that `md` is a MessageDigest
      message = options.md.digest().getBytes();
      encoding = 'binary';
    } else {
      throw new TypeError('"options.message" or "options.md" not specified.');
    }
  }

  if(typeof message === 'string' && !encoding) {
    throw new TypeError('"options.encoding" must be "binary" or "utf8".');
  }

  if(typeof message === 'string') {
    if(typeof Buffer !== 'undefined') {
      return Buffer.from(message, encoding);
    }
    message = new ByteBuffer(message, encoding);
  } else if(!(message instanceof ByteBuffer)) {
    throw new TypeError(
      '"options.message" must be a node.js Buffer, a Uint8Array, a forge ' +
      'ByteBuffer, or a string with "options.encoding" specifying its ' +
      'encoding.');
  }

  // convert to native buffer
  var buffer = new NativeBuffer(message.length());
  for(var i = 0; i < buffer.length; ++i) {
    buffer[i] = message.at(i);
  }
  return buffer;
}

var gf0 = gf();
var gf1 = gf([1]);
var D = gf([
  0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070,
  0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]);
var D2 = gf([
  0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0,
  0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]);
var X = gf([
  0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c,
  0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]);
var Y = gf([
  0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666,
  0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]);
var L = new Float64Array([
  0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58,
  0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);
var I = gf([
  0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43,
  0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);

// TODO: update forge buffer implementation to use `Buffer` or `Uint8Array`,
// whichever is available, to improve performance
function sha512(msg, msgLen) {
  // Note: `out` and `msg` are NativeBuffer
  var md = forge$6.md.sha512.create();
  var buffer = new ByteBuffer(msg);
  md.update(buffer.getBytes(msgLen), 'binary');
  var hash = md.digest().getBytes();
  if(typeof Buffer !== 'undefined') {
    return Buffer.from(hash, 'binary');
  }
  var out = new NativeBuffer(ed25519.constants.HASH_BYTE_LENGTH);
  for(var i = 0; i < 64; ++i) {
    out[i] = hash.charCodeAt(i);
  }
  return out;
}

function crypto_sign_keypair(pk, sk) {
  var p = [gf(), gf(), gf(), gf()];
  var i;

  var d = sha512(sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  scalarbase(p, d);
  pack(pk, p);

  for(i = 0; i < 32; ++i) {
    sk[i + 32] = pk[i];
  }
  return 0;
}

// Note: difference from C - smlen returned, not passed as argument.
function crypto_sign(sm, m, n, sk) {
  var i, j, x = new Float64Array(64);
  var p = [gf(), gf(), gf(), gf()];

  var d = sha512(sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  var smlen = n + 64;
  for(i = 0; i < n; ++i) {
    sm[64 + i] = m[i];
  }
  for(i = 0; i < 32; ++i) {
    sm[32 + i] = d[32 + i];
  }

  var r = sha512(sm.subarray(32), n + 32);
  reduce(r);
  scalarbase(p, r);
  pack(sm, p);

  for(i = 32; i < 64; ++i) {
    sm[i] = sk[i];
  }
  var h = sha512(sm, n + 64);
  reduce(h);

  for(i = 32; i < 64; ++i) {
    x[i] = 0;
  }
  for(i = 0; i < 32; ++i) {
    x[i] = r[i];
  }
  for(i = 0; i < 32; ++i) {
    for(j = 0; j < 32; j++) {
      x[i + j] += h[i] * d[j];
    }
  }

  modL(sm.subarray(32), x);
  return smlen;
}

function crypto_sign_open(m, sm, n, pk) {
  var i, mlen;
  var t = new NativeBuffer(32);
  var p = [gf(), gf(), gf(), gf()],
      q = [gf(), gf(), gf(), gf()];

  mlen = -1;
  if(n < 64) {
    return -1;
  }

  if(unpackneg(q, pk)) {
    return -1;
  }

  for(i = 0; i < n; ++i) {
    m[i] = sm[i];
  }
  for(i = 0; i < 32; ++i) {
    m[i + 32] = pk[i];
  }
  var h = sha512(m, n);
  reduce(h);
  scalarmult(p, q, h);

  scalarbase(q, sm.subarray(32));
  add(p, q);
  pack(t, p);

  n -= 64;
  if(crypto_verify_32(sm, 0, t, 0)) {
    for(i = 0; i < n; ++i) {
      m[i] = 0;
    }
    return -1;
  }

  for(i = 0; i < n; ++i) {
    m[i] = sm[i + 64];
  }
  mlen = n;
  return mlen;
}

function modL(r, x) {
  var carry, i, j, k;
  for(i = 63; i >= 32; --i) {
    carry = 0;
    for(j = i - 32, k = i - 12; j < k; ++j) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
      carry = (x[j] + 128) >> 8;
      x[j] -= carry * 256;
    }
    x[j] += carry;
    x[i] = 0;
  }
  carry = 0;
  for(j = 0; j < 32; ++j) {
    x[j] += carry - (x[31] >> 4) * L[j];
    carry = x[j] >> 8;
    x[j] &= 255;
  }
  for(j = 0; j < 32; ++j) {
    x[j] -= carry * L[j];
  }
  for(i = 0; i < 32; ++i) {
    x[i + 1] += x[i] >> 8;
    r[i] = x[i] & 255;
  }
}

function reduce(r) {
  var x = new Float64Array(64);
  for(var i = 0; i < 64; ++i) {
    x[i] = r[i];
    r[i] = 0;
  }
  modL(r, x);
}

function add(p, q) {
  var a = gf(), b = gf(), c = gf(),
      d = gf(), e = gf(), f = gf(),
      g = gf(), h = gf(), t = gf();

  Z(a, p[1], p[0]);
  Z(t, q[1], q[0]);
  M(a, a, t);
  A(b, p[0], p[1]);
  A(t, q[0], q[1]);
  M(b, b, t);
  M(c, p[3], q[3]);
  M(c, c, D2);
  M(d, p[2], q[2]);
  A(d, d, d);
  Z(e, b, a);
  Z(f, d, c);
  A(g, d, c);
  A(h, b, a);

  M(p[0], e, f);
  M(p[1], h, g);
  M(p[2], g, f);
  M(p[3], e, h);
}

function cswap(p, q, b) {
  for(var i = 0; i < 4; ++i) {
    sel25519(p[i], q[i], b);
  }
}

function pack(r, p) {
  var tx = gf(), ty = gf(), zi = gf();
  inv25519(zi, p[2]);
  M(tx, p[0], zi);
  M(ty, p[1], zi);
  pack25519(r, ty);
  r[31] ^= par25519(tx) << 7;
}

function pack25519(o, n) {
  var i, j, b;
  var m = gf(), t = gf();
  for(i = 0; i < 16; ++i) {
    t[i] = n[i];
  }
  car25519(t);
  car25519(t);
  car25519(t);
  for(j = 0; j < 2; ++j) {
    m[0] = t[0] - 0xffed;
    for(i = 1; i < 15; ++i) {
      m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
      m[i-1] &= 0xffff;
    }
    m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
    b = (m[15] >> 16) & 1;
    m[14] &= 0xffff;
    sel25519(t, m, 1 - b);
  }
  for (i = 0; i < 16; i++) {
    o[2 * i] = t[i] & 0xff;
    o[2 * i + 1] = t[i] >> 8;
  }
}

function unpackneg(r, p) {
  var t = gf(), chk = gf(), num = gf(),
      den = gf(), den2 = gf(), den4 = gf(),
      den6 = gf();

  set25519(r[2], gf1);
  unpack25519(r[1], p);
  S(num, r[1]);
  M(den, num, D);
  Z(num, num, r[2]);
  A(den, r[2], den);

  S(den2, den);
  S(den4, den2);
  M(den6, den4, den2);
  M(t, den6, num);
  M(t, t, den);

  pow2523(t, t);
  M(t, t, num);
  M(t, t, den);
  M(t, t, den);
  M(r[0], t, den);

  S(chk, r[0]);
  M(chk, chk, den);
  if(neq25519(chk, num)) {
    M(r[0], r[0], I);
  }

  S(chk, r[0]);
  M(chk, chk, den);
  if(neq25519(chk, num)) {
    return -1;
  }

  if(par25519(r[0]) === (p[31] >> 7)) {
    Z(r[0], gf0, r[0]);
  }

  M(r[3], r[0], r[1]);
  return 0;
}

function unpack25519(o, n) {
  var i;
  for(i = 0; i < 16; ++i) {
    o[i] = n[2 * i] + (n[2 * i + 1] << 8);
  }
  o[15] &= 0x7fff;
}

function pow2523(o, i) {
  var c = gf();
  var a;
  for(a = 0; a < 16; ++a) {
    c[a] = i[a];
  }
  for(a = 250; a >= 0; --a) {
    S(c, c);
    if(a !== 1) {
      M(c, c, i);
    }
  }
  for(a = 0; a < 16; ++a) {
    o[a] = c[a];
  }
}

function neq25519(a, b) {
  var c = new NativeBuffer(32);
  var d = new NativeBuffer(32);
  pack25519(c, a);
  pack25519(d, b);
  return crypto_verify_32(c, 0, d, 0);
}

function crypto_verify_32(x, xi, y, yi) {
  return vn(x, xi, y, yi, 32);
}

function vn(x, xi, y, yi, n) {
  var i, d = 0;
  for(i = 0; i < n; ++i) {
    d |= x[xi + i] ^ y[yi + i];
  }
  return (1 & ((d - 1) >>> 8)) - 1;
}

function par25519(a) {
  var d = new NativeBuffer(32);
  pack25519(d, a);
  return d[0] & 1;
}

function scalarmult(p, q, s) {
  var b, i;
  set25519(p[0], gf0);
  set25519(p[1], gf1);
  set25519(p[2], gf1);
  set25519(p[3], gf0);
  for(i = 255; i >= 0; --i) {
    b = (s[(i / 8)|0] >> (i & 7)) & 1;
    cswap(p, q, b);
    add(q, p);
    add(p, p);
    cswap(p, q, b);
  }
}

function scalarbase(p, s) {
  var q = [gf(), gf(), gf(), gf()];
  set25519(q[0], X);
  set25519(q[1], Y);
  set25519(q[2], gf1);
  M(q[3], X, Y);
  scalarmult(p, q, s);
}

function set25519(r, a) {
  var i;
  for(i = 0; i < 16; i++) {
    r[i] = a[i] | 0;
  }
}

function inv25519(o, i) {
  var c = gf();
  var a;
  for(a = 0; a < 16; ++a) {
    c[a] = i[a];
  }
  for(a = 253; a >= 0; --a) {
    S(c, c);
    if(a !== 2 && a !== 4) {
      M(c, c, i);
    }
  }
  for(a = 0; a < 16; ++a) {
    o[a] = c[a];
  }
}

function car25519(o) {
  var i, v, c = 1;
  for(i = 0; i < 16; ++i) {
    v = o[i] + c + 65535;
    c = Math.floor(v / 65536);
    o[i] = v - c * 65536;
  }
  o[0] += c - 1 + 37 * (c - 1);
}

function sel25519(p, q, b) {
  var t, c = ~(b - 1);
  for(var i = 0; i < 16; ++i) {
    t = c & (p[i] ^ q[i]);
    p[i] ^= t;
    q[i] ^= t;
  }
}

function gf(init) {
  var i, r = new Float64Array(16);
  if(init) {
    for(i = 0; i < init.length; ++i) {
      r[i] = init[i];
    }
  }
  return r;
}

function A(o, a, b) {
  for(var i = 0; i < 16; ++i) {
    o[i] = a[i] + b[i];
  }
}

function Z(o, a, b) {
  for(var i = 0; i < 16; ++i) {
    o[i] = a[i] - b[i];
  }
}

function S(o, a) {
  M(o, a, a);
}

function M(o, a, b) {
  var v, c,
     t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
     t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
    t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
    t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
    b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7],
    b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11],
    b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];

  v = a[0];
  t0 += v * b0;
  t1 += v * b1;
  t2 += v * b2;
  t3 += v * b3;
  t4 += v * b4;
  t5 += v * b5;
  t6 += v * b6;
  t7 += v * b7;
  t8 += v * b8;
  t9 += v * b9;
  t10 += v * b10;
  t11 += v * b11;
  t12 += v * b12;
  t13 += v * b13;
  t14 += v * b14;
  t15 += v * b15;
  v = a[1];
  t1 += v * b0;
  t2 += v * b1;
  t3 += v * b2;
  t4 += v * b3;
  t5 += v * b4;
  t6 += v * b5;
  t7 += v * b6;
  t8 += v * b7;
  t9 += v * b8;
  t10 += v * b9;
  t11 += v * b10;
  t12 += v * b11;
  t13 += v * b12;
  t14 += v * b13;
  t15 += v * b14;
  t16 += v * b15;
  v = a[2];
  t2 += v * b0;
  t3 += v * b1;
  t4 += v * b2;
  t5 += v * b3;
  t6 += v * b4;
  t7 += v * b5;
  t8 += v * b6;
  t9 += v * b7;
  t10 += v * b8;
  t11 += v * b9;
  t12 += v * b10;
  t13 += v * b11;
  t14 += v * b12;
  t15 += v * b13;
  t16 += v * b14;
  t17 += v * b15;
  v = a[3];
  t3 += v * b0;
  t4 += v * b1;
  t5 += v * b2;
  t6 += v * b3;
  t7 += v * b4;
  t8 += v * b5;
  t9 += v * b6;
  t10 += v * b7;
  t11 += v * b8;
  t12 += v * b9;
  t13 += v * b10;
  t14 += v * b11;
  t15 += v * b12;
  t16 += v * b13;
  t17 += v * b14;
  t18 += v * b15;
  v = a[4];
  t4 += v * b0;
  t5 += v * b1;
  t6 += v * b2;
  t7 += v * b3;
  t8 += v * b4;
  t9 += v * b5;
  t10 += v * b6;
  t11 += v * b7;
  t12 += v * b8;
  t13 += v * b9;
  t14 += v * b10;
  t15 += v * b11;
  t16 += v * b12;
  t17 += v * b13;
  t18 += v * b14;
  t19 += v * b15;
  v = a[5];
  t5 += v * b0;
  t6 += v * b1;
  t7 += v * b2;
  t8 += v * b3;
  t9 += v * b4;
  t10 += v * b5;
  t11 += v * b6;
  t12 += v * b7;
  t13 += v * b8;
  t14 += v * b9;
  t15 += v * b10;
  t16 += v * b11;
  t17 += v * b12;
  t18 += v * b13;
  t19 += v * b14;
  t20 += v * b15;
  v = a[6];
  t6 += v * b0;
  t7 += v * b1;
  t8 += v * b2;
  t9 += v * b3;
  t10 += v * b4;
  t11 += v * b5;
  t12 += v * b6;
  t13 += v * b7;
  t14 += v * b8;
  t15 += v * b9;
  t16 += v * b10;
  t17 += v * b11;
  t18 += v * b12;
  t19 += v * b13;
  t20 += v * b14;
  t21 += v * b15;
  v = a[7];
  t7 += v * b0;
  t8 += v * b1;
  t9 += v * b2;
  t10 += v * b3;
  t11 += v * b4;
  t12 += v * b5;
  t13 += v * b6;
  t14 += v * b7;
  t15 += v * b8;
  t16 += v * b9;
  t17 += v * b10;
  t18 += v * b11;
  t19 += v * b12;
  t20 += v * b13;
  t21 += v * b14;
  t22 += v * b15;
  v = a[8];
  t8 += v * b0;
  t9 += v * b1;
  t10 += v * b2;
  t11 += v * b3;
  t12 += v * b4;
  t13 += v * b5;
  t14 += v * b6;
  t15 += v * b7;
  t16 += v * b8;
  t17 += v * b9;
  t18 += v * b10;
  t19 += v * b11;
  t20 += v * b12;
  t21 += v * b13;
  t22 += v * b14;
  t23 += v * b15;
  v = a[9];
  t9 += v * b0;
  t10 += v * b1;
  t11 += v * b2;
  t12 += v * b3;
  t13 += v * b4;
  t14 += v * b5;
  t15 += v * b6;
  t16 += v * b7;
  t17 += v * b8;
  t18 += v * b9;
  t19 += v * b10;
  t20 += v * b11;
  t21 += v * b12;
  t22 += v * b13;
  t23 += v * b14;
  t24 += v * b15;
  v = a[10];
  t10 += v * b0;
  t11 += v * b1;
  t12 += v * b2;
  t13 += v * b3;
  t14 += v * b4;
  t15 += v * b5;
  t16 += v * b6;
  t17 += v * b7;
  t18 += v * b8;
  t19 += v * b9;
  t20 += v * b10;
  t21 += v * b11;
  t22 += v * b12;
  t23 += v * b13;
  t24 += v * b14;
  t25 += v * b15;
  v = a[11];
  t11 += v * b0;
  t12 += v * b1;
  t13 += v * b2;
  t14 += v * b3;
  t15 += v * b4;
  t16 += v * b5;
  t17 += v * b6;
  t18 += v * b7;
  t19 += v * b8;
  t20 += v * b9;
  t21 += v * b10;
  t22 += v * b11;
  t23 += v * b12;
  t24 += v * b13;
  t25 += v * b14;
  t26 += v * b15;
  v = a[12];
  t12 += v * b0;
  t13 += v * b1;
  t14 += v * b2;
  t15 += v * b3;
  t16 += v * b4;
  t17 += v * b5;
  t18 += v * b6;
  t19 += v * b7;
  t20 += v * b8;
  t21 += v * b9;
  t22 += v * b10;
  t23 += v * b11;
  t24 += v * b12;
  t25 += v * b13;
  t26 += v * b14;
  t27 += v * b15;
  v = a[13];
  t13 += v * b0;
  t14 += v * b1;
  t15 += v * b2;
  t16 += v * b3;
  t17 += v * b4;
  t18 += v * b5;
  t19 += v * b6;
  t20 += v * b7;
  t21 += v * b8;
  t22 += v * b9;
  t23 += v * b10;
  t24 += v * b11;
  t25 += v * b12;
  t26 += v * b13;
  t27 += v * b14;
  t28 += v * b15;
  v = a[14];
  t14 += v * b0;
  t15 += v * b1;
  t16 += v * b2;
  t17 += v * b3;
  t18 += v * b4;
  t19 += v * b5;
  t20 += v * b6;
  t21 += v * b7;
  t22 += v * b8;
  t23 += v * b9;
  t24 += v * b10;
  t25 += v * b11;
  t26 += v * b12;
  t27 += v * b13;
  t28 += v * b14;
  t29 += v * b15;
  v = a[15];
  t15 += v * b0;
  t16 += v * b1;
  t17 += v * b2;
  t18 += v * b3;
  t19 += v * b4;
  t20 += v * b5;
  t21 += v * b6;
  t22 += v * b7;
  t23 += v * b8;
  t24 += v * b9;
  t25 += v * b10;
  t26 += v * b11;
  t27 += v * b12;
  t28 += v * b13;
  t29 += v * b14;
  t30 += v * b15;

  t0  += 38 * t16;
  t1  += 38 * t17;
  t2  += 38 * t18;
  t3  += 38 * t19;
  t4  += 38 * t20;
  t5  += 38 * t21;
  t6  += 38 * t22;
  t7  += 38 * t23;
  t8  += 38 * t24;
  t9  += 38 * t25;
  t10 += 38 * t26;
  t11 += 38 * t27;
  t12 += 38 * t28;
  t13 += 38 * t29;
  t14 += 38 * t30;
  // t15 left as is

  // first car
  c = 1;
  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
  t0 += c-1 + 37 * (c-1);

  // second car
  c = 1;
  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
  t0 += c-1 + 37 * (c-1);

  o[ 0] = t0;
  o[ 1] = t1;
  o[ 2] = t2;
  o[ 3] = t3;
  o[ 4] = t4;
  o[ 5] = t5;
  o[ 6] = t6;
  o[ 7] = t7;
  o[ 8] = t8;
  o[ 9] = t9;
  o[10] = t10;
  o[11] = t11;
  o[12] = t12;
  o[13] = t13;
  o[14] = t14;
  o[15] = t15;
}

/**
 * Javascript implementation of RSA-KEM.
 *
 * @author Lautaro Cozzani Rodriguez
 * @author Dave Longley
 *
 * Copyright (c) 2014 Lautaro Cozzani <lautaro.cozzani@scytl.com>
 * Copyright (c) 2014 Digital Bazaar, Inc.
 */

var forge$5 = forge$F;




forge$5.kem = forge$5.kem || {};

var BigInteger = forge$5.jsbn.BigInteger;

/**
 * The API for the RSA Key Encapsulation Mechanism (RSA-KEM) from ISO 18033-2.
 */
forge$5.kem.rsa = {};

/**
 * Creates an RSA KEM API object for generating a secret asymmetric key.
 *
 * The symmetric key may be generated via a call to 'encrypt', which will
 * produce a ciphertext to be transmitted to the recipient and a key to be
 * kept secret. The ciphertext is a parameter to be passed to 'decrypt' which
 * will produce the same secret key for the recipient to use to decrypt a
 * message that was encrypted with the secret key.
 *
 * @param kdf the KDF API to use (eg: new forge.kem.kdf1()).
 * @param options the options to use.
 *          [prng] a custom crypto-secure pseudo-random number generator to use,
 *            that must define "getBytesSync".
 */
forge$5.kem.rsa.create = function(kdf, options) {
  options = options || {};
  var prng = options.prng || forge$5.random;

  var kem = {};

  /**
   * Generates a secret key and its encapsulation.
   *
   * @param publicKey the RSA public key to encrypt with.
   * @param keyLength the length, in bytes, of the secret key to generate.
   *
   * @return an object with:
   *   encapsulation: the ciphertext for generating the secret key, as a
   *     binary-encoded string of bytes.
   *   key: the secret key to use for encrypting a message.
   */
  kem.encrypt = function(publicKey, keyLength) {
    // generate a random r where 1 < r < n
    var byteLength = Math.ceil(publicKey.n.bitLength() / 8);
    var r;
    do {
      r = new BigInteger(
        forge$5.util.bytesToHex(prng.getBytesSync(byteLength)),
        16).mod(publicKey.n);
    } while(r.compareTo(BigInteger.ONE) <= 0);

    // prepend r with zeros
    r = forge$5.util.hexToBytes(r.toString(16));
    var zeros = byteLength - r.length;
    if(zeros > 0) {
      r = forge$5.util.fillString(String.fromCharCode(0), zeros) + r;
    }

    // encrypt the random
    var encapsulation = publicKey.encrypt(r, 'NONE');

    // generate the secret key
    var key = kdf.generate(r, keyLength);

    return {encapsulation: encapsulation, key: key};
  };

  /**
   * Decrypts an encapsulated secret key.
   *
   * @param privateKey the RSA private key to decrypt with.
   * @param encapsulation the ciphertext for generating the secret key, as
   *          a binary-encoded string of bytes.
   * @param keyLength the length, in bytes, of the secret key to generate.
   *
   * @return the secret key as a binary-encoded string of bytes.
   */
  kem.decrypt = function(privateKey, encapsulation, keyLength) {
    // decrypt the encapsulation and generate the secret key
    var r = privateKey.decrypt(encapsulation, 'NONE');
    return kdf.generate(r, keyLength);
  };

  return kem;
};

// TODO: add forge.kem.kdf.create('KDF1', {md: ..., ...}) API?

/**
 * Creates a key derivation API object that implements KDF1 per ISO 18033-2.
 *
 * @param md the hash API to use.
 * @param [digestLength] an optional digest length that must be positive and
 *          less than or equal to md.digestLength.
 *
 * @return a KDF1 API object.
 */
forge$5.kem.kdf1 = function(md, digestLength) {
  _createKDF(this, md, 0, digestLength || md.digestLength);
};

/**
 * Creates a key derivation API object that implements KDF2 per ISO 18033-2.
 *
 * @param md the hash API to use.
 * @param [digestLength] an optional digest length that must be positive and
 *          less than or equal to md.digestLength.
 *
 * @return a KDF2 API object.
 */
forge$5.kem.kdf2 = function(md, digestLength) {
  _createKDF(this, md, 1, digestLength || md.digestLength);
};

/**
 * Creates a KDF1 or KDF2 API object.
 *
 * @param md the hash API to use.
 * @param counterStart the starting index for the counter.
 * @param digestLength the digest length to use.
 *
 * @return the KDF API object.
 */
function _createKDF(kdf, md, counterStart, digestLength) {
  /**
   * Generate a key of the specified length.
   *
   * @param x the binary-encoded byte string to generate a key from.
   * @param length the number of bytes to generate (the size of the key).
   *
   * @return the key as a binary-encoded string.
   */
  kdf.generate = function(x, length) {
    var key = new forge$5.util.ByteBuffer();

    // run counter from counterStart to ceil(length / Hash.len)
    var k = Math.ceil(length / digestLength) + counterStart;

    var c = new forge$5.util.ByteBuffer();
    for(var i = counterStart; i < k; ++i) {
      // I2OSP(i, 4): convert counter to an octet string of 4 octets
      c.putInt32(i);

      // digest 'x' and the counter and add the result to the key
      md.start();
      md.update(x + c.getBytes());
      var hash = md.digest();
      key.putBytes(hash.getBytes(digestLength));
    }

    // truncate to the correct key length
    key.truncate(key.length() - length);
    return key.getBytes();
  };
}

/**
 * Cross-browser support for logging in a web application.
 *
 * @author David I. Lehn <dlehn@digitalbazaar.com>
 *
 * Copyright (c) 2008-2013 Digital Bazaar, Inc.
 */

var forge$4 = forge$F;


/* LOG API */
forge$4.log = forge$4.log || {};

/**
 * Application logging system.
 *
 * Each logger level available as it's own function of the form:
 *   forge.log.level(category, args...)
 * The category is an arbitrary string, and the args are the same as
 * Firebug's console.log API. By default the call will be output as:
 *   'LEVEL [category] <args[0]>, args[1], ...'
 * This enables proper % formatting via the first argument.
 * Each category is enabled by default but can be enabled or disabled with
 * the setCategoryEnabled() function.
 */
// list of known levels
forge$4.log.levels = [
  'none', 'error', 'warning', 'info', 'debug', 'verbose', 'max'];
// info on the levels indexed by name:
//   index: level index
//   name: uppercased display name
var sLevelInfo = {};
// list of loggers
var sLoggers = [];
/**
 * Standard console logger. If no console support is enabled this will
 * remain null. Check before using.
 */
var sConsoleLogger = null;

// logger flags
/**
 * Lock the level at the current value. Used in cases where user config may
 * set the level such that only critical messages are seen but more verbose
 * messages are needed for debugging or other purposes.
 */
forge$4.log.LEVEL_LOCKED = (1 << 1);
/**
 * Always call log function. By default, the logging system will check the
 * message level against logger.level before calling the log function. This
 * flag allows the function to do its own check.
 */
forge$4.log.NO_LEVEL_CHECK = (1 << 2);
/**
 * Perform message interpolation with the passed arguments. "%" style
 * fields in log messages will be replaced by arguments as needed. Some
 * loggers, such as Firebug, may do this automatically. The original log
 * message will be available as 'message' and the interpolated version will
 * be available as 'fullMessage'.
 */
forge$4.log.INTERPOLATE = (1 << 3);

// setup each log level
for(var i = 0; i < forge$4.log.levels.length; ++i) {
  var level = forge$4.log.levels[i];
  sLevelInfo[level] = {
    index: i,
    name: level.toUpperCase()
  };
}

/**
 * Message logger. Will dispatch a message to registered loggers as needed.
 *
 * @param message message object
 */
forge$4.log.logMessage = function(message) {
  var messageLevelIndex = sLevelInfo[message.level].index;
  for(var i = 0; i < sLoggers.length; ++i) {
    var logger = sLoggers[i];
    if(logger.flags & forge$4.log.NO_LEVEL_CHECK) {
      logger.f(message);
    } else {
      // get logger level
      var loggerLevelIndex = sLevelInfo[logger.level].index;
      // check level
      if(messageLevelIndex <= loggerLevelIndex) {
        // message critical enough, call logger
        logger.f(logger, message);
      }
    }
  }
};

/**
 * Sets the 'standard' key on a message object to:
 * "LEVEL [category] " + message
 *
 * @param message a message log object
 */
forge$4.log.prepareStandard = function(message) {
  if(!('standard' in message)) {
    message.standard =
      sLevelInfo[message.level].name +
      //' ' + +message.timestamp +
      ' [' + message.category + '] ' +
      message.message;
  }
};

/**
 * Sets the 'full' key on a message object to the original message
 * interpolated via % formatting with the message arguments.
 *
 * @param message a message log object.
 */
forge$4.log.prepareFull = function(message) {
  if(!('full' in message)) {
    // copy args and insert message at the front
    var args = [message.message];
    args = args.concat([] || message['arguments']);
    // format the message
    message.full = forge$4.util.format.apply(this, args);
  }
};

/**
 * Applies both preparseStandard() and prepareFull() to a message object and
 * store result in 'standardFull'.
 *
 * @param message a message log object.
 */
forge$4.log.prepareStandardFull = function(message) {
  if(!('standardFull' in message)) {
    // FIXME implement 'standardFull' logging
    forge$4.log.prepareStandard(message);
    message.standardFull = message.standard;
  }
};

// create log level functions
{
  // levels for which we want functions
  var levels = ['error', 'warning', 'info', 'debug', 'verbose'];
  for(var i = 0; i < levels.length; ++i) {
    // wrap in a function to ensure proper level var is passed
    (function(level) {
      // create function for this level
      forge$4.log[level] = function(category, message/*, args...*/) {
        // convert arguments to real array, remove category and message
        var args = Array.prototype.slice.call(arguments).slice(2);
        // create message object
        // Note: interpolation and standard formatting is done lazily
        var msg = {
          timestamp: new Date(),
          level: level,
          category: category,
          message: message,
          'arguments': args
          /*standard*/
          /*full*/
          /*fullMessage*/
        };
        // process this message
        forge$4.log.logMessage(msg);
      };
    })(levels[i]);
  }
}

/**
 * Creates a new logger with specified custom logging function.
 *
 * The logging function has a signature of:
 *   function(logger, message)
 * logger: current logger
 * message: object:
 *   level: level id
 *   category: category
 *   message: string message
 *   arguments: Array of extra arguments
 *   fullMessage: interpolated message and arguments if INTERPOLATE flag set
 *
 * @param logFunction a logging function which takes a log message object
 *          as a parameter.
 *
 * @return a logger object.
 */
forge$4.log.makeLogger = function(logFunction) {
  var logger = {
    flags: 0,
    f: logFunction
  };
  forge$4.log.setLevel(logger, 'none');
  return logger;
};

/**
 * Sets the current log level on a logger.
 *
 * @param logger the target logger.
 * @param level the new maximum log level as a string.
 *
 * @return true if set, false if not.
 */
forge$4.log.setLevel = function(logger, level) {
  var rval = false;
  if(logger && !(logger.flags & forge$4.log.LEVEL_LOCKED)) {
    for(var i = 0; i < forge$4.log.levels.length; ++i) {
      var aValidLevel = forge$4.log.levels[i];
      if(level == aValidLevel) {
        // set level
        logger.level = level;
        rval = true;
        break;
      }
    }
  }

  return rval;
};

/**
 * Locks the log level at its current value.
 *
 * @param logger the target logger.
 * @param lock boolean lock value, default to true.
 */
forge$4.log.lock = function(logger, lock) {
  if(typeof lock === 'undefined' || lock) {
    logger.flags |= forge$4.log.LEVEL_LOCKED;
  } else {
    logger.flags &= ~forge$4.log.LEVEL_LOCKED;
  }
};

/**
 * Adds a logger.
 *
 * @param logger the logger object.
 */
forge$4.log.addLogger = function(logger) {
  sLoggers.push(logger);
};

// setup the console logger if possible, else create fake console.log
if(typeof(console) !== 'undefined' && 'log' in console) {
  var logger;
  if(console.error && console.warn && console.info && console.debug) {
    // looks like Firebug-style logging is available
    // level handlers map
    var levelHandlers = {
      error: console.error,
      warning: console.warn,
      info: console.info,
      debug: console.debug,
      verbose: console.debug
    };
    var f = function(logger, message) {
      forge$4.log.prepareStandard(message);
      var handler = levelHandlers[message.level];
      // prepend standard message and concat args
      var args = [message.standard];
      args = args.concat(message['arguments'].slice());
      // apply to low-level console function
      handler.apply(console, args);
    };
    logger = forge$4.log.makeLogger(f);
  } else {
    // only appear to have basic console.log
    var f = function(logger, message) {
      forge$4.log.prepareStandardFull(message);
      console.log(message.standardFull);
    };
    logger = forge$4.log.makeLogger(f);
  }
  forge$4.log.setLevel(logger, 'debug');
  forge$4.log.addLogger(logger);
  sConsoleLogger = logger;
} else {
  // define fake console.log to avoid potential script errors on
  // browsers that do not have console logging
  console = {
    log: function() {}
  };
}

/*
 * Check for logging control query vars.
 *
 * console.level=<level-name>
 * Set's the console log level by name.  Useful to override defaults and
 * allow more verbose logging before a user config is loaded.
 *
 * console.lock=<true|false>
 * Lock the console log level at whatever level it is set at.  This is run
 * after console.level is processed.  Useful to force a level of verbosity
 * that could otherwise be limited by a user config.
 */
if(sConsoleLogger !== null) {
  var query = forge$4.util.getQueryVariables();
  if('console.level' in query) {
    // set with last value
    forge$4.log.setLevel(
      sConsoleLogger, query['console.level'].slice(-1)[0]);
  }
  if('console.lock' in query) {
    // set with last value
    var lock = query['console.lock'].slice(-1)[0];
    if(lock == 'true') {
      forge$4.log.lock(sConsoleLogger);
    }
  }
}

// provide public access to console logger
forge$4.log.consoleLogger = sConsoleLogger;

/**
 * Javascript implementation of PKCS#7 v1.5.
 *
 * @author Stefan Siegl
 * @author Dave Longley
 *
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 * Copyright (c) 2012-2015 Digital Bazaar, Inc.
 *
 * Currently this implementation only supports ContentType of EnvelopedData,
 * EncryptedData, or SignedData at the root level. The top level elements may
 * contain only a ContentInfo of ContentType Data, i.e. plain data. Further
 * nesting is not (yet) supported.
 *
 * The Forge validators for PKCS #7's ASN.1 structures are available from
 * a separate file pkcs7asn1.js, since those are referenced from other
 * PKCS standards like PKCS #12.
 */

var forge$3 = forge$F;










// shortcut for ASN.1 API
var asn1 = forge$3.asn1;

// shortcut for PKCS#7 API
var p7 = forge$3.pkcs7 = forge$3.pkcs7 || {};

/**
 * Converts a PKCS#7 message from PEM format.
 *
 * @param pem the PEM-formatted PKCS#7 message.
 *
 * @return the PKCS#7 message.
 */
p7.messageFromPem = function(pem) {
  var msg = forge$3.pem.decode(pem)[0];

  if(msg.type !== 'PKCS7') {
    var error = new Error('Could not convert PKCS#7 message from PEM; PEM ' +
      'header type is not "PKCS#7".');
    error.headerType = msg.type;
    throw error;
  }
  if(msg.procType && msg.procType.type === 'ENCRYPTED') {
    throw new Error('Could not convert PKCS#7 message from PEM; PEM is encrypted.');
  }

  // convert DER to ASN.1 object
  var obj = asn1.fromDer(msg.body);

  return p7.messageFromAsn1(obj);
};

/**
 * Converts a PKCS#7 message to PEM format.
 *
 * @param msg The PKCS#7 message object
 * @param maxline The maximum characters per line, defaults to 64.
 *
 * @return The PEM-formatted PKCS#7 message.
 */
p7.messageToPem = function(msg, maxline) {
  // convert to ASN.1, then DER, then PEM-encode
  var pemObj = {
    type: 'PKCS7',
    body: asn1.toDer(msg.toAsn1()).getBytes()
  };
  return forge$3.pem.encode(pemObj, {maxline: maxline});
};

/**
 * Converts a PKCS#7 message from an ASN.1 object.
 *
 * @param obj the ASN.1 representation of a ContentInfo.
 *
 * @return the PKCS#7 message.
 */
p7.messageFromAsn1 = function(obj) {
  // validate root level ContentInfo and capture data
  var capture = {};
  var errors = [];
  if(!asn1.validate(obj, p7.asn1.contentInfoValidator, capture, errors)) {
    var error = new Error('Cannot read PKCS#7 message. ' +
      'ASN.1 object is not an PKCS#7 ContentInfo.');
    error.errors = errors;
    throw error;
  }

  var contentType = asn1.derToOid(capture.contentType);
  var msg;

  switch(contentType) {
    case forge$3.pki.oids.envelopedData:
      msg = p7.createEnvelopedData();
      break;

    case forge$3.pki.oids.encryptedData:
      msg = p7.createEncryptedData();
      break;

    case forge$3.pki.oids.signedData:
      msg = p7.createSignedData();
      break;

    default:
      throw new Error('Cannot read PKCS#7 message. ContentType with OID ' +
        contentType + ' is not (yet) supported.');
  }

  msg.fromAsn1(capture.content.value[0]);
  return msg;
};

p7.createSignedData = function() {
  var msg = null;
  msg = {
    type: forge$3.pki.oids.signedData,
    version: 1,
    certificates: [],
    crls: [],
    // TODO: add json-formatted signer stuff here?
    signers: [],
    // populated during sign()
    digestAlgorithmIdentifiers: [],
    contentInfo: null,
    signerInfos: [],

    fromAsn1: function(obj) {
      // validate SignedData content block and capture data.
      _fromAsn1(msg, obj, p7.asn1.signedDataValidator);
      msg.certificates = [];
      msg.crls = [];
      msg.digestAlgorithmIdentifiers = [];
      msg.contentInfo = null;
      msg.signerInfos = [];

      if(msg.rawCapture.certificates) {
        var certs = msg.rawCapture.certificates.value;
        for(var i = 0; i < certs.length; ++i) {
          msg.certificates.push(forge$3.pki.certificateFromAsn1(certs[i]));
        }
      }

      // TODO: parse crls
    },

    toAsn1: function() {
      // degenerate case with no content
      if(!msg.contentInfo) {
        msg.sign();
      }

      var certs = [];
      for(var i = 0; i < msg.certificates.length; ++i) {
        certs.push(forge$3.pki.certificateToAsn1(msg.certificates[i]));
      }

      var crls = [];
      // TODO: implement CRLs

      // [0] SignedData
      var signedData = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // Version
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
            asn1.integerToDer(msg.version).getBytes()),
          // DigestAlgorithmIdentifiers
          asn1.create(
            asn1.Class.UNIVERSAL, asn1.Type.SET, true,
            msg.digestAlgorithmIdentifiers),
          // ContentInfo
          msg.contentInfo
        ])
      ]);
      if(certs.length > 0) {
        // [0] IMPLICIT ExtendedCertificatesAndCertificates OPTIONAL
        signedData.value[0].value.push(
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, certs));
      }
      if(crls.length > 0) {
        // [1] IMPLICIT CertificateRevocationLists OPTIONAL
        signedData.value[0].value.push(
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, crls));
      }
      // SignerInfos
      signedData.value[0].value.push(
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true,
          msg.signerInfos));

      // ContentInfo
      return asn1.create(
        asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // ContentType
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
            asn1.oidToDer(msg.type).getBytes()),
          // [0] SignedData
          signedData
        ]);
    },

    /**
     * Add (another) entity to list of signers.
     *
     * Note: If authenticatedAttributes are provided, then, per RFC 2315,
     * they must include at least two attributes: content type and
     * message digest. The message digest attribute value will be
     * auto-calculated during signing and will be ignored if provided.
     *
     * Here's an example of providing these two attributes:
     *
     * forge.pkcs7.createSignedData();
     * p7.addSigner({
     *   issuer: cert.issuer.attributes,
     *   serialNumber: cert.serialNumber,
     *   key: privateKey,
     *   digestAlgorithm: forge.pki.oids.sha1,
     *   authenticatedAttributes: [{
     *     type: forge.pki.oids.contentType,
     *     value: forge.pki.oids.data
     *   }, {
     *     type: forge.pki.oids.messageDigest
     *   }]
     * });
     *
     * TODO: Support [subjectKeyIdentifier] as signer's ID.
     *
     * @param signer the signer information:
     *          key the signer's private key.
     *          [certificate] a certificate containing the public key
     *            associated with the signer's private key; use this option as
     *            an alternative to specifying signer.issuer and
     *            signer.serialNumber.
     *          [issuer] the issuer attributes (eg: cert.issuer.attributes).
     *          [serialNumber] the signer's certificate's serial number in
     *           hexadecimal (eg: cert.serialNumber).
     *          [digestAlgorithm] the message digest OID, as a string, to use
     *            (eg: forge.pki.oids.sha1).
     *          [authenticatedAttributes] an optional array of attributes
     *            to also sign along with the content.
     */
    addSigner: function(signer) {
      var issuer = signer.issuer;
      var serialNumber = signer.serialNumber;
      if(signer.certificate) {
        var cert = signer.certificate;
        if(typeof cert === 'string') {
          cert = forge$3.pki.certificateFromPem(cert);
        }
        issuer = cert.issuer.attributes;
        serialNumber = cert.serialNumber;
      }
      var key = signer.key;
      if(!key) {
        throw new Error(
          'Could not add PKCS#7 signer; no private key specified.');
      }
      if(typeof key === 'string') {
        key = forge$3.pki.privateKeyFromPem(key);
      }

      // ensure OID known for digest algorithm
      var digestAlgorithm = signer.digestAlgorithm || forge$3.pki.oids.sha1;
      switch(digestAlgorithm) {
      case forge$3.pki.oids.sha1:
      case forge$3.pki.oids.sha256:
      case forge$3.pki.oids.sha384:
      case forge$3.pki.oids.sha512:
      case forge$3.pki.oids.md5:
        break;
      default:
        throw new Error(
          'Could not add PKCS#7 signer; unknown message digest algorithm: ' +
          digestAlgorithm);
      }

      // if authenticatedAttributes is present, then the attributes
      // must contain at least PKCS #9 content-type and message-digest
      var authenticatedAttributes = signer.authenticatedAttributes || [];
      if(authenticatedAttributes.length > 0) {
        var contentType = false;
        var messageDigest = false;
        for(var i = 0; i < authenticatedAttributes.length; ++i) {
          var attr = authenticatedAttributes[i];
          if(!contentType && attr.type === forge$3.pki.oids.contentType) {
            contentType = true;
            if(messageDigest) {
              break;
            }
            continue;
          }
          if(!messageDigest && attr.type === forge$3.pki.oids.messageDigest) {
            messageDigest = true;
            if(contentType) {
              break;
            }
            continue;
          }
        }

        if(!contentType || !messageDigest) {
          throw new Error('Invalid signer.authenticatedAttributes. If ' +
            'signer.authenticatedAttributes is specified, then it must ' +
            'contain at least two attributes, PKCS #9 content-type and ' +
            'PKCS #9 message-digest.');
        }
      }

      msg.signers.push({
        key: key,
        version: 1,
        issuer: issuer,
        serialNumber: serialNumber,
        digestAlgorithm: digestAlgorithm,
        signatureAlgorithm: forge$3.pki.oids.rsaEncryption,
        signature: null,
        authenticatedAttributes: authenticatedAttributes,
        unauthenticatedAttributes: []
      });
    },

    /**
     * Signs the content.
     * @param options Options to apply when signing:
     *    [detached] boolean. If signing should be done in detached mode. Defaults to false.
     */
    sign: function(options) {
      options = options || {};
      // auto-generate content info
      if(typeof msg.content !== 'object' || msg.contentInfo === null) {
        // use Data ContentInfo
        msg.contentInfo = asn1.create(
          asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // ContentType
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
              asn1.oidToDer(forge$3.pki.oids.data).getBytes())
          ]);

        // add actual content, if present
        if('content' in msg) {
          var content;
          if(msg.content instanceof forge$3.util.ByteBuffer) {
            content = msg.content.bytes();
          } else if(typeof msg.content === 'string') {
            content = forge$3.util.encodeUtf8(msg.content);
          }

          if (options.detached) {
            msg.detachedContent = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, content);
          } else {
            msg.contentInfo.value.push(
              // [0] EXPLICIT content
              asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
                asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false,
                  content)
              ]));
          }
        }
      }

      // no signers, return early (degenerate case for certificate container)
      if(msg.signers.length === 0) {
        return;
      }

      // generate digest algorithm identifiers
      var mds = addDigestAlgorithmIds();

      // generate signerInfos
      addSignerInfos(mds);
    },

    verify: function() {
      throw new Error('PKCS#7 signature verification not yet implemented.');
    },

    /**
     * Add a certificate.
     *
     * @param cert the certificate to add.
     */
    addCertificate: function(cert) {
      // convert from PEM
      if(typeof cert === 'string') {
        cert = forge$3.pki.certificateFromPem(cert);
      }
      msg.certificates.push(cert);
    },

    /**
     * Add a certificate revokation list.
     *
     * @param crl the certificate revokation list to add.
     */
    addCertificateRevokationList: function(crl) {
      throw new Error('PKCS#7 CRL support not yet implemented.');
    }
  };
  return msg;

  function addDigestAlgorithmIds() {
    var mds = {};

    for(var i = 0; i < msg.signers.length; ++i) {
      var signer = msg.signers[i];
      var oid = signer.digestAlgorithm;
      if(!(oid in mds)) {
        // content digest
        mds[oid] = forge$3.md[forge$3.pki.oids[oid]].create();
      }
      if(signer.authenticatedAttributes.length === 0) {
        // no custom attributes to digest; use content message digest
        signer.md = mds[oid];
      } else {
        // custom attributes to be digested; use own message digest
        // TODO: optimize to just copy message digest state if that
        // feature is ever supported with message digests
        signer.md = forge$3.md[forge$3.pki.oids[oid]].create();
      }
    }

    // add unique digest algorithm identifiers
    msg.digestAlgorithmIdentifiers = [];
    for(var oid in mds) {
      msg.digestAlgorithmIdentifiers.push(
        // AlgorithmIdentifier
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
            asn1.oidToDer(oid).getBytes()),
          // parameters (null)
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')
        ]));
    }

    return mds;
  }

  function addSignerInfos(mds) {
    var content;

    if (msg.detachedContent) {
      // Signature has been made in detached mode.
      content = msg.detachedContent;
    } else {
      // Note: ContentInfo is a SEQUENCE with 2 values, second value is
      // the content field and is optional for a ContentInfo but required here
      // since signers are present
      // get ContentInfo content
      content = msg.contentInfo.value[1];
      // skip [0] EXPLICIT content wrapper
      content = content.value[0];
    }

    if(!content) {
      throw new Error(
        'Could not sign PKCS#7 message; there is no content to sign.');
    }

    // get ContentInfo content type
    var contentType = asn1.derToOid(msg.contentInfo.value[0].value);

    // serialize content
    var bytes = asn1.toDer(content);

    // skip identifier and length per RFC 2315 9.3
    // skip identifier (1 byte)
    bytes.getByte();
    // read and discard length bytes
    asn1.getBerValueLength(bytes);
    bytes = bytes.getBytes();

    // digest content DER value bytes
    for(var oid in mds) {
      mds[oid].start().update(bytes);
    }

    // sign content
    var signingTime = new Date();
    for(var i = 0; i < msg.signers.length; ++i) {
      var signer = msg.signers[i];

      if(signer.authenticatedAttributes.length === 0) {
        // if ContentInfo content type is not "Data", then
        // authenticatedAttributes must be present per RFC 2315
        if(contentType !== forge$3.pki.oids.data) {
          throw new Error(
            'Invalid signer; authenticatedAttributes must be present ' +
            'when the ContentInfo content type is not PKCS#7 Data.');
        }
      } else {
        // process authenticated attributes
        // [0] IMPLICIT
        signer.authenticatedAttributesAsn1 = asn1.create(
          asn1.Class.CONTEXT_SPECIFIC, 0, true, []);

        // per RFC 2315, attributes are to be digested using a SET container
        // not the above [0] IMPLICIT container
        var attrsAsn1 = asn1.create(
          asn1.Class.UNIVERSAL, asn1.Type.SET, true, []);

        for(var ai = 0; ai < signer.authenticatedAttributes.length; ++ai) {
          var attr = signer.authenticatedAttributes[ai];
          if(attr.type === forge$3.pki.oids.messageDigest) {
            // use content message digest as value
            attr.value = mds[signer.digestAlgorithm].digest();
          } else if(attr.type === forge$3.pki.oids.signingTime) {
            // auto-populate signing time if not already set
            if(!attr.value) {
              attr.value = signingTime;
            }
          }

          // convert to ASN.1 and push onto Attributes SET (for signing) and
          // onto authenticatedAttributesAsn1 to complete SignedData ASN.1
          // TODO: optimize away duplication
          attrsAsn1.value.push(_attributeToAsn1(attr));
          signer.authenticatedAttributesAsn1.value.push(_attributeToAsn1(attr));
        }

        // DER-serialize and digest SET OF attributes only
        bytes = asn1.toDer(attrsAsn1).getBytes();
        signer.md.start().update(bytes);
      }

      // sign digest
      signer.signature = signer.key.sign(signer.md, 'RSASSA-PKCS1-V1_5');
    }

    // add signer info
    msg.signerInfos = _signersToAsn1(msg.signers);
  }
};

/**
 * Creates an empty PKCS#7 message of type EncryptedData.
 *
 * @return the message.
 */
p7.createEncryptedData = function() {
  var msg = null;
  msg = {
    type: forge$3.pki.oids.encryptedData,
    version: 0,
    encryptedContent: {
      algorithm: forge$3.pki.oids['aes256-CBC']
    },

    /**
     * Reads an EncryptedData content block (in ASN.1 format)
     *
     * @param obj The ASN.1 representation of the EncryptedData content block
     */
    fromAsn1: function(obj) {
      // Validate EncryptedData content block and capture data.
      _fromAsn1(msg, obj, p7.asn1.encryptedDataValidator);
    },

    /**
     * Decrypt encrypted content
     *
     * @param key The (symmetric) key as a byte buffer
     */
    decrypt: function(key) {
      if(key !== undefined) {
        msg.encryptedContent.key = key;
      }
      _decryptContent(msg);
    }
  };
  return msg;
};

/**
 * Creates an empty PKCS#7 message of type EnvelopedData.
 *
 * @return the message.
 */
p7.createEnvelopedData = function() {
  var msg = null;
  msg = {
    type: forge$3.pki.oids.envelopedData,
    version: 0,
    recipients: [],
    encryptedContent: {
      algorithm: forge$3.pki.oids['aes256-CBC']
    },

    /**
     * Reads an EnvelopedData content block (in ASN.1 format)
     *
     * @param obj the ASN.1 representation of the EnvelopedData content block.
     */
    fromAsn1: function(obj) {
      // validate EnvelopedData content block and capture data
      var capture = _fromAsn1(msg, obj, p7.asn1.envelopedDataValidator);
      msg.recipients = _recipientsFromAsn1(capture.recipientInfos.value);
    },

    toAsn1: function() {
      // ContentInfo
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // ContentType
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
          asn1.oidToDer(msg.type).getBytes()),
        // [0] EnvelopedData
        asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // Version
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
              asn1.integerToDer(msg.version).getBytes()),
            // RecipientInfos
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true,
              _recipientsToAsn1(msg.recipients)),
            // EncryptedContentInfo
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true,
              _encryptedContentToAsn1(msg.encryptedContent))
          ])
        ])
      ]);
    },

    /**
     * Find recipient by X.509 certificate's issuer.
     *
     * @param cert the certificate with the issuer to look for.
     *
     * @return the recipient object.
     */
    findRecipient: function(cert) {
      var sAttr = cert.issuer.attributes;

      for(var i = 0; i < msg.recipients.length; ++i) {
        var r = msg.recipients[i];
        var rAttr = r.issuer;

        if(r.serialNumber !== cert.serialNumber) {
          continue;
        }

        if(rAttr.length !== sAttr.length) {
          continue;
        }

        var match = true;
        for(var j = 0; j < sAttr.length; ++j) {
          if(rAttr[j].type !== sAttr[j].type ||
            rAttr[j].value !== sAttr[j].value) {
            match = false;
            break;
          }
        }

        if(match) {
          return r;
        }
      }

      return null;
    },

    /**
     * Decrypt enveloped content
     *
     * @param recipient The recipient object related to the private key
     * @param privKey The (RSA) private key object
     */
    decrypt: function(recipient, privKey) {
      if(msg.encryptedContent.key === undefined && recipient !== undefined &&
        privKey !== undefined) {
        switch(recipient.encryptedContent.algorithm) {
          case forge$3.pki.oids.rsaEncryption:
          case forge$3.pki.oids.desCBC:
            var key = privKey.decrypt(recipient.encryptedContent.content);
            msg.encryptedContent.key = forge$3.util.createBuffer(key);
            break;

          default:
            throw new Error('Unsupported asymmetric cipher, ' +
              'OID ' + recipient.encryptedContent.algorithm);
        }
      }

      _decryptContent(msg);
    },

    /**
     * Add (another) entity to list of recipients.
     *
     * @param cert The certificate of the entity to add.
     */
    addRecipient: function(cert) {
      msg.recipients.push({
        version: 0,
        issuer: cert.issuer.attributes,
        serialNumber: cert.serialNumber,
        encryptedContent: {
          // We simply assume rsaEncryption here, since forge.pki only
          // supports RSA so far.  If the PKI module supports other
          // ciphers one day, we need to modify this one as well.
          algorithm: forge$3.pki.oids.rsaEncryption,
          key: cert.publicKey
        }
      });
    },

    /**
     * Encrypt enveloped content.
     *
     * This function supports two optional arguments, cipher and key, which
     * can be used to influence symmetric encryption.  Unless cipher is
     * provided, the cipher specified in encryptedContent.algorithm is used
     * (defaults to AES-256-CBC).  If no key is provided, encryptedContent.key
     * is (re-)used.  If that one's not set, a random key will be generated
     * automatically.
     *
     * @param [key] The key to be used for symmetric encryption.
     * @param [cipher] The OID of the symmetric cipher to use.
     */
    encrypt: function(key, cipher) {
      // Part 1: Symmetric encryption
      if(msg.encryptedContent.content === undefined) {
        cipher = cipher || msg.encryptedContent.algorithm;
        key = key || msg.encryptedContent.key;

        var keyLen, ivLen, ciphFn;
        switch(cipher) {
          case forge$3.pki.oids['aes128-CBC']:
            keyLen = 16;
            ivLen = 16;
            ciphFn = forge$3.aes.createEncryptionCipher;
            break;

          case forge$3.pki.oids['aes192-CBC']:
            keyLen = 24;
            ivLen = 16;
            ciphFn = forge$3.aes.createEncryptionCipher;
            break;

          case forge$3.pki.oids['aes256-CBC']:
            keyLen = 32;
            ivLen = 16;
            ciphFn = forge$3.aes.createEncryptionCipher;
            break;

          case forge$3.pki.oids['des-EDE3-CBC']:
            keyLen = 24;
            ivLen = 8;
            ciphFn = forge$3.des.createEncryptionCipher;
            break;

          default:
            throw new Error('Unsupported symmetric cipher, OID ' + cipher);
        }

        if(key === undefined) {
          key = forge$3.util.createBuffer(forge$3.random.getBytes(keyLen));
        } else if(key.length() != keyLen) {
          throw new Error('Symmetric key has wrong length; ' +
            'got ' + key.length() + ' bytes, expected ' + keyLen + '.');
        }

        // Keep a copy of the key & IV in the object, so the caller can
        // use it for whatever reason.
        msg.encryptedContent.algorithm = cipher;
        msg.encryptedContent.key = key;
        msg.encryptedContent.parameter = forge$3.util.createBuffer(
          forge$3.random.getBytes(ivLen));

        var ciph = ciphFn(key);
        ciph.start(msg.encryptedContent.parameter.copy());
        ciph.update(msg.content);

        // The finish function does PKCS#7 padding by default, therefore
        // no action required by us.
        if(!ciph.finish()) {
          throw new Error('Symmetric encryption failed.');
        }

        msg.encryptedContent.content = ciph.output;
      }

      // Part 2: asymmetric encryption for each recipient
      for(var i = 0; i < msg.recipients.length; ++i) {
        var recipient = msg.recipients[i];

        // Nothing to do, encryption already done.
        if(recipient.encryptedContent.content !== undefined) {
          continue;
        }

        switch(recipient.encryptedContent.algorithm) {
          case forge$3.pki.oids.rsaEncryption:
            recipient.encryptedContent.content =
              recipient.encryptedContent.key.encrypt(
                msg.encryptedContent.key.data);
            break;

          default:
            throw new Error('Unsupported asymmetric cipher, OID ' +
              recipient.encryptedContent.algorithm);
        }
      }
    }
  };
  return msg;
};

/**
 * Converts a single recipient from an ASN.1 object.
 *
 * @param obj the ASN.1 RecipientInfo.
 *
 * @return the recipient object.
 */
function _recipientFromAsn1(obj) {
  // validate EnvelopedData content block and capture data
  var capture = {};
  var errors = [];
  if(!asn1.validate(obj, p7.asn1.recipientInfoValidator, capture, errors)) {
    var error = new Error('Cannot read PKCS#7 RecipientInfo. ' +
      'ASN.1 object is not an PKCS#7 RecipientInfo.');
    error.errors = errors;
    throw error;
  }

  return {
    version: capture.version.charCodeAt(0),
    issuer: forge$3.pki.RDNAttributesAsArray(capture.issuer),
    serialNumber: forge$3.util.createBuffer(capture.serial).toHex(),
    encryptedContent: {
      algorithm: asn1.derToOid(capture.encAlgorithm),
      parameter: capture.encParameter.value,
      content: capture.encKey
    }
  };
}

/**
 * Converts a single recipient object to an ASN.1 object.
 *
 * @param obj the recipient object.
 *
 * @return the ASN.1 RecipientInfo.
 */
function _recipientToAsn1(obj) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // Version
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      asn1.integerToDer(obj.version).getBytes()),
    // IssuerAndSerialNumber
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      // Name
      forge$3.pki.distinguishedNameToAsn1({attributes: obj.issuer}),
      // Serial
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
        forge$3.util.hexToBytes(obj.serialNumber))
    ]),
    // KeyEncryptionAlgorithmIdentifier
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      // Algorithm
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
        asn1.oidToDer(obj.encryptedContent.algorithm).getBytes()),
      // Parameter, force NULL, only RSA supported for now.
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')
    ]),
    // EncryptedKey
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false,
      obj.encryptedContent.content)
  ]);
}

/**
 * Map a set of RecipientInfo ASN.1 objects to recipient objects.
 *
 * @param infos an array of ASN.1 representations RecipientInfo (i.e. SET OF).
 *
 * @return an array of recipient objects.
 */
function _recipientsFromAsn1(infos) {
  var ret = [];
  for(var i = 0; i < infos.length; ++i) {
    ret.push(_recipientFromAsn1(infos[i]));
  }
  return ret;
}

/**
 * Map an array of recipient objects to ASN.1 RecipientInfo objects.
 *
 * @param recipients an array of recipientInfo objects.
 *
 * @return an array of ASN.1 RecipientInfos.
 */
function _recipientsToAsn1(recipients) {
  var ret = [];
  for(var i = 0; i < recipients.length; ++i) {
    ret.push(_recipientToAsn1(recipients[i]));
  }
  return ret;
}

/**
 * Converts a single signerInfo object to an ASN.1 object.
 *
 * @param obj the signerInfo object.
 *
 * @return the ASN.1 representation of a SignerInfo.
 */
function _signerToAsn1(obj) {
  // SignerInfo
  var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // version
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      asn1.integerToDer(obj.version).getBytes()),
    // issuerAndSerialNumber
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      // name
      forge$3.pki.distinguishedNameToAsn1({attributes: obj.issuer}),
      // serial
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
        forge$3.util.hexToBytes(obj.serialNumber))
    ]),
    // digestAlgorithm
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      // algorithm
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
        asn1.oidToDer(obj.digestAlgorithm).getBytes()),
      // parameters (null)
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')
    ])
  ]);

  // authenticatedAttributes (OPTIONAL)
  if(obj.authenticatedAttributesAsn1) {
    // add ASN.1 previously generated during signing
    rval.value.push(obj.authenticatedAttributesAsn1);
  }

  // digestEncryptionAlgorithm
  rval.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // algorithm
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
      asn1.oidToDer(obj.signatureAlgorithm).getBytes()),
    // parameters (null)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')
  ]));

  // encryptedDigest
  rval.value.push(asn1.create(
    asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, obj.signature));

  // unauthenticatedAttributes (OPTIONAL)
  if(obj.unauthenticatedAttributes.length > 0) {
    // [1] IMPLICIT
    var attrsAsn1 = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, []);
    for(var i = 0; i < obj.unauthenticatedAttributes.length; ++i) {
      var attr = obj.unauthenticatedAttributes[i];
      attrsAsn1.values.push(_attributeToAsn1(attr));
    }
    rval.value.push(attrsAsn1);
  }

  return rval;
}

/**
 * Map an array of signer objects to ASN.1 objects.
 *
 * @param signers an array of signer objects.
 *
 * @return an array of ASN.1 SignerInfos.
 */
function _signersToAsn1(signers) {
  var ret = [];
  for(var i = 0; i < signers.length; ++i) {
    ret.push(_signerToAsn1(signers[i]));
  }
  return ret;
}

/**
 * Convert an attribute object to an ASN.1 Attribute.
 *
 * @param attr the attribute object.
 *
 * @return the ASN.1 Attribute.
 */
function _attributeToAsn1(attr) {
  var value;

  // TODO: generalize to support more attributes
  if(attr.type === forge$3.pki.oids.contentType) {
    value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
      asn1.oidToDer(attr.value).getBytes());
  } else if(attr.type === forge$3.pki.oids.messageDigest) {
    value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false,
      attr.value.bytes());
  } else if(attr.type === forge$3.pki.oids.signingTime) {
    /* Note per RFC 2985: Dates between 1 January 1950 and 31 December 2049
      (inclusive) MUST be encoded as UTCTime. Any dates with year values
      before 1950 or after 2049 MUST be encoded as GeneralizedTime. [Further,]
      UTCTime values MUST be expressed in Greenwich Mean Time (Zulu) and MUST
      include seconds (i.e., times are YYMMDDHHMMSSZ), even where the
      number of seconds is zero.  Midnight (GMT) must be represented as
      "YYMMDD000000Z". */
    // TODO: make these module-level constants
    var jan_1_1950 = new Date('1950-01-01T00:00:00Z');
    var jan_1_2050 = new Date('2050-01-01T00:00:00Z');
    var date = attr.value;
    if(typeof date === 'string') {
      // try to parse date
      var timestamp = Date.parse(date);
      if(!isNaN(timestamp)) {
        date = new Date(timestamp);
      } else if(date.length === 13) {
        // YYMMDDHHMMSSZ (13 chars for UTCTime)
        date = asn1.utcTimeToDate(date);
      } else {
        // assume generalized time
        date = asn1.generalizedTimeToDate(date);
      }
    }

    if(date >= jan_1_1950 && date < jan_1_2050) {
      value = asn1.create(
        asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false,
        asn1.dateToUtcTime(date));
    } else {
      value = asn1.create(
        asn1.Class.UNIVERSAL, asn1.Type.GENERALIZEDTIME, false,
        asn1.dateToGeneralizedTime(date));
    }
  }

  // TODO: expose as common API call
  // create a RelativeDistinguishedName set
  // each value in the set is an AttributeTypeAndValue first
  // containing the type (an OID) and second the value
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // AttributeType
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
      asn1.oidToDer(attr.type).getBytes()),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
      // AttributeValue
      value
    ])
  ]);
}

/**
 * Map messages encrypted content to ASN.1 objects.
 *
 * @param ec The encryptedContent object of the message.
 *
 * @return ASN.1 representation of the encryptedContent object (SEQUENCE).
 */
function _encryptedContentToAsn1(ec) {
  return [
    // ContentType, always Data for the moment
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
      asn1.oidToDer(forge$3.pki.oids.data).getBytes()),
    // ContentEncryptionAlgorithmIdentifier
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      // Algorithm
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
        asn1.oidToDer(ec.algorithm).getBytes()),
      // Parameters (IV)
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false,
        ec.parameter.getBytes())
    ]),
    // [0] EncryptedContent
    asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false,
        ec.content.getBytes())
    ])
  ];
}

/**
 * Reads the "common part" of an PKCS#7 content block (in ASN.1 format)
 *
 * This function reads the "common part" of the PKCS#7 content blocks
 * EncryptedData and EnvelopedData, i.e. version number and symmetrically
 * encrypted content block.
 *
 * The result of the ASN.1 validate and capture process is returned
 * to allow the caller to extract further data, e.g. the list of recipients
 * in case of a EnvelopedData object.
 *
 * @param msg the PKCS#7 object to read the data to.
 * @param obj the ASN.1 representation of the content block.
 * @param validator the ASN.1 structure validator object to use.
 *
 * @return the value map captured by validator object.
 */
function _fromAsn1(msg, obj, validator) {
  var capture = {};
  var errors = [];
  if(!asn1.validate(obj, validator, capture, errors)) {
    var error = new Error('Cannot read PKCS#7 message. ' +
      'ASN.1 object is not a supported PKCS#7 message.');
    error.errors = error;
    throw error;
  }

  // Check contentType, so far we only support (raw) Data.
  var contentType = asn1.derToOid(capture.contentType);
  if(contentType !== forge$3.pki.oids.data) {
    throw new Error('Unsupported PKCS#7 message. ' +
      'Only wrapped ContentType Data supported.');
  }

  if(capture.encryptedContent) {
    var content = '';
    if(forge$3.util.isArray(capture.encryptedContent)) {
      for(var i = 0; i < capture.encryptedContent.length; ++i) {
        if(capture.encryptedContent[i].type !== asn1.Type.OCTETSTRING) {
          throw new Error('Malformed PKCS#7 message, expecting encrypted ' +
            'content constructed of only OCTET STRING objects.');
        }
        content += capture.encryptedContent[i].value;
      }
    } else {
      content = capture.encryptedContent;
    }
    msg.encryptedContent = {
      algorithm: asn1.derToOid(capture.encAlgorithm),
      parameter: forge$3.util.createBuffer(capture.encParameter.value),
      content: forge$3.util.createBuffer(content)
    };
  }

  if(capture.content) {
    var content = '';
    if(forge$3.util.isArray(capture.content)) {
      for(var i = 0; i < capture.content.length; ++i) {
        if(capture.content[i].type !== asn1.Type.OCTETSTRING) {
          throw new Error('Malformed PKCS#7 message, expecting ' +
            'content constructed of only OCTET STRING objects.');
        }
        content += capture.content[i].value;
      }
    } else {
      content = capture.content;
    }
    msg.content = forge$3.util.createBuffer(content);
  }

  msg.version = capture.version.charCodeAt(0);
  msg.rawCapture = capture;

  return capture;
}

/**
 * Decrypt the symmetrically encrypted content block of the PKCS#7 message.
 *
 * Decryption is skipped in case the PKCS#7 message object already has a
 * (decrypted) content attribute.  The algorithm, key and cipher parameters
 * (probably the iv) are taken from the encryptedContent attribute of the
 * message object.
 *
 * @param The PKCS#7 message object.
 */
function _decryptContent(msg) {
  if(msg.encryptedContent.key === undefined) {
    throw new Error('Symmetric key not available.');
  }

  if(msg.content === undefined) {
    var ciph;

    switch(msg.encryptedContent.algorithm) {
      case forge$3.pki.oids['aes128-CBC']:
      case forge$3.pki.oids['aes192-CBC']:
      case forge$3.pki.oids['aes256-CBC']:
        ciph = forge$3.aes.createDecryptionCipher(msg.encryptedContent.key);
        break;

      case forge$3.pki.oids['desCBC']:
      case forge$3.pki.oids['des-EDE3-CBC']:
        ciph = forge$3.des.createDecryptionCipher(msg.encryptedContent.key);
        break;

      default:
        throw new Error('Unsupported symmetric cipher, OID ' +
          msg.encryptedContent.algorithm);
    }
    ciph.start(msg.encryptedContent.parameter);
    ciph.update(msg.encryptedContent.content);

    if(!ciph.finish()) {
      throw new Error('Symmetric decryption failed.');
    }

    msg.content = ciph.output;
  }
}

/**
 * Functions to output keys in SSH-friendly formats.
 *
 * This is part of the Forge project which may be used under the terms of
 * either the BSD License or the GNU General Public License (GPL) Version 2.
 *
 * See: https://github.com/digitalbazaar/forge/blob/cbebca3780658703d925b61b2caffb1d263a6c1d/LICENSE
 *
 * @author https://github.com/shellac
 */

var forge$2 = forge$F;






var ssh = forge$2.ssh = forge$2.ssh || {};

/**
 * Encodes (and optionally encrypts) a private RSA key as a Putty PPK file.
 *
 * @param privateKey the key.
 * @param passphrase a passphrase to protect the key (falsy for no encryption).
 * @param comment a comment to include in the key file.
 *
 * @return the PPK file as a string.
 */
ssh.privateKeyToPutty = function(privateKey, passphrase, comment) {
  comment = comment || '';
  passphrase = passphrase || '';
  var algorithm = 'ssh-rsa';
  var encryptionAlgorithm = (passphrase === '') ? 'none' : 'aes256-cbc';

  var ppk = 'PuTTY-User-Key-File-2: ' + algorithm + '\r\n';
  ppk += 'Encryption: ' + encryptionAlgorithm + '\r\n';
  ppk += 'Comment: ' + comment + '\r\n';

  // public key into buffer for ppk
  var pubbuffer = forge$2.util.createBuffer();
  _addStringToBuffer(pubbuffer, algorithm);
  _addBigIntegerToBuffer(pubbuffer, privateKey.e);
  _addBigIntegerToBuffer(pubbuffer, privateKey.n);

  // write public key
  var pub = forge$2.util.encode64(pubbuffer.bytes(), 64);
  var length = Math.floor(pub.length / 66) + 1; // 66 = 64 + \r\n
  ppk += 'Public-Lines: ' + length + '\r\n';
  ppk += pub;

  // private key into a buffer
  var privbuffer = forge$2.util.createBuffer();
  _addBigIntegerToBuffer(privbuffer, privateKey.d);
  _addBigIntegerToBuffer(privbuffer, privateKey.p);
  _addBigIntegerToBuffer(privbuffer, privateKey.q);
  _addBigIntegerToBuffer(privbuffer, privateKey.qInv);

  // optionally encrypt the private key
  var priv;
  if(!passphrase) {
    // use the unencrypted buffer
    priv = forge$2.util.encode64(privbuffer.bytes(), 64);
  } else {
    // encrypt RSA key using passphrase
    var encLen = privbuffer.length() + 16 - 1;
    encLen -= encLen % 16;

    // pad private key with sha1-d data -- needs to be a multiple of 16
    var padding = _sha1(privbuffer.bytes());

    padding.truncate(padding.length() - encLen + privbuffer.length());
    privbuffer.putBuffer(padding);

    var aeskey = forge$2.util.createBuffer();
    aeskey.putBuffer(_sha1('\x00\x00\x00\x00', passphrase));
    aeskey.putBuffer(_sha1('\x00\x00\x00\x01', passphrase));

    // encrypt some bytes using CBC mode
    // key is 40 bytes, so truncate *by* 8 bytes
    var cipher = forge$2.aes.createEncryptionCipher(aeskey.truncate(8), 'CBC');
    cipher.start(forge$2.util.createBuffer().fillWithByte(0, 16));
    cipher.update(privbuffer.copy());
    cipher.finish();
    var encrypted = cipher.output;

    // Note: this appears to differ from Putty -- is forge wrong, or putty?
    // due to padding we finish as an exact multiple of 16
    encrypted.truncate(16); // all padding

    priv = forge$2.util.encode64(encrypted.bytes(), 64);
  }

  // output private key
  length = Math.floor(priv.length / 66) + 1; // 64 + \r\n
  ppk += '\r\nPrivate-Lines: ' + length + '\r\n';
  ppk += priv;

  // MAC
  var mackey = _sha1('putty-private-key-file-mac-key', passphrase);

  var macbuffer = forge$2.util.createBuffer();
  _addStringToBuffer(macbuffer, algorithm);
  _addStringToBuffer(macbuffer, encryptionAlgorithm);
  _addStringToBuffer(macbuffer, comment);
  macbuffer.putInt32(pubbuffer.length());
  macbuffer.putBuffer(pubbuffer);
  macbuffer.putInt32(privbuffer.length());
  macbuffer.putBuffer(privbuffer);

  var hmac = forge$2.hmac.create();
  hmac.start('sha1', mackey);
  hmac.update(macbuffer.bytes());

  ppk += '\r\nPrivate-MAC: ' + hmac.digest().toHex() + '\r\n';

  return ppk;
};

/**
 * Encodes a public RSA key as an OpenSSH file.
 *
 * @param key the key.
 * @param comment a comment.
 *
 * @return the public key in OpenSSH format.
 */
ssh.publicKeyToOpenSSH = function(key, comment) {
  var type = 'ssh-rsa';
  comment = comment || '';

  var buffer = forge$2.util.createBuffer();
  _addStringToBuffer(buffer, type);
  _addBigIntegerToBuffer(buffer, key.e);
  _addBigIntegerToBuffer(buffer, key.n);

  return type + ' ' + forge$2.util.encode64(buffer.bytes()) + ' ' + comment;
};

/**
 * Encodes a private RSA key as an OpenSSH file.
 *
 * @param key the key.
 * @param passphrase a passphrase to protect the key (falsy for no encryption).
 *
 * @return the public key in OpenSSH format.
 */
ssh.privateKeyToOpenSSH = function(privateKey, passphrase) {
  if(!passphrase) {
    return forge$2.pki.privateKeyToPem(privateKey);
  }
  // OpenSSH private key is just a legacy format, it seems
  return forge$2.pki.encryptRsaPrivateKey(privateKey, passphrase,
    {legacy: true, algorithm: 'aes128'});
};

/**
 * Gets the SSH fingerprint for the given public key.
 *
 * @param options the options to use.
 *          [md] the message digest object to use (defaults to forge.md.md5).
 *          [encoding] an alternative output encoding, such as 'hex'
 *            (defaults to none, outputs a byte buffer).
 *          [delimiter] the delimiter to use between bytes for 'hex' encoded
 *            output, eg: ':' (defaults to none).
 *
 * @return the fingerprint as a byte buffer or other encoding based on options.
 */
ssh.getPublicKeyFingerprint = function(key, options) {
  options = options || {};
  var md = options.md || forge$2.md.md5.create();

  var type = 'ssh-rsa';
  var buffer = forge$2.util.createBuffer();
  _addStringToBuffer(buffer, type);
  _addBigIntegerToBuffer(buffer, key.e);
  _addBigIntegerToBuffer(buffer, key.n);

  // hash public key bytes
  md.start();
  md.update(buffer.getBytes());
  var digest = md.digest();
  if(options.encoding === 'hex') {
    var hex = digest.toHex();
    if(options.delimiter) {
      return hex.match(/.{2}/g).join(options.delimiter);
    }
    return hex;
  } else if(options.encoding === 'binary') {
    return digest.getBytes();
  } else if(options.encoding) {
    throw new Error('Unknown encoding "' + options.encoding + '".');
  }
  return digest;
};

/**
 * Adds len(val) then val to a buffer.
 *
 * @param buffer the buffer to add to.
 * @param val a big integer.
 */
function _addBigIntegerToBuffer(buffer, val) {
  var hexVal = val.toString(16);
  // ensure 2s complement +ve
  if(hexVal[0] >= '8') {
    hexVal = '00' + hexVal;
  }
  var bytes = forge$2.util.hexToBytes(hexVal);
  buffer.putInt32(bytes.length);
  buffer.putBytes(bytes);
}

/**
 * Adds len(val) then val to a buffer.
 *
 * @param buffer the buffer to add to.
 * @param val a string.
 */
function _addStringToBuffer(buffer, val) {
  buffer.putInt32(val.length);
  buffer.putString(val);
}

/**
 * Hashes the arguments into one value using SHA-1.
 *
 * @return the sha1 hash of the provided arguments.
 */
function _sha1() {
  var sha = forge$2.md.sha1.create();
  var num = arguments.length;
  for (var i = 0; i < num; ++i) {
    sha.update(arguments[i]);
  }
  return sha.digest();
}

/**
 * Support for concurrent task management and synchronization in web
 * applications.
 *
 * @author Dave Longley
 * @author David I. Lehn <dlehn@digitalbazaar.com>
 *
 * Copyright (c) 2009-2013 Digital Bazaar, Inc.
 */

var forge$1 = forge$F;




// logging category
var cat = 'forge.task';

// track tasks for debugging
var sTasks = {};
var sNextTaskId = 0;
// debug access
forge$1.debug.set(cat, 'tasks', sTasks);

// a map of task type to task queue
var sTaskQueues = {};
// debug access
forge$1.debug.set(cat, 'queues', sTaskQueues);

// name for unnamed tasks
var sNoTaskName = '?';

// maximum number of doNext() recursions before a context swap occurs
// FIXME: might need to tweak this based on the browser
var sMaxRecursions = 30;

// time slice for doing tasks before a context swap occurs
// FIXME: might need to tweak this based on the browser
var sTimeSlice = 20;

/**
 * Task states.
 *
 * READY: ready to start processing
 * RUNNING: task or a subtask is running
 * BLOCKED: task is waiting to acquire N permits to continue
 * SLEEPING: task is sleeping for a period of time
 * DONE: task is done
 * ERROR: task has an error
 */
var READY = 'ready';
var RUNNING = 'running';
var BLOCKED = 'blocked';
var SLEEPING = 'sleeping';
var DONE = 'done';
var ERROR = 'error';

/**
 * Task actions.  Used to control state transitions.
 *
 * STOP: stop processing
 * START: start processing tasks
 * BLOCK: block task from continuing until 1 or more permits are released
 * UNBLOCK: release one or more permits
 * SLEEP: sleep for a period of time
 * WAKEUP: wakeup early from SLEEPING state
 * CANCEL: cancel further tasks
 * FAIL: a failure occured
 */
var STOP = 'stop';
var START = 'start';
var BLOCK = 'block';
var UNBLOCK = 'unblock';
var SLEEP = 'sleep';
var WAKEUP = 'wakeup';
var CANCEL = 'cancel';
var FAIL = 'fail';

/**
 * State transition table.
 *
 * nextState = sStateTable[currentState][action]
 */
var sStateTable = {};

sStateTable[READY] = {};
sStateTable[READY][STOP] = READY;
sStateTable[READY][START] = RUNNING;
sStateTable[READY][CANCEL] = DONE;
sStateTable[READY][FAIL] = ERROR;

sStateTable[RUNNING] = {};
sStateTable[RUNNING][STOP] = READY;
sStateTable[RUNNING][START] = RUNNING;
sStateTable[RUNNING][BLOCK] = BLOCKED;
sStateTable[RUNNING][UNBLOCK] = RUNNING;
sStateTable[RUNNING][SLEEP] = SLEEPING;
sStateTable[RUNNING][WAKEUP] = RUNNING;
sStateTable[RUNNING][CANCEL] = DONE;
sStateTable[RUNNING][FAIL] = ERROR;

sStateTable[BLOCKED] = {};
sStateTable[BLOCKED][STOP] = BLOCKED;
sStateTable[BLOCKED][START] = BLOCKED;
sStateTable[BLOCKED][BLOCK] = BLOCKED;
sStateTable[BLOCKED][UNBLOCK] = BLOCKED;
sStateTable[BLOCKED][SLEEP] = BLOCKED;
sStateTable[BLOCKED][WAKEUP] = BLOCKED;
sStateTable[BLOCKED][CANCEL] = DONE;
sStateTable[BLOCKED][FAIL] = ERROR;

sStateTable[SLEEPING] = {};
sStateTable[SLEEPING][STOP] = SLEEPING;
sStateTable[SLEEPING][START] = SLEEPING;
sStateTable[SLEEPING][BLOCK] = SLEEPING;
sStateTable[SLEEPING][UNBLOCK] = SLEEPING;
sStateTable[SLEEPING][SLEEP] = SLEEPING;
sStateTable[SLEEPING][WAKEUP] = SLEEPING;
sStateTable[SLEEPING][CANCEL] = DONE;
sStateTable[SLEEPING][FAIL] = ERROR;

sStateTable[DONE] = {};
sStateTable[DONE][STOP] = DONE;
sStateTable[DONE][START] = DONE;
sStateTable[DONE][BLOCK] = DONE;
sStateTable[DONE][UNBLOCK] = DONE;
sStateTable[DONE][SLEEP] = DONE;
sStateTable[DONE][WAKEUP] = DONE;
sStateTable[DONE][CANCEL] = DONE;
sStateTable[DONE][FAIL] = ERROR;

sStateTable[ERROR] = {};
sStateTable[ERROR][STOP] = ERROR;
sStateTable[ERROR][START] = ERROR;
sStateTable[ERROR][BLOCK] = ERROR;
sStateTable[ERROR][UNBLOCK] = ERROR;
sStateTable[ERROR][SLEEP] = ERROR;
sStateTable[ERROR][WAKEUP] = ERROR;
sStateTable[ERROR][CANCEL] = ERROR;
sStateTable[ERROR][FAIL] = ERROR;

/**
 * Creates a new task.
 *
 * @param options options for this task
 *   run: the run function for the task (required)
 *   name: the run function for the task (optional)
 *   parent: parent of this task (optional)
 *
 * @return the empty task.
 */
var Task = function(options) {
  // task id
  this.id = -1;

  // task name
  this.name = options.name || sNoTaskName;

  // task has no parent
  this.parent = options.parent || null;

  // save run function
  this.run = options.run;

  // create a queue of subtasks to run
  this.subtasks = [];

  // error flag
  this.error = false;

  // state of the task
  this.state = READY;

  // number of times the task has been blocked (also the number
  // of permits needed to be released to continue running)
  this.blocks = 0;

  // timeout id when sleeping
  this.timeoutId = null;

  // no swap time yet
  this.swapTime = null;

  // no user data
  this.userData = null;

  // initialize task
  // FIXME: deal with overflow
  this.id = sNextTaskId++;
  sTasks[this.id] = this;
};

/**
 * Logs debug information on this task and the system state.
 */
Task.prototype.debug = function(msg) {
  msg = msg || '';
  forge$1.log.debug(cat, msg,
    '[%s][%s] task:', this.id, this.name, this,
    'subtasks:', this.subtasks.length,
    'queue:', sTaskQueues);
};

/**
 * Adds a subtask to run after task.doNext() or task.fail() is called.
 *
 * @param name human readable name for this task (optional).
 * @param subrun a function to run that takes the current task as
 *          its first parameter.
 *
 * @return the current task (useful for chaining next() calls).
 */
Task.prototype.next = function(name, subrun) {
  // juggle parameters if it looks like no name is given
  if(typeof(name) === 'function') {
    subrun = name;

    // inherit parent's name
    name = this.name;
  }
  // create subtask, set parent to this task, propagate callbacks
  var subtask = new Task({
    run: subrun,
    name: name,
    parent: this
  });
  // start subtasks running
  subtask.state = RUNNING;
  subtask.type = this.type;
  subtask.successCallback = this.successCallback || null;
  subtask.failureCallback = this.failureCallback || null;

  // queue a new subtask
  this.subtasks.push(subtask);

  return this;
};

/**
 * Adds subtasks to run in parallel after task.doNext() or task.fail()
 * is called.
 *
 * @param name human readable name for this task (optional).
 * @param subrun functions to run that take the current task as
 *          their first parameter.
 *
 * @return the current task (useful for chaining next() calls).
 */
Task.prototype.parallel = function(name, subrun) {
  // juggle parameters if it looks like no name is given
  if(forge$1.util.isArray(name)) {
    subrun = name;

    // inherit parent's name
    name = this.name;
  }
  // Wrap parallel tasks in a regular task so they are started at the
  // proper time.
  return this.next(name, function(task) {
    // block waiting for subtasks
    var ptask = task;
    ptask.block(subrun.length);

    // we pass the iterator from the loop below as a parameter
    // to a function because it is otherwise included in the
    // closure and changes as the loop changes -- causing i
    // to always be set to its highest value
    var startParallelTask = function(pname, pi) {
      forge$1.task.start({
        type: pname,
        run: function(task) {
           subrun[pi](task);
        },
        success: function(task) {
           ptask.unblock();
        },
        failure: function(task) {
           ptask.unblock();
        }
      });
    };

    for(var i = 0; i < subrun.length; i++) {
      // Type must be unique so task starts in parallel:
      //    name + private string + task id + sub-task index
      // start tasks in parallel and unblock when the finish
      var pname = name + '__parallel-' + task.id + '-' + i;
      var pi = i;
      startParallelTask(pname, pi);
    }
  });
};

/**
 * Stops a running task.
 */
Task.prototype.stop = function() {
  this.state = sStateTable[this.state][STOP];
};

/**
 * Starts running a task.
 */
Task.prototype.start = function() {
  this.error = false;
  this.state = sStateTable[this.state][START];

  // try to restart
  if(this.state === RUNNING) {
    this.start = new Date();
    this.run(this);
    runNext(this, 0);
  }
};

/**
 * Blocks a task until it one or more permits have been released. The
 * task will not resume until the requested number of permits have
 * been released with call(s) to unblock().
 *
 * @param n number of permits to wait for(default: 1).
 */
Task.prototype.block = function(n) {
  n = typeof(n) === 'undefined' ? 1 : n;
  this.blocks += n;
  if(this.blocks > 0) {
    this.state = sStateTable[this.state][BLOCK];
  }
};

/**
 * Releases a permit to unblock a task. If a task was blocked by
 * requesting N permits via block(), then it will only continue
 * running once enough permits have been released via unblock() calls.
 *
 * If multiple processes need to synchronize with a single task then
 * use a condition variable (see forge.task.createCondition). It is
 * an error to unblock a task more times than it has been blocked.
 *
 * @param n number of permits to release (default: 1).
 *
 * @return the current block count (task is unblocked when count is 0)
 */
Task.prototype.unblock = function(n) {
  n = typeof(n) === 'undefined' ? 1 : n;
  this.blocks -= n;
  if(this.blocks === 0 && this.state !== DONE) {
    this.state = RUNNING;
    runNext(this, 0);
  }
  return this.blocks;
};

/**
 * Sleep for a period of time before resuming tasks.
 *
 * @param n number of milliseconds to sleep (default: 0).
 */
Task.prototype.sleep = function(n) {
  n = typeof(n) === 'undefined' ? 0 : n;
  this.state = sStateTable[this.state][SLEEP];
  var self = this;
  this.timeoutId = setTimeout(function() {
    self.timeoutId = null;
    self.state = RUNNING;
    runNext(self, 0);
  }, n);
};

/**
 * Waits on a condition variable until notified. The next task will
 * not be scheduled until notification. A condition variable can be
 * created with forge.task.createCondition().
 *
 * Once cond.notify() is called, the task will continue.
 *
 * @param cond the condition variable to wait on.
 */
Task.prototype.wait = function(cond) {
  cond.wait(this);
};

/**
 * If sleeping, wakeup and continue running tasks.
 */
Task.prototype.wakeup = function() {
  if(this.state === SLEEPING) {
    cancelTimeout(this.timeoutId);
    this.timeoutId = null;
    this.state = RUNNING;
    runNext(this, 0);
  }
};

/**
 * Cancel all remaining subtasks of this task.
 */
Task.prototype.cancel = function() {
  this.state = sStateTable[this.state][CANCEL];
  // remove permits needed
  this.permitsNeeded = 0;
  // cancel timeouts
  if(this.timeoutId !== null) {
    cancelTimeout(this.timeoutId);
    this.timeoutId = null;
  }
  // remove subtasks
  this.subtasks = [];
};

/**
 * Finishes this task with failure and sets error flag. The entire
 * task will be aborted unless the next task that should execute
 * is passed as a parameter. This allows levels of subtasks to be
 * skipped. For instance, to abort only this tasks's subtasks, then
 * call fail(task.parent). To abort this task's subtasks and its
 * parent's subtasks, call fail(task.parent.parent). To abort
 * all tasks and simply call the task callback, call fail() or
 * fail(null).
 *
 * The task callback (success or failure) will always, eventually, be
 * called.
 *
 * @param next the task to continue at, or null to abort entirely.
 */
Task.prototype.fail = function(next) {
  // set error flag
  this.error = true;

  // finish task
  finish(this, true);

  if(next) {
    // propagate task info
    next.error = this.error;
    next.swapTime = this.swapTime;
    next.userData = this.userData;

    // do next task as specified
    runNext(next, 0);
  } else {
    if(this.parent !== null) {
      // finish root task (ensures it is removed from task queue)
      var parent = this.parent;
      while(parent.parent !== null) {
        // propagate task info
        parent.error = this.error;
        parent.swapTime = this.swapTime;
        parent.userData = this.userData;
        parent = parent.parent;
      }
      finish(parent, true);
    }

    // call failure callback if one exists
    if(this.failureCallback) {
      this.failureCallback(this);
    }
  }
};

/**
 * Asynchronously start a task.
 *
 * @param task the task to start.
 */
var start = function(task) {
  task.error = false;
  task.state = sStateTable[task.state][START];
  setTimeout(function() {
    if(task.state === RUNNING) {
      task.swapTime = +new Date();
      task.run(task);
      runNext(task, 0);
    }
  }, 0);
};

/**
 * Run the next subtask or finish this task.
 *
 * @param task the task to process.
 * @param recurse the recursion count.
 */
var runNext = function(task, recurse) {
  // get time since last context swap (ms), if enough time has passed set
  // swap to true to indicate that doNext was performed asynchronously
  // also, if recurse is too high do asynchronously
  var swap =
    (recurse > sMaxRecursions) ||
    (+new Date() - task.swapTime) > sTimeSlice;

  var doNext = function(recurse) {
    recurse++;
    if(task.state === RUNNING) {
      if(swap) {
        // update swap time
        task.swapTime = +new Date();
      }

      if(task.subtasks.length > 0) {
        // run next subtask
        var subtask = task.subtasks.shift();
        subtask.error = task.error;
        subtask.swapTime = task.swapTime;
        subtask.userData = task.userData;
        subtask.run(subtask);
        if(!subtask.error) {
           runNext(subtask, recurse);
        }
      } else {
        finish(task);

        if(!task.error) {
          // chain back up and run parent
          if(task.parent !== null) {
            // propagate task info
            task.parent.error = task.error;
            task.parent.swapTime = task.swapTime;
            task.parent.userData = task.userData;

            // no subtasks left, call run next subtask on parent
            runNext(task.parent, recurse);
          }
        }
      }
    }
  };

  if(swap) {
    // we're swapping, so run asynchronously
    setTimeout(doNext, 0);
  } else {
    // not swapping, so run synchronously
    doNext(recurse);
  }
};

/**
 * Finishes a task and looks for the next task in the queue to start.
 *
 * @param task the task to finish.
 * @param suppressCallbacks true to suppress callbacks.
 */
var finish = function(task, suppressCallbacks) {
  // subtask is now done
  task.state = DONE;

  delete sTasks[task.id];

  // only do queue processing for root tasks
  if(task.parent === null) {
    // report error if queue is missing
    if(!(task.type in sTaskQueues)) {
      forge$1.log.error(cat,
        '[%s][%s] task queue missing [%s]',
        task.id, task.name, task.type);
    } else if(sTaskQueues[task.type].length === 0) {
      // report error if queue is empty
      forge$1.log.error(cat,
        '[%s][%s] task queue empty [%s]',
        task.id, task.name, task.type);
    } else if(sTaskQueues[task.type][0] !== task) {
      // report error if this task isn't the first in the queue
      forge$1.log.error(cat,
        '[%s][%s] task not first in queue [%s]',
        task.id, task.name, task.type);
    } else {
      // remove ourselves from the queue
      sTaskQueues[task.type].shift();
      // clean up queue if it is empty
      if(sTaskQueues[task.type].length === 0) {
        /* Note: Only a task can delete a queue of its own type. This
         is used as a way to synchronize tasks. If a queue for a certain
         task type exists, then a task of that type is running.
         */
        delete sTaskQueues[task.type];
      } else {
        sTaskQueues[task.type][0].start();
      }
    }

    if(!suppressCallbacks) {
      // call final callback if one exists
      if(task.error && task.failureCallback) {
        task.failureCallback(task);
      } else if(!task.error && task.successCallback) {
        task.successCallback(task);
      }
    }
  }
};

/* Tasks API */
forge$1.task = forge$1.task || {};

/**
 * Starts a new task that will run the passed function asynchronously.
 *
 * In order to finish the task, either task.doNext() or task.fail()
 * *must* be called.
 *
 * The task must have a type (a string identifier) that can be used to
 * synchronize it with other tasks of the same type. That type can also
 * be used to cancel tasks that haven't started yet.
 *
 * To start a task, the following object must be provided as a parameter
 * (each function takes a task object as its first parameter):
 *
 * {
 *   type: the type of task.
 *   run: the function to run to execute the task.
 *   success: a callback to call when the task succeeds (optional).
 *   failure: a callback to call when the task fails (optional).
 * }
 *
 * @param options the object as described above.
 */
forge$1.task.start = function(options) {
  // create a new task
  var task = new Task({
    run: options.run,
    name: options.name || sNoTaskName
  });
  task.type = options.type;
  task.successCallback = options.success || null;
  task.failureCallback = options.failure || null;

  // append the task onto the appropriate queue
  if(!(task.type in sTaskQueues)) {
    // create the queue with the new task
    sTaskQueues[task.type] = [task];
    start(task);
  } else {
    // push the task onto the queue, it will be run after a task
    // with the same type completes
    sTaskQueues[options.type].push(task);
  }
};

/**
 * Cancels all tasks of the given type that haven't started yet.
 *
 * @param type the type of task to cancel.
 */
forge$1.task.cancel = function(type) {
  // find the task queue
  if(type in sTaskQueues) {
    // empty all but the current task from the queue
    sTaskQueues[type] = [sTaskQueues[type][0]];
  }
};

/**
 * Creates a condition variable to synchronize tasks. To make a task wait
 * on the condition variable, call task.wait(condition). To notify all
 * tasks that are waiting, call condition.notify().
 *
 * @return the condition variable.
 */
forge$1.task.createCondition = function() {
  var cond = {
    // all tasks that are blocked
    tasks: {}
  };

  /**
   * Causes the given task to block until notify is called. If the task
   * is already waiting on this condition then this is a no-op.
   *
   * @param task the task to cause to wait.
   */
  cond.wait = function(task) {
    // only block once
    if(!(task.id in cond.tasks)) {
       task.block();
       cond.tasks[task.id] = task;
    }
  };

  /**
   * Notifies all waiting tasks to wake up.
   */
  cond.notify = function() {
    // since unblock() will run the next task from here, make sure to
    // clear the condition's blocked task list before unblocking
    var tmp = cond.tasks;
    cond.tasks = {};
    for(var id in tmp) {
      tmp[id].unblock();
    }
  };

  return cond;
};

/**
 * Node.js module for Forge.
 *
 * @author Dave Longley
 *
 * Copyright 2011-2016 Digital Bazaar, Inc.
 */

var lib = forge$F;

var forge = lib;

// a hexString is considered negative if it's most significant bit is 1
// because serial numbers use ones' complement notation
// this RFC in section 4.1.2.2 requires serial numbers to be positive
// http://www.ietf.org/rfc/rfc5280.txt
function toPositiveHex(hexString){
  var mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
  if (mostSiginficativeHexAsInt < 8){
    return hexString;
  }

  mostSiginficativeHexAsInt -= 8;
  return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
}

function getAlgorithm(key) {
  switch (key) {
    case 'sha256':
      return forge.md.sha256.create();
    default:
      return forge.md.sha1.create();
  }
}

/**
 *
 * @param {forge.pki.CertificateField[]} attrs Attributes used for subject and issuer.
 * @param {object} options
 * @param {number} [options.days=365] the number of days before expiration
 * @param {number} [options.keySize=1024] the size for the private key in bits
 * @param {object} [options.extensions] additional extensions for the certificate
 * @param {string} [options.algorithm="sha1"] The signature algorithm sha256 or sha1
 * @param {boolean} [options.pkcs7=false] include PKCS#7 as part of the output
 * @param {boolean} [options.clientCertificate=false] generate client cert signed by the original key
 * @param {string} [options.clientCertificateCN="John Doe jdoe123"] client certificate's common name
 * @param {function} [done] Optional callback, if not provided the generation is synchronous
 * @returns
 */
var generate = selfsigned.generate = function generate(attrs, options, done) {
  if (typeof attrs === 'function') {
    done = attrs;
    attrs = undefined;
  } else if (typeof options === 'function') {
    done = options;
    options = {};
  }

  options = options || {};

  var generatePem = function (keyPair) {
    var cert = forge.pki.createCertificate();

    cert.serialNumber = toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9))); // the serial number can be decimal or hex (if preceded by 0x)

    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + (options.days || 365));

    attrs = attrs || [{
      name: 'commonName',
      value: 'example.org'
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'Virginia'
    }, {
      name: 'localityName',
      value: 'Blacksburg'
    }, {
      name: 'organizationName',
      value: 'Test'
    }, {
      shortName: 'OU',
      value: 'Test'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.publicKey = keyPair.publicKey;

    cert.setExtensions(options.extensions || [{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 6, // URI
        value: 'http://example.org/webid#me'
      }]
    }]);

    cert.sign(keyPair.privateKey, getAlgorithm(options && options.algorithm));

    const fingerprint = forge.md.sha1
                          .create()
                          .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
                          .digest()
                          .toHex()
                          .match(/.{2}/g)
                          .join(':');

    var pem = {
      private:     forge.pki.privateKeyToPem(keyPair.privateKey),
      public:      forge.pki.publicKeyToPem(keyPair.publicKey),
      cert:        forge.pki.certificateToPem(cert),
      fingerprint: fingerprint,
    };

    if (options && options.pkcs7) {
      var p7 = forge.pkcs7.createSignedData();
      p7.addCertificate(cert);
      pem.pkcs7 = forge.pkcs7.messageToPem(p7);
    }

    if (options && options.clientCertificate) {
      var clientkeys = forge.pki.rsa.generateKeyPair(1024);
      var clientcert = forge.pki.createCertificate();
      clientcert.serialNumber = toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9)));
      clientcert.validity.notBefore = new Date();
      clientcert.validity.notAfter = new Date();
      clientcert.validity.notAfter.setFullYear(clientcert.validity.notBefore.getFullYear() + 1);

      var clientAttrs = JSON.parse(JSON.stringify(attrs));

      for(var i = 0; i < clientAttrs.length; i++) {
        if(clientAttrs[i].name === 'commonName') {
          if( options.clientCertificateCN )
            clientAttrs[i] = { name: 'commonName', value: options.clientCertificateCN };
          else
            clientAttrs[i] = { name: 'commonName', value: 'John Doe jdoe123' };
        }
      }

      clientcert.setSubject(clientAttrs);

      // Set the issuer to the parent key
      clientcert.setIssuer(attrs);

      clientcert.publicKey = clientkeys.publicKey;

      // Sign client cert with root cert
      clientcert.sign(keyPair.privateKey);

      pem.clientprivate = forge.pki.privateKeyToPem(clientkeys.privateKey);
      pem.clientpublic = forge.pki.publicKeyToPem(clientkeys.publicKey);
      pem.clientcert = forge.pki.certificateToPem(clientcert);

      if (options.pkcs7) {
        var clientp7 = forge.pkcs7.createSignedData();
        clientp7.addCertificate(clientcert);
        pem.clientpkcs7 = forge.pkcs7.messageToPem(clientp7);
      }
    }

    var caStore = forge.pki.createCaStore();
    caStore.addCertificate(cert);

    try {
      forge.pki.verifyCertificateChain(caStore, [cert],
        function (vfd, depth, chain) {
          if (vfd !== true) {
            throw new Error('Certificate could not be verified.');
          }
          return true;
        });
    }
    catch(ex) {
      throw new Error(ex);
    }

    return pem;
  };

  var keySize = options.keySize || 1024;

  if (done) { // async scenario
    return forge.pki.rsa.generateKeyPair({ bits: keySize }, function (err, keyPair) {
      if (err) { return done(err); }

      try {
        return done(null, generatePem(keyPair));
      } catch (ex) {
        return done(ex);
      }
    });
  }

  var keyPair = options.keyPair ? {
    privateKey: forge.pki.privateKeyFromPem(options.keyPair.privateKey),
    publicKey: forge.pki.publicKeyFromPem(options.keyPair.publicKey)
  } : forge.pki.rsa.generateKeyPair(keySize);

  return generatePem(keyPair);
};

var index = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  'default': selfsigned,
  generate: generate
}, [selfsigned]);

exports.index = index;
//# sourceMappingURL=dep-34d2edc0.js.map
