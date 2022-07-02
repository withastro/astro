/// <reference lib="dom" />
/* eslint @typescript-eslint/no-unused-vars: off */
/**
 * Adapted from babel-plugin-react-html-attrs's TypeScript definition from DefinitelyTyped.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/babel-plugin-react-html-attrs/index.d.ts
 *
 * and
 *
 * Adapted from React’s TypeScript definition from DefinitelyTyped.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts
 */
declare namespace astroHTML.JSX {
	/* html jsx */
	export type Child = Node | Node[] | string | number | boolean | null | undefined | unknown;
	export type Children = Child | Child[];

	interface ElementChildrenAttribute {
		// eslint-disable-next-line @typescript-eslint/ban-types
		children: {};
	}

	interface IntrinsicAttributes extends AstroBuiltinProps, AstroBuiltinAttributes {
		slot?: string;
		children?: Children;
	}

	type AstroBuiltinProps = import('astro').AstroBuiltinProps;
	type AstroBuiltinAttributes = import('astro').AstroBuiltinAttributes;
	type AstroDefineVarsAttribute = import('astro').AstroDefineVarsAttribute;
	type AstroScriptAttributes = import('astro').AstroScriptAttributes & AstroDefineVarsAttribute;
	type AstroStyleAttributes = import('astro').AstroStyleAttributes & AstroDefineVarsAttribute;

	// Certain Astro methods returns AstroComponent using AstroComponentFactory
	// The language-server does not really like this because it expects Elements to
	// all be compatible with HTMLElement so we'll add AstroComponentFactory as a valid element type
	type AstroComponent = import('astro').AstroComponentFactory;
	type Element = HTMLElement | AstroComponent;

	interface DOMAttributes {
		children?: Children;

		// Clipboard Events
		oncopy?: string | undefined | null;
		oncut?: string | undefined | null;
		onpaste?: string | undefined | null;

		// Composition Events
		oncompositionend?: string | undefined | null;
		oncompositionstart?: string | undefined | null;
		oncompositionupdate?: string | undefined | null;

		// Focus Events
		onfocus?: string | undefined | null;
		onfocusin?: string | undefined | null;
		onfocusout?: string | undefined | null;
		onblur?: string | undefined | null;

		// Form Events
		onchange?: string | undefined | null;
		oninput?: string | undefined | null;
		onreset?: string | undefined | null;
		onsubmit?: string | undefined | null;
		oninvalid?: string | undefined | null;
		onbeforeinput?: string | undefined | null;

		// Image Events
		onload?: string | undefined | null;
		onerror?: string | undefined | null; // also a Media Event

		// Detail Events
		ontoggle?: string | undefined | null;

		// Keyboard Events
		onkeydown?: string | undefined | null;
		onkeypress?: string | undefined | null;
		onkeyup?: string | undefined | null;

		// Media Events
		onabort?: string | undefined | null;
		oncanplay?: string | undefined | null;
		oncanplaythrough?: string | undefined | null;
		oncuechange?: string | undefined | null;
		ondurationchange?: string | undefined | null;
		onemptied?: string | undefined | null;
		onencrypted?: string | undefined | null;
		onended?: string | undefined | null;
		onloadeddata?: string | undefined | null;
		onloadedmetadata?: string | undefined | null;
		onloadstart?: string | undefined | null;
		onpause?: string | undefined | null;
		onplay?: string | undefined | null;
		onplaying?: string | undefined | null;
		onprogress?: string | undefined | null;
		onratechange?: string | undefined | null;
		onseeked?: string | undefined | null;
		onseeking?: string | undefined | null;
		onstalled?: string | undefined | null;
		onsuspend?: string | undefined | null;
		ontimeupdate?: string | undefined | null;
		onvolumechange?: string | undefined | null;
		onwaiting?: string | undefined | null;

		// MouseEvents
		onauxclick?: string | undefined | null;
		onclick?: string | undefined | null;
		oncontextmenu?: string | undefined | null;
		ondblclick?: string | undefined | null;
		ondrag?: string | undefined | null;
		ondragend?: string | undefined | null;
		ondragenter?: string | undefined | null;
		ondragexit?: string | undefined | null;
		ondragleave?: string | undefined | null;
		ondragover?: string | undefined | null;
		ondragstart?: string | undefined | null;
		ondrop?: string | undefined | null;
		onmousedown?: string | undefined | null;
		onmouseenter?: string | undefined | null;
		onmouseleave?: string | undefined | null;
		onmousemove?: string | undefined | null;
		onmouseout?: string | undefined | null;
		onmouseover?: string | undefined | null;
		onmouseup?: string | undefined | null;

		// Selection Events
		onselect?: string | undefined | null;
		onselectionchange?: string | undefined | null;
		onselectstart?: string | undefined | null;

		// Touch Events
		ontouchcancel?: string | undefined | null;
		ontouchend?: string | undefined | null;
		ontouchmove?: string | undefined | null;
		ontouchstart?: string | undefined | null;

		// Pointer Events
		ongotpointercapture?: string | undefined | null;
		onpointercancel?: string | undefined | null;
		onpointerdown?: string | undefined | null;
		onpointerenter?: string | undefined | null;
		onpointerleave?: string | undefined | null;
		onpointermove?: string | undefined | null;
		onpointerout?: string | undefined | null;
		onpointerover?: string | undefined | null;
		onpointerup?: string | undefined | null;
		onlostpointercapture?: string | undefined | null;

		// UI Events
		onscroll?: string | undefined | null;
		onresize?: string | undefined | null;

		// Wheel Events
		onwheel?: string | undefined | null;

		// Animation Events
		onanimationstart?: string | undefined | null;
		onanimationend?: string | undefined | null;
		onanimationiteration?: string | undefined | null;

		// Transition Events
		ontransitionstart?: string | undefined | null;
		ontransitionrun?: string | undefined | null;
		ontransitionend?: string | undefined | null;
		ontransitioncancel?: string | undefined | null;

		// Message Events
		onmessage?: string | undefined | null;
		onmessageerror?: string | undefined | null;

		// Global Events
		oncancel?: string | undefined | null;
		onclose?: string | undefined | null;
		onfullscreenchange?: string | undefined | null;
		onfullscreenerror?: string | undefined | null;
	}

