// Hydrate directly and write the passed options to the DOM
export default async (load, options) => {
		const hydrate = await load()
		document.write(`<div id="options">Passed options are: ${JSON.stringify(options.value)}</div>`)
    await hydrate()
}
