import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:new-game' })

store.schema = {
  type: 'lazy',
  seed: '',
  b: {
    type: 'lazy',
    algorithm: 'mod8',
    lines: 0,
    seed: '',
  },
}

export default store
