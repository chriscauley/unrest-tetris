import { LocalStorage } from '@unrest/vue-storage'
import { Board } from '@unrest/tetris'

export default LocalStorage('game', { toServer: Board.prepOptions })
