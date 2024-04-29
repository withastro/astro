import {
	deselectScripts,
	restoreFocus,
	saveFocus,
	swapBodyElement,
	swapHeadElements,
	swapRootAttributes,
} from './swap-functions.js';

export interface SwapperOptions {
	deselectScripts?: (doc: Document) => void;
	swapRootAttributes?: (doc: Document) => void;
	swapHeadElements?: (doc: Document) => void;
	swapBodyElement?: (newElement: Element, oldElement: Element) => void;
	saveFocus?: () => any;
	restoreFocus?: (savedFocus: any) => void;
}

export class CustomSwapper {
	swap(doc: Document) {
		this.#deselectScripts(doc);
		this.#swapRootAttributes(doc);
		this.#swapHeadElements(doc);
		const savedFocus = this.#saveFocus();
		this.#swapBodyElement(doc.body, document.body);
		this.#restoreFocus(savedFocus);
	}

	#deselectScripts: (doc: Document) => void;
	#swapRootAttributes: (doc: Document) => void;
	#swapHeadElements: (doc: Document) => void;
	#swapBodyElement: (newElement: Element, oldElement: Element) => void;
	#saveFocus: () => void;
	#restoreFocus: (savedFocus: any) => void;
	constructor(options: SwapperOptions) {
		this.#deselectScripts = options.deselectScripts || deselectScripts;
		this.#swapRootAttributes = options.swapRootAttributes || swapRootAttributes;
		this.#swapHeadElements = options.swapHeadElements || swapHeadElements;
		this.#swapBodyElement = options.swapBodyElement || swapBodyElement;
		this.#saveFocus = options.saveFocus || saveFocus;
		this.#restoreFocus = options.restoreFocus || restoreFocus;
	}
}
