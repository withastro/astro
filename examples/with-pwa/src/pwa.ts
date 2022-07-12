import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onOfflineReady() {
    // eslint-disable-next-line no-console
    console.log('SW registered')
  },
})

