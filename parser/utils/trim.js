"use strict";
exports.__esModule = true;
exports.trim_end = exports.trim_start = void 0;
var patterns_js_1 = require("./patterns.js");
/** Trim whitespace from start of string */
function trim_start(str) {
    var i = 0;
    while (patterns_js_1.whitespace.test(str[i]))
        i += 1;
    return str.slice(i);
}
exports.trim_start = trim_start;
/** Trim whitespace from end of string */
function trim_end(str) {
    var i = str.length;
    while (patterns_js_1.whitespace.test(str[i - 1]))
        i -= 1;
    return str.slice(0, i);
}
exports.trim_end = trim_end;