	// All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
	interface AriaAttributes {
		/** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
		'aria-activedescendant'?: string | undefined | null;
		/** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
		'aria-atomic'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
		 * presented if they are made.
		 */
		'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both' | undefined | null;
		/** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
		'aria-busy'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
		 * @see aria-pressed @see aria-selected.
		 */
		'aria-checked'?: boolean | 'false' | 'mixed' | 'true' | undefined | null;
		/**
		 * Defines the total number of columns in a table, grid, or treegrid.
		 * @see aria-colindex.
		 */
		'aria-colcount'?: number | string | undefined | null;
		/**
		 * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
		 * @see aria-colcount @see aria-colspan.
		 */
		'aria-colindex'?: number | string | undefined | null;
		/**
		 * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
		 * @see aria-colindex @see aria-rowspan.
		 */
		'aria-colspan'?: number | string | undefined | null;
		/**
		 * Identifies the element (or elements) whose contents or presence are controlled by the current element.
		 * @see aria-owns.
		 */
		'aria-controls'?: string | undefined | null;
		/** Indicates the element that represents the current item within a container or set of related elements. */
		'aria-current'?:
			| boolean
			| 'false'
			| 'true'
			| 'page'
			| 'step'
			| 'location'
			| 'date'
			| 'time'
			| undefined
			| null;
		/**
		 * Identifies the element (or elements) that describes the object.
		 * @see aria-labelledby
		 */
		'aria-describedby'?: string | undefined | null;
		/**
		 * Identifies the element that provides a detailed, extended description for the object.
		 * @see aria-describedby.
		 */
		'aria-details'?: string | undefined | null;
		/**
		 * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
		 * @see aria-hidden @see aria-readonly.
		 */
		'aria-disabled'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Indicates what functions can be performed when a dragged object is released on the drop target.
		 * @deprecated in ARIA 1.1
		 */
		'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | undefined | null;
		/**
		 * Identifies the element that provides an error message for the object.
		 * @see aria-invalid @see aria-describedby.
		 */
		'aria-errormessage'?: string | undefined | null;
		/** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
		'aria-expanded'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
		 * allows assistive technology to override the general default of reading in document source order.
		 */
		'aria-flowto'?: string | undefined | null;
		/**
		 * Indicates an element's "grabbed" state in a drag-and-drop operation.
		 * @deprecated in ARIA 1.1
		 */
		'aria-grabbed'?: boolean | 'false' | 'true' | undefined | null;
		/** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
		'aria-haspopup'?:
			| boolean
			| 'false'
			| 'true'
			| 'menu'
			| 'listbox'
			| 'tree'
			| 'grid'
			| 'dialog'
			| undefined
			| null;
		/**
		 * Indicates whether the element is exposed to an accessibility API.
		 * @see aria-disabled.
		 */
		'aria-hidden'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Indicates the entered value does not conform to the format expected by the application.
		 * @see aria-errormessage.
		 */
		'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling' | undefined | null;
		/** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
		'aria-keyshortcuts'?: string | undefined | null;
		/**
		 * Defines a string value that labels the current element.
		 * @see aria-labelledby.
		 */
		'aria-label'?: string | undefined | null;
		/**
		 * Identifies the element (or elements) that labels the current element.
		 * @see aria-describedby.
		 */
		'aria-labelledby'?: string | undefined | null;
		/** Defines the hierarchical level of an element within a structure. */
		'aria-level'?: number | string | undefined | null;
		/** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
		'aria-live'?: 'off' | 'assertive' | 'polite' | undefined | null;
		/** Indicates whether an element is modal when displayed. */
		'aria-modal'?: boolean | 'false' | 'true' | undefined | null;
		/** Indicates whether a text box accepts multiple lines of input or only a single line. */
		'aria-multiline'?: boolean | 'false' | 'true' | undefined | null;
		/** Indicates that the user may select more than one item from the current selectable descendants. */
		'aria-multiselectable'?: boolean | 'false' | 'true' | undefined | null;
		/** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
		'aria-orientation'?: 'horizontal' | 'vertical' | undefined | null;
		/**
		 * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
		 * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
		 * @see aria-controls.
		 */
		'aria-owns'?: string | undefined | null;
		/**
		 * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
		 * A hint could be a sample value or a brief description of the expected format.
		 */
		'aria-placeholder'?: string | undefined | null;
		/**
		 * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
		 * @see aria-setsize.
		 */
		'aria-posinset'?: number | string | undefined | null;
		/**
		 * Indicates the current "pressed" state of toggle buttons.
		 * @see aria-checked @see aria-selected.
		 */
		'aria-pressed'?: boolean | 'false' | 'mixed' | 'true' | undefined | null;
		/**
		 * Indicates that the element is not editable, but is otherwise operable.
		 * @see aria-disabled.
		 */
		'aria-readonly'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
		 * @see aria-atomic.
		 */
		'aria-relevant'?:
			| 'additions'
			| 'additions removals'
			| 'additions text'
			| 'all'
			| 'removals'
			| 'removals additions'
			| 'removals text'
			| 'text'
			| 'text additions'
			| 'text removals'
			| undefined
			| null;
		/** Indicates that user input is required on the element before a form may be submitted. */
		'aria-required'?: boolean | 'false' | 'true' | undefined | null;
		/** Defines a human-readable, author-localized description for the role of an element. */
		'aria-roledescription'?: string | undefined | null;
		/**
		 * Defines the total number of rows in a table, grid, or treegrid.
		 * @see aria-rowindex.
		 */
		'aria-rowcount'?: number | string | undefined | null;
		/**
		 * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
		 * @see aria-rowcount @see aria-rowspan.
		 */
		'aria-rowindex'?: number | string | undefined | null;
		/**
		 * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
		 * @see aria-rowindex @see aria-colspan.
		 */
		'aria-rowspan'?: number | string | undefined | null;
		/**
		 * Indicates the current "selected" state of various widgets.
		 * @see aria-checked @see aria-pressed.
		 */
		'aria-selected'?: boolean | 'false' | 'true' | undefined | null;
		/**
		 * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
		 * @see aria-posinset.
		 */
		'aria-setsize'?: number | string | undefined | null;
		/** Indicates if items in a table or grid are sorted in ascending or descending order. */
		'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other' | undefined | null;
		/** Defines the maximum allowed value for a range widget. */
		'aria-valuemax'?: number | string | undefined | null;
		/** Defines the minimum allowed value for a range widget. */
		'aria-valuemin'?: number | string | undefined | null;
		/**
		 * Defines the current value for a range widget.
		 * @see aria-valuetext.
		 */
		'aria-valuenow'?: number | string | undefined | null;
		/** Defines the human readable text alternative of aria-valuenow for a range widget. */
		'aria-valuetext'?: string | undefined | null;
	}

