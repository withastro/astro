import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { ErrorHandler, ErrorHandlerInput } from '../definitions.js';

export class AstroErrorHandler implements ErrorHandler {
	private getProps(input: ErrorHandlerInput): ConstructorParameters<typeof AstroError>[0] {
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
		}
		input satisfies never;
		// Should never happen
		return AstroErrorData.UnknownError;
	}

	handle(input: ErrorHandlerInput): Error {
		return new AstroError(this.getProps(input), { cause: input.cause });
	}
}
