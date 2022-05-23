export interface SvelteNode {
    start: number;
    end: number;
    type: string;
    parent?: SvelteNode;
}

/**
 * Returns when given node represents an HTML Attribute.
 * Example: The `class` in `<div class=".."`.
 * Note: This method returns `false` for shorthands like `<div {foo}`.
 */
export function isAttributeName(
    node: SvelteNode | null | undefined,
    only?: 'Element' | 'InlineComponent'
): boolean {
    return !!node && node.type === 'Attribute' && (!only || node.parent?.type === only);
}

/**
 * Returns when given node represents an HTML element.
 * Example: The `div` in `<div class=".."`.
 * Note: This method returns `false` for shorthands like `<div {foo}`.
 */
export function isHTMLElement(
    node: SvelteNode | null | undefined,
    only?: 'Element' | 'InlineComponent'
): boolean {
    return !!node && node.type === 'Attribute' && (!only || node.parent?.type === only);
}

/**
 * Returns when given node represents an HTML Attribute shorthand or is inside one.
 * Example: The `{foo}` in `<div {foo}`
 */
export function isAttributeShorthand(
    node: SvelteNode | null | undefined,
    only?: 'Element' | 'InlineComponent'
): boolean {
    if (!node) {
        return false;
    }
    do {
        // We could get the expression, or the shorthand, or the attribute
        // Be pragmatic and just go upwards until we can't anymore
        if (isAttributeName(node, only)) {
            return true;
        }
        node = node.parent!;
    } while (node);
    return false;
}

/**
 * Returns when given node represents an HTML Attribute shorthand or is inside one.
 * Example: The `on:click={foo}` in `<div on:click={foo}`
 */
export function isEventHandler(
    node: SvelteNode | null | undefined,
    only?: 'Element' | 'InlineComponent'
) {
    return !!node && node.type === 'EventHandler' && (!only || node.parent?.type === only);
}
