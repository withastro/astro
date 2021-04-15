"use strict";
exports.__esModule = true;
/** Display an array of strings in a human-readable format */
function list(items, conjunction) {
    if (conjunction === void 0) { conjunction = 'or'; }
    if (items.length === 1)
        return items[0];
    return items.slice(0, -1).join(', ') + " " + conjunction + " " + items[items.length - 1];
}
exports["default"] = list;
