const points_by_lines = {
  0: 0,
  1: 1, // 12 /12
  2: 3, // 18 / 12
  3: 5, // 20 / 12
}

const linesToPoints = (lines) => lines > 3 ? lines * 8 : points_by_lines[lines]

export default class Score {
  constructor(board) {
    this.board = board
    this.turns = {}
  }
  addLines(ys) {
    const current_turn = this.turns
    if (!this.turns[current_turn])
    this.turns[this.board.turn]
  }
  getEmptyTurn() {
    const turn = { a: 0, b: 0, turn: this.board.turn }
    if (
    
}