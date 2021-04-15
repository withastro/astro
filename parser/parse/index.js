"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.Parser = void 0;
var acorn_1 = require("acorn");
var fragment_js_1 = require("./state/fragment.js");
var patterns_js_1 = require("../utils/patterns.js");
var names_js_1 = require("../utils/names.js");
var full_char_code_at_js_1 = require("../utils/full_char_code_at.js");
var error_js_1 = require("../utils/error.js");
var Parser = /** @class */ (function () {
    function Parser(template, options) {
        this.index = 0;
        this.stack = [];
        this.css = [];
        this.js = [];
        this.meta_tags = {};
        if (typeof template !== 'string') {
            throw new TypeError('Template must be a string');
        }
        this.template = template.replace(/\s+$/, '');
        this.filename = options.filename;
        this.customElement = options.customElement;
        this.html = {
            start: null,
            end: null,
            type: 'Fragment',
            children: []
        };
        this.stack.push(this.html);
        var state = fragment_js_1["default"];
        while (this.index < this.template.length) {
            state = state(this) || fragment_js_1["default"];
        }
        if (this.stack.length > 1) {
            var current = this.current();
            var type = current.type === 'Element' ? "<" + current.name + ">" : 'Block';
            var slug = current.type === 'Element' ? 'element' : 'block';
            this.error({
                code: "unclosed-" + slug,
                message: type + " was left open"
            }, current.start);
        }
        if (state !== fragment_js_1["default"]) {
            this.error({
                code: 'unexpected-eof',
                message: 'Unexpected end of input'
            });
        }
        if (this.html.children.length) {
            var start = this.html.children[0].start;
            while (patterns_js_1.whitespace.test(template[start]))
                start += 1;
            var end = this.html.children[this.html.children.length - 1].end;
            while (patterns_js_1.whitespace.test(template[end - 1]))
                end -= 1;
            this.html.start = start;
            this.html.end = end;
        }
        else {
            this.html.start = this.html.end = null;
        }
    }
    Parser.prototype.current = function () {
        return this.stack[this.stack.length - 1];
    };
    Parser.prototype.acorn_error = function (err) {
        this.error({
            code: 'parse-error',
            message: err.message.replace(/ \(\d+:\d+\)$/, '')
        }, err.pos);
    };
    Parser.prototype.error = function (_a, index) {
        var code = _a.code, message = _a.message;
        if (index === void 0) { index = this.index; }
        error_js_1["default"](message, {
            name: 'ParseError',
            code: code,
            source: this.template,
            start: index,
            filename: this.filename
        });
    };
    Parser.prototype.eat = function (str, required, message) {
        if (this.match(str)) {
            this.index += str.length;
            return true;
        }
        if (required) {
            this.error({
                code: "unexpected-" + (this.index === this.template.length ? 'eof' : 'token'),
                message: message || "Expected " + str
            });
        }
        return false;
    };
    Parser.prototype.match = function (str) {
        return this.template.slice(this.index, this.index + str.length) === str;
    };
    Parser.prototype.match_regex = function (pattern) {
        var match = pattern.exec(this.template.slice(this.index));
        if (!match || match.index !== 0)
            return null;
        return match[0];
    };
    Parser.prototype.allow_whitespace = function () {
        while (this.index < this.template.length && patterns_js_1.whitespace.test(this.template[this.index])) {
            this.index++;
        }
    };
    Parser.prototype.read = function (pattern) {
        var result = this.match_regex(pattern);
        if (result)
            this.index += result.length;
        return result;
    };
    Parser.prototype.read_identifier = function (allow_reserved) {
        if (allow_reserved === void 0) { allow_reserved = false; }
        var start = this.index;
        var i = this.index;
        var code = full_char_code_at_js_1["default"](this.template, i);
        if (!acorn_1.isIdentifierStart(code, true))
            return null;
        i += code <= 0xffff ? 1 : 2;
        while (i < this.template.length) {
            var code_1 = full_char_code_at_js_1["default"](this.template, i);
            if (!acorn_1.isIdentifierChar(code_1, true))
                break;
            i += code_1 <= 0xffff ? 1 : 2;
        }
        var identifier = this.template.slice(this.index, (this.index = i));
        if (!allow_reserved && names_js_1.reserved.has(identifier)) {
            this.error({
                code: 'unexpected-reserved-word',
                message: "'" + identifier + "' is a reserved word in JavaScript and cannot be used here"
            }, start);
        }
        return identifier;
    };
    Parser.prototype.read_until = function (pattern) {
        if (this.index >= this.template.length) {
            this.error({
                code: 'unexpected-eof',
                message: 'Unexpected end of input'
            });
        }
        var start = this.index;
        var match = pattern.exec(this.template.slice(start));
        if (match) {
            this.index = start + match.index;
            return this.template.slice(start, this.index);
        }
        this.index = this.template.length;
        return this.template.slice(start);
    };
    Parser.prototype.require_whitespace = function () {
        if (!patterns_js_1.whitespace.test(this.template[this.index])) {
            this.error({
                code: 'missing-whitespace',
                message: 'Expected whitespace'
            });
        }
        this.allow_whitespace();
    };
    return Parser;
}());
exports.Parser = Parser;
/**
 * Parse
 * Step 1/3 in Astro SSR.
 * This is the first pass over .astro files and the step at which we convert a string to an AST for us to crawl.
 */
function parse(template, options) {
    if (options === void 0) { options = {}; }
    var parser = new Parser(template, options);
    // TODO we may want to allow multiple <style> tags —
    // one scoped, one global. for now, only allow one
    if (parser.css.length > 1) {
        parser.error({
            code: 'duplicate-style',
            message: 'You can only have one <style> tag per Astro file'
        }, parser.css[1].start);
    }
    // const instance_scripts = parser.js.filter((script) => script.context === 'default');
    // const module_scripts = parser.js.filter((script) => script.context === 'module');
    var astro_scripts = parser.js.filter(function (script) { return script.context === 'setup'; });
    if (astro_scripts.length > 1) {
        parser.error({
            code: 'invalid-script',
            message: 'A component can only have one frontmatter (---) script'
        }, astro_scripts[1].start);
    }
    // if (module_scripts.length > 1) {
    //   parser.error(
    //     {
    //       code: 'invalid-script',
    //       message: 'A component can only have one <script context="module"> element',
    //     },
    //     module_scripts[1].start
    //   );
    // }
    return {
        html: parser.html,
        css: parser.css[0],
        // instance: instance_scripts[0],
        module: astro_scripts[0]
    };
}
exports["default"] = parse;
