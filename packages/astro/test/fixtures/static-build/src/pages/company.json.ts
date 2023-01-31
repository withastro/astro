export async function get() {
    return {
        body: JSON.stringify({
            name: 'Astro Technology Company',
            url: 'https://astro.build/'
        })
    }
}