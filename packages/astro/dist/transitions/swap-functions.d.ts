export type SavedFocus = {
	activeElement: HTMLElement | null;
	start?: number | null;
	end?: number | null;
};
export declare function detectScriptExecuted(script: HTMLScriptElement): boolean;
export declare function deselectScripts(doc: Document): void;
export declare function swapRootAttributes(newDoc: Document): void;
export declare function swapHeadElements(doc: Document): void;
export declare function swapBodyElement(newElement: Element, oldElement: Element): void;
export declare const saveFocus: () => () => void;
export declare const restoreFocus: ({ activeElement, start, end }: SavedFocus) => void;
export declare const vueScopedStyleId: (el: HTMLStyleElement) => string;
export declare const swapFunctions: {
	deselectScripts: typeof deselectScripts;
	swapRootAttributes: typeof swapRootAttributes;
	swapHeadElements: typeof swapHeadElements;
	swapBodyElement: typeof swapBodyElement;
	saveFocus: () => () => void;
};
export declare const swap: (doc: Document) => void;