	// All the WAI-ARIA 1.1 role attribute values from https://www.w3.org/TR/wai-aria-1.1/#role_definitions
	type AriaRole =
		| 'alert'
		| 'alertdialog'
		| 'application'
		| 'article'
		| 'banner'
		| 'button'
		| 'cell'
		| 'checkbox'
		| 'columnheader'
		| 'combobox'
		| 'complementary'
		| 'contentinfo'
		| 'definition'
		| 'dialog'
		| 'directory'
		| 'document'
		| 'feed'
		| 'figure'
		| 'form'
		| 'grid'
		| 'gridcell'
		| 'group'
		| 'heading'
		| 'img'
		| 'link'
		| 'list'
		| 'listbox'
		| 'listitem'
		| 'log'
		| 'main'
		| 'marquee'
		| 'math'
		| 'menu'
		| 'menubar'
		| 'menuitem'
		| 'menuitemcheckbox'
		| 'menuitemradio'
		| 'navigation'
		| 'none'
		| 'note'
		| 'option'
		| 'presentation'
		| 'progressbar'
		| 'radio'
		| 'radiogroup'
		| 'region'
		| 'row'
		| 'rowgroup'
		| 'rowheader'
		| 'scrollbar'
		| 'search'
		| 'searchbox'
		| 'separator'
		| 'slider'
		| 'spinbutton'
		| 'status'
		| 'switch'
		| 'tab'
		| 'table'
		| 'tablist'
		| 'tabpanel'
		| 'term'
		| 'textbox'
		| 'timer'
		| 'toolbar'
		| 'tooltip'
		| 'tree'
		| 'treegrid'
		| 'treeitem';

	interface HTMLAttributes extends AriaAttributes, DOMAttributes, AstroBuiltinAttributes {
		// Standard HTML Attributes
		autocapitalize?: string | undefined | null;
		accesskey?: string | undefined | null;
		class?: string | undefined | null;
		contenteditable?: 'true' | 'false' | boolean | 'inherit' | undefined | null;
		contextmenu?: string | undefined | null;
		dir?: string | undefined | null;
		draggable?: 'true' | 'false' | boolean | undefined | null;
		hidden?: boolean | string | undefined | null;
		id?: string | undefined | null;
		lang?: string | undefined | null;
		placeholder?: string | undefined | null;
		slot?: string | undefined | null;
		spellcheck?: 'true' | 'false' | boolean | undefined | null;
		style?: string | undefined | null;
		tabindex?: number | string | undefined | null;
		title?: string | undefined | null;
		translate?: 'yes' | 'no' | undefined | null;

		// <command>, <menuitem>
		radiogroup?: string | undefined | null;

		// WAI-ARIA
		role?: AriaRole | undefined | null;

		// RDFa Attributes
		about?: string | undefined | null;
		datatype?: string | undefined | null;
		inlist?: any;
		prefix?: string | undefined | null;
		property?: string | undefined | null;
		resource?: string | undefined | null;
		typeof?: string | undefined | null;
		vocab?: string | undefined | null;

		// Non-standard Attributes
		autocorrect?: string | undefined | null;
		autosave?: string | undefined | null;
		color?: string | undefined | null;
		itemprop?: string | undefined | null;
		itemscope?: boolean | string | undefined | null;
		itemtype?: string | undefined | null;
		itemid?: string | undefined | null;
		itemref?: string | undefined | null;
		results?: number | string | undefined | null;
		security?: string | undefined | null;
		unselectable?: 'on' | 'off' | undefined | null;

		// Living Standard
		/**
		 * Hints at the type of data that might be entered by the user while editing the element or its contents
		 * @see https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute
		 */
		inputmode?:
			| 'none'
			| 'text'
			| 'tel'
			| 'url'
			| 'email'
			| 'numeric'
			| 'decimal'
			| 'search'
			| undefined;
		/**
		 * Specify that a standard HTML element should behave like a defined custom built-in element
		 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is
		 */
		is?: string | undefined | null;
	}

	type HTMLAttributeReferrerPolicy =
		| ''
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url';

	type HTMLAttributeAnchorTarget = '_self' | '_blank' | '_parent' | '_top';

	interface AnchorHTMLAttributes extends HTMLAttributes {
		download?: string | boolean | undefined | null;
		href?: string | URL | undefined | null;
		hreflang?: string | undefined | null;
		media?: string | undefined | null;
		ping?: string | undefined | null;
		rel?: string | undefined | null;
		target?: HTMLAttributeAnchorTarget | undefined | null;
		type?: string | undefined | null;
		referrerpolicy?: HTMLAttributeReferrerPolicy | undefined | null;
	}

	interface AudioHTMLAttributes extends MediaHTMLAttributes {}

	interface AreaHTMLAttributes extends HTMLAttributes {
		alt?: string | undefined;
		coords?: string | undefined;
		download?: any;
		href?: string | undefined;
		hreflang?: string | undefined;
		media?: string | undefined;
		referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
		rel?: string | undefined;
		shape?: string | undefined;
		target?: string | undefined;
	}

	interface BaseHTMLAttributes extends HTMLAttributes {
		href?: string | undefined;
		target?: string | undefined;
	}

	interface BlockquoteHTMLAttributes extends HTMLAttributes {
		cite?: string | undefined;
	}

	interface ButtonHTMLAttributes extends HTMLAttributes {
		autofocus?: boolean | string | undefined;
		disabled?: boolean | string | undefined;
		form?: string | undefined;
		formaction?: string | undefined;
		formenctype?: string | undefined;
		formmethod?: string | undefined;
		formnovalidate?: boolean | string | undefined;
		formtarget?: string | undefined;
		name?: string | undefined;
		type?: 'submit' | 'reset' | 'button' | undefined;
		value?: string | string[] | number | undefined;
	}

	interface CanvasHTMLAttributes extends HTMLAttributes {
		height?: number | string | undefined;
		width?: number | string | undefined;
	}

