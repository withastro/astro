"use strict";
// @ts-nocheck
exports.__esModule = true;
var html_js_1 = require("../utils/html.js");
function text(parser) {
    var start = parser.index;
    var data = '';
    while (parser.index < parser.template.length && !parser.match('---') && !parser.match('<') && !parser.match('{')) {
        data += parser.template[parser.index++];
    }
    var node = {
        start: start,
        end: parser.index,
        type: 'Text',
        raw: data,
        data: html_js_1.decode_character_references(data)
    };
    parser.current().children.push(node);
}
exports["default"] = text;
