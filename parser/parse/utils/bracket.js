"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.get_bracket_close = exports.is_bracket_pair = exports.is_bracket_close = exports.is_bracket_open = void 0;
var SQUARE_BRACKET_OPEN = '['.charCodeAt(0);
var SQUARE_BRACKET_CLOSE = ']'.charCodeAt(0);
var CURLY_BRACKET_OPEN = '{'.charCodeAt(0);
var CURLY_BRACKET_CLOSE = '}'.charCodeAt(0);
function is_bracket_open(code) {
    return code === SQUARE_BRACKET_OPEN || code === CURLY_BRACKET_OPEN;
}
exports.is_bracket_open = is_bracket_open;
function is_bracket_close(code) {
    return code === SQUARE_BRACKET_CLOSE || code === CURLY_BRACKET_CLOSE;
}
exports.is_bracket_close = is_bracket_close;
function is_bracket_pair(open, close) {
    return (open === SQUARE_BRACKET_OPEN && close === SQUARE_BRACKET_CLOSE) || (open === CURLY_BRACKET_OPEN && close === CURLY_BRACKET_CLOSE);
}
exports.is_bracket_pair = is_bracket_pair;
function get_bracket_close(open) {
    if (open === SQUARE_BRACKET_OPEN) {
        return SQUARE_BRACKET_CLOSE;
    }
    if (open === CURLY_BRACKET_OPEN) {
        return CURLY_BRACKET_CLOSE;
    }
}
exports.get_bracket_close = get_bracket_close;
