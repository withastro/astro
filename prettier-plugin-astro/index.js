/** @type {Partial<import('prettier').SupportLanguage>[]} */
module.exports.languages = [
    {
        name: 'astro',
        parsers: ['astro'],
        extensions: ['.astro'],
        vscodeLanguageIds: ['astro'],
    },
];

/** @type {Record<string, import('prettier').Parser>} */
module.exports.parsers = {
    astro: {
        parse: (text, parsers) => {

        },
        locEnd(node) {
            return node.locEnd
        },
        locStart(node) {
            return node.locStart
        },
        astFormat: 'astro-ast',
    },
};

/** @type {Record<string, import('prettier').Printer>} */
module.exports.printers = {
    'astro-ast': {
        print() {
            /** @type {any} */
            const doc = {};
            return doc;
        }
    },
};
