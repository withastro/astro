"use strict";
// @ts-nocheck
exports.__esModule = true;
function setup(parser) {
    // TODO: Error if not at top of file? currently, we ignore / just treat as text.
    // if (parser.html.children.length > 0) {
    //   parser.error({
    //     code: 'unexpected-token',
    //     message: 'Frontmatter scripts only supported at the top of file.',
    //   });
    // }
    var start = parser.index;
    parser.index += 3;
    var content_start = parser.index;
    var setupScriptContent = parser.read_until(/^---/m);
    var content_end = parser.index;
    parser.eat('---', true);
    var end = parser.index;
    parser.js.push({
        type: 'Script',
        context: 'setup',
        start: start,
        end: end,
        content: setupScriptContent
    });
    return;
}
exports["default"] = setup;
