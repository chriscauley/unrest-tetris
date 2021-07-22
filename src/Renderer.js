import Piece from './Piece'
import Geo from '@unrest/geo'

const tlrbByShape = {}
const geo4 = new Geo(4, 4)
Piece.all.forEach((piece) => {
  const exists = {}
  const indexes = piece.dxys.map((dxy) => geo4.dxy2dindex(dxy))
  piece.dxys.forEach((dxy) => (exists[geo4.xy2index(dxy)] = true))
  tlrbByShape[piece.shape] = indexes.map((index) =>
    [-4, -1, 1, 4].map((dindex) => (indexes.includes(dindex + index) ? 0 : 1)).join(''),
  )
})

const getGhost = (board) => {
  const { W, H } = board.geo
  const max_index = W * H - 1
  let _h = H
  let ghost = board.current_piece?.indexes || []
  while (_h--) {
    const new_ghost = ghost.map((i) => i + W)
    const collides = new_ghost.find((index) => {
      if (index > max_index) {
        return true
      }
      if (board.indexes[index] === undefined) {
        return false
      }
      return board.indexes[index] !== board.current_piece.id
    })
    if (collides !== undefined) {
      break
    }
    ghost = new_ghost
  }
  return ghost
}

const renderGhost = (board) => {
  const { scale, buffer } = board
  const blocks = getGhost(board).map((index) => {
    const [x, y] = board.geo.index2xy(index)
    return {
      key: Math.random(),
      x: x * scale + buffer,
      y: y * scale + buffer,
      width: scale - 2 * buffer,
      height: scale - 2 * buffer,
      fill: 'none',
      'stroke-width': buffer,
      stroke: 'gray',
      'stroke-dasharray': 4,
    }
  })
  return { id: 'ghost', blocks }
}

const renderQueue = (board) => {
  const { scale } = board
  return board.piece_queue.map((shape, iy) => ({
    id: `queue-${iy}`,
    blocks: Piece[shape].dxys.map(([x, y], i) => ({
      x: (2 + x) * scale,
      y: (2 + y + 3 * iy) * scale,
      key: `queue-${iy}-${[x, y]}`,
      href: `#${shape}-${tlrbByShape[shape][i]}`,
    })),
  }))
}

const renderStash = (board) => {
  const shape = board.stash
  const { scale } = board
  return Piece[shape]?.dxys.map(([x, y], i) => ({
    x: (2 + x) * scale,
    y: (2 + y) * scale,
    key: `stash-${[x, y]}`,
    href: `#${shape}-${tlrbByShape[shape][i]}`,
  }))
}

export default (board) => {
  let current_frame = 0
  let stale = []
  const _cache = {}
  const frames = []
  const getCached = (key, f) => {
    if (!_cache[key]) {
      _cache[key] = f()
    }
    return _cache[key]
  }

  const tlrd = (block_index, piece_id) => {
    return board.geo.dindexes
      .map((dindex) => (board.indexes[dindex + block_index] === piece_id ? 0 : 1))
      .join('')
  }

  const draw = (delay = 0) => {
    const { scale } = board
    const pieces = Object.values(board.entities)
    // clear cache of stale and wet cache
    stale.forEach((id) => delete _cache[id])
    stale = []
    pieces.forEach((piece) => {
      // TODO first attempt at caching wasn't great and performance isn't limited yet
      if (true || !_cache[piece.id]) {
        const piece_key = piece.id === board.current_piece.id ? Math.random() : piece.id
        _cache[piece.id] = {
          id: piece.id,
          blocks: piece.indexes.map((index, i) => {
            const [x, y] = board.geo.index2xy(index)
            return {
              x: x * scale,
              y: y * scale,
              key: `${piece_key}-${piece.block_ids[i]}`,
              href: `#${piece.shape}-${tlrd(index, piece.id)}`,
            }
          }),
        }
      }
    })

    // create new frame
    const new_frame = {
      entities: pieces.map((piece) => _cache[piece.id]),
      piece_queue: getCached('queue', () => renderQueue(board)),
      stash: getCached('stash', () => renderStash(board)),
      frame_number: frames.length,
      delay: delay * 1,
      ghost: renderGhost(board),
    }
    frames.push(new_frame)
  }

  return {
    draw,
    frames,
    markStale(id) {
      stale.push(id)
    },
    next(callback) {
      if (current_frame < frames.length - 1 && !board._paused_at) {
        current_frame++
        setTimeout(callback, frames[current_frame]?.delay / 2)
      }
      return frames[current_frame]
    },
  }
}
