"use strict";
// Adapted from https://github.com/acornjs/acorn/blob/6584815dca7440e00de841d1dad152302fdd7ca5/src/tokenize.js
// Reproduced under MIT License https://github.com/acornjs/acorn/blob/master/LICENSE
exports.__esModule = true;
/** @url https://github.com/acornjs/acorn/blob/6584815dca7440e00de841d1dad152302fdd7ca5/src/tokenize.js */
function full_char_code_at(str, i) {
    var code = str.charCodeAt(i);
    if (code <= 0xd7ff || code >= 0xe000)
        return code;
    var next = str.charCodeAt(i + 1);
    return (code << 10) + next - 0x35fdc00;
}
exports["default"] = full_char_code_at;
