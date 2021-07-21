import Palette from './Palette'
import Piece from './Piece'

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
  const { buffer, scale } = board
  return board.piece_queue.map((shape, iy) => ({
    id: `queue-${iy}`,
    blocks: Piece[shape].dxys.map(([x, y]) => ({
      x: (2 + x) * scale + buffer,
      y: (2 + y + 3 * iy) * scale + buffer,
      width: scale - 2 * buffer,
      height: scale - 2 * buffer,
      key: `queue-${iy}-${[x, y]}`,
      fill: Palette.default[shape],
    })),
  }))
}

const renderStash = (board) => {
  const shape = board.stash
  const { buffer, scale } = board
  return Piece[shape]?.dxys.map(([x, y]) => ({
    x: (2 + x) * scale + buffer,
    y: (2 + y) * scale + buffer,
    width: scale - 2 * buffer,
    height: scale - 2 * buffer,
    key: `stash-${[x, y]}`,
    fill: Palette.default[shape],
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

  const draw = (delay) => {
    const { scale, buffer } = board
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
              x: x * scale + buffer,
              y: y * scale + buffer,
              width: scale - 2 * buffer,
              height: scale - 2 * buffer,
              key: `${piece_key}-${piece.block_ids[i]}`,
              fill: Palette.default[piece.shape],
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
      delay,
    }
    new_frame.entities.push(renderGhost(board))
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
        setTimeout(callback, frames[current_frame]?.delay)
      }
      return frames[current_frame]
    },
  }
}
