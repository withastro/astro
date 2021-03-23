"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
async function activate() {
    onConfigUpdated();
    vscode.workspace.onDidChangeConfiguration(onConfigUpdated);
    function onConfigUpdated() {
        const astro = vscode.extensions.getExtension('skypack.astro');
        if (!astro) {
            return;
        }
        const emmet = vscode.extensions.getExtension('vscode.emmet');
        if (!emmet) {
            return;
        }
        const emmetIncludeLanguages = getEmmetIncludeLanguages();
        if (emmetIncludeLanguages && emmetIncludeLanguages['astro']) {
            return;
        }
        setEmmetIncludeLanguages({ ...emmetIncludeLanguages, astro: 'html' });
    }
    function getEmmetIncludeLanguages() {
        return vscode.workspace.getConfiguration('emmet').get('includeLanguages');
    }
    function setEmmetIncludeLanguages(value) {
        return vscode.workspace.getConfiguration('emmet').set('includeLanguages', value);
    }
}
exports.activate = activate;
//# sourceMappingURL=settings.js.map