async function fetchPosts() {
    const files = import.meta.glob('./posts/**/*.md');
    
    const posts = await Promise.all(
        Object.entries(files).map(([filename, load]) => load().then(({ frontmatter }) => {
            return {
                filename,
                title: frontmatter.title,
            };
        })),
    );

    return posts.sort((a, b) => a.title.localeCompare(b.title));
}

export async function get() {
    const posts = await fetchPosts();

    return {
        body: JSON.stringify(posts, null, 4),
    };
}
