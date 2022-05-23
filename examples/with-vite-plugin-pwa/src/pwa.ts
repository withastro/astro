import { registerSW } from 'virtual:pwa-register'

// replaced dynamicaly
const reloadSW = '__RELOAD_SW__'

const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    // eslint-disable-next-line no-console
    console.log('SW registered')
  },
})

window.addEventListener('load', () => {
  updateSW()
})
