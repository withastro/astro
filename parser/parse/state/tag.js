"use strict";
// @ts-nocheck
exports.__esModule = true;
var expression_js_1 = require("../read/expression.js");
var style_js_1 = require("../read/style.js");
var html_js_1 = require("../utils/html.js");
var names_js_1 = require("../../utils/names.js");
var fuzzymatch_js_1 = require("../../utils/fuzzymatch.js");
var list_js_1 = require("../../utils/list.js");
// eslint-disable-next-line no-useless-escape
var valid_tag_name = /^\!?[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/;
var meta_tags = new Map([
    ['astro:head', 'Head'],
    // ['slot:body', 'Body'],
    // ['astro:options', 'Options'],
    // ['astro:window', 'Window'],
    // ['astro:body', 'Body'],
]);
var valid_meta_tags = Array.from(meta_tags.keys()); //.concat('astro:self', 'astro:component', 'astro:fragment');
var specials = new Map([
    // Now handled as "setup" in setup.ts
    // [
    //   'script',
    //   {
    //     read: read_script,
    //     property: 'js',
    //   },
    // ],
    [
        'style',
        {
            read: style_js_1["default"],
            property: 'css'
        },
    ],
]);
var SELF = /^astro:self(?=[\s/>])/;
var COMPONENT = /^astro:component(?=[\s/>])/;
var SLOT = /^astro:fragment(?=[\s/>])/;
var HEAD = /^head(?=[\s/>])/;
function parent_is_head(stack) {
    var i = stack.length;
    while (i--) {
        var type = stack[i].type;
        if (type === 'Head')
            return true;
        if (type === 'Element' || type === 'InlineComponent')
            return false;
    }
    return false;
}
function tag(parser) {
    var start = parser.index++;
    var parent = parser.current();
    if (parser.eat('!--')) {
        var data = parser.read_until(/-->/);
        parser.eat('-->', true, 'comment was left open, expected -->');
        parser.current().children.push({
            start: start,
            end: parser.index,
            type: 'Comment',
            data: data
        });
        return;
    }
    var is_closing_tag = parser.eat('/');
    var name = read_tag_name(parser);
    if (meta_tags.has(name)) {
        var slug = meta_tags.get(name).toLowerCase();
        if (is_closing_tag) {
            if ((name === 'astro:window' || name === 'astro:body') && parser.current().children.length) {
                parser.error({
                    code: "invalid-" + slug + "-content",
                    message: "<" + name + "> cannot have children"
                }, parser.current().children[0].start);
            }
        }
        else {
            if (name in parser.meta_tags) {
                parser.error({
                    code: "duplicate-" + slug,
                    message: "A component can only have one <" + name + "> tag"
                }, start);
            }
            if (parser.stack.length > 1) {
                parser.error({
                    code: "invalid-" + slug + "-placement",
                    message: "<" + name + "> tags cannot be inside elements or blocks"
                }, start);
            }
            parser.meta_tags[name] = true;
        }
    }
    var type = meta_tags.has(name)
        ? meta_tags.get(name)
        : /[A-Z]/.test(name[0]) || name === 'astro:self' || name === 'astro:component'
            ? 'InlineComponent'
            : name === 'astro:fragment'
                ? 'SlotTemplate'
                : name === 'title' && parent_is_head(parser.stack)
                    ? 'Title'
                    : name === 'slot' && !parser.customElement
                        ? 'Slot'
                        : 'Element';
    var element = {
        start: start,
        end: null,
        type: type,
        name: name,
        attributes: [],
        children: []
    };
    parser.allow_whitespace();
    if (is_closing_tag) {
        if (names_js_1.is_void(name)) {
            parser.error({
                code: 'invalid-void-content',
                message: "<" + name + "> is a void element and cannot have children, or a closing tag"
            }, start);
        }
        parser.eat('>', true);
        // close any elements that don't have their own closing tags, e.g. <div><p></div>
        while (parent.name !== name) {
            if (parent.type !== 'Element') {
                var message = parser.last_auto_closed_tag && parser.last_auto_closed_tag.tag === name
                    ? "</" + name + "> attempted to close <" + name + "> that was already automatically closed by <" + parser.last_auto_closed_tag.reason + ">"
                    : "</" + name + "> attempted to close an element that was not open";
                parser.error({
                    code: 'invalid-closing-tag',
                    message: message
                }, start);
            }
            parent.end = start;
            parser.stack.pop();
            parent = parser.current();
        }
        parent.end = parser.index;
        parser.stack.pop();
        if (parser.last_auto_closed_tag && parser.stack.length < parser.last_auto_closed_tag.depth) {
            parser.last_auto_closed_tag = null;
        }
        return;
    }
    else if (html_js_1.closing_tag_omitted(parent.name, name)) {
        parent.end = start;
        parser.stack.pop();
        parser.last_auto_closed_tag = {
            tag: parent.name,
            reason: name,
            depth: parser.stack.length
        };
    }
    var unique_names = new Set();
    var attribute;
    while ((attribute = read_attribute(parser, unique_names))) {
        element.attributes.push(attribute);
        parser.allow_whitespace();
    }
    if (name === 'astro:component') {
        var index = element.attributes.findIndex(function (attr) { return attr.type === 'Attribute' && attr.name === 'this'; });
        if (!~index) {
            parser.error({
                code: 'missing-component-definition',
                message: "<astro:component> must have a 'this' attribute"
            }, start);
        }
        var definition = element.attributes.splice(index, 1)[0];
        if (definition.value === true || definition.value.length !== 1 || definition.value[0].type === 'Text') {
            parser.error({
                code: 'invalid-component-definition',
                message: 'invalid component definition'
            }, definition.start);
        }
        element.expression = definition.value[0].expression;
    }
    // special cases – top-level <script> and <style>
    if (specials.has(name) && parser.stack.length === 1) {
        var special = specials.get(name);
        parser.eat('>', true);
        var content = special.read(parser, start, element.attributes);
        if (content)
            parser[special.property].push(content);
        return;
    }
    parser.current().children.push(element);
    var self_closing = parser.eat('/') || names_js_1.is_void(name);
    parser.eat('>', true);
    if (self_closing) {
        // don't push self-closing elements onto the stack
        element.end = parser.index;
    }
    else if (name === 'textarea') {
        // special case
        element.children = read_sequence(parser, function () { return parser.template.slice(parser.index, parser.index + 11) === '</textarea>'; });
        parser.read(/<\/textarea>/);
        element.end = parser.index;
    }
    else if (name === 'script' || name === 'style') {
        // special case
        var start_1 = parser.index;
        var data = parser.read_until(new RegExp("</" + name + ">"));
        var end = parser.index;
        element.children.push({ start: start_1, end: end, type: 'Text', data: data });
        parser.eat("</" + name + ">", true);
        element.end = parser.index;
    }
    else {
        parser.stack.push(element);
    }
}
exports["default"] = tag;
function read_tag_name(parser) {
    var start = parser.index;
    if (parser.read(SELF)) {
        // check we're inside a block, otherwise this
        // will cause infinite recursion
        var i = parser.stack.length;
        var legal = false;
        while (i--) {
            var fragment = parser.stack[i];
            if (fragment.type === 'IfBlock' || fragment.type === 'EachBlock' || fragment.type === 'InlineComponent') {
                legal = true;
                break;
            }
        }
        if (!legal) {
            parser.error({
                code: 'invalid-self-placement',
                message: '<astro:self> components can only exist inside {#if} blocks, {#each} blocks, or slots passed to components'
            }, start);
        }
        return 'astro:self';
    }
    if (parser.read(COMPONENT))
        return 'astro:component';
    if (parser.read(SLOT))
        return 'astro:fragment';
    if (parser.read(HEAD))
        return 'head';
    var name = parser.read_until(/(\s|\/|>)/);
    if (meta_tags.has(name))
        return name;
    if (name.startsWith('astro:')) {
        var match = fuzzymatch_js_1["default"](name.slice(7), valid_meta_tags);
        var message = "Valid <astro:...> tag names are " + list_js_1["default"](valid_meta_tags);
        if (match)
            message += " (did you mean '" + match + "'?)";
        parser.error({
            code: 'invalid-tag-name',
            message: message
        }, start);
    }
    if (!valid_tag_name.test(name)) {
        parser.error({
            code: 'invalid-tag-name',
            message: 'Expected valid tag name'
        }, start);
    }
    return name;
}
function read_attribute(parser, unique_names) {
    var start = parser.index;
    function check_unique(name) {
        if (unique_names.has(name)) {
            parser.error({
                code: 'duplicate-attribute',
                message: 'Attributes need to be unique'
            }, start);
        }
        unique_names.add(name);
    }
    if (parser.eat('{')) {
        parser.allow_whitespace();
        if (parser.eat('...')) {
            var expression = expression_js_1["default"](parser).expression;
            parser.allow_whitespace();
            parser.eat('}', true);
            return {
                start: start,
                end: parser.index,
                type: 'Spread',
                expression: expression
            };
        }
        else {
            var value_start = parser.index;
            var name_1 = parser.read_identifier();
            parser.allow_whitespace();
            parser.eat('}', true);
            check_unique(name_1);
            return {
                start: start,
                end: parser.index,
                type: 'Attribute',
                name: name_1,
                value: [
                    {
                        start: value_start,
                        end: value_start + name_1.length,
                        type: 'AttributeShorthand',
                        expression: {
                            start: value_start,
                            end: value_start + name_1.length,
                            type: 'Identifier',
                            name: name_1
                        }
                    },
                ]
            };
        }
    }
    // eslint-disable-next-line no-useless-escape
    var name = parser.read_until(/[\s=\/>"']/);
    if (!name)
        return null;
    var end = parser.index;
    parser.allow_whitespace();
    var colon_index = name.indexOf(':');
    var type = colon_index !== -1 && get_directive_type(name.slice(0, colon_index));
    var value = true;
    if (parser.eat('=')) {
        parser.allow_whitespace();
        value = read_attribute_value(parser);
        end = parser.index;
    }
    else if (parser.match_regex(/["']/)) {
        parser.error({
            code: 'unexpected-token',
            message: 'Expected ='
        }, parser.index);
    }
    if (type) {
        var _a = name.slice(colon_index + 1).split('|'), directive_name = _a[0], modifiers = _a.slice(1);
        if (type === 'Binding' && directive_name !== 'this') {
            check_unique(directive_name);
        }
        else if (type !== 'EventHandler' && type !== 'Action') {
            check_unique(name);
        }
        if (type === 'Ref') {
            parser.error({
                code: 'invalid-ref-directive',
                message: "The ref directive is no longer supported \u2014 use `bind:this={" + directive_name + "}` instead"
            }, start);
        }
        if (type === 'Class' && directive_name === '') {
            parser.error({
                code: 'invalid-class-directive',
                message: 'Class binding name cannot be empty'
            }, start + colon_index + 1);
        }
        if (value[0]) {
            if (value.length > 1 || value[0].type === 'Text') {
                parser.error({
                    code: 'invalid-directive-value',
                    message: 'Directive value must be a JavaScript expression enclosed in curly braces'
                }, value[0].start);
            }
        }
        var directive = {
            start: start,
            end: end,
            type: type,
            name: directive_name,
            modifiers: modifiers,
            expression: (value[0] && value[0].expression) || null
        };
        if (type === 'Transition') {
            var direction = name.slice(0, colon_index);
            directive.intro = direction === 'in' || direction === 'transition';
            directive.outro = direction === 'out' || direction === 'transition';
        }
        if (!directive.expression && (type === 'Binding' || type === 'Class')) {
            directive.expression = {
                start: directive.start + colon_index + 1,
                end: directive.end,
                type: 'Identifier',
                name: directive.name
            };
        }
        return directive;
    }
    check_unique(name);
    return {
        start: start,
        end: end,
        type: 'Attribute',
        name: name,
        value: value
    };
}
function get_directive_type(name) {
    if (name === 'use')
        return 'Action';
    if (name === 'animate')
        return 'Animation';
    if (name === 'bind')
        return 'Binding';
    if (name === 'class')
        return 'Class';
    if (name === 'on')
        return 'EventHandler';
    if (name === 'let')
        return 'Let';
    if (name === 'ref')
        return 'Ref';
    if (name === 'in' || name === 'out' || name === 'transition')
        return 'Transition';
}
function read_attribute_value(parser) {
    var quote_mark = parser.eat("'") ? "'" : parser.eat('"') ? '"' : null;
    var regex = quote_mark === "'" ? /'/ : quote_mark === '"' ? /"/ : /(\/>|[\s"'=<>`])/;
    var value = read_sequence(parser, function () { return !!parser.match_regex(regex); });
    if (quote_mark)
        parser.index += 1;
    return value;
}
function read_sequence(parser, done) {
    var current_chunk = {
        start: parser.index,
        end: null,
        type: 'Text',
        raw: '',
        data: null
    };
    function flush() {
        if (current_chunk.raw) {
            current_chunk.data = html_js_1.decode_character_references(current_chunk.raw);
            current_chunk.end = parser.index;
            chunks.push(current_chunk);
        }
    }
    var chunks = [];
    while (parser.index < parser.template.length) {
        var index = parser.index;
        if (done()) {
            flush();
            return chunks;
        }
        else if (parser.eat('{')) {
            flush();
            parser.allow_whitespace();
            var expression = expression_js_1["default"](parser);
            parser.allow_whitespace();
            parser.eat('}', true);
            chunks.push({
                start: index,
                end: parser.index,
                type: 'MustacheTag',
                expression: expression
            });
            current_chunk = {
                start: parser.index,
                end: null,
                type: 'Text',
                raw: '',
                data: null
            };
        }
        else {
            current_chunk.raw += parser.template[parser.index++];
        }
    }
    parser.error({
        code: 'unexpected-eof',
        message: 'Unexpected end of input'
    });
}
