import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:new-game' })

store.schema = {
  type: 'lazy',
  seed: '',
  a: {
    title: 'a-level',
    type: 'number',
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  b: {
    type: 'object',
    title: 'b-level',
    properties: {
      algorithm: 'mod8',
      lines: 0,
      seed: '',
    },
  },
}

export default store
