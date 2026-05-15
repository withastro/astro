const loadDirective = async (load) => {
	const hydrate = await load();
	await hydrate();
};
var load_default = loadDirective;
export { load_default as default };
