import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage('debug')

store.schema = {
  type: 'lazy',
  text: {
    type: 'string',
    enum: ['', 'piece_index', 'board_index'],
  },
}

export default store
