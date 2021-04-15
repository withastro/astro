"use strict";
// @ts-nocheck
exports.__esModule = true;
var acorn_1 = require("acorn");
var full_char_code_at_js_1 = require("../../utils/full_char_code_at.js");
var bracket_js_1 = require("../utils/bracket.js");
var expression_js_1 = require("./expression.js");
function read_context(parser) {
    var start = parser.index;
    var i = parser.index;
    var code = full_char_code_at_js_1["default"](parser.template, i);
    if (acorn_1.isIdentifierStart(code, true)) {
        return {
            type: 'Identifier',
            name: parser.read_identifier(),
            start: start,
            end: parser.index
        };
    }
    if (!bracket_js_1.is_bracket_open(code)) {
        parser.error({
            code: 'unexpected-token',
            message: 'Expected identifier or destructure pattern'
        });
    }
    var bracket_stack = [code];
    i += code <= 0xffff ? 1 : 2;
    while (i < parser.template.length) {
        var code_1 = full_char_code_at_js_1["default"](parser.template, i);
        if (bracket_js_1.is_bracket_open(code_1)) {
            bracket_stack.push(code_1);
        }
        else if (bracket_js_1.is_bracket_close(code_1)) {
            if (!bracket_js_1.is_bracket_pair(bracket_stack[bracket_stack.length - 1], code_1)) {
                parser.error({
                    code: 'unexpected-token',
                    message: "Expected " + String.fromCharCode(bracket_js_1.get_bracket_close(bracket_stack[bracket_stack.length - 1]))
                });
            }
            bracket_stack.pop();
            if (bracket_stack.length === 0) {
                i += code_1 <= 0xffff ? 1 : 2;
                break;
            }
        }
        i += code_1 <= 0xffff ? 1 : 2;
    }
    parser.index = i;
    var pattern_string = parser.template.slice(start, i);
    try {
        // the length of the `space_with_newline` has to be start - 1
        // because we added a `(` in front of the pattern_string,
        // which shifted the entire string to right by 1
        // so we offset it by removing 1 character in the `space_with_newline`
        // to achieve that, we remove the 1st space encountered,
        // so it will not affect the `column` of the node
        var space_with_newline = parser.template.slice(0, start).replace(/[^\n]/g, ' ');
        var first_space = space_with_newline.indexOf(' ');
        space_with_newline = space_with_newline.slice(0, first_space) + space_with_newline.slice(first_space + 1);
        return expression_js_1.parse_expression_at(space_with_newline + "(" + pattern_string + " = 1)", start - 1).left;
    }
    catch (error) {
        parser.acorn_error(error);
    }
}
exports["default"] = read_context;
