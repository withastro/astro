import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { ErrorHandler, ErrorHandlerInput } from '../definitions.js';

export class AstroErrorHandler implements ErrorHandler {
	private getProps(
		input: Pick<ErrorHandlerInput, 'type' | 'data'>,
	): ConstructorParameters<typeof AstroError>[0] {
		if (input.type === 'cannot-load-font-provider') {
			return {
				...AstroErrorData.CannotLoadFontProvider,
				message: AstroErrorData.CannotLoadFontProvider.message(input.data.entrypoint),
			};
		}
		input.type satisfies never;
		throw new Error('Should never happen');
	}

	handle({ type, data, cause }: ErrorHandlerInput): Error {
		return new AstroError(this.getProps({ type, data }), { cause });
	}
}
