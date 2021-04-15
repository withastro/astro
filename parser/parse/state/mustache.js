"use strict";
exports.__esModule = true;
var context_js_1 = require("../read/context.js");
var expression_js_1 = require("../read/expression.js");
var html_js_1 = require("../utils/html.js");
var patterns_js_1 = require("../../utils/patterns.js");
var trim_js_1 = require("../../utils/trim.js");
var node_js_1 = require("../utils/node.js");
function trim_whitespace(block, trim_before, trim_after) {
    if (!block.children || block.children.length === 0)
        return; // AwaitBlock
    var first_child = block.children[0];
    var last_child = block.children[block.children.length - 1];
    if (first_child.type === 'Text' && trim_before) {
        first_child.data = trim_js_1.trim_start(first_child.data);
        if (!first_child.data)
            block.children.shift();
    }
    if (last_child.type === 'Text' && trim_after) {
        last_child.data = trim_js_1.trim_end(last_child.data);
        if (!last_child.data)
            block.children.pop();
    }
    if (block["else"]) {
        trim_whitespace(block["else"], trim_before, trim_after);
    }
    if (first_child.elseif) {
        trim_whitespace(first_child, trim_before, trim_after);
    }
}
function mustache(parser) {
    var start = parser.index;
    parser.index += 1;
    parser.allow_whitespace();
    // {/if}, {/each}, {/await} or {/key}
    if (parser.eat('/')) {
        var block = parser.current();
        var expected = void 0;
        if (html_js_1.closing_tag_omitted(block.name)) {
            block.end = start;
            parser.stack.pop();
            block = parser.current();
        }
        if (block.type === 'ElseBlock' || block.type === 'PendingBlock' || block.type === 'ThenBlock' || block.type === 'CatchBlock') {
            block.end = start;
            parser.stack.pop();
            block = parser.current();
            expected = 'await';
        }
        if (block.type === 'IfBlock') {
            expected = 'if';
        }
        else if (block.type === 'EachBlock') {
            expected = 'each';
        }
        else if (block.type === 'AwaitBlock') {
            expected = 'await';
        }
        else if (block.type === 'KeyBlock') {
            expected = 'key';
        }
        else {
            parser.error({
                code: 'unexpected-block-close',
                message: 'Unexpected block closing tag'
            });
        }
        parser.eat(expected, true);
        parser.allow_whitespace();
        parser.eat('}', true);
        while (block.elseif) {
            block.end = parser.index;
            parser.stack.pop();
            block = parser.current();
            if (block["else"]) {
                block["else"].end = start;
            }
        }
        // strip leading/trailing whitespace as necessary
        var char_before = parser.template[block.start - 1];
        var char_after = parser.template[parser.index];
        var trim_before = !char_before || patterns_js_1.whitespace.test(char_before);
        var trim_after = !char_after || patterns_js_1.whitespace.test(char_after);
        trim_whitespace(block, trim_before, trim_after);
        block.end = parser.index;
        parser.stack.pop();
    }
    else if (parser.eat(':else')) {
        if (parser.eat('if')) {
            parser.error({
                code: 'invalid-elseif',
                message: "'elseif' should be 'else if'"
            });
        }
        parser.allow_whitespace();
        // :else if
        if (parser.eat('if')) {
            var block = parser.current();
            if (block.type !== 'IfBlock') {
                parser.error({
                    code: 'invalid-elseif-placement',
                    message: parser.stack.some(function (block) { return block.type === 'IfBlock'; })
                        ? "Expected to close " + node_js_1.to_string(block) + " before seeing {:else if ...} block"
                        : 'Cannot have an {:else if ...} block outside an {#if ...} block'
                });
            }
            parser.require_whitespace();
            var expression = expression_js_1["default"](parser);
            parser.allow_whitespace();
            parser.eat('}', true);
            block["else"] = {
                start: parser.index,
                end: null,
                type: 'ElseBlock',
                children: [
                    {
                        start: parser.index,
                        end: null,
                        type: 'IfBlock',
                        elseif: true,
                        expression: expression,
                        children: []
                    },
                ]
            };
            parser.stack.push(block["else"].children[0]);
        }
        else {
            // :else
            var block = parser.current();
            if (block.type !== 'IfBlock' && block.type !== 'EachBlock') {
                parser.error({
                    code: 'invalid-else-placement',
                    message: parser.stack.some(function (block) { return block.type === 'IfBlock' || block.type === 'EachBlock'; })
                        ? "Expected to close " + node_js_1.to_string(block) + " before seeing {:else} block"
                        : 'Cannot have an {:else} block outside an {#if ...} or {#each ...} block'
                });
            }
            parser.allow_whitespace();
            parser.eat('}', true);
            block["else"] = {
                start: parser.index,
                end: null,
                type: 'ElseBlock',
                children: []
            };
            parser.stack.push(block["else"]);
        }
    }
    else if (parser.match(':then') || parser.match(':catch')) {
        var block = parser.current();
        var is_then = parser.eat(':then') || !parser.eat(':catch');
        if (is_then) {
            if (block.type !== 'PendingBlock') {
                parser.error({
                    code: 'invalid-then-placement',
                    message: parser.stack.some(function (block) { return block.type === 'PendingBlock'; })
                        ? "Expected to close " + node_js_1.to_string(block) + " before seeing {:then} block"
                        : 'Cannot have an {:then} block outside an {#await ...} block'
                });
            }
        }
        else {
            if (block.type !== 'ThenBlock' && block.type !== 'PendingBlock') {
                parser.error({
                    code: 'invalid-catch-placement',
                    message: parser.stack.some(function (block) { return block.type === 'ThenBlock' || block.type === 'PendingBlock'; })
                        ? "Expected to close " + node_js_1.to_string(block) + " before seeing {:catch} block"
                        : 'Cannot have an {:catch} block outside an {#await ...} block'
                });
            }
        }
        block.end = start;
        parser.stack.pop();
        var await_block = parser.current();
        if (!parser.eat('}')) {
            parser.require_whitespace();
            await_block[is_then ? 'value' : 'error'] = context_js_1["default"](parser);
            parser.allow_whitespace();
            parser.eat('}', true);
        }
        var new_block = {
            start: start,
            // @ts-ignore
            end: null,
            type: is_then ? 'ThenBlock' : 'CatchBlock',
            children: [],
            skip: false
        };
        await_block[is_then ? 'then' : 'catch'] = new_block;
        parser.stack.push(new_block);
    }
    else if (parser.eat('#')) {
        // {#if foo}, {#each foo} or {#await foo}
        var type = void 0;
        if (parser.eat('if')) {
            type = 'IfBlock';
        }
        else if (parser.eat('each')) {
            type = 'EachBlock';
        }
        else if (parser.eat('await')) {
            type = 'AwaitBlock';
        }
        else if (parser.eat('key')) {
            type = 'KeyBlock';
        }
        else {
            parser.error({
                code: 'expected-block-type',
                message: 'Expected if, each, await or key'
            });
        }
        parser.require_whitespace();
        var expression = expression_js_1["default"](parser);
        // @ts-ignore
        var block = type === 'AwaitBlock'
            ? {
                start: start,
                end: null,
                type: type,
                expression: expression,
                value: null,
                error: null,
                pending: {
                    start: null,
                    end: null,
                    type: 'PendingBlock',
                    children: [],
                    skip: true
                },
                then: {
                    start: null,
                    end: null,
                    type: 'ThenBlock',
                    children: [],
                    skip: true
                },
                "catch": {
                    start: null,
                    end: null,
                    type: 'CatchBlock',
                    children: [],
                    skip: true
                }
            }
            : {
                start: start,
                end: null,
                type: type,
                expression: expression,
                children: []
            };
        parser.allow_whitespace();
        // {#each} blocks must declare a context – {#each list as item}
        if (type === 'EachBlock') {
            parser.eat('as', true);
            parser.require_whitespace();
            block.context = context_js_1["default"](parser);
            parser.allow_whitespace();
            if (parser.eat(',')) {
                parser.allow_whitespace();
                block.index = parser.read_identifier();
                if (!block.index) {
                    parser.error({
                        code: 'expected-name',
                        message: 'Expected name'
                    });
                }
                parser.allow_whitespace();
            }
            if (parser.eat('(')) {
                parser.allow_whitespace();
                block.key = expression_js_1["default"](parser);
                parser.allow_whitespace();
                parser.eat(')', true);
                parser.allow_whitespace();
            }
        }
        var await_block_shorthand = type === 'AwaitBlock' && parser.eat('then');
        if (await_block_shorthand) {
            parser.require_whitespace();
            block.value = context_js_1["default"](parser);
            parser.allow_whitespace();
        }
        var await_block_catch_shorthand = !await_block_shorthand && type === 'AwaitBlock' && parser.eat('catch');
        if (await_block_catch_shorthand) {
            parser.require_whitespace();
            block.error = context_js_1["default"](parser);
            parser.allow_whitespace();
        }
        parser.eat('}', true);
        // @ts-ignore
        parser.current().children.push(block);
        parser.stack.push(block);
        if (type === 'AwaitBlock') {
            var child_block = void 0;
            if (await_block_shorthand) {
                block.then.skip = false;
                child_block = block.then;
            }
            else if (await_block_catch_shorthand) {
                block["catch"].skip = false;
                child_block = block["catch"];
            }
            else {
                block.pending.skip = false;
                child_block = block.pending;
            }
            child_block.start = parser.index;
            parser.stack.push(child_block);
        }
    }
    else if (parser.eat('@html')) {
        // {@html content} tag
        parser.require_whitespace();
        var expression = expression_js_1["default"](parser);
        parser.allow_whitespace();
        parser.eat('}', true);
        // @ts-ignore
        parser.current().children.push({
            start: start,
            end: parser.index,
            type: 'RawMustacheTag',
            expression: expression
        });
    }
    else if (parser.eat('@debug')) {
        // let identifiers;
        // // Implies {@debug} which indicates "debug all"
        // if (parser.read(/\s*}/)) {
        // 	identifiers = [];
        // } else {
        // 	const expression = read_expression(parser);
        // 	identifiers = expression.type === 'SequenceExpression'
        // 		? expression.expressions
        // 		: [expression];
        // 	identifiers.forEach(node => {
        // 		if (node.type !== 'Identifier') {
        // 			parser.error({
        // 				code: 'invalid-debug-args',
        // 				message: '{@debug ...} arguments must be identifiers, not arbitrary expressions'
        // 			}, node.start);
        // 		}
        // 	});
        // 	parser.allow_whitespace();
        // 	parser.eat('}', true);
        // }
        // parser.current().children.push({
        // 	start,
        // 	end: parser.index,
        // 	type: 'DebugTag',
        // 	identifiers
        // });
        throw new Error('@debug not yet supported');
    }
    else {
        var expression = expression_js_1["default"](parser);
        parser.allow_whitespace();
        parser.eat('}', true);
        // @ts-ignore
        parser.current().children.push({
            start: start,
            end: parser.index,
            type: 'MustacheTag',
            expression: expression
        });
    }
}
exports["default"] = mustache;
