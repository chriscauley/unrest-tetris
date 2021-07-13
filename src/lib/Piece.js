const Piece = {
  t: {
    dxs: [0, 1, -1, 0],
    dys: [0, 0, 0, 1],
    max_spin: 4,
  },
  l: {
    dxs: [0, 1, -1, -1],
    dys: [0, 0, 0, -1],
    max_spin: 4,
  },
  j: {
    dxs: [0, 1, -1, 1],
    dys: [0, 0, 0, 1],
    max_spin: 4,
  },
  z: {
    dxs: [0, -1, 1, 0],
    dys: [0, 0, 1, 1],
    max_spin: 2,
  },
  s: {
    dxs: [0, 1, -1, 0],
    dys: [0, 0, 1, 1],
    max_spin: 2,
  },
  i: {
    dxs: [0, 1, -1, -2],
    dys: [0, 0, 0, 0],
    max_spin: 2,
  },
  o: {
    dxs: [0, 1, 1, 0],
    dys: [0, 0, 1, 1],
    max_spin: 0,
  },
}
const all = []

Object.entries(Piece).forEach(([shape, piece]) => {
  piece.shape = shape
  all.push(piece)
  piece.dxys = piece.dxs.map((dx, i) => [dx, piece.dys[i]])
})

export default {
  all,
  ...Piece,
}