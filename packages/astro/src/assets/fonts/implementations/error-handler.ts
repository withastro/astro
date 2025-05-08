import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { ErrorHandler, ErrorHandlerInput } from '../definitions.js';

function getProps(input: ErrorHandlerInput): ConstructorParameters<typeof AstroError>[0] {
	if (input.type === 'cannot-load-font-provider') {
		return {
			...AstroErrorData.CannotLoadFontProvider,
			message: AstroErrorData.CannotLoadFontProvider.message(input.data.entrypoint),
		};
	} else if (input.type === 'unknown-fs-error') {
		return AstroErrorData.UnknownFilesystemError;
	} else if (input.type === 'cannot-fetch-font-file') {
		return {
			...AstroErrorData.CannotFetchFontFile,
			message: AstroErrorData.CannotFetchFontFile.message(input.data.url),
		};
	} else if (input.type === 'cannot-extract-font-type') {
		return {
			...AstroErrorData.CannotExtractFontType,
			message: AstroErrorData.CannotExtractFontType.message(input.data.url),
		};
	} else if (input.type === 'cannot-extract-data') {
		return {
			...AstroErrorData.CannotDetermineWeightAndStyleFromFontFile,
			message: AstroErrorData.CannotDetermineWeightAndStyleFromFontFile.message(
				input.data.family,
				input.data.url,
			),
		};
	}
	input satisfies never;
	// Should never happen but TS isn't happy
	return AstroErrorData.UnknownError;
}

export function createAstroErrorHandler(): ErrorHandler {
	return {
		handle(input) {
			return new AstroError(getProps(input), { cause: input.cause });
		},
	};
}
