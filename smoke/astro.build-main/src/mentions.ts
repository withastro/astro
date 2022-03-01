interface Mention {
    name: string;
    avatar: string;
    twitter: string;
}

export const mentions: Record<string, Mention> = {
    fred: {
        name: 'Fred K. Schott',
        avatar: '/authors/fred.jpg',
        twitter: 'https://twitter.com/FredKSchott'
    },
    drew: {
        name: 'Drew Powers',
        avatar: '/authors/drew.jpg',
        twitter: 'https://twitter.com/drwpow'
    },
    matthew: {
        name: 'Matthew Phillips',
        avatar: '/authors/matthew.jpg',
        twitter: 'https://twitter.com/matthewcp'
    },
    nate: {
        name: 'Nate Moore',
        avatar: '/authors/nate.jpg',
        twitter: 'https://twitter.com/n_moore'
    },
    jon: {
        name: 'Jonathan Neal',
        avatar: '/authors/jon.jpg',
        twitter: 'https://twitter.com/jon_neal'
    }
}
