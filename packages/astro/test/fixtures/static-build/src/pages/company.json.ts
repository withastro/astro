export async function GET() {
    return {
        body: JSON.stringify({
            name: 'Astro Technology Company',
            url: 'https://astro.build/'
        })
    }
}
