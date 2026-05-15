const onlyDirective = async (load) => {
	const hydrate = await load();
	await hydrate();
};
var only_default = onlyDirective;
export { only_default as default };
