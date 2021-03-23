"use strict";
// import { Position, CompletionItem, CompletionList, TextEdit, CompletionItemKind, Range } from 'vscode-languageserver-types';
// import { CompletionContext } from 'vscode-languageserver/node';
// import { TextDocument } from 'vscode-languageserver-textdocument';
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.wordPatterns = exports.triggerCharacter = void 0;
exports.triggerCharacter = {
    typescript: ['.', '"', "'", '`', '/', '@', '<', '#'],
    html: ['<', ':', '@'],
    css: ['.', '@'],
};
exports.wordPatterns = {
    css: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g,
    scss: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@$#.!])?[\w-?]+%?|[@#!$.])/g,
};
function register(...args) {
    console.log(args);
}
exports.register = register;
//# sourceMappingURL=completions.js.map