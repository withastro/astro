import { defineMiddleware } from 'astro/middleware'
import { API_SECRET } from 'astro:env/server'

const secret = API_SECRET

export const onRequest = defineMiddleware((_ctx, next) => {
    console.info({ secret })
    return next()
})
