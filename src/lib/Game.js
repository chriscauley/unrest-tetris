import Board from './Board'
import Piece from './Piece'
import splitmix64 from './splitmix64'

export default class Game {
  constructor(options = {}) {
    this.options = options
    this.reset()
  }
  reset() {
    const { seed = new Date().valueOf() % 256 } = this.options
    this.board = new Board()
    this.rand = splitmix64(seed)
    this.board.addPiece(this.rand.choice(Piece.shapes))
  }
  input(action) {
    const actions = {
      rotate: ['rotateCurrent', 1],
      left: ['moveCurrent', [-1, 0]],
      right: ['moveCurrent', [1, 0]],
      down: ['moveCurrentDown'],
      drop: ['dropCurrent'],
      lock: ['nextTurn'],
    }
    this.board.doAction(...actions[action])
  }
}