	interface ColHTMLAttributes extends HTMLAttributes {
		span?: number | string | undefined;
		width?: number | string | undefined;
	}

	interface ColgroupHTMLAttributes extends HTMLAttributes {
		span?: number | string | undefined;
	}

	interface DataHTMLAttributes extends HTMLAttributes {
		value?: string | string[] | number | undefined;
	}

	interface DetailsHTMLAttributes extends HTMLAttributes {
		open?: boolean | string | undefined;
	}

	interface DelHTMLAttributes extends HTMLAttributes {
		cite?: string | undefined;
		datetime?: string | undefined;
	}

	interface DialogHTMLAttributes extends HTMLAttributes {
		open?: boolean | string | undefined;
	}

	interface EmbedHTMLAttributes extends HTMLAttributes {
		height?: number | string | undefined;
		src?: string | undefined;
		type?: string | undefined;
		width?: number | string | undefined;
	}

	interface FieldsetHTMLAttributes extends HTMLAttributes {
		disabled?: boolean | string | undefined;
		form?: string | undefined;
		name?: string | undefined;
	}

	interface FormHTMLAttributes extends HTMLAttributes {
		'accept-charset'?: string | undefined;
		action?: string | undefined;
		autocomplete?: string | undefined;
		enctype?: string | undefined;
		method?: string | undefined;
		name?: string | undefined;
		novalidate?: boolean | string | undefined;
		target?: string | undefined;
	}

	interface HtmlHTMLAttributes extends HTMLAttributes {
		manifest?: string | undefined;
	}

	interface IframeHTMLAttributes extends HTMLAttributes {
		allow?: string | undefined;
		allowfullscreen?: boolean | string | undefined;
		allowtransparency?: boolean | string | undefined;
		/** @deprecated */
		frameborder?: number | string | undefined;
		height?: number | string | undefined;
		/** @deprecated */
		marginheight?: number | string | undefined;
		/** @deprecated */
		marginwidth?: number | string | undefined;
		name?: string | undefined;
		referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
		sandbox?: string | undefined;
		/** @deprecated */
		scrolling?: string | undefined;
		seamless?: boolean | string | undefined;
		src?: string | undefined;
		srcdoc?: string | undefined;
		width?: number | string | undefined;
	}

	interface ImgHTMLAttributes extends HTMLAttributes {
		alt?: string | undefined;
		crossorigin?: 'anonymous' | 'use-credentials' | '' | undefined;
		decoding?: 'async' | 'auto' | 'sync' | undefined;
		height?: number | string | undefined;
		loading?: 'eager' | 'lazy' | undefined;
		referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
		sizes?: string | undefined;
		src?: string | undefined;
		srcset?: string | undefined;
		usemap?: string | undefined;
		width?: number | string | undefined;
	}

	interface InsHTMLAttributes extends HTMLAttributes {
		cite?: string | undefined;
		datetime?: string | undefined;
	}

	type HTMLInputTypeAttribute =
		| 'button'
		| 'checkbox'
		| 'color'
		| 'date'
		| 'datetime-local'
		| 'email'
		| 'file'
		| 'hidden'
		| 'image'
		| 'month'
		| 'number'
		| 'password'
		| 'radio'
		| 'range'
		| 'reset'
		| 'search'
		| 'submit'
		| 'tel'
		| 'text'
		| 'time'
		| 'url'
		| 'week';

	interface InputHTMLAttributes extends HTMLAttributes {
		accept?: string | undefined;
		alt?: string | undefined;
		autocomplete?: string | undefined;
		autofocus?: boolean | string | undefined;
		capture?: boolean | string | undefined; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
		checked?: boolean | string | undefined;
		crossorigin?: string | undefined;
		disabled?: boolean | string | undefined;
		enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined;
		form?: string | undefined;
		formaction?: string | undefined;
		formenctype?: string | undefined;
		formmethod?: string | undefined;
		formnovalidate?: boolean | string | undefined;
		formtarget?: string | undefined;
		height?: number | string | undefined;
		list?: string | undefined;
		max?: number | string | undefined;
		maxlength?: number | string | undefined;
		min?: number | string | undefined;
		minlength?: number | string | undefined;
		multiple?: boolean | string | undefined;
		name?: string | undefined;
		pattern?: string | undefined;
		placeholder?: string | undefined;
		readonly?: boolean | string | undefined;
		required?: boolean | string | undefined;
		size?: number | string | undefined;
		src?: string | undefined;
		step?: number | string | undefined;
		type?: HTMLInputTypeAttribute | string | undefined;
		value?: string | string[] | number | undefined;
		width?: number | string | undefined;
	}

	interface KeygenHTMLAttributes extends HTMLAttributes {
		autofocus?: boolean | string | undefined;
		challenge?: string | undefined;
		disabled?: boolean | string | undefined;
		form?: string | undefined;
		keytype?: string | undefined;
		keyparams?: string | undefined;
		name?: string | undefined;
	}

	interface LabelHTMLAttributes extends HTMLAttributes {
		form?: string | undefined;
		for?: string | undefined;
	}

	interface LiHTMLAttributes extends HTMLAttributes {
		value?: string | string[] | number | undefined;
	}

	interface LinkHTMLAttributes extends HTMLAttributes {
		as?: string | undefined;
		crossorigin?: boolean | string | undefined;
		href?: string | URL | undefined;
		hreflang?: string | undefined;
		integrity?: string | undefined;
		media?: string | undefined;
		imageSrcSet?: string | undefined;
		imageSizes?: string | undefined;
		referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
		rel?: string | undefined;
		sizes?: string | undefined;
		type?: string | undefined;
		charset?: string | undefined;
	}

	interface MapHTMLAttributes extends HTMLAttributes {
		name?: string | undefined;
	}

	interface MenuHTMLAttributes extends HTMLAttributes {
		type?: string | undefined;
	}

	interface MediaHTMLAttributes extends HTMLAttributes {
		autoplay?: boolean | string | undefined;
		controls?: boolean | string | undefined;
		controlslist?: string | undefined;
		crossorigin?: string | undefined;
		loop?: boolean | string | undefined;
		mediagroup?: string | undefined;
		muted?: boolean | string | undefined;
		playsinline?: boolean | string | undefined;
		preload?: string | undefined;
		src?: string | undefined;
	}

