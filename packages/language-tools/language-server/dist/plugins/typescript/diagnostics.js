'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DiagnosticCodes = void 0;
exports.enhancedProvideSemanticDiagnostics = enhancedProvideSemanticDiagnostics;
// List of codes:
// https://github.com/Microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
var DiagnosticCodes;
(function (DiagnosticCodes) {
	DiagnosticCodes[(DiagnosticCodes['IS_NOT_A_MODULE'] = 2306)] = 'IS_NOT_A_MODULE';
	DiagnosticCodes[(DiagnosticCodes['CANNOT_FIND_MODULE'] = 2307)] = 'CANNOT_FIND_MODULE';
	DiagnosticCodes[(DiagnosticCodes['DUPLICATED_JSX_ATTRIBUTES'] = 17001)] =
		'DUPLICATED_JSX_ATTRIBUTES';
	DiagnosticCodes[(DiagnosticCodes['CANT_RETURN_OUTSIDE_FUNC'] = 1108)] =
		'CANT_RETURN_OUTSIDE_FUNC';
	DiagnosticCodes[(DiagnosticCodes['ISOLATED_MODULE_COMPILE_ERR'] = 1208)] =
		'ISOLATED_MODULE_COMPILE_ERR';
	DiagnosticCodes[(DiagnosticCodes['TYPE_NOT_ASSIGNABLE'] = 2322)] = 'TYPE_NOT_ASSIGNABLE';
	DiagnosticCodes[(DiagnosticCodes['JSX_NO_CLOSING_TAG'] = 17008)] = 'JSX_NO_CLOSING_TAG';
	DiagnosticCodes[(DiagnosticCodes['JSX_ELEMENT_NO_CALL'] = 2604)] = 'JSX_ELEMENT_NO_CALL';
})(DiagnosticCodes || (exports.DiagnosticCodes = DiagnosticCodes = {}));
function enhancedProvideSemanticDiagnostics(originalDiagnostics, tsxLineCount) {
	const diagnostics = originalDiagnostics
		.filter(
			(diagnostic) =>
				(tsxLineCount ? diagnostic.range.start.line <= tsxLineCount : true) &&
				isNoCantReturnOutsideFunction(diagnostic) &&
				isNoIsolatedModuleError(diagnostic) &&
				isNoJsxCannotHaveMultipleAttrsError(diagnostic),
		)
		.map((diag) =>
			tsxLineCount ? generalEnhancements(astroEnhancements(diag)) : generalEnhancements(diag),
		);
	return diagnostics;
}
// General enhancements that apply to all files
function generalEnhancements(diagnostic) {
	if (
		diagnostic.code === DiagnosticCodes.CANNOT_FIND_MODULE &&
		diagnostic.message.includes('astro:content')
	) {
		diagnostic.message +=
			"\n\nIf you're using content collections, make sure to run `astro dev`, `astro build` or `astro sync` to first generate the types so you can import from them. If you already ran one of those commands, restarting the language server might be necessary in order for the change to take effect.";
		return diagnostic;
	}
	return diagnostic;
}
/**
 * Astro-specific enhancements. For instance, when the user tries to import a component from a framework that is not installed
 * or a difference with JSX needing a different error message
 */
function astroEnhancements(diagnostic) {
	// When the language integrations are not installed, the content of the imported snapshot is empty
	// As such, it triggers the "is not a module error", which we can enhance with a more helpful message for the related framework
	if (diagnostic.code === DiagnosticCodes.IS_NOT_A_MODULE) {
		if (diagnostic.message.includes('.svelte')) {
			diagnostic.message +=
				'\n\nIs the `@astrojs/svelte` package installed? You can add it to your project by running the following command: `astro add svelte`. If already installed, restarting the language server might be necessary in order for the change to take effect.';
		}
		if (diagnostic.message.includes('.vue')) {
			diagnostic.message +=
				'\n\nIs the `@astrojs/vue` package installed? You can add it to your project by running the following command: `astro add vue`. If already installed, restarting the language server might be necessary in order for the change to take effect.';
		}
		return diagnostic;
	}
	// JSX element has no closing tag. JSX -> HTML
	if (diagnostic.code === DiagnosticCodes.JSX_NO_CLOSING_TAG) {
		return {
			...diagnostic,
			message: diagnostic.message.replace('JSX', 'HTML'),
		};
	}
	// JSX Element can't be constructed or called. This happens on syntax errors / invalid components
	if (diagnostic.code === DiagnosticCodes.JSX_ELEMENT_NO_CALL) {
		return {
			...diagnostic,
			message: diagnostic.message
				.replace('JSX element type', 'Component')
				.replace(
					'does not have any construct or call signatures.',
					'is not a valid component.\n\nIf this is a Svelte or Vue component, it might have a syntax error that makes it impossible to parse.',
				),
		};
	}
	// For the rare case where an user might try to put a client directive on something that is not a component
	if (diagnostic.code === DiagnosticCodes.TYPE_NOT_ASSIGNABLE) {
		if (
			diagnostic.message.includes("Property 'client:") &&
			diagnostic.message.includes("to type 'HTMLAttributes")
		) {
			return {
				...diagnostic,
				message:
					diagnostic.message + '\n\nClient directives are only available on framework components.',
			};
		}
	}
	return diagnostic;
}
/**
 * Astro allows multiple attributes to have the same name
 */
function isNoJsxCannotHaveMultipleAttrsError(diagnostic) {
	return diagnostic.code !== DiagnosticCodes.DUPLICATED_JSX_ATTRIBUTES;
}
/**
 * Ignore "Can't return outside of function body"
 * Since the frontmatter is at the top level, users trying to return a Response for SSR mode run into this
 * TODO: Update the TSX shape so this is not an issue anymore
 */
function isNoCantReturnOutsideFunction(diagnostic) {
	return diagnostic.code !== DiagnosticCodes.CANT_RETURN_OUTSIDE_FUNC;
}
/**
 * When the content of the file is invalid and can't be parsed properly for TSX generation, TS will show an error about
 * how the current module can't be compiled under --isolatedModule, this is confusing to users so let's ignore this
 */
function isNoIsolatedModuleError(diagnostic) {
	return diagnostic.code !== DiagnosticCodes.ISOLATED_MODULE_COMPILE_ERR;
}
//# sourceMappingURL=diagnostics.js.map
