import {
    SemanticTokensLegend,
    SemanticTokenModifiers,
    SemanticTokenTypes
} from 'vscode-languageserver';

/**
 * extended from https://github.com/microsoft/TypeScript/blob/35c8df04ad959224fad9037e340c1e50f0540a49/src/services/classifier2020.ts#L9
 * so that we don't have to map it into our own legend
 */
export const enum TokenType {
    class,
    enum,
    interface,
    namespace,
    typeParameter,
    type,
    parameter,
    variable,
    enumMember,
    property,
    function,
    member,

    // svelte
    event
}

/**
 * adopted from https://github.com/microsoft/TypeScript/blob/35c8df04ad959224fad9037e340c1e50f0540a49/src/services/classifier2020.ts#L13
 * so that we don't have to map it into our own legend
 */
export const enum TokenModifier {
    declaration,
    static,
    async,
    readonly,
    defaultLibrary,
    local
}

export function getSemanticTokenLegends(): SemanticTokensLegend {
    const tokenModifiers: string[] = [];

    (
        [
            [TokenModifier.declaration, SemanticTokenModifiers.declaration],
            [TokenModifier.static, SemanticTokenModifiers.static],
            [TokenModifier.async, SemanticTokenModifiers.async],
            [TokenModifier.readonly, SemanticTokenModifiers.readonly],
            [TokenModifier.defaultLibrary, SemanticTokenModifiers.defaultLibrary],
            [TokenModifier.local, 'local']
        ] as const
    ).forEach(([tsModifier, legend]) => (tokenModifiers[tsModifier] = legend));

    const tokenTypes: string[] = [];

    (
        [
            [TokenType.class, SemanticTokenTypes.class],
            [TokenType.enum, SemanticTokenTypes.enum],
            [TokenType.interface, SemanticTokenTypes.interface],
            [TokenType.namespace, SemanticTokenTypes.namespace],
            [TokenType.typeParameter, SemanticTokenTypes.typeParameter],
            [TokenType.type, SemanticTokenTypes.type],
            [TokenType.parameter, SemanticTokenTypes.parameter],
            [TokenType.variable, SemanticTokenTypes.variable],
            [TokenType.enumMember, SemanticTokenTypes.enumMember],
            [TokenType.property, SemanticTokenTypes.property],
            [TokenType.function, SemanticTokenTypes.function],

            // member is renamed to method in vscode codebase to match LSP default
            [TokenType.member, SemanticTokenTypes.method],
            [TokenType.event, SemanticTokenTypes.event]
        ] as const
    ).forEach(([tokenType, legend]) => (tokenTypes[tokenType] = legend));

    return {
        tokenModifiers,
        tokenTypes
    };
}
