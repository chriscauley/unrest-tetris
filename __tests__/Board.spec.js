import Board from '../src/lib/Board'
import Piece from '../src/lib/Piece'

const print = (board) => console.log(board.geo.print(board.indexes, { empty: 'X' })) // eslint-disable-line

test('Board.rotateCurrent', () => {
  const results = {}
  Piece.all.forEach((piece) => {
    const board = new Board()
    board.addPiece(piece.shape)
    results[piece.shape] = Object.keys(board.indexes).join(',')
    for (let i = 0; i < 4; i++) {
      board.rotateCurrent(1)
      results[piece.shape] += '|' + Object.keys(board.indexes).join(',')
    }
  })
  expect(results).toMatchSnapshot()
})

test('Board.dropCurrent', () => {
  // If you rotate and drop the piece, how many rotations does it take before game over?
  const results = {}
  Piece.all.forEach((piece) => {
    results[piece.shape] = 0
    const board = new Board()
    while (results[piece.shape]++ < 30) {
      try {
        board.addPiece(piece.shape)
        board.rotateCurrent(1)
        board.dropCurrent()
      } catch (_e) {
        break
      }
    }
  })
  expect(results).toMatchSnapshot()
})

test('Board.options', () => {
  const board = new Board({ W: 6, H: 6 })
  expect(board.geo.AREA).toBe(36)
})

test('Board.clearLine', () => {
  const board = new Board()
  const placePiece = (shape, dx, rotate) => {
    board.addPiece(shape)
    rotate && board.rotateCurrent(1)
    board.moveCurrent([dx, 0])
    board.dropCurrent()
  }

  placePiece('i', 4)
  placePiece('i', 0)
  placePiece('i', -3, true)

  placePiece('t', -1, true)
  placePiece('t', 1, true)
  placePiece('t', 3, true)
  placePiece('t', 5, true)

  placePiece('i', -4, true)

  board.nextTurn()
  expect(board.indexes).toMatchSnapshot()

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
