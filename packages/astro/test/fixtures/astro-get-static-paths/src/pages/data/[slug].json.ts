export async function getStaticPaths() {
    return [
        { params: { slug: 'thing1' } },
        { params: { slug: 'thing2' } }
    ];
}

export async function GET() {
    return {
        body: JSON.stringify({
            title: '[slug]'
        }, null, 4)
    };
}
