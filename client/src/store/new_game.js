import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:new-game' })

store.schema = {
  type: 'lazy',
  rules: {
    type: 'lazy',
    seed: '',
    a: {
      title: 'a-level',
      type: 'number',
      enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    },
    b: {
      type: 'lazy',
      algorithm: 'mod8',
      lines: 0,
      seed: '',
    },
    sticky: false,
    cascade: false,
    nuclear: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['', 'fission', 'fusion'],
        },
        temperature: {
          type: 'string',
          enum: ['hot', 'cold'],
        },
      },
    },
  },
}

export default store