	interface MetaHTMLAttributes extends HTMLAttributes {
		charset?: string | undefined;
		content?: string | URL | undefined;
		'http-equiv'?: string | undefined;
		name?: string | undefined;
	}

	interface MeterHTMLAttributes extends HTMLAttributes {
		form?: string | undefined;
		high?: number | string | undefined;
		low?: number | string | undefined;
		max?: number | string | undefined;
		min?: number | string | undefined;
		optimum?: number | string | undefined;
		value?: string | string[] | number | undefined;
	}

	interface QuoteHTMLAttributes extends HTMLAttributes {
		cite?: string | undefined;
	}

	interface ObjectHTMLAttributes extends HTMLAttributes {
		classid?: string | undefined;
		data?: string | undefined;
		form?: string | undefined;
		height?: number | string | undefined;
		name?: string | undefined;
		type?: string | undefined;
		usemap?: string | undefined;
		width?: number | string | undefined;
		wmode?: string | undefined;
	}

	interface OlHTMLAttributes extends HTMLAttributes {
		reversed?: boolean | string | undefined;
		start?: number | string | undefined;
		type?: '1' | 'a' | 'A' | 'i' | 'I' | undefined;
	}

	interface OptgroupHTMLAttributes extends HTMLAttributes {
		disabled?: boolean | string | undefined;
		label?: string | undefined;
	}

	interface OptionHTMLAttributes extends HTMLAttributes {
		disabled?: boolean | string | undefined;
		label?: string | undefined;
		selected?: boolean | string | undefined;
		value?: string | string[] | number | undefined;
	}

	interface OutputHTMLAttributes extends HTMLAttributes {
		form?: string | undefined;
		for?: string | undefined;
		name?: string | undefined;
	}

	interface ParamHTMLAttributes extends HTMLAttributes {
		name?: string | undefined;
		value?: string | string[] | number | undefined;
	}

	interface ProgressHTMLAttributes extends HTMLAttributes {
		max?: number | string | undefined;
		value?: string | string[] | number | undefined;
	}

	interface SlotHTMLAttributes extends HTMLAttributes {
		name?: string | undefined;
	}

	interface ScriptHTMLAttributes extends HTMLAttributes {
		async?: boolean | string | undefined;
		charset?: string | undefined;
		crossorigin?: string | undefined;
		defer?: boolean | string | undefined;
		integrity?: string | undefined;
		nomodule?: boolean | string | undefined;
		nonce?: string | undefined;
		src?: string | undefined;
		type?: string | undefined;
	}

	interface SelectHTMLAttributes extends HTMLAttributes {
		autocomplete?: string | undefined;
		autofocus?: boolean | string | undefined;
		disabled?: boolean | string | undefined;
		form?: string | undefined;
		multiple?: boolean | string | undefined;
		name?: string | undefined;
		required?: boolean | string | undefined;
		size?: number | string | undefined;
		value?: string | string[] | number | undefined;
	}

	interface SourceHTMLAttributes extends HTMLAttributes {
		height?: number | string | undefined;
		media?: string | undefined;
		sizes?: string | undefined;
		src?: string | undefined;
		srcset?: string | undefined;
		type?: string | undefined;
		width?: number | string | undefined;
	}

	interface StyleHTMLAttributes extends HTMLAttributes {
		media?: string | undefined;
		nonce?: string | undefined;
		scoped?: boolean | string | undefined;
		type?: string | undefined;
	}

	interface TableHTMLAttributes extends HTMLAttributes {
		align?: 'left' | 'center' | 'right' | undefined;
		bgcolor?: string | undefined;
		border?: number | undefined;
		cellpadding?: number | string | undefined;
		cellspacing?: number | string | undefined;
		frame?: boolean | undefined;
		rules?: 'none' | 'groups' | 'rows' | 'columns' | 'all' | undefined;
		summary?: string | undefined;
		width?: number | string | undefined;
	}

	interface TextareaHTMLAttributes extends HTMLAttributes {
		autocomplete?: string | undefined;
		autofocus?: boolean | string | undefined;
		cols?: number | string | undefined;
		dirname?: string | undefined;
		disabled?: boolean | string | undefined;
		form?: string | undefined;
		maxlength?: number | string | undefined;
		minlength?: number | string | undefined;
		name?: string | undefined;
		placeholder?: string | undefined;
		readonly?: boolean | string | undefined;
		required?: boolean | string | undefined;
		rows?: number | string | undefined;
		value?: string | string[] | number | undefined;
		wrap?: string | undefined;
	}

	interface TdHTMLAttributes extends HTMLAttributes {
		align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined;
		colspan?: number | string | undefined;
		headers?: string | undefined;
		rowspan?: number | string | undefined;
		scope?: string | undefined;
		abbr?: string | undefined;
		valign?: 'top' | 'middle' | 'bottom' | 'baseline' | undefined;
	}

	interface ThHTMLAttributes extends HTMLAttributes {
		align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined;
		colspan?: number | string | undefined;
		headers?: string | undefined;
		rowspan?: number | string | undefined;
		scope?: string | undefined;
		abbr?: string | undefined;
	}

	interface TimeHTMLAttributes extends HTMLAttributes {
		datetime?: string | undefined;
	}

	interface TrackHTMLAttributes extends HTMLAttributes {
		default?: boolean | string | undefined;
		kind?: string | undefined;
		label?: string | undefined;
		src?: string | undefined;
		srclang?: string | undefined;
	}

	interface VideoHTMLAttributes extends MediaHTMLAttributes {
		height?: number | string | undefined;
		playsinline?: boolean | string | undefined;
		poster?: string | undefined;
		width?: number | string | undefined;
		disablepictureinpicture?: boolean | string | undefined;
	}

	// this list is "complete" in that it contains every SVG attribute
	// that React supports, but the types can be improved.
	// Full list here: https://facebook.github.io/react/docs/dom-elements.html
	//
	// The three broad type categories are (in order of restrictiveness):
	//   - "number | string"
	//   - "string"
	//   - union of string literals
	interface SVGAttributes extends AriaAttributes, DOMAttributes, AstroBuiltinAttributes {
		// Attributes which also defined in HTMLAttributes
		className?: string | undefined | null;
		class?: string | undefined | null;
		color?: string | undefined | null;
		height?: number | string | undefined | null;
		id?: string | undefined | null;
		lang?: string | undefined | null;
		max?: number | string | undefined | null;
		media?: string | undefined | null;
		method?: string | undefined | null;
		min?: number | string | undefined | null;
		name?: string | undefined | null;
		style?: string | undefined | null;
		target?: string | undefined | null;
		type?: string | undefined | null;
		width?: number | string | undefined | null;

