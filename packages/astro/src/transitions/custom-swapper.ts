import {
	deselectScripts,
	saveFocus,
	swapBodyElement,
	swapHeadElements,
	swapRootAttributes,
} from './swap-functions.js';

export interface SwapperOptions {
	deselectScripts: (doc: Document) => void;
	swapRootAttributes: (doc: Document) => void;
	swapHeadElements: (doc: Document) => void;
	swapBodyElement: (newElement: Element, oldElement: Element) => void;
	saveFocus: () => () => void;
}

type Extension<Args extends any[], Return> = ((...args: [...Args, next: (...args: Args) => Return]) => Return);

type SwapperExtensions = {
	[K in keyof SwapperOptions]?: Extension<Parameters<SwapperOptions[K]>, ReturnType<SwapperOptions[K]>>
}

export class CustomSwapper {
	swap(doc: Document) {
		this.#deselectScripts(doc);
		this.#swapRootAttributes(doc);
		this.#swapHeadElements(doc);
		const restoreFocus = this.#saveFocus();
		this.#swapBodyElement(doc.body, document.body);
		restoreFocus();
	}

	#deselectScripts: (doc: Document) => void = deselectScripts;
	#swapRootAttributes: (doc: Document) => void = swapRootAttributes;
	#swapHeadElements: (doc: Document) => void = swapHeadElements;
	#swapBodyElement: (newElement: Element, oldElement: Element) => void = swapBodyElement;
	#saveFocus: () => () => void = saveFocus;

	public extend(extensions: SwapperExtensions): void {
		this.#deselectScripts = CustomSwapper.makeExtension(this.#deselectScripts, extensions.deselectScripts);
		this.#swapRootAttributes = CustomSwapper.makeExtension(this.#swapRootAttributes, extensions.swapRootAttributes);
		this.#swapHeadElements = CustomSwapper.makeExtension(this.#swapHeadElements, extensions.swapHeadElements);
		this.#swapBodyElement = CustomSwapper.makeExtension(this.#swapBodyElement, extensions.swapBodyElement);
		this.#saveFocus = CustomSwapper.makeExtension(this.#saveFocus, extensions.saveFocus);
	}

	private static makeExtension<Args extends any[], Return>(
		current: (...args: Args) => Return,
		extension?: Extension<Args, Return>
	): ((...args: Args) => Return) {
		return extension === undefined ? current : (...args) => {
			return extension(...args, current);
		}
	}
}
