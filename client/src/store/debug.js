import { ReactiveLocalStorage } from '@unrest/vue-storage'

const store = ReactiveLocalStorage({ LS_KEY: 'LocalStorage:debug' })

store.schema = {
  type: 'lazy',
  text: {
    type: 'string',
    enum: ['', 'piece_id', 'block_id', 'block_key', 'board_index', 'block_connect'],
  },
  half_opacity: false, // used to see overlapping blocks (bad deletions)
}

export default store
