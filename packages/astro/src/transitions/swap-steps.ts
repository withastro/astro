import {
	deselectScripts,
	saveFocus,
	swapBodyElement,
	swapHeadElements,
	swapRootAttributes,
} from './swap-functions.js';

export interface SwapStepsOptions {
	deselectScripts: (doc: Document) => void;
	swapRootAttributes: (doc: Document) => void;
	swapHeadElements: (doc: Document) => void;
	swapBodyElement: (newElement: Element, oldElement: Element) => void;
	saveFocus: () => () => void;
}

type Extension<Args extends any[], Return> = ((...args: [...Args, next: (...args: Args) => Return]) => Return);

type SwapStepsExtensions = {
	[K in keyof SwapStepsOptions]?: Extension<Parameters<SwapStepsOptions[K]>, ReturnType<SwapStepsOptions[K]>>
};

class SwapSteps {
	extended(doc: Document) {
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

	public extend(extensions: SwapStepsExtensions): void {
		this.#deselectScripts = SwapSteps.makeExtension(this.#deselectScripts, extensions.deselectScripts);
		this.#swapRootAttributes = SwapSteps.makeExtension(this.#swapRootAttributes, extensions.swapRootAttributes);
		this.#swapHeadElements = SwapSteps.makeExtension(this.#swapHeadElements, extensions.swapHeadElements);
		this.#swapBodyElement = SwapSteps.makeExtension(this.#swapBodyElement, extensions.swapBodyElement);
		this.#saveFocus = SwapSteps.makeExtension(this.#saveFocus, extensions.saveFocus);
	}

	private static makeExtension<Args extends any[], Return>(
		current: (...args: Args) => Return,
		extension?: Extension<Args, Return>
	): ((...args: Args) => Return) {
		return extension === undefined ? current : (...args) => {
			return extension(...args, current);
		};
	}
}
export let builtInSwap = new SwapSteps();
document.addEventListener('astro:after-swap', () => builtInSwap = new SwapSteps());
