const entities = { '"': 'quot', '&': 'amp', '\'': 'apos', '<': 'lt', '>': 'gt' } as const

export const escapeHTML = (string: any) => string.replace(/["'&<>]/g, (char: keyof typeof entities) => '&' + entities[char] + ';')
