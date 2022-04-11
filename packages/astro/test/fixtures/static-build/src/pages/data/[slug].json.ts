export async function getStaticPaths() {
    return [
        { params: { slug: 'thing1' }},
        { params: { slug: 'thing2' }}
    ]
}

export async function get(params) {
    return {
        body: JSON.stringify({
            slug: params.slug,
            name: 'Astro Technology Company',
            url: 'https://astro.build/'
        })
    }
}