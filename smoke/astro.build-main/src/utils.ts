const formatter = Intl.NumberFormat('en', { notation: 'compact' });

let stars: string;
export async function getStars() {
    if (stars) return stars;
    stars = await fetch('https://api.github.com/repos/withastro/astro').then(res => res.json()).then(res => formatter.format(res.stargazers_count));
    return stars;
}
