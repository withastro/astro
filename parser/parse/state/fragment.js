"use strict";
exports.__esModule = true;
var tag_js_1 = require("./tag.js");
var setup_js_1 = require("./setup.js");
var mustache_js_1 = require("./mustache.js");
var text_js_1 = require("./text.js");
function fragment(parser) {
    if (parser.html.children.length === 0 && parser.match_regex(/^---/m)) {
        return setup_js_1["default"];
    }
    if (parser.match('<')) {
        return tag_js_1["default"];
    }
    if (parser.match('{')) {
        return mustache_js_1["default"];
    }
    return text_js_1["default"];
}
exports["default"] = fragment;
