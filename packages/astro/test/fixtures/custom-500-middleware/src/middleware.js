export function onRequest(_context, next) {
    throw 'an error'
    return next()
}