import Board from './Board'

export default class Game {
  constructor(options = {}) {
    this.options = options
    this.reset()
    this.paused = false
    this.pause = () => {
      // TODO class properties
      this.paused = true
      this.board.pause()
    }
  }
  reset() {
    this.board = new Board(this.options)
    this.board.start()
  }
  input(action) {
    clearTimeout(this.timeout)
    this.board[action]()
  }
  on(action, f) {
    this.board.mitt.on(action, f)
  }
  resume() {
    this.paused = false
    this.board.resume()
  }
}
