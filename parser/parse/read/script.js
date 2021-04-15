"use strict";
// @ts-nocheck
exports.__esModule = true;
var script_closing_tag = '</script>';
function get_context(parser, attributes, start) {
    var context = attributes.find(function (attribute) { return attribute.name === 'astro'; });
    if (!context)
        return 'runtime';
    if (context.value === true)
        return 'setup';
    if (context.value.length !== 1 || context.value[0].type !== 'Text') {
        parser.error({
            code: 'invalid-script',
            message: 'astro attribute must be static'
        }, start);
    }
    var value = context.value[0].data;
    if (value !== 'setup') {
        parser.error({
            code: 'invalid-script',
            message: 'If the "astro" attribute has a value, its value must be "setup"'
        }, context.start);
    }
    return value;
}
function read_script(parser, start, attributes) {
    var script_start = parser.index;
    var script_end = parser.template.indexOf(script_closing_tag, script_start);
    if (script_end === -1) {
        parser.error({
            code: 'unclosed-script',
            message: '<script> must have a closing tag'
        });
    }
    var source = parser.template.slice(0, script_start).replace(/[^\n]/g, ' ') + parser.template.slice(script_start, script_end);
    parser.index = script_end + script_closing_tag.length;
    return {
        type: 'Script',
        start: start,
        end: parser.index,
        context: get_context(parser, attributes, start),
        content: source
    };
}
exports["default"] = read_script;
