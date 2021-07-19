import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:debug' })

store.schema = {
  type: 'lazy',
  text: {
    type: 'string',
    enum: ['', 'piece_id', 'block_id', 'board_index'],
  },
}

export default store
