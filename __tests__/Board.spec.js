import Board from '../src/lib/Board'
import Piece from '../src/lib/Piece'

const print = (board) => console.log(board.geo.print(board.indexes, { empty: 'X' })) // eslint-disable-line

test('Board.rotateCurrent', () => {
  const results = {}
  Piece.all.forEach((piece) => {
    const board = Board.new()
    Board.addPiece(board, piece.shape)
    results[piece.shape] = Object.keys(board.indexes).join(',')
    for (let i = 0; i < 4; i++) {
      Board.rotateCurrent(board, 1)
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
    const board = Board.new()
    while (results[piece.shape]++ < 30) {
      try {
        Board.addPiece(board, piece.shape)
        Board.rotateCurrent(board, 1)
        Board.dropCurrent(board)
      } catch (_e) {
        break
      }
    }
  })
  expect(results).toMatchSnapshot()
})

test('Board.options', () => {
  const board = Board.new({ W: 6, H: 6 })
  expect(board.geo.AREA).toBe(36)
})

test('Board.clearLine', () => {
  const board = Board.new()
  const placePiece = (shape, dx, rotate) => {
    Board.addPiece(board, shape)
    rotate && Board.rotateCurrent(board, 1)
    Board.moveCurrent(board, [dx, 0])
    Board.dropCurrent(board)
  }

  placePiece('i', 4)
  placePiece('i', 0)
  placePiece('i', -3, true)

  placePiece('t', -1, true)
  placePiece('t', 1, true)
  placePiece('t', 3, true)
  placePiece('t', 5, true)

  placePiece('i', -4, true)

  Board.nextTurn(board)
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
