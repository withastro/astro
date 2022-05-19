export default (frontmatter, {fileId, fileUrl}) => {
	let newFrontmatter = Object.assign({}, frontmatter)
	newFrontmatter.layout = "../layouts/content-alt.astro";
	return newFrontmatter;
};