		// Other HTML properties supported by SVG elements in browsers
		role?: string | undefined | null;
		tabindex?: number | undefined | null;
		crossorigin?: 'anonymous' | 'use-credentials' | '' | undefined | null;

		// SVG Specific attributes
		'accent-height'?: number | string | undefined | null;
		accumulate?: 'none' | 'sum' | undefined | null;
		additive?: 'replace' | 'sum' | undefined | null;
		'alignment-baseline'?:
			| 'auto'
			| 'baseline'
			| 'before-edge'
			| 'text-before-edge'
			| 'middle'
			| 'central'
			| 'after-edge'
			| 'text-after-edge'
			| 'ideographic'
			| 'alphabetic'
			| 'hanging'
			| 'mathematical'
			| 'inherit'
			| undefined
			| null;
		allowReorder?: 'no' | 'yes' | undefined | null;
		alphabetic?: number | string | undefined | null;
		amplitude?: number | string | undefined | null;
		'arabic-form'?: 'initial' | 'medial' | 'terminal' | 'isolated' | undefined | null;
		ascent?: number | string | undefined | null;
		attributeName?: string | undefined | null;
		attributeType?: string | undefined | null;
		autoReverse?: number | string | undefined | null;
		azimuth?: number | string | undefined | null;
		baseFrequency?: number | string | undefined | null;
		'baseline-shift'?: number | string | undefined | null;
		baseProfile?: number | string | undefined | null;
		bbox?: number | string | undefined | null;
		begin?: number | string | undefined | null;
		bias?: number | string | undefined | null;
		by?: number | string | undefined | null;
		calcMode?: number | string | undefined | null;
		'cap-height'?: number | string | undefined | null;
		clip?: number | string | undefined | null;
		'clip-path'?: string | undefined | null;
		clipPathUnits?: number | string | undefined | null;
		'clip-rule'?: number | string | undefined | null;
		'color-interpolation'?: number | string | undefined | null;
		'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit' | undefined | null;
		'color-profile'?: number | string | undefined | null;
		'color-rendering'?: number | string | undefined | null;
		contentScriptType?: number | string | undefined | null;
		contentStyleType?: number | string | undefined | null;
		cursor?: number | string | undefined | null;
		cx?: number | string | undefined | null;
		cy?: number | string | undefined | null;
		d?: string | undefined | null;
		decelerate?: number | string | undefined | null;
		descent?: number | string | undefined | null;
		diffuseConstant?: number | string | undefined | null;
		direction?: number | string | undefined | null;
		display?: number | string | undefined | null;
		divisor?: number | string | undefined | null;
		'dominant-baseline'?: number | string | undefined | null;
		dur?: number | string | undefined | null;
		dx?: number | string | undefined | null;
		dy?: number | string | undefined | null;
		edgeMode?: number | string | undefined | null;
		elevation?: number | string | undefined | null;
		'enable-background'?: number | string | undefined | null;
		end?: number | string | undefined | null;
		exponent?: number | string | undefined | null;
		externalResourcesRequired?: number | string | undefined | null;
		fill?: string | undefined | null;
		'fill-opacity'?: number | string | undefined | null;
		'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit' | undefined | null;
		filter?: string | undefined | null;
		filterRes?: number | string | undefined | null;
		filterUnits?: number | string | undefined | null;
		'flood-color'?: number | string | undefined | null;
		'flood-opacity'?: number | string | undefined | null;
		focusable?: number | string | undefined | null;
		'font-family'?: string | undefined | null;
		'font-size'?: number | string | undefined | null;
		'font-size-adjust'?: number | string | undefined | null;
		'font-stretch'?: number | string | undefined | null;
		'font-style'?: number | string | undefined | null;
		'font-variant'?: number | string | undefined | null;
		'font-weight'?: number | string | undefined | null;
		format?: number | string | undefined | null;
		from?: number | string | undefined | null;
		fx?: number | string | undefined | null;
		fy?: number | string | undefined | null;
		g1?: number | string | undefined | null;
		g2?: number | string | undefined | null;
		'glyph-name'?: number | string | undefined | null;
		'glyph-orientation-horizontal'?: number | string | undefined | null;
		'glyph-orientation-vertical'?: number | string | undefined | null;
		glyphRef?: number | string | undefined | null;
		gradientTransform?: string | undefined | null;
		gradientUnits?: string | undefined | null;
		hanging?: number | string | undefined | null;
		href?: string | undefined | null;
		'horiz-adv-x'?: number | string | undefined | null;
		'horiz-origin-x'?: number | string | undefined | null;
		ideographic?: number | string | undefined | null;
		'image-rendering'?: number | string | undefined | null;
		in2?: number | string | undefined | null;
		in?: string | undefined | null;
		intercept?: number | string | undefined | null;
		k1?: number | string | undefined | null;
		k2?: number | string | undefined | null;
		k3?: number | string | undefined | null;
		k4?: number | string | undefined | null;
		k?: number | string | undefined | null;
		kernelMatrix?: number | string | undefined | null;
		kernelUnitLength?: number | string | undefined | null;
		kerning?: number | string | undefined | null;
		keyPoints?: number | string | undefined | null;
		keySplines?: number | string | undefined | null;
		keyTimes?: number | string | undefined | null;
		lengthAdjust?: number | string | undefined | null;
		'letter-spacing'?: number | string | undefined | null;
		'lighting-color'?: number | string | undefined | null;
		limitingConeAngle?: number | string | undefined | null;
		local?: number | string | undefined | null;
		'marker-end'?: string | undefined | null;
		markerHeight?: number | string | undefined | null;
		'marker-mid'?: string | undefined | null;
		'marker-start'?: string | undefined | null;
		markerUnits?: number | string | undefined | null;
		markerWidth?: number | string | undefined | null;
		mask?: string | undefined | null;
		maskContentUnits?: number | string | undefined | null;
		maskUnits?: number | string | undefined | null;
		mathematical?: number | string | undefined | null;
		mode?: number | string | undefined | null;
		numOctaves?: number | string | undefined | null;
		offset?: number | string | undefined | null;
		opacity?: number | string | undefined | null;
		operator?: number | string | undefined | null;
		order?: number | string | undefined | null;
		orient?: number | string | undefined | null;
		orientation?: number | string | undefined | null;
		origin?: number | string | undefined | null;
		overflow?: number | string | undefined | null;
		'overline-position'?: number | string | undefined | null;
		'overline-thickness'?: number | string | undefined | null;
		'paint-order'?: number | string | undefined | null;
		'panose-1'?: number | string | undefined | null;
		path?: string | undefined | null;
		pathLength?: number | string | undefined | null;
		patternContentUnits?: string | undefined | null;
		patternTransform?: number | string | undefined | null;
		patternUnits?: string | undefined | null;
		'pointer-events'?: number | string | undefined | null;
		points?: string | undefined | null;
		pointsAtX?: number | string | undefined | null;
		pointsAtY?: number | string | undefined | null;
		pointsAtZ?: number | string | undefined | null;
		preserveAlpha?: number | string | undefined | null;
		preserveAspectRatio?: string | undefined | null;
		primitiveUnits?: number | string | undefined | null;
		r?: number | string | undefined | null;
		radius?: number | string | undefined | null;
		refX?: number | string | undefined | null;
		refY?: number | string | undefined | null;
		'rendering-intent'?: number | string | undefined | null;
		repeatCount?: number | string | undefined | null;
		repeatDur?: number | string | undefined | null;
		requiredExtensions?: number | string | undefined | null;
		requiredFeatures?: number | string | undefined | null;
		restart?: number | string | undefined | null;
		result?: string | undefined | null;
		rotate?: number | string | undefined | null;
		rx?: number | string | undefined | null;
		ry?: number | string | undefined | null;
		scale?: number | string | undefined | null;
		seed?: number | string | undefined | null;
		'shape-rendering'?: number | string | undefined | null;
		slope?: number | string | undefined | null;
		spacing?: number | string | undefined | null;
		specularConstant?: number | string | undefined | null;
		specularExponent?: number | string | undefined | null;
		speed?: number | string | undefined | null;
		spreadMethod?: string | undefined | null;
		startOffset?: number | string | undefined | null;
		stdDeviation?: number | string | undefined | null;
		stemh?: number | string | undefined | null;
		stemv?: number | string | undefined | null;
		stitchTiles?: number | string | undefined | null;
		'stop-color'?: string | undefined | null;
		'stop-opacity'?: number | string | undefined | null;
		'strikethrough-position'?: number | string | undefined | null;
		'strikethrough-thickness'?: number | string | undefined | null;
		string?: number | string | undefined | null;
		stroke?: string | undefined | null;
		'stroke-dasharray'?: string | number | undefined | null;
		'stroke-dashoffset'?: string | number | undefined | null;
		'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit' | undefined | null;
		'stroke-linejoin'?: 'miter' | 'round' | 'bevel' | 'inherit' | undefined | null;
		'stroke-miterlimit'?: string | undefined | null;
		'stroke-opacity'?: number | string | undefined | null;
		'stroke-width'?: number | string | undefined | null;
		surfaceScale?: number | string | undefined | null;
		systemLanguage?: number | string | undefined | null;
		tableValues?: number | string | undefined | null;
		targetX?: number | string | undefined | null;
		targetY?: number | string | undefined | null;
		'text-anchor'?: string | undefined | null;
		'text-decoration'?: number | string | undefined | null;
		textLength?: number | string | undefined | null;
		'text-rendering'?: number | string | undefined | null;
		to?: number | string | undefined | null;
		transform?: string | undefined | null;
		u1?: number | string | undefined | null;
		u2?: number | string | undefined | null;
		'underline-position'?: number | string | undefined | null;
		'underline-thickness'?: number | string | undefined | null;
		unicode?: number | string | undefined | null;
		'unicode-bidi'?: number | string | undefined | null;
		'unicode-range'?: number | string | undefined | null;
		'units-per-em'?: number | string | undefined | null;
		'v-alphabetic'?: number | string | undefined | null;
		values?: string | undefined | null;
		'vector-effect'?: number | string | undefined | null;
		version?: string | undefined | null;
		'vert-adv-y'?: number | string | undefined | null;
		'vert-origin-x'?: number | string | undefined | null;
		'vert-origin-y'?: number | string | undefined | null;
		'v-hanging'?: number | string | undefined | null;
		'v-ideographic'?: number | string | undefined | null;
		viewBox?: string | undefined | null;
		viewTarget?: number | string | undefined | null;
		visibility?: number | string | undefined | null;
		'v-mathematical'?: number | string | undefined | null;
		widths?: number | string | undefined | null;
		'word-spacing'?: number | string | undefined | null;
		'writing-mode'?: number | string | undefined | null;
		x1?: number | string | undefined | null;
		x2?: number | string | undefined | null;
		x?: number | string | undefined | null;
		xChannelSelector?: string | undefined | null;
		'x-height'?: number | string | undefined | null;
		'xlink:actuate'?: string | undefined | null;
		'xlink:arcrole'?: string | undefined | null;
		'xlink:href'?: string | undefined | null;
		'xlink:role'?: string | undefined | null;
		'xlink:show'?: string | undefined | null;
		'xlink:title'?: string | undefined | null;
		'xlink:type'?: string | undefined | null;
		'xml:base'?: string | undefined | null;
		'xml:lang'?: string | undefined | null;
		xmlns?: string | undefined | null;
		'xmlns:xlink'?: string | undefined | null;
		'xml:space'?: string | undefined | null;
		y1?: number | string | undefined | null;
		y2?: number | string | undefined | null;
		y?: number | string | undefined | null;
		yChannelSelector?: string | undefined | null;
		z?: number | string | undefined | null;
		zoomAndPan?: string | undefined | null;
	}

