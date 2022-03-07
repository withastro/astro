import * as _ from './utils'

export class CustomElementRegistry {
	/** Defines a new custom element using the given tag name and HTMLElement constructor. */
	define(
		name: string,
		constructor: Function,
		options?: ElementDefinitionOptions
	) {
		const internals = _.internalsOf<CustomElementRegistryInternals>(
			this,
			'CustomElementRegistry',
			'define'
		)

		name = String(name)

		if (/[A-Z]/.test(name))
			throw new SyntaxError(
				'Custom element name cannot contain an uppercase ASCII letter'
			)
		if (!/^[a-z]/.test(name))
			throw new SyntaxError(
				'Custom element name must have a lowercase ASCII letter as its first character'
			)
		if (!/-/.test(name))
			throw new SyntaxError('Custom element name must contain a hyphen')

		internals.constructorByName.set(name, constructor)
		internals.nameByConstructor.set(constructor, name)

		void options
	}

	/** Returns the constructor associated with the given tag name. */
	get(name: string) {
		const internals = _.internalsOf<CustomElementRegistryInternals>(
			this,
			'CustomElementRegistry',
			'get'
		)

		name = String(name).toLowerCase()

		return internals.constructorByName.get(name)
	}

	getName(constructor: Function) {
		const internals = _.internalsOf<CustomElementRegistryInternals>(
			this,
			'CustomElementRegistry',
			'getName'
		)

		return internals.nameByConstructor.get(constructor)
	}
}

_.allowStringTag(CustomElementRegistry)

interface CustomElementRegistryInternals {
	constructorByName: Map<string, Function>
	nameByConstructor: Map<Function, string>
}

interface ElementDefinitionOptions {
	extends?: string | undefined
}

export const initCustomElementRegistry = (
	target: Record<any, any>,
	exclude: Set<string>
) => {
	if (exclude.has('customElements')) return

	const CustomElementRegistry =
		target.CustomElementRegistry || globalThis.CustomElementRegistry

	const customElements: CustomElementRegistry = (target.customElements =
		Object.create(CustomElementRegistry.prototype))

	_.INTERNALS.set(customElements, {
		constructorByName: new Map(),
		nameByConstructor: new Map(),
	} as CustomElementRegistryInternals)
}
