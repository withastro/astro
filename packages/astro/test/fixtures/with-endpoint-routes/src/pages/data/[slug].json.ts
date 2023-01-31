export async function getStaticPaths() {
    return [
        { params: { slug: 'thing3' } },
        { params: { slug: 'thing4' } }
    ];
}

export async function get(params) {
    return {
        body: JSON.stringify({
            slug: params.slug,
            title: 'data [slug]'
        })
    };
}