	interface IntrinsicElements {
		// HTML
		a: AnchorHTMLAttributes;
		abbr: HTMLAttributes;
		address: HTMLAttributes;
		area: AreaHTMLAttributes;
		article: HTMLAttributes;
		aside: HTMLAttributes;
		audio: AudioHTMLAttributes;
		b: HTMLAttributes;
		base: BaseHTMLAttributes;
		bdi: HTMLAttributes;
		bdo: HTMLAttributes;
		big: HTMLAttributes;
		blockquote: BlockquoteHTMLAttributes;
		body: HTMLAttributes;
		br: HTMLAttributes;
		button: ButtonHTMLAttributes;
		canvas: CanvasHTMLAttributes;
		caption: HTMLAttributes;
		cite: HTMLAttributes;
		code: HTMLAttributes;
		col: ColHTMLAttributes;
		colgroup: ColgroupHTMLAttributes;
		data: DataHTMLAttributes;
		datalist: HTMLAttributes;
		dd: HTMLAttributes;
		del: DelHTMLAttributes;
		details: DetailsHTMLAttributes;
		dfn: HTMLAttributes;
		dialog: DialogHTMLAttributes;
		div: HTMLAttributes;
		dl: HTMLAttributes;
		dt: HTMLAttributes;
		em: HTMLAttributes;
		embed: EmbedHTMLAttributes;
		fieldset: FieldsetHTMLAttributes;
		figcaption: HTMLAttributes;
		figure: HTMLAttributes;
		footer: HTMLAttributes;
		form: FormHTMLAttributes;
		h1: HTMLAttributes;
		h2: HTMLAttributes;
		h3: HTMLAttributes;
		h4: HTMLAttributes;
		h5: HTMLAttributes;
		h6: HTMLAttributes;
		head: HTMLAttributes;
		header: HTMLAttributes;
		hgroup: HTMLAttributes;
		hr: HTMLAttributes;
		html: HtmlHTMLAttributes;
		i: HTMLAttributes;
		iframe: IframeHTMLAttributes;
		img: ImgHTMLAttributes;
		input: InputHTMLAttributes;
		ins: InsHTMLAttributes;
		kbd: HTMLAttributes;
		keygen: KeygenHTMLAttributes;
		label: LabelHTMLAttributes;
		legend: HTMLAttributes;
		li: LiHTMLAttributes;
		link: LinkHTMLAttributes;
		main: HTMLAttributes;
		map: MapHTMLAttributes;
		mark: HTMLAttributes;
		menu: MenuHTMLAttributes;
		menuitem: HTMLAttributes;
		meta: MetaHTMLAttributes;
		meter: MeterHTMLAttributes;
		nav: HTMLAttributes;
		noindex: HTMLAttributes; // https://en.wikipedia.org/wiki/Noindex#%3Cnoindex%3E_tag
		noscript: HTMLAttributes;
		object: ObjectHTMLAttributes;
		ol: OlHTMLAttributes;
		optgroup: OptgroupHTMLAttributes;
		option: OptionHTMLAttributes;
		output: OutputHTMLAttributes;
		p: HTMLAttributes;
		param: ParamHTMLAttributes;
		picture: HTMLAttributes;
		pre: HTMLAttributes;
		progress: ProgressHTMLAttributes;
		q: QuoteHTMLAttributes;
		rp: HTMLAttributes;
		rt: HTMLAttributes;
		ruby: HTMLAttributes;
		s: HTMLAttributes;
		samp: HTMLAttributes;
		slot: SlotHTMLAttributes;
		script: ScriptHTMLAttributes & AstroScriptAttributes;
		section: HTMLAttributes;
		select: SelectHTMLAttributes;
		small: HTMLAttributes;
		source: SourceHTMLAttributes;
		span: HTMLAttributes;
		strong: HTMLAttributes;
		style: StyleHTMLAttributes;
		sub: HTMLAttributes;
		summary: HTMLAttributes;
		sup: HTMLAttributes;
		table: TableHTMLAttributes;
		tbody: HTMLAttributes;
		td: TdHTMLAttributes;
		textarea: TextareaHTMLAttributes;
		tfoot: HTMLAttributes;
		th: ThHTMLAttributes;
		thead: HTMLAttributes;
		time: TimeHTMLAttributes;
		title: HTMLAttributes;
		tr: HTMLAttributes;
		track: TrackHTMLAttributes;
		u: HTMLAttributes;
		ul: HTMLAttributes;
		var: HTMLAttributes;
		video: VideoHTMLAttributes;
		wbr: HTMLAttributes;

