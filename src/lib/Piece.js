import splitmix64 from './splitmix64'

const Piece = {
  t: {
    dxs: [0, 1, -1, 0],
    dys: [0, 0, 0, -1],
    max_spin: 4,
  },
  l: {
    dxs: [0, 1, -1, -1],
    dys: [0, 0, 0, -1],
    max_spin: 4,
  },
  j: {
    dxs: [0, 1, -1, 1],
    dys: [0, 0, 0, -1],
    max_spin: 4,
  },
  z: {
    dxs: [0, -1, 1, 0],
    dys: [0, 0, 1, 1],
    max_spin: 4,
  },
  s: {
    dxs: [0, 1, -1, 0],
    dys: [0, 0, 1, 1],
    max_spin: 4,
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
const shapes = all.map((p) => p.shape)

export default {
  all,
  shapes,
  ...Piece,
  generator: (s) => {
    s = s || new Date().valueOf() % 256
    if (s.match(/^\d+$/)) {
      s = Number(s)
    }
    if (typeof s === 'number') {
      const rand = splitmix64(s)
      return () => rand.choice(shapes)
    }
    if (Piece[s[0]]) {
      let i = 0
      return () => s[i++ % s.length]
    }
    throw `Unknown generator: ${s}`
  },
}
