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
    this.board = Board.new()
    this.rand = splitmix64(seed)
    Board.addPiece(this.board, this.rand.choice(Piece.shapes))
  }
}
