"use strict";
// @ts-nocheck
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.CompileError = void 0;
var locate_character_1 = require("locate-character");
var get_code_frame_js_1 = require("./get_code_frame.js");
var CompileError = /** @class */ (function (_super) {
    __extends(CompileError, _super);
    function CompileError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CompileError.prototype.toString = function () {
        return this.message + " (" + this.start.line + ":" + this.start.column + ")\n" + this.frame;
    };
    return CompileError;
}(Error));
exports.CompileError = CompileError;
/** Throw CompileError */
function error(message, props) {
    var err = new CompileError(message);
    err.name = props.name;
    var start = locate_character_1.locate(props.source, props.start, { offsetLine: 1 });
    var end = locate_character_1.locate(props.source, props.end || props.start, { offsetLine: 1 });
    err.code = props.code;
    err.start = start;
    err.end = end;
    err.pos = props.start;
    err.filename = props.filename;
    err.frame = get_code_frame_js_1["default"](props.source, start.line - 1, start.column);
    throw err;
}
exports["default"] = error;
