export default ({ persistent }) => (persistent ? import('./client-persist.js') : import('./client-static.js')).then(res => res.default())
