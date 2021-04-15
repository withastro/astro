"use strict";
exports.__esModule = true;
exports.parse_expression_at = void 0;
var index_js_1 = require("../index.js");
function peek_char(state) {
    return state.source[state.index];
}
function peek_nonwhitespace(state) {
    var index = state.index;
    do {
        var char = state.source[index];
        if (!/\s/.test(char)) {
            return char;
        }
        index++;
    } while (index < state.source.length);
}
function next_char(state) {
    return state.source[state.index++];
}
function in_bounds(state) {
    return state.index < state.source.length;
}
function consume_string(state, stringChar) {
    var inEscape;
    do {
        var char = next_char(state);
        if (inEscape) {
            inEscape = false;
        }
        else if (char === '\\') {
            inEscape = true;
        }
        else if (char === stringChar) {
            break;
        }
    } while (in_bounds(state));
}
function consume_multiline_comment(state) {
    do {
        var char = next_char(state);
        if (char === '*' && peek_char(state) === '/') {
            break;
        }
    } while (in_bounds(state));
}
function consume_line_comment(state) {
    do {
        var char = next_char(state);
        if (char === '\n') {
            break;
        }
    } while (in_bounds(state));
}
var voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
function consume_tag(state) {
    var start = state.index - 1;
    var tagName = '';
    var inTag = false;
    var inStart = true;
    var selfClosed = false;
    var inClose = false;
    var bracketIndex = 1;
    do {
        var char = next_char(state);
        switch (char) {
            case "'":
            case '"': {
                consume_string(state, char);
                break;
            }
            case '<': {
                inTag = false;
                tagName = '';
                if (peek_nonwhitespace(state) === '/') {
                    inClose = true;
                    bracketIndex--;
                }
                else {
                    inStart = true;
                    bracketIndex++;
                }
                break;
            }
            case '>': {
                // An arrow function, probably
                if (!inStart && !inClose) {
                    break;
                }
                bracketIndex--;
                var addExpectedBrackets = 
                // Void elements don't need a closing
                !voidElements.has(tagName.toLowerCase()) &&
                    // Self-closing don't need a closing
                    !selfClosed &&
                    // If we're in a start tag, we expect to find 2 more brackets
                    !inClose;
                if (addExpectedBrackets) {
                    bracketIndex += 2;
                }
                inTag = false;
                selfClosed = false;
                inStart = false;
                inClose = false;
                break;
            }
            case ' ': {
                inTag = true;
                break;
            }
            case '/': {
                if (inStart) {
                    selfClosed = true;
                }
                break;
            }
            default: {
                if (!inTag) {
                    tagName += char;
                }
                break;
            }
        }
        // Unclosed tags
        if (state.curlyCount <= 0) {
            break;
        }
        if (bracketIndex === 0) {
            break;
        }
    } while (in_bounds(state));
    var source = state.source.substring(start, state.index);
    var ast = index_js_1["default"](source);
    var fragment = ast.html;
    return fragment;
}
function consume_expression(source, start) {
    var expr = {
        type: 'Expression',
        start: start,
        end: Number.NaN,
        codeStart: '',
        codeEnd: '',
        children: []
    };
    var codeEndStart = 0;
    var state = {
        source: source,
        start: start,
        index: start,
        curlyCount: 1,
        bracketCount: 0,
        root: expr
    };
    do {
        var char = next_char(state);
        switch (char) {
            case '{': {
                state.curlyCount++;
                break;
            }
            case '}': {
                state.curlyCount--;
                break;
            }
            case '<': {
                expr.codeStart = source.substring(start, state.index - 1);
                var tag = consume_tag(state);
                expr.children.push(tag);
                codeEndStart = state.index;
                break;
            }
            case "'":
            case '"':
            case '`': {
                consume_string(state, char);
                break;
            }
            case '/': {
                switch (peek_char(state)) {
                    case '/': {
                        consume_line_comment(state);
                        break;
                    }
                    case '*': {
                        consume_multiline_comment(state);
                        break;
                    }
                }
            }
        }
    } while (in_bounds(state) && state.curlyCount > 0);
    expr.end = state.index - 1;
    if (codeEndStart) {
        expr.codeEnd = source.substring(codeEndStart, expr.end);
    }
    else {
        expr.codeStart = source.substring(start, expr.end);
    }
    return expr;
}
var parse_expression_at = function (source, index) {
    var expression = consume_expression(source, index);
    return expression;
};
exports.parse_expression_at = parse_expression_at;
// @ts-ignore
function read_expression(parser) {
    try {
        var expression = exports.parse_expression_at(parser.template, parser.index);
        parser.index = expression.end;
        return expression;
    }
    catch (err) {
        parser.acorn_error(err);
    }
}
exports["default"] = read_expression;
