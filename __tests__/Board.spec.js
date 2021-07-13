import Board from '../src/lib/Board'
import Piece from '../src/lib/Piece'

test('piece rotations', () => {
  const results = {}
  Piece.all.forEach((piece) => {
    const board = Board.new()
    Board.addPiece(board, piece.shape)
    results[piece.shape] = Object.keys(board.indexes).join(',')
    for (let i = 0; i < 4; i++) {
      Board.rotatePiece(board, 1, 1)
      results[piece.shape] += '|' + Object.keys(board.indexes).join(',')
    }
  })
  expect(results).toMatchSnapshot()
})

test('board.dropPiece', () => {
  // If you rotate and drop the piece, how many rotations does it take before game over?
  const results = {}
  Piece.all.forEach((piece) => {
    results[piece.shape] = 0
    const board = Board.new()
    while (results[piece.shape]++ < 30) {
      try {
        Board.addPiece(board, piece.shape)
        Board.rotatePiece(board, board.current_piece.id, 1)
        Board.dropPiece(board, board.current_piece.id)
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
