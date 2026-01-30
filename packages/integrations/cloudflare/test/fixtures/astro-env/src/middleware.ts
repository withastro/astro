import { defineMiddleware } from 'astro/middleware'
import { API_SECRET } from 'astro:env/server'

const secret = API_SECRET

export const onRequest = defineMiddleware((_ctx, next) => {
    console.log({ secret })
    return next()
})