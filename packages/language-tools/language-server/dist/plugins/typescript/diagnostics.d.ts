import type { Diagnostic } from '@volar/language-server';
export declare enum DiagnosticCodes {
	IS_NOT_A_MODULE = 2306, // '{0}' is not a module.
	CANNOT_FIND_MODULE = 2307, // Cannot find module '{0}' or its corresponding type declarations.
	DUPLICATED_JSX_ATTRIBUTES = 17001, // JSX elements cannot have multiple attributes with the same name.
	CANT_RETURN_OUTSIDE_FUNC = 1108, // A 'return' statement can only be used within a function body.
	ISOLATED_MODULE_COMPILE_ERR = 1208, // '{0}' cannot be compiled under '--isolatedModules' because it is considered a global script file.
	TYPE_NOT_ASSIGNABLE = 2322, // Type '{0}' is not assignable to type '{1}'.
	JSX_NO_CLOSING_TAG = 17008, // JSX element '{0}' has no corresponding closing tag.
	JSX_ELEMENT_NO_CALL = 2604,
}
export declare function enhancedProvideSemanticDiagnostics(
	originalDiagnostics: Diagnostic[],
	tsxLineCount?: number,
): Diagnostic[];
