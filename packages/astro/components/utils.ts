export function getFunctionExpression(slots: any) {
    if (!slots) return;
    if ('default' in slots) {
        if (typeof slots.default === 'function') return slots.default;
        if (typeof slots.default === 'object' && 'expressions' in slots.default && typeof slots.default.expressions[0] === 'function') return slots.default.expressions[0];
    }
}