		// SVG
		svg: SVGAttributes;
		animate: SVGAttributes;
		circle: SVGAttributes;
		clipPath: SVGAttributes;
		defs: SVGAttributes;
		desc: SVGAttributes;
		ellipse: SVGAttributes;
		feBlend: SVGAttributes;
		feColorMatrix: SVGAttributes;
		feComponentTransfer: SVGAttributes;
		feComposite: SVGAttributes;
		feConvolveMatrix: SVGAttributes;
		feDiffuseLighting: SVGAttributes;
		feDisplacementMap: SVGAttributes;
		feDistantLight: SVGAttributes;
		feFlood: SVGAttributes;
		feFuncA: SVGAttributes;
		feFuncB: SVGAttributes;
		feFuncG: SVGAttributes;
		feFuncR: SVGAttributes;
		feGaussianBlur: SVGAttributes;
		feImage: SVGAttributes;
		feMerge: SVGAttributes;
		feMergeNode: SVGAttributes;
		feMorphology: SVGAttributes;
		feOffset: SVGAttributes;
		fePointLight: SVGAttributes;
		feSpecularLighting: SVGAttributes;
		feSpotLight: SVGAttributes;
		feTile: SVGAttributes;
		feTurbulence: SVGAttributes;
		filter: SVGAttributes;
		foreignObject: SVGAttributes;
		g: SVGAttributes;
		image: SVGAttributes;
		line: SVGAttributes;
		linearGradient: SVGAttributes;
		marker: SVGAttributes;
		mask: SVGAttributes;
		metadata: SVGAttributes;
		path: SVGAttributes;
		pattern: SVGAttributes;
		polygon: SVGAttributes;
		polyline: SVGAttributes;
		radialGradient: SVGAttributes;
		rect: SVGAttributes;
		stop: SVGAttributes;
		switch: SVGAttributes;
		symbol: SVGAttributes;
		text: SVGAttributes;
		textPath: SVGAttributes;
		tspan: SVGAttributes;
		use: SVGAttributes;
		view: SVGAttributes;

		// Allow for arbitrary elements
		[name: string]: { [name: string]: any };
	}
}
