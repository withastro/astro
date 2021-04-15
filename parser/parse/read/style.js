"use strict";
exports.__esModule = true;
function read_style(parser, start, attributes) {
    var content_start = parser.index;
    var styles = parser.read_until(/<\/style>/);
    var content_end = parser.index;
    parser.eat('</style>', true);
    var end = parser.index;
    return {
        type: 'Style',
        start: start,
        end: end,
        attributes: attributes,
        content: {
            start: content_start,
            end: content_end,
            styles: styles
        }
    };
}
exports["default"] = read_style;
function is_ref_selector(a, b) {
    // TODO add CSS node types
    if (!b)
        return false;
    return a.type === 'TypeSelector' && a.name === 'ref' && b.type === 'PseudoClassSelector';
}
