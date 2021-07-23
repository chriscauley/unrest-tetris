import Board, { WALL } from '../src/Board'
import Piece from '../src/Piece'

const print = (board) => console.log(board.geo.print(board.indexes, { empty: 'X' })) // eslint-disable-line
const reducedIndexes = (board) =>
  Object.fromEntries(Object.entries(board.indexes).filter((e) => e[1] !== WALL))

test('Board.rotate', () => {
  const results = {}
  Piece.shapes.forEach((shape) => {
    const board = new Board({ rules: { seed: shape } })
    results[shape] = Object.keys(reducedIndexes(board)).join(',')
    for (let i = 0; i < 4; i++) {
      board.rotate(1)
      results[shape] += '|' + Object.keys(reducedIndexes(board)).join(',')
    }
  })
  expect(results).toMatchSnapshot()
})

test('Board.drop', () => {
  // If you rotate and drop the piece, how many rotations does it take before game over?
  const results = {}
  Piece.all.forEach((piece) => {
    results[piece.shape] = 0
    const board = new Board({ rules: { seed: piece.shape } })
    while (results[piece.shape]++ < 30) {
      try {
        board.rotate(1)
        board.drop()
        board.nextTurn()
      } catch (_e) {
        break
      }
    }
  })
  expect(results).toMatchSnapshot()
})

test('Board.options', () => {
  const board = new Board({ W: 6, H: 6, wrap: true })
  expect(board.geo.AREA).toBe(42)
})

test('Board.clearLine', () => {
  const board = new Board({ rules: { seed: 'iiitttti' } })
  const placePiece = (dindex, rotate) => {
    rotate && board.rotate(1)
    board._moveCurrent(dindex)
    board.drop()
    board.nextTurn()
  }

  placePiece(3)
  placePiece(-1)
  placePiece(-3, true)

  placePiece(-2, true)
  placePiece(0, true)
  placePiece(2, true)
  placePiece(4, true)

  placePiece(-4, true)

  expect(reducedIndexes(board)).toMatchSnapshot()

  // pieces 1 and 2 were cleared
  expect(board.entities[1]).toBe(undefined)
  expect(board.entities[2]).toBe(undefined)

  // pieces were updated with new indexes
  Object.values(board.entities).forEach((piece) => {
    piece.indexes.forEach((i) => {
      expect(board.indexes[i]).toBe(piece.id)
    })
  })
})
