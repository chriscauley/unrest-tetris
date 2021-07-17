import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:new-game' })

store.schema = {
  type: 'lazy',
  seed: '',
}

export default store
